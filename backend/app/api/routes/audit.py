from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.api.deps.dependencies import get_db
from app.model.models import ApplicationAuditLogInDB
from app.schemas.schemas import AuditLogCreate, AuditLogResponse

router = APIRouter()

def create_audit_entry(
    db: Session,
    action: str,
    applicationId: Optional[int] = None,
    stage: Optional[str] = None,
    performedBy: Optional[str] = None,
    userRole: Optional[str] = None,
    details: Optional[str] = None,
    ipAddress: Optional[str] = None
):
    """Helper utility to insert an audit log record cleanly."""
    try:
        new_log = ApplicationAuditLogInDB(
            applicationId=applicationId,
            action=action,
            stage=stage,
            performedBy=performedBy,
            userRole=userRole,
            details=details,
            ipAddress=ipAddress,
            createdAt=datetime.now()
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        return new_log
    except Exception as err:
        print(f"[AUDIT LOG ERROR] Failed to record audit log: {err}")
        db.rollback()
        return None

@router.get('/api/applications/{applicationId}/audit-trail', response_model=List[AuditLogResponse])
def get_application_audit_trail(applicationId: int, db: Session = Depends(get_db)):
    """Fetch audit trail logs for a specific application sorted chronologically."""
    logs = db.query(ApplicationAuditLogInDB).filter(
        ApplicationAuditLogInDB.applicationId == applicationId
    ).order_by(ApplicationAuditLogInDB.createdAt.desc()).all()
    return logs

@router.get('/api/audit-logs', response_model=List[AuditLogResponse])
def get_all_audit_logs(
    applicationId: Optional[int] = None,
    action: Optional[str] = None,
    stage: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Query audit logs with optional filters."""
    query = db.query(ApplicationAuditLogInDB)
    if applicationId:
        query = query.filter(ApplicationAuditLogInDB.applicationId == applicationId)
    if action:
        query = query.filter(ApplicationAuditLogInDB.action == action)
    if stage:
        query = query.filter(ApplicationAuditLogInDB.stage == stage)

    return query.order_by(ApplicationAuditLogInDB.createdAt.desc()).limit(limit).all()

@router.post('/api/audit-logs', response_model=AuditLogResponse, status_code=status.HTTP_201_CREATED)
def record_audit_log(payload: AuditLogCreate, request: Request, db: Session = Depends(get_db)):
    """API endpoint to record an audit log directly from frontend or services."""
    client_ip = request.client.host if request.client else payload.ipAddress
    log_entry = create_audit_entry(
        db=db,
        action=payload.action,
        applicationId=payload.applicationId,
        stage=payload.stage,
        performedBy=payload.performedBy,
        userRole=payload.userRole,
        details=payload.details,
        ipAddress=client_ip or payload.ipAddress
    )
    if not log_entry:
        raise HTTPException(status_code=500, detail="Could not create audit log entry")
    return log_entry
