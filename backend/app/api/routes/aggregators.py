from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import datetime, timezone
from app.api.deps.dependencies import get_db, get_current_user
from app.model.models import ManageAggregatorInDB, PaymentAggregatorInDB, ApplicationsInDB, ProjectionDetailsInDB, ApplicationAuditLogInDB, User
from app.schemas.schemas import ManageAggregator, ManageAggregatorUpdate, PaymentAggregator, PaymentAggregatorUpdate
from app.services.email_service import EmailService

router = APIRouter()

# --- Manage Aggregator ---

@router.post('/api/manage-aggregator', status_code=status.HTTP_201_CREATED)
def create_manageAggregator(manageAggregator: ManageAggregator, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_manageAggregator = ManageAggregatorInDB(**manageAggregator.dict())
    db.add(new_manageAggregator)
    db.commit()
    db.refresh(new_manageAggregator)
    response_dict = {
        "aggregatorId": new_manageAggregator.aggregatorId,
        "aggregatorName": new_manageAggregator.aggregatorName,
        "contactPersonName": new_manageAggregator.contactPersonName,
        "email": new_manageAggregator.email,
        "mobileNo": new_manageAggregator.mobileNo,
        "location": new_manageAggregator.location,
        "services": new_manageAggregator.services,
        "isDeleted": new_manageAggregator.isDeleted,
        "status": "Created"
    }
    return JSONResponse(content=response_dict, media_type="application/json")

@router.get('/api/single-manage-aggregator/{manageAggregatorId}')
def get_single_manageAggregator(manageAggregatorId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    manageAggregator = db.query(ManageAggregatorInDB).filter(
        and_(ManageAggregatorInDB.isDeleted == False, ManageAggregatorInDB.aggregatorId == manageAggregatorId)).first()
    return manageAggregator

@router.get('/api/all-manage-aggregator')
def get_all_manageAggregator(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    manageAggregator = db.query(ManageAggregatorInDB).filter(and_(ManageAggregatorInDB.isDeleted == False)).all()
    return manageAggregator

@router.delete('/api/manage-aggregator/{id}')
def delete_manageAggregator(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_manageAggregator = db.query(ManageAggregatorInDB).filter(ManageAggregatorInDB.aggregatorId == id).first()
    existing_manageAggregator.isDeleted = True
    db.commit()
    db.refresh(existing_manageAggregator)
    response_dict = {
        "aggregatorCode": existing_manageAggregator.aggregatorId,
        "status": "Deleted"
    }
    return JSONResponse(content=response_dict, media_type="application/json")

@router.put('/api/manage-aggregator/{id}')
def update_manageAggregator(id: int, new_manageAggregator: ManageAggregatorUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_manageAggregator = db.query(ManageAggregatorInDB).filter(
        and_(ManageAggregatorInDB.aggregatorId == id, ManageAggregatorInDB.isDeleted == False)).first()
    if not existing_manageAggregator:
        raise HTTPException(status_code=404, detail="Manage Aggregator not found")
    for key, value in new_manageAggregator.__dict__.items():
        if value is not None:
            setattr(existing_manageAggregator, key, value)
    db.commit()
    db.refresh(existing_manageAggregator)
    response_dict = {
        "aggregatorCode": existing_manageAggregator.aggregatorId,
        "status": "Updated"
    }
    return JSONResponse(content=response_dict, media_type="application/json")

# --- Payment Aggregator ---

@router.post('/api/applications/payment-aggregators', status_code=status.HTTP_201_CREATED)
def create_paymentAggregator(
    paymentAggregatorsList: List[PaymentAggregator], 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    db_objects = []
    app_ids = set()
    dispatched_recipients = []

    for aggregator in paymentAggregatorsList:
        db_object = PaymentAggregatorInDB(**aggregator.dict())
        db_objects.append(db_object)
        if aggregator.applicationId:
            app_ids.add(aggregator.applicationId)
    db.add_all(db_objects)
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

            # 2. Dispatch quotation request emails in the background for each assigned aggregator
            for agg_entry in paymentAggregatorsList:
                if agg_entry.applicationId == app_id:
                    # Look up aggregator details from manage_aggregators
                    manage_agg = db.query(ManageAggregatorInDB).filter(
                        and_(
                            ManageAggregatorInDB.aggregatorId == agg_entry.aggregatorId,
                            ManageAggregatorInDB.isDeleted == False
                        )
                    ).first()

                    agg_name = (manage_agg.aggregatorName if manage_agg else None) or agg_entry.aggregatorName or "Payment Aggregator"
                    agg_email = (manage_agg.email if manage_agg else None) or ""
                    contact_person = (manage_agg.contactPersonName if manage_agg else None) or ""

                    # Queue email dispatch task in background
                    if agg_email:
                        dispatched_recipients.append({
                            "aggregatorName": agg_name,
                            "email": agg_email,
                            "contactPerson": contact_person
                        })
                        background_tasks.add_task(
                            EmailService.send_quote_request_email,
                            aggregator_name=agg_name,
                            aggregator_email=agg_email,
                            contact_person=contact_person,
                            application=app,
                            end_date_str=agg_entry.endDate,
                            projections=[p for p in base_projections if not p.isIB]
                        )

            # Record audit log entry
            if dispatched_recipients:
                agg_names = ", ".join([r["aggregatorName"] for r in dispatched_recipients])
                audit_log = ApplicationAuditLogInDB(
                    applicationId=app_id,
                    action="SEND_FOR_QUOTE",
                    stage="Add Aggregator",
                    performedBy=getattr(current_user, "username", "Central Office"),
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
    current_user: User = Depends(get_current_user)
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
def get_all_paymentAggregator(applicationId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
    db.commit()
    paymentAggregators = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == applicationId)).all()
    return paymentAggregators

@router.get('/api/single-payment-aggregator/{paymentAggregatorId}')
def get_single_paymentAggregator(paymentAggregatorId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    paymentAggregator = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.aggregatorId == paymentAggregatorId)).first()
    return paymentAggregator

@router.delete('/api/payment-aggregator/{id}')
def delete_paymentAggregator(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_PaymentAggregator = db.query(PaymentAggregatorInDB).filter(PaymentAggregatorInDB.aggregatorId == id).first()
    existing_PaymentAggregator.isDeleted = True
    db.commit()
    db.refresh(existing_PaymentAggregator)
    response_dict = {
        "aggregatorCode": existing_PaymentAggregator.id,
        "status": "Deleted"
    }
    return JSONResponse(content=response_dict, media_type="application/json")

@router.put('/api/payment-aggregator/application/{applicationId}/aggregator/{aggregatorId}')
def update_paymentAggregator(applicationId: int, aggregatorId: int, new_PaymentAggregator: PaymentAggregatorUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_PaymentAggregator = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.applicationId == applicationId, PaymentAggregatorInDB.aggregatorId == aggregatorId, PaymentAggregatorInDB.isDeleted == False)).first()
    if not existing_PaymentAggregator:
        raise HTTPException(status_code=404, detail="PaymentAggregator not found")
    for key, value in new_PaymentAggregator.__dict__.items():
        if value is not None:
            setattr(existing_PaymentAggregator, key, value)
    db.commit()
    db.refresh(existing_PaymentAggregator)
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
def test_email_dispatch(payload: TestEmailRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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

