from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional, Any
from datetime import datetime, timezone
from app.api.deps.dependencies import get_db, get_current_user, verify_write_permission, verify_admin_permission, is_admin_user
from app.model.models import (
    ManageAggregatorInDB,
    PaymentAggregatorInDB,
    ApplicationsInDB,
    ProjectionDetailsInDB,
    ApplicationAuditLogInDB,
    AggregatorAuditLogInDB,
    User
)
from app.schemas.schemas import (
    ManageAggregator,
    ManageAggregatorUpdate,
    PaymentAggregator,
    PaymentAggregatorUpdate,
    AggregatorAuditLogResponse
)
from app.services.email_service import EmailService
from app.api.routes.notifications import create_notification
from app.core.aggregator_security import generate_strong_password, hash_password

router = APIRouter()


def log_aggregator_audit(
    db: Session,
    action: str,
    aggregatorId: Optional[int] = None,
    aggregatorName: Optional[str] = None,
    performedBy: Optional[str] = None,
    userRole: Optional[str] = "ADMIN",
    details: Optional[str] = None,
    ipAddress: Optional[str] = None
):
    """Centrally records an immutable audit log entry for Payment Aggregator events."""
    try:
        entry = AggregatorAuditLogInDB(
            aggregatorId=aggregatorId,
            aggregatorName=aggregatorName,
            action=action,
            performedBy=performedBy,
            userRole=userRole,
            details=details,
            ipAddress=ipAddress,
            createdAt=datetime.now(timezone.utc)
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
    except Exception as e:
        print(f"[AGGREGATOR AUDIT ERROR] {e}")
        db.rollback()
        return None


# --- Manage Aggregator Audit Query Endpoints ---

@router.get('/api/manage-aggregator/audit-logs', response_model=List[AggregatorAuditLogResponse])
def get_all_aggregator_audit_logs(
    aggregatorId: Optional[int] = None,
    action: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Query aggregator audit trail logs with optional filters."""
    query = db.query(AggregatorAuditLogInDB)
    if aggregatorId:
        query = query.filter(AggregatorAuditLogInDB.aggregatorId == aggregatorId)
    if action and action != "ALL":
        query = query.filter(AggregatorAuditLogInDB.action == action)
    return query.order_by(AggregatorAuditLogInDB.createdAt.desc()).limit(limit).all()


@router.get('/api/manage-aggregator/{aggregatorId}/audit-logs', response_model=List[AggregatorAuditLogResponse])
def get_specific_aggregator_audit_logs(
    aggregatorId: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Fetch complete audit history for a specific payment aggregator partner."""
    return db.query(AggregatorAuditLogInDB).filter(
        AggregatorAuditLogInDB.aggregatorId == aggregatorId
    ).order_by(AggregatorAuditLogInDB.createdAt.desc()).all()


def mask_email_str(email: Optional[str]) -> Optional[str]:
    """Masks an email address for non-admin view, e.g. 'contact@razorpay.com' -> 'c****t@razorpay.com'."""
    if not email or "@" not in str(email):
        return email
    parts = str(email).split("@", 1)
    user_part, domain_part = parts[0], parts[1]
    if len(user_part) <= 2:
        masked_user = user_part[0] + "*"
    else:
        masked_user = user_part[0] + "*" * (len(user_part) - 2) + user_part[-1]
    return f"{masked_user}@{domain_part}"


def mask_phone_str(phone: Optional[Any]) -> Optional[str]:
    """Masks a phone number for non-admin view, e.g. '9876543210' -> '98******10'."""
    if not phone:
        return None
    phone_str = str(phone).strip()
    if len(phone_str) <= 4:
        return "*" * len(phone_str)
    return phone_str[:2] + "*" * (len(phone_str) - 4) + phone_str[-2:]


def serialize_aggregator(agg: ManageAggregatorInDB, is_admin: bool = False) -> dict:
    """Serializes aggregator model with conditional masking for non-admin callers."""
    email_val = agg.email if is_admin else mask_email_str(agg.email)
    alt_email_val = agg.alternateEmail if is_admin else mask_email_str(agg.alternateEmail)
    mobile_val = agg.mobileNo if is_admin else mask_phone_str(agg.mobileNo)
    
    return {
        "aggregatorId": agg.aggregatorId,
        "aggregatorName": agg.aggregatorName,
        "contactPersonName": agg.contactPersonName,
        "email": email_val,
        "alternateEmail": alt_email_val,
        "mobileNo": mobile_val,
        "location": agg.location,
        "services": agg.services,
        "status": getattr(agg, "status", "active") or "active",
        "isDeleted": agg.isDeleted,
        "created_at": agg.created_at.isoformat() if getattr(agg, "created_at", None) else None,
        "isMasked": not is_admin
    }


# --- Manage Aggregator CRUD with Audit Logging ---

@router.post('/api/manage-aggregator', status_code=status.HTTP_201_CREATED)
def create_manageAggregator(
    manageAggregator: ManageAggregator,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Any = Depends(verify_admin_permission)
):
    temp_password = generate_strong_password(14)
    agg_dict = manageAggregator.dict() if hasattr(manageAggregator, "dict") else dict(manageAggregator)
    
    new_manageAggregator = ManageAggregatorInDB(
        **agg_dict,
        hashed_password=hash_password(temp_password),
        must_reset_password=True,
        failed_login_attempts=0
    )
    db.add(new_manageAggregator)
    db.commit()
    db.refresh(new_manageAggregator)

    # Record Audit Log
    admin_name = getattr(current_user, "EmployeeId", None) or getattr(current_user, "username", "CBI Admin")
    log_aggregator_audit(
        db=db,
        action="ONBOARDED",
        aggregatorId=new_manageAggregator.aggregatorId,
        aggregatorName=new_manageAggregator.aggregatorName,
        performedBy=str(admin_name),
        userRole="ADMIN",
        details=f"Aggregator onboarded by {admin_name}. Contact: {new_manageAggregator.contactPersonName} ({new_manageAggregator.email}). Temporary credentials generated & email dispatched."
    )

    # Dispatch onboarding credentials email with temporary password
    if new_manageAggregator.email:
        try:
            background_tasks.add_task(
                EmailService.send_aggregator_onboarding_email,
                aggregator_name=new_manageAggregator.aggregatorName,
                contact_person=new_manageAggregator.contactPersonName,
                email=new_manageAggregator.email,
                temp_password=temp_password
            )
        except Exception as e:
            print(f"Warning: Failed to queue aggregator onboarding email: {e}")

    response_dict = {
        "aggregatorId": new_manageAggregator.aggregatorId,
        "aggregatorName": new_manageAggregator.aggregatorName,
        "contactPersonName": new_manageAggregator.contactPersonName,
        "email": new_manageAggregator.email,
        "alternateEmail": getattr(new_manageAggregator, "alternateEmail", None),
        "mobileNo": new_manageAggregator.mobileNo,
        "location": new_manageAggregator.location,
        "services": new_manageAggregator.services,
        "isDeleted": new_manageAggregator.isDeleted,
        "status": getattr(new_manageAggregator, "status", "active") or "active",
        "temporaryPassword": temp_password
    }
    return JSONResponse(status_code=status.HTTP_201_CREATED, content=response_dict, media_type="application/json")


@router.post('/api/manage-aggregator/{aggregatorId}/reset-credentials')
def reset_aggregator_credentials(
    aggregatorId: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Any = Depends(verify_admin_permission)
):
    aggregator = db.query(ManageAggregatorInDB).filter(
        and_(ManageAggregatorInDB.aggregatorId == aggregatorId, ManageAggregatorInDB.isDeleted == False)
    ).first()
    if not aggregator:
        raise HTTPException(status_code=404, detail="Manage Aggregator not found")

    new_temp_password = generate_strong_password(14)
    aggregator.hashed_password = hash_password(new_temp_password)
    aggregator.must_reset_password = True
    aggregator.failed_login_attempts = 0
    aggregator.locked_until = None
    db.commit()

    # Record Audit Log
    admin_name = getattr(current_user, "EmployeeId", None) or getattr(current_user, "username", "CBI Admin")
    log_aggregator_audit(
        db=db,
        action="CREDENTIALS_RESET",
        aggregatorId=aggregator.aggregatorId,
        aggregatorName=aggregator.aggregatorName,
        performedBy=str(admin_name),
        userRole="ADMIN",
        details=f"Portal login credentials reset by {admin_name}. New temporary password dispatched to {aggregator.email} with mandatory reset flag set."
    )

    if aggregator.email:
        background_tasks.add_task(
            EmailService.send_aggregator_onboarding_email,
            aggregator_name=aggregator.aggregatorName,
            contact_person=aggregator.contactPersonName,
            email=aggregator.email,
            temp_password=new_temp_password
        )

    return {
        "success": True,
        "message": f"New temporary password generated and dispatched to {aggregator.email}.",
        "aggregatorId": aggregatorId,
        "email": aggregator.email,
        "temporaryPassword": new_temp_password if config.DEV_MODE else None
    }

@router.get('/api/single-manage-aggregator/{manageAggregatorId}')
def get_single_manageAggregator(manageAggregatorId: int, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    manageAggregator = db.query(ManageAggregatorInDB).filter(
        and_(ManageAggregatorInDB.isDeleted == False, ManageAggregatorInDB.aggregatorId == manageAggregatorId)).first()
    if not manageAggregator:
        raise HTTPException(status_code=404, detail="Manage Aggregator not found")
    
    is_admin = is_admin_user(current_user)
    return serialize_aggregator(manageAggregator, is_admin=is_admin)

@router.get('/api/all-manage-aggregator')
def get_all_manageAggregator(db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    aggregators = db.query(ManageAggregatorInDB).filter(and_(ManageAggregatorInDB.isDeleted == False)).all()
    is_admin = is_admin_user(current_user)
    return [serialize_aggregator(agg, is_admin=is_admin) for agg in aggregators]

@router.delete('/api/manage-aggregator/{id}')
def delete_manageAggregator(id: int, db: Session = Depends(get_db), current_user: Any = Depends(verify_admin_permission)):
    existing_manageAggregator = db.query(ManageAggregatorInDB).filter(ManageAggregatorInDB.aggregatorId == id).first()
    if not existing_manageAggregator:
        raise HTTPException(status_code=404, detail="Manage Aggregator not found")
    existing_manageAggregator.isDeleted = True
    db.commit()
    db.refresh(existing_manageAggregator)

    # Record Audit Log
    admin_name = getattr(current_user, "EmployeeId", None) or getattr(current_user, "username", "CBI Admin")
    log_aggregator_audit(
        db=db,
        action="DELETED",
        aggregatorId=existing_manageAggregator.aggregatorId,
        aggregatorName=existing_manageAggregator.aggregatorName,
        performedBy=str(admin_name),
        userRole="ADMIN",
        details=f"Aggregator '{existing_manageAggregator.aggregatorName}' (ID: {id}) marked as deleted by {admin_name}."
    )

    response_dict = {
        "aggregatorCode": existing_manageAggregator.aggregatorId,
        "status": "Deleted"
    }
    return JSONResponse(content=response_dict, media_type="application/json")

@router.put('/api/manage-aggregator/{id}')
def update_manageAggregator(id: int, new_manageAggregator: ManageAggregatorUpdate, db: Session = Depends(get_db), current_user: Any = Depends(verify_admin_permission)):
    existing_manageAggregator = db.query(ManageAggregatorInDB).filter(
        and_(ManageAggregatorInDB.aggregatorId == id, ManageAggregatorInDB.isDeleted == False)).first()
    if not existing_manageAggregator:
        raise HTTPException(status_code=404, detail="Manage Aggregator not found")

    old_status = getattr(existing_manageAggregator, "status", "active")
    changes = []
    for key, value in new_manageAggregator.__dict__.items():
        if value is not None:
            old_val = getattr(existing_manageAggregator, key, None)
            if old_val != value:
                changes.append(f"{key}: '{old_val}' -> '{value}'")
            setattr(existing_manageAggregator, key, value)
    db.commit()
    db.refresh(existing_manageAggregator)

    new_status = getattr(existing_manageAggregator, "status", "active")
    action_type = "STATUS_CHANGED" if old_status != new_status else "UPDATED"
    admin_name = getattr(current_user, "EmployeeId", None) or getattr(current_user, "username", "CBI Admin")
    log_aggregator_audit(
        db=db,
        action=action_type,
        aggregatorId=existing_manageAggregator.aggregatorId,
        aggregatorName=existing_manageAggregator.aggregatorName,
        performedBy=str(admin_name),
        userRole="ADMIN",
        details=f"Aggregator updated by {admin_name}. Changes: {', '.join(changes) if changes else 'No field changes'}."
    )

    response_dict = {
        "aggregatorCode": existing_manageAggregator.aggregatorId,
        "status": "Updated",
        "aggregatorStatus": getattr(existing_manageAggregator, "status", "active")
    }
    return JSONResponse(content=response_dict, media_type="application/json")

# --- Payment Aggregator ---

@router.post('/api/applications/payment-aggregators', status_code=status.HTTP_201_CREATED)
def create_paymentAggregator(
    paymentAggregatorsList: List[PaymentAggregator], 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: Any = Depends(verify_write_permission)
):
    db_objects = []
    app_ids = set()
    dispatched_recipients = []

    for aggregator in paymentAggregatorsList:
        if aggregator.applicationId:
            app_ids.add(aggregator.applicationId)

    # Rejection guard: Check if any application is rejected
    for app_id in app_ids:
        app = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == app_id).first()
        if app and (("reject" in str(app.status or "").lower()) or bool(app.reasonOfRejection)):
            raise HTTPException(status_code=400, detail=f"Application #{app_id} is REJECTED. Actions on rejected applications are disabled.")

    valid_cols = {c.name for c in PaymentAggregatorInDB.__table__.columns}
    for aggregator in paymentAggregatorsList:
        agg_dict = aggregator.dict() if hasattr(aggregator, "dict") else dict(aggregator)
        filtered_dict = {k: v for k, v in agg_dict.items() if k in valid_cols}

        existing_pa = db.query(PaymentAggregatorInDB).filter(
            and_(
                PaymentAggregatorInDB.applicationId == aggregator.applicationId,
                PaymentAggregatorInDB.aggregatorId == aggregator.aggregatorId,
                PaymentAggregatorInDB.isDeleted == False
            )
        ).first()

        if existing_pa:
            for k, v in filtered_dict.items():
                if k not in ("id", "applicationId", "aggregatorId"):
                    setattr(existing_pa, k, v)
            db_objects.append(existing_pa)
        else:
            db_object = PaymentAggregatorInDB(**filtered_dict)
            db.add(db_object)
            db_objects.append(db_object)

    db.commit()
    for aggregator in db_objects:
        db.refresh(aggregator)

    # 1. Update application status and workflow stage flag
    for app_id in app_ids:
        app = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == app_id).first()
        if app:
            app.isAggregatorAdded = True
            app.status = "quoterequested"

            # Query base projections for this application
            raw_base_projections = db.query(ProjectionDetailsInDB).filter(
                and_(
                    ProjectionDetailsInDB.applicationId == app_id,
                    ProjectionDetailsInDB.isDeleted == False
                )
            ).order_by(ProjectionDetailsInDB.id.asc()).all()

            # Deduplicate base projections by transactionType
            unique_base_projections = []
            seen_base_types = set()
            for bp in raw_base_projections:
                t_type = (bp.transactionType or "").strip()
                if t_type and t_type not in seen_base_types:
                    seen_base_types.add(t_type)
                    unique_base_projections.append(bp)

            # Ensure each assigned aggregator has projection rows linked to their aggregatorId
            for agg_entry in paymentAggregatorsList:
                if agg_entry.applicationId == app_id:
                    existing_agg_proj = db.query(ProjectionDetailsInDB).filter(
                        and_(
                            ProjectionDetailsInDB.applicationId == app_id,
                            ProjectionDetailsInDB.aggregatorId == agg_entry.aggregatorId,
                            ProjectionDetailsInDB.isDeleted == False
                        )
                    ).first()

                    if not existing_agg_proj and unique_base_projections:
                        for bp in unique_base_projections:
                            cloned_proj = ProjectionDetailsInDB(
                                applicationId=app_id,
                                aggregatorId=agg_entry.aggregatorId,
                                order=bp.order,
                                allow=bp.allow,
                                transactionCount=bp.transactionCount,
                                transactionValue=bp.transactionValue,
                                transactionType=bp.transactionType,
                                transactionTypePercent=bp.transactionTypePercent,
                                isIB=bp.isIB,
                                estimatedTransactions=bp.estimatedTransactions,
                                aggregateAmount=bp.aggregateAmount,
                                rate=bp.rate,
                                unit=bp.unit,
                                chargesProposed=bp.chargesProposed,
                                grossAmount=bp.grossAmount,
                                vendorShare=bp.vendorShare,
                                expectedRevenue=bp.expectedRevenue,
                                isDeleted=False,
                                bankUnit=bp.bankUnit,
                            )
                            db.add(cloned_proj)

            # 2. Dispatch quotation request emails in the background for each active aggregator
            for agg_entry in paymentAggregatorsList:
                if agg_entry.applicationId == app_id:
                    # Look up aggregator details from manage_aggregators
                    manage_agg = db.query(ManageAggregatorInDB).filter(
                        and_(
                            ManageAggregatorInDB.aggregatorId == agg_entry.aggregatorId,
                            ManageAggregatorInDB.isDeleted == False
                        )
                    ).first()

                    # Point 8: If aggregator is inactive, skip sending mail
                    agg_status = str(getattr(manage_agg, "status", "active") or "active").lower()
                    if agg_status == "inactive":
                        continue

                    agg_name = (manage_agg.aggregatorName if manage_agg else None) or agg_entry.aggregatorName or "Payment Aggregator"
                    primary_email = (manage_agg.email if manage_agg else None) or getattr(agg_entry, "email", None) or ""
                    alt_email = getattr(manage_agg, "alternateEmail", None) if manage_agg else None
                    contact_person = (manage_agg.contactPersonName if manage_agg else None) or ""

                    # Gather recipient emails (primary + alternate)
                    recipients = []
                    if primary_email and primary_email.strip():
                        recipients.append(primary_email.strip())
                    if alt_email and alt_email.strip() and alt_email.strip() not in recipients:
                        recipients.append(alt_email.strip())

                    # Optional custom email template overrides sent from frontend popup
                    custom_email_data = getattr(agg_entry, "customEmailData", None)
                    agg_custom_data = dict(custom_email_data) if isinstance(custom_email_data, dict) else (custom_email_data.copy() if custom_email_data else {})

                    # Personalize recipient salutation per aggregator so each gets their specific contact/team name
                    per_agg_recipient = contact_person.strip() if contact_person and contact_person.strip() else f"{agg_name} Team"
                    frontend_recipient = str(agg_custom_data.get("recipient_name", "")).strip()

                    if (
                        len(paymentAggregatorsList) > 1
                        or not frontend_recipient
                        or "tarun" in frontend_recipient.lower()
                        or "standard" in frontend_recipient.lower()
                        or "respective" in frontend_recipient.lower()
                        or "personalized" in frontend_recipient.lower()
                    ):
                        agg_custom_data["recipient_name"] = per_agg_recipient

                    # Queue email dispatch task in background
                    if recipients:
                        dispatched_recipients.append({
                            "aggregatorName": agg_name,
                            "email": ", ".join(recipients),
                            "contactPerson": contact_person
                        })
                        try:
                            background_tasks.add_task(
                                EmailService.send_quote_request_email,
                                aggregator_name=agg_name,
                                aggregator_email=recipients,
                                contact_person=contact_person,
                                application=app,
                                end_date_str=str(agg_entry.endDate) if agg_entry.endDate else None,
                                projections=[p for p in unique_base_projections if not getattr(p, "isIB", False)],
                                custom_data=agg_custom_data
                            )
                        except Exception as e:
                            print(f"Warning: Failed to queue quote request email: {e}")

            # Record audit log entry
            if dispatched_recipients:
                agg_names = ", ".join([r["aggregatorName"] for r in dispatched_recipients])
                audit_user = getattr(current_user, "EmployeeId", None) or getattr(current_user, "username", "Central Office")
                audit_log = ApplicationAuditLogInDB(
                    applicationId=app_id,
                    action="SEND_FOR_QUOTE",
                    stage="Add Aggregator",
                    performedBy=str(audit_user),
                    userRole="CO",
                    details=f"Quotation request emails dispatched to: {agg_names} with projection schedule."
                )
                db.add(audit_log)

    db.commit()
    for aggregator in db_objects:
        db.refresh(aggregator)

    return db_objects

@router.post('/api/test-email')
def test_email_endpoint(
    data: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    test_to = data.get("to_email")
    app_id = data.get("applicationId")

    app = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == app_id).first() if app_id else None
    projections = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.applicationId == app_id, ProjectionDetailsInDB.isIB == False)
    ).all() if app_id else []

    if not test_to:
        raise HTTPException(status_code=400, detail="Recipient email is required.")

    res = EmailService.send_quote_request_email(
        aggregator_name="Test Aggregator Partner",
        aggregator_email=test_to,
        contact_person="Partner Representative",
        application=app,
        end_date_str="2026-08-30T18:30:00.000Z",
        projections=projections
    )

    return {
        "status": "success" if res else "failed",
        "message": f"Test email dispatched to {test_to}",
        "recipient": test_to
    }

@router.get('/api/all-payment-aggregator/{applicationId}')  
def get_all_paymentAggregator(applicationId: int, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    paymentAggregators = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == applicationId)).all()
    for aggregator in paymentAggregators:
        dt1_str = aggregator.endDate
        if dt1_str:
            try:
                clean_str = str(dt1_str).replace("Z", "+00:00")
                dt1 = datetime.fromisoformat(clean_str)
                if dt1.tzinfo is None:
                    dt1 = dt1.replace(tzinfo=timezone.utc)
                dt2 = datetime.now(timezone.utc)
                if dt1 < dt2:
                    if aggregator.status != 'submitted':
                        aggregator.status = "expired"
            except Exception:
                pass

        # Sync totals from ProjectionDetailsInDB if rates were recorded
        projs = db.query(ProjectionDetailsInDB).filter(
            ProjectionDetailsInDB.applicationId == applicationId,
            ProjectionDetailsInDB.aggregatorId == aggregator.aggregatorId,
            ProjectionDetailsInDB.isDeleted == False
        ).all()
        if projs:
            app_obj = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == applicationId).first()
            tot_txns = float(app_obj.avgTransactionYearly or 0.0) if app_obj else 0.0
            tot_amt = float(app_obj.aggregateDepositAmt or 0.0) if app_obj else 0.0
            if tot_amt == 0.0 and app_obj and app_obj.avgTransactionSize and tot_txns > 0:
                tot_amt = float(app_obj.avgTransactionSize) * tot_txns

            # Determine parent IB volumes
            ib_parent_txns = 0.0
            ib_parent_amt = 0.0
            for p in projs:
                t_lower = (p.transactionType or "").lower()
                if "internet" in t_lower and not bool(p.isIB):
                    c_str = str(p.transactionCount or "0").replace("%", "").strip()
                    v_str = str(p.transactionValue or "0").replace("%", "").strip()
                    c_pct = float(c_str) / 100.0 if float(c_str or 0) > 0 else 0.10
                    v_pct = float(v_str) / 100.0 if float(v_str or 0) > 0 else 0.22
                    ib_parent_txns = float(p.estimatedTransactions or 0.0)
                    ib_parent_amt = float(p.aggregateAmount or 0.0)
                    if ib_parent_txns <= 0 and tot_txns > 0:
                        ib_parent_txns = round(tot_txns * c_pct)
                    if ib_parent_amt <= 0 and tot_amt > 0:
                        ib_parent_amt = round(tot_amt * v_pct, 2)
                    break

            for p in projs:
                # Recalculate estimatedTransactions and aggregateAmount if 0
                if not bool(p.isIB):
                    c_str = str(p.transactionCount or "0").replace("%", "").strip()
                    v_str = str(p.transactionValue or "0").replace("%", "").strip()
                    try:
                        c_pct = float(c_str) / 100.0 if float(c_str or 0) > 0 else 0.0
                        v_pct = float(v_str) / 100.0 if float(v_str or 0) > 0 else 0.0
                    except Exception:
                        c_pct, v_pct = 0.0, 0.0
                    if float(p.estimatedTransactions or 0) <= 0 and c_pct > 0 and tot_txns > 0:
                        p.estimatedTransactions = round(tot_txns * c_pct)
                    if float(p.aggregateAmount or 0) <= 0 and v_pct > 0 and tot_amt > 0:
                        p.aggregateAmount = round(tot_amt * v_pct, 2)
                else:
                    sub_pct_str = str(p.transactionTypePercent or "0").replace("%", "").strip()
                    t_lower = (p.transactionType or "").lower()
                    try:
                        sub_pct = float(sub_pct_str) / 100.0 if float(sub_pct_str or 0) > 0 else 0.0
                    except Exception:
                        sub_pct = 0.0
                    if sub_pct <= 0:
                        if "sbi" in t_lower: sub_pct = 0.6861
                        elif "hdfc" in t_lower: sub_pct = 0.1078
                        elif "icici" in t_lower: sub_pct = 0.0557
                        elif "axis" in t_lower: sub_pct = 0.0447
                        elif "other" in t_lower: sub_pct = 0.1056

                    if float(p.estimatedTransactions or 0) <= 0 and ib_parent_txns > 0:
                        p.estimatedTransactions = round(ib_parent_txns * sub_pct, 2)
                    if float(p.aggregateAmount or 0) <= 0 and ib_parent_amt > 0:
                        p.aggregateAmount = round(ib_parent_amt * sub_pct, 2)

                # Recompute gross and vendor share
                r_val = float(p.rate or 0.0)
                c_val = float(p.chargesProposed or 0.0)
                u_val = str(p.unit or "%").strip()
                bu_val = str(p.bankUnit or u_val).strip()

                if u_val in ("%", "Percentage"):
                    p.vendorShare = round(float(p.aggregateAmount or 0.0) * (r_val / 100.0), 2)
                else:
                    p.vendorShare = round(float(p.estimatedTransactions or 0.0) * r_val, 2)

                if bu_val in ("%", "Percentage"):
                    p.grossAmount = round(float(p.aggregateAmount or 0.0) * (c_val / 100.0), 2)
                else:
                    p.grossAmount = round(float(p.estimatedTransactions or 0.0) * c_val, 2)

                p.expectedRevenue = round(float(p.grossAmount or 0.0) - float(p.vendorShare or 0.0), 2)

            t_gross = sum(float(p.grossAmount or 0.0) for p in projs)
            t_vendor = sum(float(p.vendorShare or 0.0) for p in projs)
            t_rev = t_gross - t_vendor
            sum_rate = sum(float(p.rate or 0.0) for p in projs)
            if t_vendor > 0 or sum_rate > 0:
                aggregator.totalGrossAmount = round(t_gross, 3)
                aggregator.totalVendorShare = round(t_vendor, 3)
                aggregator.totalExpectedRevenue = round(t_rev, 3)
                aggregator.sumOfRate = sum_rate
                aggregator.status = "submitted"
    db.commit()
    paymentAggregators = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == applicationId)).all()
    return paymentAggregators

@router.get('/api/single-payment-aggregator/{paymentAggregatorId}')
def get_single_paymentAggregator(paymentAggregatorId: int, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    paymentAggregator = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.aggregatorId == paymentAggregatorId)).first()
    return paymentAggregator

@router.delete('/api/payment-aggregator/{id}')
def delete_paymentAggregator(id: int, db: Session = Depends(get_db), current_user: Any = Depends(verify_write_permission)):
    existing_PaymentAggregator = db.query(PaymentAggregatorInDB).filter(PaymentAggregatorInDB.aggregatorId == id).first()
    if existing_PaymentAggregator and existing_PaymentAggregator.applicationId:
        app = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == existing_PaymentAggregator.applicationId).first()
        if app and (("reject" in str(app.status or "").lower()) or bool(app.reasonOfRejection)):
            raise HTTPException(status_code=400, detail=f"Application #{app.applicationId} is REJECTED. Actions on rejected applications are disabled.")
    existing_PaymentAggregator.isDeleted = True
    db.commit()
    db.refresh(existing_PaymentAggregator)
    response_dict = {
        "aggregatorCode": existing_PaymentAggregator.id,
        "status": "Deleted"
    }
    return JSONResponse(content=response_dict, media_type="application/json")

@router.put('/api/payment-aggregator/application/{applicationId}/aggregator/{aggregatorId}')
def update_paymentAggregator(applicationId: int, aggregatorId: int, new_PaymentAggregator: PaymentAggregatorUpdate, db: Session = Depends(get_db), current_user: Any = Depends(verify_write_permission)):
    app = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == applicationId).first()
    if app and (("reject" in str(app.status or "").lower()) or bool(app.reasonOfRejection)):
        raise HTTPException(status_code=400, detail=f"Application #{applicationId} is REJECTED. Actions on rejected applications are disabled.")
    existing_PaymentAggregator = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.applicationId == applicationId, PaymentAggregatorInDB.aggregatorId == aggregatorId, PaymentAggregatorInDB.isDeleted == False)).first()
    if not existing_PaymentAggregator:
        raise HTTPException(status_code=404, detail="PaymentAggregator not found")
    for key, value in new_PaymentAggregator.__dict__.items():
        if value is not None:
            setattr(existing_PaymentAggregator, key, value)
    db.commit()
    db.refresh(existing_PaymentAggregator)

    # 3. Notify CO when quotation is received from an aggregator (Requirement 3)
    try:
        is_quote_submitted = (
            (new_PaymentAggregator.status and "submit" in str(new_PaymentAggregator.status).lower())
            or (getattr(new_PaymentAggregator, "sumOfRate", None) is not None and new_PaymentAggregator.sumOfRate > 0)
        )
        if is_quote_submitted:
            agg_name = existing_PaymentAggregator.aggregatorName or f"Aggregator #{aggregatorId}"
            cust_name = getattr(app, "customerName", "Merchant") or "Merchant"
            create_notification(
                db=db,
                applicationId=applicationId,
                title="Quotation Received",
                message=f"Quotation rates received from {agg_name} for Application #{applicationId} ({cust_name}).",
                type="info",
                stage="Quote Submission",
                targetRole="CO"
            )
    except Exception as notif_err:
        print(f"[NOTIFICATION WARNING] {notif_err}")

    response_dict = {
        "aggregatorCode": existing_PaymentAggregator.id,
        "status": "Updated"
    }
    return JSONResponse(content=response_dict, media_type="application/json")



# --- Test Email Dispatch Endpoint ---
from pydantic import BaseModel
from typing import Optional
from app.core import config

class TestEmailRequest(BaseModel):
    toEmail: str
    recipientName: Optional[str] = "Partner POC"
    applicationId: Optional[int] = None
    aggregatorName: Optional[str] = "Payment Aggregator"

@router.post('/api/test-email')
def test_email_dispatch(payload: TestEmailRequest, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    try:
        to_email = payload.toEmail.strip() if payload.toEmail else ""
        if not to_email:
            raise HTTPException(status_code=400, detail="Recipient email address is required.")

        # Find sample or specified application from DB
        app = None
        if payload.applicationId:
            app = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == payload.applicationId).first()
        if not app:
            app = db.query(ApplicationsInDB).filter(ApplicationsInDB.isDeleted == False).first()

        # If no application exists in DB, construct a structured fallback object
        if not app:
            class DummyApp:
                applicationId = 23
                customerName = "Central Bank Merchant Partner"
                category = "Education & Training"
                integrateWith = "Web Payment Gateway & UPI"
                avgTransactionSize = 2500.0
                avgTransactionYearly = 25000000.0
                totalAnnualTransaction = 25000000.0
            app = DummyApp()

        success = EmailService.send_quote_request_email(
            aggregator_name=payload.aggregatorName or "Test Payment Aggregator",
            aggregator_email=to_email,
            contact_person=payload.recipientName or "Partner POC",
            application=app,
            end_date_str=datetime.now(timezone.utc).strftime("%Y-%m-%dT23:59:59.000Z")
        )

        return {
            "success": success,
            "message": f"Test quotation request email dispatched successfully to {to_email}" if success else f"Unable to reach SMTP server ({config.SMTP_HOST}:{config.SMTP_PORT}). Check your credentials in backend/.env.",
            "recipient": to_email,
            "smtpHost": config.SMTP_HOST,
            "smtpPort": config.SMTP_PORT,
            "emailEnabled": config.EMAIL_ENABLED
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Test email dispatch failed: {str(e)}"}
        )

