"""
Central Bank of India - Payment Aggregator Portal
Actionable Application Event Notifications Router
"""

import logging
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.api.deps.dependencies import get_db, get_current_user
from app.model.models import ApplicationsInDB, NotificationInDB, User

logger = logging.getLogger("notifications")
router = APIRouter(tags=["Notifications"])


def create_notification(
    db: Session,
    applicationId: Optional[int],
    title: str,
    message: str,
    type: str = "info",
    stage: Optional[str] = None,
    targetRole: Optional[str] = "ALL",
    targetUserId: Optional[str] = None,
    branchName: Optional[str] = None,
    regionName: Optional[str] = None,
    zoneName: Optional[str] = None,
) -> Optional[NotificationInDB]:
    """
    Inserts a persistent role-targeted notification entry into the database.
    """
    try:
        notif = NotificationInDB(
            applicationId=applicationId,
            title=title,
            message=message,
            type=type,
            stage=stage,
            targetRole=targetRole.upper() if targetRole else "ALL",
            targetUserId=str(targetUserId) if targetUserId else None,
            branchName=branchName,
            regionName=regionName,
            zoneName=zoneName,
            isRead=False,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating notification: {e}")
        return None


@router.get("/api/application-notifications")
def get_application_notifications(
    userRole: Optional[str] = Query(None),
    regionName: Optional[str] = Query(None),
    branchName: Optional[str] = Query(None),
    zoneName: Optional[str] = Query(None),
    limit: int = Query(30),
    db: Session = Depends(get_db)
):
    """
    Returns actionable application event notifications filtered by role and region/branch/zone.
    Queries persistent notifications from `app_notifications`, with graceful fallback
    to dynamic application statuses if no persistent notifications exist yet.
    """
    role = (userRole or "CO").upper().strip()
    norm_region = (regionName or "").strip()
    norm_branch = (branchName or "").strip()
    norm_zone = (zoneName or "").strip()

    notifications = []

    # 1. Query persistent notifications from DB
    try:
        q = db.query(NotificationInDB)

        # Filter by target role
        if role in ["CO", "ADMIN"]:
            q = q.filter(NotificationInDB.targetRole.in_(["CO", "ADMIN", "ALL"]))
        elif role == "RO":
            q = q.filter(NotificationInDB.targetRole.in_(["RO", "ALL"]))
            if norm_region:
                q = q.filter(
                    or_(
                        NotificationInDB.regionName.is_(None),
                        NotificationInDB.regionName == "",
                        NotificationInDB.regionName.ilike(f"%{norm_region}%")
                    )
                )
        elif role == "BO":
            q = q.filter(NotificationInDB.targetRole.in_(["BO", "ALL"]))
            if norm_branch:
                q = q.filter(
                    or_(
                        NotificationInDB.branchName.is_(None),
                        NotificationInDB.branchName == "",
                        NotificationInDB.branchName.ilike(f"%{norm_branch}%")
                    )
                )
        elif role == "ZO":
            q = q.filter(NotificationInDB.targetRole.in_(["ZO", "ALL"]))
            if norm_zone:
                q = q.filter(
                    or_(
                        NotificationInDB.zoneName.is_(None),
                        NotificationInDB.zoneName == "",
                        NotificationInDB.zoneName.ilike(f"%{norm_zone}%")
                    )
                )

        db_notifs = q.order_by(NotificationInDB.createdAt.desc()).limit(limit).all()

        for item in db_notifs:
            notifications.append({
                "id": f"db_notif_{item.id}",
                "rawId": item.id,
                "applicationId": item.applicationId,
                "title": item.title,
                "message": item.message,
                "type": item.type or "info",
                "stage": item.stage or "",
                "timestamp": item.createdAt.isoformat() if item.createdAt else datetime.now().isoformat(),
                "branchName": item.branchName or "",
                "regionName": item.regionName or "",
                "zoneName": item.zoneName or "",
                "isRead": bool(item.isRead)
            })
    except Exception as db_err:
        logger.warning(f"Failed to query app_notifications table: {db_err}")

    # 2. If no persistent notifications returned yet, fallback to dynamic derivation from applications
    if not notifications:
        app_query = db.query(ApplicationsInDB).filter(ApplicationsInDB.isDeleted == False).order_by(ApplicationsInDB.createdAt.desc())

        if role == "RO" and norm_region:
            app_query = app_query.filter(ApplicationsInDB.regionName.ilike(f"%{norm_region}%"))
        elif role == "BO" and norm_branch:
            app_query = app_query.filter(ApplicationsInDB.branchName.ilike(f"%{norm_branch}%"))
        elif role == "ZO" and norm_zone:
            app_query = app_query.filter(ApplicationsInDB.zoneName.ilike(f"%{norm_zone}%"))

        apps = app_query.limit(limit).all()
        for app in apps:
            app_id = app.applicationId
            branch = app.branchName or "Branch"
            region = app.regionName or "Region"
            customer = app.customerName or "Customer"
            created_at = app.createdAt.isoformat() if app.createdAt else datetime.now().isoformat()
            is_rejected = getattr(app, "status", "") and "reject" in str(app.status).lower()

            if app.isFinalApproved:
                notifications.append({
                    "id": f"notif_approved_{app_id}",
                    "applicationId": app_id,
                    "title": "Application Final Approved",
                    "message": f"Central Office completed final approval and issued PO for Application #{app_id} ({customer})",
                    "type": "success",
                    "stage": "Final Approval",
                    "timestamp": created_at,
                    "branchName": branch,
                    "regionName": region,
                    "isRead": False
                })
            elif is_rejected:
                notifications.append({
                    "id": f"notif_rejected_{app_id}",
                    "applicationId": app_id,
                    "title": "Application Rejected",
                    "message": f"Application #{app_id} for {customer} was rejected by {getattr(app, 'rejectedRole', 'Office') or 'Office'}. Reason: {getattr(app, 'reasonOfRejection', 'N/A')}",
                    "type": "error",
                    "stage": "Rejected",
                    "timestamp": created_at,
                    "branchName": branch,
                    "regionName": region,
                    "isRead": False
                })
            elif app.isReviewByRO:
                notifications.append({
                    "id": f"notif_ro_{app_id}",
                    "applicationId": app_id,
                    "title": "Approved by Regional Office",
                    "message": f"Regional Office verified and forwarded Application #{app_id} ({customer}) to CO",
                    "type": "info",
                    "stage": "RO Review",
                    "timestamp": created_at,
                    "branchName": branch,
                    "regionName": region,
                    "isRead": False
                })
            else:
                notifications.append({
                    "id": f"notif_init_{app_id}",
                    "applicationId": app_id,
                    "title": "Application Initiated",
                    "message": f"Branch {branch} initiated Application #{app_id} for {customer}",
                    "type": "info",
                    "stage": "Submitted",
                    "timestamp": created_at,
                    "branchName": branch,
                    "regionName": region,
                    "isRead": False
                })

    notifications.sort(key=lambda x: str(x.get("timestamp", "")), reverse=True)
    return notifications[:limit]


@router.put("/api/application-notifications/{id}/read")
def mark_notification_read(id: str, db: Session = Depends(get_db)):
    """Marks a single notification as read."""
    raw_id_str = id.replace("db_notif_", "")
    try:
        raw_id = int(raw_id_str)
        notif = db.query(NotificationInDB).filter(NotificationInDB.id == raw_id).first()
        if notif:
            notif.isRead = True
            db.commit()
            return {"status": "success", "id": id}
    except Exception:
        pass
    return {"status": "success", "id": id}


@router.post("/api/application-notifications/mark-all-read")
def mark_all_notifications_read(
    userRole: Optional[str] = Query(None),
    regionName: Optional[str] = Query(None),
    branchName: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Marks all notifications read for the given user role and scope."""
    role = (userRole or "CO").upper().strip()
    try:
        q = db.query(NotificationInDB).filter(NotificationInDB.isRead == False)
        if role in ["CO", "ADMIN"]:
            q = q.filter(NotificationInDB.targetRole.in_(["CO", "ADMIN", "ALL"]))
        elif role == "RO":
            q = q.filter(NotificationInDB.targetRole.in_(["RO", "ALL"]))
            if regionName:
                q = q.filter(
                    or_(
                        NotificationInDB.regionName.is_(None),
                        NotificationInDB.regionName.ilike(f"%{regionName.strip()}%")
                    )
                )
        elif role == "BO":
            q = q.filter(NotificationInDB.targetRole.in_(["BO", "ALL"]))
            if branchName:
                q = q.filter(
                    or_(
                        NotificationInDB.branchName.is_(None),
                        NotificationInDB.branchName.ilike(f"%{branchName.strip()}%")
                    )
                )

        q.update({"isRead": True}, synchronize_session=False)
        db.commit()
    except Exception as e:
        logger.warning(f"Error marking all read: {e}")
        db.rollback()

    return {"status": "success", "message": "All notifications marked as read."}

