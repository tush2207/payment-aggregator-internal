from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import datetime, timezone
from app.api.deps.dependencies import get_db, get_current_user
from app.model.models import ManageAggregatorInDB, PaymentAggregatorInDB, User
from app.schemas.schemas import ManageAggregator, ManageAggregatorUpdate, PaymentAggregator, PaymentAggregatorUpdate

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
def create_paymentAggregator(paymentAggregatorsList: List[PaymentAggregator], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_objects = []
    for aggregator in paymentAggregatorsList:
        db_object = PaymentAggregatorInDB(**aggregator.dict())
        db_objects.append(db_object)
    db.add_all(db_objects)
    db.commit()
    for aggregator in db_objects:
        db.refresh(aggregator)
    return db_objects

@router.get('/api/all-payment-aggregator/{applicationId}')  
def get_all_paymentAggregator(applicationId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    paymentAggregators = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == applicationId)).all()
    for aggregator in paymentAggregators:
        dt1_str = aggregator.endDate
        dt1 = datetime.strptime(dt1_str, "%Y-%m-%dT%H:%M:%S.%fZ")
        dt1 = dt1.replace(tzinfo=timezone.utc)
        dt2 = datetime.now(timezone.utc)
        if dt1 < dt2:
            if aggregator.status != 'submitted':
                aggregator.status = "expired"
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
