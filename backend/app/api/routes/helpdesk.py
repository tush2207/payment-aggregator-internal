import json
import logging
from typing import Optional, List, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, Body
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.api.deps.dependencies import get_db, get_current_user, verify_write_permission
from app.model.models import HelpDesk, User, ApplicationsInDB
from app.schemas.schemas import HelpDeskCreate, HelpDeskUpdate, HelpDeskResponse
from app.core.websocket_manager import query_ws_manager

logger = logging.getLogger(__name__)

router = APIRouter()

def serialize_ticket(ticket: HelpDesk) -> dict:
    if not ticket:
        return {}
    return {
        "id": ticket.id,
        "ticketName": ticket.ticketName,
        "customerName": ticket.customerName,
        "branchName": ticket.branchName,
        "zoneName": ticket.zoneName,
        "regionName": ticket.regionName,
        "accountNo": ticket.accountNo,
        "customerEmail": ticket.customerEmail,
        "customerMobileNo": ticket.customerMobileNo,
        "description": ticket.description,
        "priority": ticket.priority or "Medium",
        "status": ticket.status or "Open",
        "createdAt": ticket.createdAt.isoformat() if hasattr(ticket.createdAt, "isoformat") else str(ticket.createdAt),
        "updatedAt": ticket.updatedAt.isoformat() if hasattr(ticket.updatedAt, "isoformat") and ticket.updatedAt else (str(ticket.updatedAt) if ticket.updatedAt else None),
        "applicationNo": ticket.applicationNo,
        "chats": ticket.chats,
        "remark": ticket.remark,
        "attachmentUrl": ticket.attachmentUrl,
        "attachmentName": ticket.attachmentName,
        "attachments": ticket.attachments,
        "changedFields": ticket.changedFields,
        "targetOffice": ticket.targetOffice or "BO",
        "queryType": ticket.queryType or "APPLICATION_QUERY",
    }


def is_application_completed(db: Session, application_no: Optional[int]) -> bool:
    """Helper to check if an application is completed and marked isFinalApproved."""
    if not application_no:
        return False
    try:
        app = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == int(application_no)).first()
        if app and (app.isFinalApproved is True or str(app.status or "").lower() in ["final approved", "approved"]):
            return True
    except Exception as e:
        logger.warning(f"Error checking application completion status: {e}")
    return False


# ─────────────────────────────────────────────────────────────────────────────
# WEBSOCKET REAL-TIME CHANNEL
# ─────────────────────────────────────────────────────────────────────────────
@router.websocket("/ws/queries/{app_id}")
async def websocket_query_endpoint(websocket: WebSocket, app_id: str):
    """
    WebSocket endpoint for real-time application queries, live badges, and discussions.
    app_id can be a specific application ID (e.g. '123') or 'global' for table observers.
    """
    await query_ws_manager.connect(websocket, app_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_json({"type": "PONG", "timestamp": datetime.now().isoformat()})
            except Exception:
                pass
    except WebSocketDisconnect:
        await query_ws_manager.disconnect(websocket, app_id)
    except Exception as exc:
        logger.debug(f"WebSocket connection error: {exc}")
        await query_ws_manager.disconnect(websocket, app_id)


# ─────────────────────────────────────────────────────────────────────────────
# HELPDESK REST ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/api/helpdesk", status_code=status.HTTP_201_CREATED)
@router.post("/helpdesk", status_code=status.HTTP_201_CREATED)
@router.post("/api/helpdesk/create-ticket", status_code=status.HTTP_201_CREATED)
async def create_ticket(
    data: HelpDeskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_write_permission)
):
    ticket_dict = data.dict() if hasattr(data, "dict") else dict(data)
    ticket_dict.pop("id", None)

    # Normalize ticketName from subject / title / ticketName
    if not ticket_dict.get("ticketName"):
        ticket_dict["ticketName"] = ticket_dict.get("subject") or ticket_dict.get("title") or "Application Query"

    # Normalize description from message / comments / description
    if not ticket_dict.get("description"):
        ticket_dict["description"] = ticket_dict.get("message") or ticket_dict.get("comments") or ""

    # Normalize chats if comments or message provided
    if not ticket_dict.get("chats"):
        if ticket_dict.get("comments"):
            ticket_dict["chats"] = ticket_dict.get("comments")
        elif ticket_dict.get("message"):
            s_name = ticket_dict.get("senderName") or getattr(current_user, "username", "User")
            s_role = ticket_dict.get("senderRole") or getattr(current_user, "role", "User")
            ticket_dict["chats"] = f"{s_name} ({s_role}): {ticket_dict.get('message')}"

    # Check if target application is completed & final approved
    raw_app = ticket_dict.get("applicationNo") if ticket_dict.get("applicationNo") is not None else ticket_dict.get("applicationId")
    if raw_app is not None and str(raw_app).strip():
        try:
            app_id = int(raw_app)
            ticket_dict["applicationNo"] = app_id
            if is_application_completed(db, app_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This application is fully completed and final approved. Raising new queries is disabled (View-Only mode)."
                )
        except HTTPException:
            raise
        except (ValueError, TypeError):
            ticket_dict["applicationNo"] = None

    # Normalize accountNo safely
    raw_acc = ticket_dict.get("accountNo")
    if raw_acc is not None and str(raw_acc).strip():
        try:
            ticket_dict["accountNo"] = int(raw_acc)
        except (ValueError, TypeError):
            ticket_dict["accountNo"] = None
    else:
        ticket_dict["accountNo"] = None

    # Normalize customerMobileNo safely
    raw_mob = ticket_dict.get("customerMobileNo")
    if raw_mob is not None and str(raw_mob).strip():
        try:
            cleaned = str(raw_mob).strip().replace("+91", "").replace("-", "").replace(" ", "")
            ticket_dict["customerMobileNo"] = int(cleaned)
        except (ValueError, TypeError):
            ticket_dict["customerMobileNo"] = None
    else:
        ticket_dict["customerMobileNo"] = None

    valid_cols = {c.key for c in HelpDesk.__table__.columns if c.name != "id"}
    filtered = {k: v for k, v in ticket_dict.items() if k in valid_cols or hasattr(HelpDesk, k)}

    new_ticket = HelpDesk(**filtered)
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    # Broadcast real-time event
    serialized = serialize_ticket(new_ticket)
    app_id_str = str(new_ticket.applicationNo) if new_ticket.applicationNo else "global"
    try:
        await query_ws_manager.broadcast_to_app(app_id_str, {
            "type": "NEW_QUERY",
            "applicationId": new_ticket.applicationNo,
            "ticket": serialized,
        })
    except Exception as ws_err:
        logger.warning(f"Failed to broadcast NEW_QUERY websocket event: {ws_err}")

    return JSONResponse(content=serialized, status_code=status.HTTP_201_CREATED)


@router.get("/api/helpdesk/{ticket_id}")
@router.get("/helpdesk/{ticket_id}")
def get_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(HelpDesk).filter(HelpDesk.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return serialize_ticket(ticket)


@router.get("/api/helpdesk/")
@router.get("/api/helpdesk")
@router.get("/helpdesk/")
@router.get("/helpdesk")
@router.get("/api/helpdesk/get-tickets")
def get_all_tickets(
    applicationNo: Optional[int] = None,
    applicationId: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(HelpDesk)
    app_target = applicationNo or applicationId
    if app_target:
        query = query.filter(HelpDesk.applicationNo == app_target)
    
    tickets_list = query.order_by(HelpDesk.createdAt.desc()).all()
    open_count = len([t for t in tickets_list if str(t.status or "").lower() in ["open", "reverted_by_branch", "inprogress", "in review"]])
    resolved_count = len([t for t in tickets_list if str(t.status or "").lower() in ["resolved", "closed"]])
    pending_count = len([t for t in tickets_list if str(t.status or "").lower() in ["pending", "inprogress"]])

    return {
        "ticketsList": [serialize_ticket(t) for t in tickets_list],
        "openTkCount": open_count,
        "resolvedTkCount": resolved_count,
        "pendingTkCount": pending_count
    }


@router.get("/api/helpdesk/application/{application_id}/summary")
@router.get("/helpdesk/application/{application_id}/summary")
@router.get("/api/helpdesk/application/{application_id}")
@router.get("/helpdesk/application/{application_id}")
def get_application_queries_summary(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns query counts, list of tickets, and completion read-only status for a specific application.
    """
    is_completed = is_application_completed(db, application_id)
    app_tickets = db.query(HelpDesk).filter(HelpDesk.applicationNo == application_id).order_by(HelpDesk.createdAt.desc()).all()

    open_count = len([t for t in app_tickets if str(t.status or "").lower() not in ["resolved", "closed"]])
    resolved_count = len([t for t in app_tickets if str(t.status or "").lower() in ["resolved", "closed"]])

    serialized_tickets = [serialize_ticket(t) for t in app_tickets]
    return {
        "applicationId": application_id,
        "isReadOnly": is_completed,
        "totalQueries": len(app_tickets),
        "openQueries": open_count,
        "resolvedQueries": resolved_count,
        "tickets": serialized_tickets,
        "data": serialized_tickets,
    }


@router.post("/api/helpdesk/{ticket_id}/comment")
@router.post("/helpdesk/{ticket_id}/comment")
async def add_ticket_comment(
    ticket_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_write_permission)
):
    """
    Adds a message / comment / branch revert to an existing ticket, with real-time WebSocket broadcast.
    Rejects action if the application is completed & final approved.
    """
    ticket = db.query(HelpDesk).filter(HelpDesk.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if is_application_completed(db, ticket.applicationNo):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This application is fully completed and final approved. Adding comments or modifying queries is disabled."
        )

    comment_text = payload.get("comment", "").strip()
    sender_label = payload.get("senderLabel", "User")
    status_update = payload.get("status")
    attachment_name = payload.get("attachmentName")
    attachment_url = payload.get("attachmentUrl")
    new_attachments = payload.get("attachments") # JSON string or list

    if not comment_text and not attachment_url and not new_attachments:
        raise HTTPException(status_code=400, detail="Comment text or attachment is required")

    # Format attachment tag if present
    message_content = comment_text
    if attachment_name and attachment_url:
        message_content = f"{comment_text} [Attachment: {attachment_name}]({attachment_url})".strip()

    # Append to existing chats pipe string
    new_entry = f"{sender_label}: {message_content}"
    if ticket.chats:
        ticket.chats = f"{ticket.chats} | {new_entry}"
    else:
        ticket.chats = new_entry

    if status_update:
        ticket.status = status_update
    if payload.get("remark"):
        ticket.remark = payload.get("remark")
    if payload.get("changedFields"):
        ticket.changedFields = payload.get("changedFields") if isinstance(payload.get("changedFields"), str) else json.dumps(payload.get("changedFields"))
    if new_attachments:
        ticket.attachments = new_attachments if isinstance(new_attachments, str) else json.dumps(new_attachments)

    db.commit()
    db.refresh(ticket)

    serialized = serialize_ticket(ticket)
    app_id_str = str(ticket.applicationNo) if ticket.applicationNo else "global"
    try:
        await query_ws_manager.broadcast_to_app(app_id_str, {
            "type": "NEW_COMMENT",
            "applicationId": ticket.applicationNo,
            "ticketId": ticket.id,
            "ticket": serialized,
            "newComment": {
                "senderLabel": sender_label,
                "msg": message_content,
                "timestamp": datetime.now().isoformat()
            }
        })
    except Exception as ws_err:
        logger.warning(f"Failed to broadcast NEW_COMMENT websocket event: {ws_err}")

    return serialized


@router.put("/api/helpdesk/{ticket_id}")
@router.put("/helpdesk/{ticket_id}")
async def update_ticket(
    ticket_id: int,
    data: HelpDeskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_write_permission)
):
    ticket = db.query(HelpDesk).filter(HelpDesk.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if is_application_completed(db, ticket.applicationNo):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This application is fully completed and final approved. Updating queries is disabled."
        )

    for key, value in data.dict().items():
        if value is not None:
            setattr(ticket, key, value)

    db.commit()
    db.refresh(ticket)

    serialized = serialize_ticket(ticket)
    app_id_str = str(ticket.applicationNo) if ticket.applicationNo else "global"
    try:
        await query_ws_manager.broadcast_to_app(app_id_str, {
            "type": "QUERY_UPDATED",
            "applicationId": ticket.applicationNo,
            "ticketId": ticket.id,
            "ticket": serialized
        })
    except Exception as ws_err:
        logger.warning(f"Failed to broadcast QUERY_UPDATED websocket event: {ws_err}")

    return serialize_ticket(ticket)


@router.delete("/api/helpdesk/{ticket_id}")
@router.delete("/helpdesk/{ticket_id}")
async def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_write_permission)
):
    ticket = db.query(HelpDesk).filter(HelpDesk.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if is_application_completed(db, ticket.applicationNo):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This application is fully completed and final approved. Deleting queries is disabled."
        )

    app_id = ticket.applicationNo
    ticket_id_val = ticket.id
    db.delete(ticket)
    db.commit()

    app_id_str = str(app_id) if app_id else "global"
    try:
        await query_ws_manager.broadcast_to_app(app_id_str, {
            "type": "QUERY_DELETED",
            "applicationId": app_id,
            "ticketId": ticket_id_val
        })
    except Exception as ws_err:
        logger.warning(f"Failed to broadcast QUERY_DELETED websocket event: {ws_err}")

    return {"message": "Ticket deleted successfully"}
