import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.api.deps.dependencies import get_db
from app.model.models import (
    ManageAggregatorInDB,
    PaymentAggregatorInDB,
    ApplicationsInDB,
    ProjectionDetailsInDB,
    ApplicationAuditLogInDB,
    AggregatorAuditLogInDB
)
from app.api.routes.aggregators import log_aggregator_audit
from app.core.aggregator_security import (
    generate_captcha,
    verify_captcha,
    verify_password,
    hash_password,
    validate_password_strength,
    create_aggregator_access_token,
    decode_aggregator_token
)
from app.services.email_service import EmailService
from app.api.routes.notifications import create_notification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/aggregator", tags=["Aggregator Portal"])

# Dependency to extract and verify Aggregator JWT Token
def get_current_aggregator(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> ManageAggregatorInDB:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token. Please log in."
        )

    token = authorization.split(" ")[1]
    payload = decode_aggregator_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid credentials. Please log in again."
        )

    aggregator_id = payload.get("aggregator_id")
    aggregator = db.query(ManageAggregatorInDB).filter(
        and_(
            ManageAggregatorInDB.aggregatorId == aggregator_id,
            ManageAggregatorInDB.isDeleted == False
        )
    ).first()

    if not aggregator:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Aggregator account not found or deactivated."
        )

    if str(getattr(aggregator, "status", "active") or "active").lower() != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aggregator account is currently inactive. Contact Central Bank administrator."
        )

    return aggregator


# --- Request / Response Schemas ---

class AggregatorLoginRequest(BaseModel):
    email: str
    password: str
    captcha_challenge_id: str
    captcha_answer: str

class PasswordResetRequest(BaseModel):
    new_password: str
    confirm_password: str

class QuoteProjectionItem(BaseModel):
    id: Optional[int] = None
    transactionType: str
    rate: float
    unit: Optional[str] = "%"
    chargesProposed: Optional[float] = None
    vendorShare: Optional[float] = None
    expectedRevenue: Optional[float] = None

class SubmitQuoteRequest(BaseModel):
    sumOfRate: float
    remarks: Optional[str] = None
    projections: List[QuoteProjectionItem]


# ─────────────────────────────────────────────────────────────────────────────
# AUTHENTICATION ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/auth/captcha")
def get_captcha_challenge():
    """Generates a visual SVG CAPTCHA challenge for bank-grade login."""
    return generate_captcha()


@router.post("/auth/login")
def aggregator_login(
    payload: AggregatorLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Bank-grade login for Aggregators with CAPTCHA validation,
    rate limiting, 5-attempt lockout, and forced password reset detection.
    """
    client_ip = request.client.host if request.client else "unknown"

    # 1. Verify CAPTCHA challenge
    if not verify_captcha(payload.captcha_challenge_id, payload.captcha_answer):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired CAPTCHA code. Please try again."
        )

    # 2. Look up aggregator by email or contact email (case-insensitive)
    email_clean = payload.email.strip().lower()
    aggregator = db.query(ManageAggregatorInDB).filter(
        and_(
            ManageAggregatorInDB.isDeleted == False,
            or_(
                ManageAggregatorInDB.email.ilike(email_clean),
                ManageAggregatorInDB.alternateEmail.ilike(email_clean)
            )
        )
    ).first()

    if not aggregator:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email and password."
        )

    # 3. Check Account Lockout
    now = datetime.now(timezone.utc)
    locked_until = getattr(aggregator, "locked_until", None)
    if locked_until:
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if now < locked_until:
            remaining_mins = max(1, int((locked_until - now).total_seconds() // 60))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account is temporarily locked due to multiple failed login attempts. Please try again in {remaining_mins} minutes."
            )

    # 4. Verify Password
    stored_hash = getattr(aggregator, "hashed_password", None)
    is_valid = verify_password(payload.password, stored_hash) if stored_hash else False

    if not is_valid:
        # Increment failed attempts
        failed_count = (getattr(aggregator, "failed_login_attempts", 0) or 0) + 1
        aggregator.failed_login_attempts = failed_count
        if failed_count >= 5:
            aggregator.locked_until = now + timedelta(minutes=15)
            aggregator.failed_login_attempts = 0
            db.commit()
            log_aggregator_audit(
                db=db,
                action="ACCOUNT_LOCKED",
                aggregatorId=aggregator.aggregatorId,
                aggregatorName=aggregator.aggregatorName,
                performedBy=aggregator.email,
                userRole="SYSTEM",
                details=f"Account locked for 15 minutes due to 5 consecutive failed login attempts from IP {client_ip}.",
                ipAddress=client_ip
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Your account has been temporarily locked for 15 minutes."
            )
        db.commit()
        log_aggregator_audit(
            db=db,
            action="LOGIN_FAILED",
            aggregatorId=aggregator.aggregatorId,
            aggregatorName=aggregator.aggregatorName,
            performedBy=aggregator.email,
            userRole="AGGREGATOR",
            details=f"Failed login attempt ({failed_count}/5) from IP {client_ip}.",
            ipAddress=client_ip
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email and password."
        )

    # 5. Successful login -> Reset lockout counters & update login stats
    aggregator.failed_login_attempts = 0
    aggregator.locked_until = None
    aggregator.last_login_at = now
    aggregator.last_login_ip = client_ip
    db.commit()

    log_aggregator_audit(
        db=db,
        action="LOGIN_SUCCESS",
        aggregatorId=aggregator.aggregatorId,
        aggregatorName=aggregator.aggregatorName,
        performedBy=aggregator.email,
        userRole="AGGREGATOR",
        details=f"Successful portal authentication from IP {client_ip}.",
        ipAddress=client_ip
    )

    must_reset = bool(getattr(aggregator, "must_reset_password", True))
    access_token = create_aggregator_access_token(
        aggregator_id=aggregator.aggregatorId,
        email=aggregator.email,
        must_reset=must_reset
    )

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "Bearer",
        "must_reset_password": must_reset,
        "aggregator": {
            "aggregatorId": aggregator.aggregatorId,
            "aggregatorName": aggregator.aggregatorName,
            "contactPersonName": aggregator.contactPersonName,
            "email": aggregator.email,
            "status": getattr(aggregator, "status", "active")
        }
    }


@router.post("/auth/reset-password")
def reset_aggregator_password(
    payload: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    current_aggregator: ManageAggregatorInDB = Depends(get_current_aggregator),
    db: Session = Depends(get_db)
):
    """
    Enforces mandatory password reset for first login.
    Validates complexity and updates must_reset_password = False.
    """
    client_ip = request.client.host if request.client else "unknown"

    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirm password do not match."
        )

    # Check password complexity
    is_strong, err_msg = validate_password_strength(payload.new_password)
    if not is_strong:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    # Prevent reusing the current temporary password
    if verify_password(payload.new_password, getattr(current_aggregator, "hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be identical to the temporary password."
        )

    # Update password and clear reset flag
    current_aggregator.hashed_password = hash_password(payload.new_password)
    current_aggregator.must_reset_password = False
    db.commit()

    log_aggregator_audit(
        db=db,
        action="PASSWORD_RESET",
        aggregatorId=current_aggregator.aggregatorId,
        aggregatorName=current_aggregator.aggregatorName,
        performedBy=current_aggregator.email,
        userRole="AGGREGATOR",
        details=f"Permanent password successfully configured from IP {client_ip}. Mandatory reset flag cleared.",
        ipAddress=client_ip
    )

    # Dispatch security confirmation email
    try:
        background_tasks.add_task(
            EmailService.send_password_reset_confirmation_email,
            aggregator_name=current_aggregator.aggregatorName,
            contact_person=current_aggregator.contactPersonName,
            email=current_aggregator.email
        )
    except Exception as e:
        logger.warning(f"Failed to queue password reset confirmation email: {e}")

    # Issue fresh token with must_reset_password = False
    new_token = create_aggregator_access_token(
        aggregator_id=current_aggregator.aggregatorId,
        email=current_aggregator.email,
        must_reset=False
    )

    return {
        "success": True,
        "message": "Password updated successfully. You now have full access to the portal.",
        "access_token": new_token,
        "must_reset_password": False
    }


@router.get("/auth/me")
def get_aggregator_profile(
    current_aggregator: ManageAggregatorInDB = Depends(get_current_aggregator)
):
    """Returns authenticated aggregator profile & account details."""
    return {
        "aggregatorId": current_aggregator.aggregatorId,
        "aggregatorName": current_aggregator.aggregatorName,
        "contactPersonName": current_aggregator.contactPersonName,
        "email": current_aggregator.email,
        "alternateEmail": getattr(current_aggregator, "alternateEmail", None),
        "mobileNo": current_aggregator.mobileNo,
        "location": current_aggregator.location,
        "services": current_aggregator.services,
        "status": getattr(current_aggregator, "status", "active"),
        "must_reset_password": getattr(current_aggregator, "must_reset_password", False),
        "last_login_at": current_aggregator.last_login_at
    }


# ─────────────────────────────────────────────────────────────────────────────
# RFQ & QUOTATION MODULE (EXACT EMAIL SPECIFICATION FIELDS)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/rfqs")
def list_assigned_rfqs(
    current_aggregator: ManageAggregatorInDB = Depends(get_current_aggregator),
    db: Session = Depends(get_db)
):
    """
    Returns list of all RFQs assigned to this aggregator from payment_aggregators + applications.
    """
    agg_id = current_aggregator.aggregatorId
    pa_records = db.query(PaymentAggregatorInDB).filter(
        and_(
            PaymentAggregatorInDB.aggregatorId == agg_id,
            PaymentAggregatorInDB.isDeleted == False
        )
    ).all()

    results = []
    for pa in pa_records:
        app = db.query(ApplicationsInDB).filter(
            and_(
                ApplicationsInDB.applicationId == pa.applicationId,
                ApplicationsInDB.isDeleted == False
            )
        ).first()

        if not app:
            continue

        # Format clean submission deadline
        raw_deadline = pa.endDate or ""
        deadline_formatted = raw_deadline
        if "T" in str(raw_deadline):
            try:
                dt = datetime.fromisoformat(str(raw_deadline).replace("Z", "+00:00"))
                deadline_formatted = dt.strftime("%d/%m/%Y")
            except Exception:
                pass

        results.append({
            "applicationId": app.applicationId,
            "customerName": app.customerName or "Merchant",
            "businessCategory": getattr(app, "businessCategory", "") or app.category or "Standard",
            "category": app.category or "Private",
            "avgTransactionSize": app.avgTransactionSize,
            "avgTransactionYearly": app.avgTransactionYearly,
            "integrateWith": app.integrateWith or "Credit cards/Debit cards/Netbanking/UPI",
            "submissionDeadline": deadline_formatted,
            "rawEndDate": pa.endDate,
            "quoteStatus": pa.status or "quoterequested",
            "sumOfRate": pa.sumOfRate,
            "isNegotiationRequested": getattr(app, "isNegotiationRequested", False),
            "negotiationRemarks": getattr(app, "negotiationRemarks", None),
            "quoteVersion": getattr(app, "currentQuoteVersion", 1),
            "createdAt": app.createdAt
        })

    return results


@router.get("/rfqs/{applicationId}")
def get_rfq_details(
    applicationId: int,
    current_aggregator: ManageAggregatorInDB = Depends(get_current_aggregator),
    db: Session = Depends(get_db)
):
    """
    Returns the complete RFQ details matching EXACTLY the Central Bank of India
    Quotation Request Email specification.
    """
    agg_id = current_aggregator.aggregatorId

    # Verify that this aggregator is assigned to this application
    pa = db.query(PaymentAggregatorInDB).filter(
        and_(
            PaymentAggregatorInDB.applicationId == applicationId,
            PaymentAggregatorInDB.aggregatorId == agg_id,
            PaymentAggregatorInDB.isDeleted == False
        )
    ).first()

    if not pa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"RFQ Application #{applicationId} is not assigned to your organization."
        )

    app = db.query(ApplicationsInDB).filter(
        and_(
            ApplicationsInDB.applicationId == applicationId,
            ApplicationsInDB.isDeleted == False
        )
    ).first()

    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application #{applicationId} not found."
        )

    # Format deadline
    raw_deadline = pa.endDate or ""
    deadline_formatted = raw_deadline
    if "T" in str(raw_deadline):
        try:
            dt = datetime.fromisoformat(str(raw_deadline).replace("Z", "+00:00"))
            deadline_formatted = dt.strftime("%d/%m/%Y")
        except Exception:
            pass

    # Query projection items linked to this aggregator
    projections = db.query(ProjectionDetailsInDB).filter(
        and_(
            ProjectionDetailsInDB.applicationId == applicationId,
            ProjectionDetailsInDB.aggregatorId == agg_id,
            ProjectionDetailsInDB.isDeleted == False
        )
    ).order_by(ProjectionDetailsInDB.order.asc(), ProjectionDetailsInDB.id.asc()).all()

    # Fallback to base projections if aggregator specific items are not populated
    if not projections:
        projections = db.query(ProjectionDetailsInDB).filter(
            and_(
                ProjectionDetailsInDB.applicationId == applicationId,
                ProjectionDetailsInDB.isDeleted == False
            )
        ).order_by(ProjectionDetailsInDB.id.asc()).all()

    proj_list = []
    seen_types = set()
    for p in projections:
        t_type = (p.transactionType or "").strip()
        if not t_type or t_type in seen_types or getattr(p, "isIB", False):
            continue
        seen_types.add(t_type)
        proj_list.append({
            "id": p.id,
            "transactionType": p.transactionType,
            "transactionCount": p.transactionCount,
            "transactionValue": p.transactionValue,
            "estimatedTransactions": p.estimatedTransactions,
            "aggregateAmount": p.aggregateAmount,
            "rate": p.rate or 0.0,
            "unit": p.unit or "%",
            "chargesProposed": p.chargesProposed or 0.0,
            "vendorShare": p.vendorShare or 0.0,
            "expectedRevenue": p.expectedRevenue or 0.0,
            "quoteVersion": getattr(p, "quoteVersion", 1)
        })

    return {
        # --- Exact Email Specification Fields ---
        "applicationId": app.applicationId,
        "customerName": app.customerName or "Merchant Partner",
        "modesOfCollection": app.integrateWith or "Credit cards/Debit cards/ Netbanking/ UPI/ Any Other mode (optional case to case basis)",
        "businessCategory": getattr(app, "businessCategory", "") or app.category or "Standard Merchant",
        "category": app.category or "Private",
        "avgTransactionSize": app.avgTransactionSize,
        "avgTransactionYearly": app.avgTransactionYearly,
        "submissionDeadline": deadline_formatted,
        "rawEndDate": pa.endDate,
        "submissionEmail": "smit1dptb@centralbank.bank.in",

        # --- Mandatory Instructions & Terms ---
        "instructions": [
            "System Integration Fee & AMC Charges must be NIL. Kindly confirm the same in your quotation.",
            "Rates quoted must be competitive and inclusive of standard SLA commitments.",
            "Digital quotation submitted via this portal constitutes your official commercial offer."
        ],
        "systemIntegrationFee": "NIL",
        "amcCharges": "NIL",

        # --- Negotiation / Revision Alert ---
        "isNegotiationRequested": getattr(app, "isNegotiationRequested", False),
        "negotiationRemarks": getattr(app, "negotiationRemarks", None),
        "currentQuoteVersion": getattr(app, "currentQuoteVersion", 1),

        # --- Submission Status & Rates Grid ---
        "quoteStatus": pa.status or "quoterequested",
        "sumOfRate": pa.sumOfRate or 0.0,
        "projections": proj_list
    }


@router.post("/rfqs/{applicationId}/quote")
def submit_quote(
    applicationId: int,
    payload: SubmitQuoteRequest,
    background_tasks: BackgroundTasks,
    current_aggregator: ManageAggregatorInDB = Depends(get_current_aggregator),
    db: Session = Depends(get_db)
):
    """
    Submits quotation rates for an RFQ application.
    Updates payment_aggregators, projection_details, triggers audit log & CO notification.
    """
    agg_id = current_aggregator.aggregatorId
    agg_name = current_aggregator.aggregatorName

    # Verify application & payment aggregator link
    pa = db.query(PaymentAggregatorInDB).filter(
        and_(
            PaymentAggregatorInDB.applicationId == applicationId,
            PaymentAggregatorInDB.aggregatorId == agg_id,
            PaymentAggregatorInDB.isDeleted == False
        )
    ).first()

    if not pa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"RFQ Application #{applicationId} is not assigned to your organization."
        )

    app = db.query(ApplicationsInDB).filter(
        and_(
            ApplicationsInDB.applicationId == applicationId,
            ApplicationsInDB.isDeleted == False
        )
    ).first()

    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application #{applicationId} not found."
        )

    # 1. Update projection rows with submitted rates
    for item in payload.projections:
        proj = None
        if item.id:
            proj = db.query(ProjectionDetailsInDB).filter(ProjectionDetailsInDB.id == item.id).first()
        if not proj:
            proj = db.query(ProjectionDetailsInDB).filter(
                and_(
                    ProjectionDetailsInDB.applicationId == applicationId,
                    ProjectionDetailsInDB.aggregatorId == agg_id,
                    ProjectionDetailsInDB.transactionType == item.transactionType,
                    ProjectionDetailsInDB.isDeleted == False
                )
            ).first()

        if proj:
            proj.rate = item.rate
            proj.unit = item.unit or "%"
            proj.chargesProposed = item.chargesProposed or item.rate
            proj.vendorShare = item.vendorShare or 0.0
            proj.expectedRevenue = item.expectedRevenue or 0.0
            proj.quoteVersion = getattr(app, "currentQuoteVersion", 1)
        else:
            new_proj = ProjectionDetailsInDB(
                applicationId=applicationId,
                aggregatorId=agg_id,
                transactionType=item.transactionType,
                rate=item.rate,
                unit=item.unit or "%",
                chargesProposed=item.chargesProposed or item.rate,
                vendorShare=item.vendorShare or 0.0,
                expectedRevenue=item.expectedRevenue or 0.0,
                quoteVersion=getattr(app, "currentQuoteVersion", 1),
                isDeleted=False
            )
            db.add(new_proj)

    # 2. Update PaymentAggregator status
    pa.status = "submitted"
    pa.quoteStatus = "submitted"
    pa.sumOfRate = payload.sumOfRate
    app.isQuoteAddedPA = True

    # 3. Create Application and Aggregator Audit Logs
    audit_entry = ApplicationAuditLogInDB(
        applicationId=applicationId,
        action="QUOTE_SUBMITTED",
        stage="Commercial Quotation",
        performedBy=f"{agg_name} ({current_aggregator.email})",
        userRole="AGGREGATOR",
        details=f"Commercial quotation submitted by {agg_name}. Total Sum of Rates: {payload.sumOfRate}%. Remarks: {payload.remarks or 'None'}"
    )
    db.add(audit_entry)

    log_aggregator_audit(
        db=db,
        action="QUOTE_SUBMITTED",
        aggregatorId=current_aggregator.aggregatorId,
        aggregatorName=current_aggregator.aggregatorName,
        performedBy=current_aggregator.email,
        userRole="AGGREGATOR",
        details=f"Submitted commercial quote for Application #{applicationId} ({app.customerName or 'Merchant'}). Total rate: {payload.sumOfRate}%. Projections submitted: {len(payload.projections)} instruments."
    )

    # 4. Notify Central Office (CO)
    try:
        create_notification(
            db=db,
            applicationId=applicationId,
            title="Quotation Received",
            message=f"Quotation rates received from {agg_name} for Application #{applicationId} ({app.customerName or 'Merchant'}).",
            type="info",
            stage="Quote Submission",
            targetRole="CO"
        )
    except Exception as e:
        logger.warning(f"Failed to create CO notification: {e}")

    # 5. Dispatch confirmation email to Aggregator in background
    try:
        background_tasks.add_task(
            EmailService.send_quote_submitted_confirmation_email,
            aggregator_name=agg_name,
            contact_person=current_aggregator.contactPersonName,
            email=current_aggregator.email,
            application=app,
            sum_of_rate=payload.sumOfRate
        )
    except Exception as e:
        logger.warning(f"Failed to queue quote confirmation email: {e}")

    db.commit()
    db.refresh(pa)

    return {
        "success": True,
        "message": f"Quotation submitted successfully for Application #{applicationId}.",
        "applicationId": applicationId,
        "status": "submitted",
        "sumOfRate": pa.sumOfRate
    }
