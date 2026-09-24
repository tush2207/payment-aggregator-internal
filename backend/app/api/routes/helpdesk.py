from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps.dependencies import get_db, get_current_user, verify_write_permission
from app.model.models import HelpDesk, User
from app.schemas.schemas import HelpDeskCreate, HelpDeskUpdate, HelpDeskResponse

router = APIRouter()

@router.post("/api/helpdesk")
def create_ticket(data: HelpDeskCreate, db: Session = Depends(get_db), current_user: User = Depends(verify_write_permission)):
    ticket_dict = data.dict() if hasattr(data, "dict") else dict(data)
    ticket_dict.pop("id", None)

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

    # Normalize applicationNo
    raw_app = ticket_dict.get("applicationNo")
    if raw_app is not None and str(raw_app).strip():
        try:
            ticket_dict["applicationNo"] = int(raw_app)
        except (ValueError, TypeError):
            ticket_dict["applicationNo"] = None

    valid_cols = {c.key for c in HelpDesk.__table__.columns if c.name != "id"}
    filtered = {k: v for k, v in ticket_dict.items() if k in valid_cols or hasattr(HelpDesk, k)}

    new_ticket = HelpDesk(**filtered)
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

@router.get("/api/helpdesk/{ticket_id}")
def get_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(HelpDesk).filter(HelpDesk.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.get("/api/helpdesk/")
def get_all_tickets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticketsList = db.query(HelpDesk).order_by(HelpDesk.createdAt.desc()).all()
    openTkCount = len(db.query(HelpDesk).filter(HelpDesk.status == 'open').all())
    resolvedTkCount = len(db.query(HelpDesk).filter(HelpDesk.status == 'resolved').all())
    pendingTkCount = len(db.query(HelpDesk).filter(HelpDesk.status == 'inprogress').all())

    return {
        "ticketsList": ticketsList,
        "openTkCount": openTkCount,
        "resolvedTkCount": resolvedTkCount,
        "pendingTkCount": pendingTkCount
    }

@router.put("/api/helpdesk/{ticket_id}")
def update_ticket(ticket_id: int, data: HelpDeskUpdate, db: Session = Depends(get_db), current_user: User = Depends(verify_write_permission)):
    ticket = db.query(HelpDesk).filter(HelpDesk.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    for key, value in data.dict().items():
        if value is not None:
            setattr(ticket, key, value)

    db.commit()
    db.refresh(ticket)
    return ticket

@router.delete("/api/helpdesk/{ticket_id}")
def delete_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(verify_write_permission)):
    ticket = db.query(HelpDesk).filter(HelpDesk.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    db.delete(ticket)
    db.commit()
    return {"message": "Ticket deleted successfully"}
