from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps.dependencies import get_db, get_current_user
from app.model.models import HelpDesk, User
from app.schemas.schemas import HelpDeskCreate, HelpDeskUpdate, HelpDeskResponse

router = APIRouter()

@router.post("/api/helpdesk")
def create_ticket(data: HelpDeskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_ticket = HelpDesk(**data.dict())
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
def update_ticket(ticket_id: int, data: HelpDeskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
def delete_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(HelpDesk).filter(HelpDesk.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    db.delete(ticket)
    db.commit()
    return {"message": "Ticket deleted successfully"}
