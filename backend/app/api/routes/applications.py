from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Request
from fastapi.responses import JSONResponse, StreamingResponse, Response, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, datetime
import io
import pdfkit
from pathlib import Path
import os

from app.api.deps.dependencies import get_db, get_current_user
from app.model.models import (ApplicationsInDB, ProjectionDetailsInDB, PaymentAggregatorInDB, 
                              FileStoreInDB, ManageAggregatorInDB, User)
from app.schemas.schemas import (Applications, ApplicationsUpdate, ProjectionDetails, 
                                 ProjectionDetailsUpdate)
from app.services.generate_po_service import PurchaseOrderService

router = APIRouter()

@router.post('/api/applications', status_code=status.HTTP_201_CREATED)
def create_application(application: Applications, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_application = ApplicationsInDB(**application.dict())
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    response_dict = {
        "applicationId": new_application.applicationId,
        "status": "Submitted"
    }
    return JSONResponse(content=response_dict, media_type="application/json")

@router.get('/api/get-single-applications/{applicationId}')
def get_single_application(applicationId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    application = db.query(ApplicationsInDB).filter( 
        and_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.applicationId == applicationId)).first()
    return application

@router.get('/api/get-all-applications/{zoneId}')
def get_all_application(zoneId: str = None, status: Optional[str] = None, search: Optional[str] = None, createdAt: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_applications = []
    today = date.today()
    current_date = today.strftime("%Y-%m-%d")

    if zoneId == "00000":
        applications = db.query(ApplicationsInDB).filter(ApplicationsInDB.isDeleted == False).order_by(ApplicationsInDB.createdAt.desc()).all()
    else:
        applications = db.query(ApplicationsInDB).filter(and_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.zoneId == zoneId)).order_by(ApplicationsInDB.createdAt.desc()).all()
    
    if (status == 'all') and (search is None) and (createdAt is None):
        return applications

    for app in applications:
        if status and status != "all" and app.status != status:
            continue
        if search and search.strip():
            s = str(search.strip()).lower()
            if not(
                s in str(app.applicationId).lower()
                or s in str(app.customerName).lower()
                or s in str(app.accountNo).lower()
            ):
                continue
        if createdAt and createdAt.strip():
            s = createdAt
            if not(
                s in app.createdAt.strftime("%Y-%m-%d")
            ):
                continue        
        new_applications.append(app)
    return new_applications

@router.delete('/api/applications/{id}')
def delete_applications(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_Applications = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == id).first()
    existing_Applications.isDeleted = True
    db.commit()
    response_dict = {
        "applicationId": existing_Applications.applicationId,
        "status": "Deleted"
    }
    return JSONResponse(content=response_dict, media_type="application/json")

@router.put('/api/applications/{id}')
def update_applications(id: int, new_application: ApplicationsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_Applications = db.query(ApplicationsInDB).filter(
        and_(ApplicationsInDB.applicationId == id, ApplicationsInDB.isDeleted == False)).first()
    if not existing_Applications:
        raise HTTPException(status_code=404, detail="Applications not found")

    for key, value in new_application.__dict__.items():
        if value is not None:
            setattr(existing_Applications, key, value)

    db.commit()
    db.refresh(existing_Applications)

    application = db.query(ApplicationsInDB).filter( 
        and_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.applicationId == id)).first()
    
    if application.finalizedAggregatorId is not None and application.isFinalApproved == True:
        paymentAggregators = db.query(PaymentAggregatorInDB).filter(
            and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == id)).all()
        for aggregator in paymentAggregators:
            if aggregator.aggregatorId == application.finalizedAggregatorId:
                aggregator.quoteStatus = "accepted"
            else:
                aggregator.quoteStatus = "rejected"
            db.commit()

    return existing_Applications 

@router.put('/api/applications/test/{id}')
def update_applications_test(id: int, db: Session = Depends(get_db)):
    application = db.query(ApplicationsInDB).filter( 
        and_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.applicationId == id)).first()
    
    if application.finalizedAggregatorId is not None and application.isFinalApproved == True:
        paymentAggregators = db.query(PaymentAggregatorInDB).filter(
            and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == id)).all()
        for aggregator in paymentAggregators:
            if aggregator.aggregatorId == application.finalizedAggregatorId:
                aggregator.quoteStatus = "accepted" 
            else:
                aggregator.quoteStatus = "rejected"
            db.commit()
    return {"message": "Test successful"}

# --- Projections ---

@router.post('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections', status_code=status.HTTP_201_CREATED)
def create_projectionDetails(applicationId: int, aggregatorId: int, projectionDetails: List[ProjectionDetails], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projectionDetailsOld = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False,
             ProjectionDetailsInDB.applicationId == applicationId, 
             ProjectionDetailsInDB.aggregatorId == aggregatorId)).all()
    
    for projectionDetail in projectionDetailsOld:
        projectionDetail.isDeleted = True

    db.commit()

    for projectionDetail in projectionDetails:
        new_projectionDetail = ProjectionDetailsInDB(**projectionDetail.dict())
        db.add(new_projectionDetail)

    db.commit()

    projectionDetailsNew = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False, 
             ProjectionDetailsInDB.applicationId == applicationId, 
             ProjectionDetailsInDB.aggregatorId == aggregatorId)).all()
    
    return projectionDetailsNew

@router.get('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections/{projectionId}')
def get_single_projectionDetails(projectionId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projectionDetail = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False, ProjectionDetailsInDB.id == projectionId)).first()
    return projectionDetail

@router.get('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections')
def get_all_projectionDetails(applicationId: int, aggregatorId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projectionDetails = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False,
             ProjectionDetailsInDB.applicationId == applicationId,
             ProjectionDetailsInDB.aggregatorId == aggregatorId)).all()
    return projectionDetails

@router.delete('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections/{projectionId}')
def delete_projectionDetails(projectionId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projectionDetails = db.query(ProjectionDetailsInDB).filter(
        ProjectionDetailsInDB.id == projectionId).first()
    projectionDetails.isDeleted = True
    db.commit()
    return "done"

@router.put('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections/{projectionId}')
def update_projectionDetails(applicationId: int, aggregatorId: int, projectionId: int, new_projectionDetails: ProjectionDetailsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_projectionDetails = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.id == projectionId,
             ProjectionDetailsInDB.isDeleted == False)).first()
    
    if not existing_projectionDetails:
        raise HTTPException(status_code=404, detail="ProjectionDetails not found")
        
    for key, value in new_projectionDetails.__dict__.items():
        if value is not None:
            setattr(existing_projectionDetails, key, value)

    db.commit()
    db.refresh(existing_projectionDetails)

    response_dict = {
        "projectionId": existing_projectionDetails.id,
        "status": "Updated"
    }
    return JSONResponse(content=response_dict, media_type="application/json")

@router.post('/api/applications/bulk-update-charges/{applicationId}')
async def bulk_update_charges(applicationId: int, request: Request, db: Session = Depends(get_db)):
    projectionUpdates = await request.json()
    existing_projectionDetails = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False,
             ProjectionDetailsInDB.applicationId == applicationId)).all()

    for projectionUpdate in projectionUpdates:
        for existingProjection in existing_projectionDetails:
            if projectionUpdate["transactionType"] == existingProjection.transactionType:
                if projectionUpdate["chargesProposed"] != "":
                    existingProjection.chargesProposed = float(projectionUpdate["chargesProposed"])
                    existingProjection.bankUnit = projectionUpdate["bankUnit"]

    db.commit()
    return {
        "status": "success",
        "applicationId": applicationId,
    }
    
@router.post('/api/applications/aggregators/complex-projections', status_code=status.HTTP_201_CREATED)
async def create_complex_projectionDetails(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projectionDetails = await request.json() 
    applicationId = projectionDetails[0]["applicationId"]
    paymentAggregators = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == applicationId)).all()
    
    aggregator_codes = [item.aggregatorId for item in paymentAggregators]
    new_projections = []

    for code in aggregator_codes:
        for projection in projectionDetails:
            new_projection = projection.copy()  
            new_projection["aggregatorId"] = code
            new_projectionDetails = ProjectionDetailsInDB(
                applicationId=new_projection["applicationId"],
                order=new_projection["order"],
                allow=new_projection["allow"],
                aggregatorId=new_projection["aggregatorId"],
                transactionCount=new_projection["transactionCount"],
                transactionValue=new_projection["transactionValue"],
                transactionType=new_projection["transactionType"],
                transactionTypePercent=new_projection.get("transactionTypePercent") or "", 
                isIB=new_projection["isIB"],
                estimatedTransactions=new_projection["estimatedTransactions"],
                aggregateAmount=new_projection["aggregateAmount"],
                rate=new_projection["rate"],
                unit=new_projection["unit"],
                chargesProposed=new_projection["chargesProposed"],
                grossAmount=new_projection["grossAmount"],
                vendorShare=new_projection["vendorShare"],
                expectedRevenue=new_projection["expectedRevenue"],
                isDeleted=new_projection["isDeleted"],
                bankUnit=new_projection["unit"],
            )
            db.add(new_projectionDetails)
            new_projections.append(new_projectionDetails)

    db.commit()
    for projection in new_projections:
        db.refresh(projection)
    return new_projections

@router.get('/api/applications/trial-api')
async def application_trial_api(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    application = await request.json()
    return "done"

# --- Files ---

@router.post("/api/files/upload")
async def uploadFile(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content = await file.read()
    db_file = FileStoreInDB(
        filename=file.filename,
        content_type=file.content_type,
        file_contents=content,
        file_size=file.size
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return {"fileId": db_file.fileId, "filename": db_file.filename, "type": db_file.content_type, "size": len(content), "uploaded_at": db_file.uploaded_at}

@router.get("/api/files/download/{file_id}")
def downloadFile(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_file = db.query(FileStoreInDB).filter(FileStoreInDB.fileId == file_id).first()
    if not db_file:
        return {"error": "File not found"}
    return StreamingResponse(
        io.BytesIO(db_file.file_contents),
        media_type=db_file.content_type,
        headers={"Content-Disposition": f"attachment; filename={db_file.filename}"}
    )

# --- PO Generation ---

def to_dict(obj, keys):
    return {key: getattr(obj, key) for key in keys}

@router.get("/api/generate-purchase-order/applicationId/{applicationId}/aggregatorId/{aggregatorId}")
def create_purchase_order_details_for_print(applicationId: int, aggregatorId: int, db: Session = Depends(get_db)):
    application = db.query(ApplicationsInDB).filter( 
        and_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.applicationId == applicationId)).first()
    
    application_dict = to_dict(application, ["customerName", "address", "finalizedAggregatorId", "finalizedAggregatorName", "rccMailId", "rccMobileNo", "rccContactPersonName", "authorisedPersonName", "authorisedPersonDesignation", "branchName", "regionName"])
    
    manageAggregator = db.query(ManageAggregatorInDB).filter(
        and_(ManageAggregatorInDB.isDeleted == False, ManageAggregatorInDB.aggregatorId == application_dict["finalizedAggregatorId"])).first()
    
    aggregator_dict = to_dict(manageAggregator, ["aggregatorId", "aggregatorName", "location"])
    
    today = date.today()
    year = today.year
    current_financial_year = str(year) + str("-") + str(year+1)
    current_date = today.strftime("%d-%m-%Y")

    projectionDetails = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False,
             ProjectionDetailsInDB.applicationId == applicationId,
             ProjectionDetailsInDB.aggregatorId == aggregatorId)).all()

    result = {
        "sbiRate": 0, "sbiBankShare": 0, "hdfcRate": 0, "hdfcBankShare": 0,
        "iciciRate": 0, "iciciBankShare": 0, "axisRate": 0, "axisBankShare": 0,
        "othersRate": 0, "othersBankShare": 0, "cdChargePurposed": 0, "cdRate": 0,
        "cdBankShare": 0, "ddupto2kChargePurposed": 0, "ddupto2kRate": 0, "ddupto2kBankShare": 0,
        "ddabove2kChargePurposed": 0, "ddabove2kRate": 0, "ddabove2kBankShare": 0,
    }

    for item in projectionDetails:
        item_dict = item.__dict__
        ttype = item_dict.get("transactionType", "").lower()
        ibtype = item_dict.get("isIB")

        if ttype == "sbi" and ibtype == True:
            result["ibChargePurposed"] = item_dict.get("chargesProposed", 0)
            result["sbiRate"] = item_dict.get("rate", 0)
            result["sbiBankShare"] = result["ibChargePurposed"] - result["sbiRate"]

        if ttype == "hdfc" and ibtype == True:
            result["hdfcRate"] = item_dict.get("rate", 0)
            result["hdfcBankShare"] = result.get("ibChargePurposed", 0) - result["hdfcRate"]

        if ttype == "icici" and ibtype == True:
            result["iciciRate"] = item_dict.get("rate", 0)
            result["iciciBankShare"] = result.get("ibChargePurposed", 0) - result["iciciRate"]

        if ttype == "axis" and ibtype == True:
            result["axisRate"] = item_dict.get("rate", 0)
            result["axisBankShare"] = result.get("ibChargePurposed", 0) - result["axisRate"]

        if ttype == "others" and ibtype == True:
            result["othersRate"] = item_dict.get("rate", 0)
            result["othersBankShare"] = result.get("ibChargePurposed", 0) - result["othersRate"]
        
        elif "credit cards" in ttype:
            result["cdChargePurposed"] = item_dict.get("chargesProposed", 0)
            result["cdRate"] = item_dict.get("rate", 0)
            result["cdBankShare"] = round(result["cdChargePurposed"] - result["cdRate"], 2)

        elif "debit card - master/visa (upto 2000)" in ttype:
            result["ddupto2kChargePurposed"] = item_dict.get("chargesProposed", 0)
            result["ddupto2kRate"] = item_dict.get("rate", 0)
            result["ddupto2kBankShare"] = round(result["ddupto2kChargePurposed"] - result["ddupto2kRate"], 2)

        elif "debit card - master/visa (above 2000)" in ttype:
            result["ddabove2kChargePurposed"] = item_dict.get("chargesProposed", 0)
            result["ddabove2kRate"] = item_dict.get("rate", 0)
            result["ddabove2kBankShare"] = round(result["ddabove2kChargePurposed"] - result["ddabove2kRate"], 2)

    # Removed static logo logic as requested
    poDetails = {**application_dict, **aggregator_dict, 
                 "currentFinancialYear": current_financial_year,
                 "currentDate": current_date, **result,
                 "branchLocation": "Mumbai"}  

    po_service = PurchaseOrderService()
    doc_bytes = po_service.generate_purchase_order(poDetails, logo_path=None)
    filename = f"CP_Certificate_{poDetails['customerName']}_{date.today().strftime('%Y%m%d')}.docx"

    return Response(
        content=doc_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
