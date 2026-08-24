from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Request
from fastapi.responses import JSONResponse, StreamingResponse, Response, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
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
from app.services.email_service import EmailService
from app.api.routes.audit import create_audit_entry

router = APIRouter()

@router.post('/api/applications', status_code=status.HTTP_201_CREATED)
def create_application(application: Applications, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        app_data = application.dict()
        valid_keys = {c.key for c in ApplicationsInDB.__table__.columns}
        filtered_data = {k: v for k, v in app_data.items() if k in valid_keys}

        new_application = ApplicationsInDB(**filtered_data)
        db.add(new_application)
        db.commit()
        db.refresh(new_application)
        response_dict = {
            "applicationId": new_application.applicationId,
            "status": "Submitted"
        }
        return JSONResponse(content=response_dict, media_type="application/json")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Exception in create_application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating application: {str(e)}"
        )

def serialize_application(app):
    if not app:
        return None
    data = {}
    for col in ApplicationsInDB.__table__.columns:
        val = getattr(app, col.key, None)
        if isinstance(val, (datetime, date)):
            val = val.isoformat()
        data[col.key] = val
    return data

@router.get('/api/get-single-applications/{applicationId}')
def get_single_application(applicationId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    application = db.query(ApplicationsInDB).filter( 
        and_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.applicationId == applicationId)).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return serialize_application(application)

@router.get('/api/get-all-applications/{zoneId}')
def get_all_application(
    zoneId: str = None, 
    status: Optional[str] = None, 
    search: Optional[str] = None, 
    createdAt: Optional[str] = None, 
    financialYear: Optional[str] = None, 
    month: Optional[str] = None, 
    startDate: Optional[str] = None, 
    endDate: Optional[str] = None, 
    page: Optional[int] = None,
    pageSize: Optional[int] = None,
    branchId: Optional[str] = None,
    regionId: Optional[str] = None,
    export: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    new_applications = []
    today = date.today()
    current_date = today.strftime("%Y-%m-%d")

    query = db.query(ApplicationsInDB).filter(ApplicationsInDB.isDeleted == False)

    # Apply role-based ID filters
    if branchId and branchId != "all" and branchId.strip():
        try:
            query = query.filter(ApplicationsInDB.branchId == int(branchId))
        except ValueError:
            pass
    elif regionId and regionId != "all" and regionId.strip():
        try:
            query = query.filter(ApplicationsInDB.regionId == int(regionId))
        except ValueError:
            pass
    elif zoneId and zoneId != "00000" and zoneId != "all" and zoneId.strip():
        try:
            query = query.filter(ApplicationsInDB.zoneId == int(zoneId))
        except ValueError:
            pass

    applications = query.order_by(ApplicationsInDB.createdAt.desc()).all()

    for app in applications:
        # Helper to extract date from app.createdAt
        app_date = None
        if app.createdAt:
            if isinstance(app.createdAt, datetime):
                app_date = app.createdAt.date()
            elif isinstance(app.createdAt, date):
                app_date = app.createdAt
            elif isinstance(app.createdAt, str):
                try:
                    app_date = datetime.strptime(app.createdAt[:10], "%Y-%m-%d").date()
                except Exception:
                    app_date = None

        # 1. status filter
        if status and status != "all" and app.status != status:
            continue

        # 2. search filter across multiple fields
        if search and search.strip():
            s = str(search.strip()).lower()
            app_id_str = str(app.applicationId or "").lower()
            cust_name_str = str(app.customerName or "").lower()
            acc_no_str = str(app.accountNo or "").lower()
            email_str = str(app.email or "").lower()
            cat_str = str(app.category or "").lower()
            branch_str = str(app.branchName or "").lower()
            region_str = str(app.regionName or "").lower()
            status_str = str(app.status or "").lower()
            if not (
                s in app_id_str
                or s in cust_name_str
                or s in acc_no_str
                or s in email_str
                or s in cat_str
                or s in branch_str
                or s in region_str
                or s in status_str
            ):
                continue

        # 3. createdAt filter
        if createdAt and createdAt.strip():
            s = createdAt.strip()
            if app_date:
                if s not in app_date.strftime("%Y-%m-%d"):
                    continue
            else:
                continue

        # 4. financialYear filter (e.g. "FY 2026-27" or "FY 2026-2027")
        if financialYear and financialYear != "all" and financialYear.strip():
            fy = financialYear.replace("FY ", "").strip()
            if "-" in fy:
                try:
                    fy_start, fy_end = fy.split("-")
                    start_year = int(fy_start)
                    end_year = int(fy_end)
                    if end_year < 100:
                        end_year = (start_year // 100) * 100 + end_year
                    
                    if app_date:
                        if app_date < date(start_year, 4, 1) or app_date > date(end_year, 3, 31):
                            continue
                    else:
                        continue
                except Exception as e:
                    print(f"Error parsing financial year: {e}")

        # 5. month filter (0-indexed to match JS)
        if month and month != "all" and str(month).strip():
            try:
                m_val = int(month)
                if app_date:
                    app_month = app_date.month - 1
                    if app_month != m_val:
                        continue
                else:
                    continue
            except Exception as e:
                print(f"Error parsing month: {e}")

        # 6. date range filters
        if startDate and startDate.strip():
            try:
                start_d = datetime.strptime(startDate.strip(), "%Y-%m-%d").date()
                if app_date:
                    if app_date < start_d:
                        continue
                else:
                    continue
            except Exception as e:
                print(f"Error parsing startDate: {e}")

        if endDate and endDate.strip():
            try:
                end_d = datetime.strptime(endDate.strip(), "%Y-%m-%d").date()
                if app_date:
                    if app_date > end_d:
                        continue
                else:
                    continue
            except Exception as e:
                print(f"Error parsing endDate: {e}")

        new_applications.append(app)

    total_records = len(new_applications)

    if export == "excel":
        headers = [
            "Sr No.", "Zone ID", "Region ID", "Region Name", "Branch ID", "Branch Name",
            "Application ID", "User Type", "Customer Name", "Category", "Email", "Mobile No",
            "Address", "Integrate With", "Status", "Average Balance", "Avg Transaction Yearly",
            "Avg Transaction Size", "Account Balance Today", "Account No", "Total Annual Transaction",
            "Total Bank Collection", "Aggregate Deposit Amt", "Projection", "Finalized Aggregator Name",
            "Authorised Person Name", "Authorised Person Designation", "RCC Contact Person Name",
            "RCC Mobile No", "RCC Mail ID", "Reason of Rejection", "Approved (RO)",
            "Approved (ZO)", "Approved (CO)", "Final PO Status", "Created Date"
        ]
        
        rows = []
        for idx, app in enumerate(new_applications, 1):
            created_dt = app.createdAt.strftime("%Y-%m-%d %H:%M:%S") if isinstance(app.createdAt, datetime) else str(app.createdAt)
            rows.append([
                idx,
                app.zoneId if app.zoneId is not None else "N/A",
                app.regionId if app.regionId is not None else "N/A",
                app.regionName or "N/A",
                app.branchId if app.branchId is not None else "N/A",
                app.branchName or "N/A",
                app.applicationId,
                app.userType or "N/A",
                app.customerName or "N/A",
                app.category or "N/A",
                app.email or "N/A",
                app.mobileNo if app.mobileNo is not None else "N/A",
                app.address or "N/A",
                app.integrateWith or "N/A",
                app.status or "N/A",
                app.averageBalance if app.averageBalance is not None else 0.0,
                app.avgTransactionYearly if app.avgTransactionYearly is not None else 0.0,
                app.avgTransactionSize if app.avgTransactionSize is not None else 0.0,
                app.accountBalanceToday if app.accountBalanceToday is not None else 0.0,
                app.accountNo if app.accountNo is not None else "N/A",
                app.totalAnnualTransaction if app.totalAnnualTransaction is not None else 0.0,
                app.totalBankCollection if app.totalBankCollection is not None else 0.0,
                app.aggregateDepositAmt if app.aggregateDepositAmt is not None else 0.0,
                app.projection or "N/A",
                app.finalizedAggregatorName or "N/A",
                app.authorisedPersonName or "N/A",
                app.authorisedPersonDesignation or "N/A",
                app.rccContactPersonName or "N/A",
                app.rccMobileNo if app.rccMobileNo is not None else "N/A",
                app.rccMailId or "N/A",
                app.reasonOfRejection or "N/A",
                "Yes" if app.isReviewByRO else "No",
                "Yes" if app.isReviewByZO else "No",
                "Yes" if app.isReviewByCO else "No",
                "Frozen" if app.isFinalApproved else "Pending",
                created_dt
            ])
            
        from fastapi.responses import StreamingResponse
        from app.utils.excel import generate_excel_workbook
        
        filters_dict = {
            "status": status,
            "search": search,
            "financialYear": financialYear,
            "month": month,
            "startDate": startDate,
            "endDate": endDate,
            "branchId": branchId,
            "regionId": regionId,
            "zoneId": zoneId if zoneId != "00000" else None
        }
        
        excel_file = generate_excel_workbook(
            headers, 
            rows, 
            sheet_name="Applications Report",
            title="Customer Applications Report",
            filters=filters_dict
        )
        response = StreamingResponse(
            excel_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response.headers["Content-Disposition"] = "attachment; filename=applications_report.xlsx"
        return response

    if page is not None and pageSize is not None:
        start = (page - 1) * pageSize
        end = start + pageSize
        sliced_applications = new_applications[start:end]
        return {
            "totalRecords": total_records,
            "data": [serialize_application(a) for a in sliced_applications]
        }
    return [serialize_application(a) for a in new_applications]

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

    valid_keys = {c.key for c in ApplicationsInDB.__table__.columns}
    for key, value in new_application.__dict__.items():
        if value is not None and key in valid_keys:
            setattr(existing_Applications, key, value)

    db.commit()
    db.refresh(existing_Applications)

    # Automatic Audit Trail Logging
    try:
        user_name = str(getattr(current_user, "username", "User") or "User")
        if new_application.isProjectionAdded is True:
            create_audit_entry(db, action="UPDATE_PROJECTION", applicationId=id, stage="Update Projection", performedBy=user_name, details="Projections updated or skipped")
        if new_application.isAggregatorAdded is True:
            create_audit_entry(db, action="ADD_AGGREGATOR", applicationId=id, stage="Add Aggregator", performedBy=user_name, details="Aggregators selected and requested for quote")
        if new_application.isMarkUpAddedCO is True or new_application.isQuoteReviewCO is True:
            create_audit_entry(db, action="ADD_MARKUP", applicationId=id, stage="Add Markup", performedBy=user_name, details="Markup applied by CO")
        if new_application.isQuoteAcceptRO is True:
            create_audit_entry(db, action="ACCEPT_QUOTE", applicationId=id, stage="Customer Acceptance", performedBy=user_name, details="Quote accepted by customer/RO")
        if new_application.isFinalApproved is True:
            create_audit_entry(db, action="FINALIZE_PO", applicationId=id, stage="PO Details", performedBy=user_name, details="Purchase Order finalized")
        if new_application.status == "rejected":
            create_audit_entry(db, action="REJECT_APPLICATION", applicationId=id, stage="CO Rejection", performedBy=user_name, details=f"Rejection reason: {new_application.reasonOfRejection or 'N/A'}")
    except Exception as audit_err:
        print(f"[AUDIT LOG WARNING] {audit_err}")

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
             ProjectionDetailsInDB.aggregatorId == aggregatorId)).order_by(ProjectionDetailsInDB.id.asc()).all()
    
    # Deduplicate by transactionType (pick latest entry per channel)
    unique_projections = []
    seen_types = set()
    for p in projectionDetails:
        t_type = (p.transactionType or "").strip()
        if t_type and t_type in seen_types:
            continue
        if t_type:
            seen_types.add(t_type)
        unique_projections.append(p)

    return unique_projections

@router.post('/api/applications/{applicationId}/aggregators/{aggregatorId}/resend-quote-email')
def resend_quote_email(applicationId: int, aggregatorId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == applicationId).first()
    if not app:
        raise HTTPException(status_code=404, detail=f"Application #{applicationId} not found")

    # Look up in ManageAggregatorInDB by aggregatorId
    aggregator = db.query(ManageAggregatorInDB).filter(
        and_(
            ManageAggregatorInDB.aggregatorId == aggregatorId,
            ManageAggregatorInDB.isDeleted == False
        )
    ).first()

    if not aggregator:
        # Fallback to check PaymentAggregatorInDB
        payment_agg = db.query(PaymentAggregatorInDB).filter(
            and_(
                PaymentAggregatorInDB.applicationId == applicationId,
                or_(
                    PaymentAggregatorInDB.aggregatorId == aggregatorId,
                    PaymentAggregatorInDB.id == aggregatorId
                )
            )
        ).first()
        if payment_agg:
            aggregator = db.query(ManageAggregatorInDB).filter(
                ManageAggregatorInDB.aggregatorId == payment_agg.aggregatorId
            ).first()

    if not aggregator:
        raise HTTPException(status_code=404, detail=f"Aggregator with ID {aggregatorId} not found")

    # Fetch projections for this aggregator
    projections = db.query(ProjectionDetailsInDB).filter(
        and_(
            ProjectionDetailsInDB.applicationId == applicationId,
            ProjectionDetailsInDB.aggregatorId == aggregatorId,
            ProjectionDetailsInDB.isDeleted == False,
            ProjectionDetailsInDB.isIB == False
        )
    ).order_by(ProjectionDetailsInDB.id.asc()).all()

    if not projections:
        projections = db.query(ProjectionDetailsInDB).filter(
            and_(
                ProjectionDetailsInDB.applicationId == applicationId,
                ProjectionDetailsInDB.isDeleted == False,
                ProjectionDetailsInDB.isIB == False
            )
        ).order_by(ProjectionDetailsInDB.id.asc()).all()

    # Deduplicate projections by transactionType
    unique_projs = []
    seen = set()
    for p in projections:
        t_type = (p.transactionType or "").strip()
        if t_type and t_type not in seen:
            seen.add(t_type)
            unique_projs.append(p)

    agg_name = aggregator.aggregatorName
    agg_email = aggregator.email
    contact_person = aggregator.contactPersonName

    # Dispatch email
    try:
        sent = EmailService.send_quote_request_email(
            aggregator_name=agg_name,
            aggregator_email=agg_email,
            contact_person=contact_person,
            application=app,
            end_date_str=str(app.endDate) if hasattr(app, "endDate") and app.endDate else None,
            projections=unique_projs
        )
    except Exception as email_err:
        print(f"[EMAIL ERROR] Failed to dispatch email: {email_err}")
        sent = False

    try:
        create_audit_entry(
            db=db,
            action="RESEND_QUOTE_EMAIL",
            applicationId=applicationId,
            stage="AGGREGATOR_QUOTE",
            performedBy=getattr(current_user, "username", "System"),
            details=f"Re-triggered quotation email to {agg_name} ({agg_email}). Dispatch Status: {'SUCCESS' if sent else 'FAILED'}"
        )
    except Exception as audit_err:
        print(f"[AUDIT ERROR] Failed to record audit log: {audit_err}")

    return {
        "status": "success" if sent else "warning",
        "message": f"Quotation request email dispatched to {agg_name} ({agg_email})" if sent else f"Email queued (Check SMTP configuration in .env to deliver to {agg_email})",
        "recipient": agg_email,
        "sent": sent
    }

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

@router.delete("/api/files/delete/{file_id}")
@router.delete("/api/files/{file_id}")
def deleteFile(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_file = db.query(FileStoreInDB).filter(FileStoreInDB.fileId == file_id).first()
    if not db_file:
        return {"success": False, "message": "File not found", "fileId": file_id}
    
    db.delete(db_file)
    db.commit()
    return {"success": True, "message": "File deleted successfully", "fileId": file_id}

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

# --- Workflow Stage Metrics Endpoint ---

@router.get('/api/applications/stage-metrics')
def get_stage_metrics(
    zoneId: Optional[str] = None,
    branchId: Optional[str] = None,
    regionId: Optional[str] = None,
    financialYear: Optional[str] = None,
    month: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ApplicationsInDB).filter(ApplicationsInDB.isDeleted == False)

    if branchId and branchId != "all" and branchId.strip():
        try:
            query = query.filter(ApplicationsInDB.branchId == int(branchId))
        except ValueError:
            pass
    elif regionId and regionId != "all" and regionId.strip():
        try:
            query = query.filter(ApplicationsInDB.regionId == int(regionId))
        except ValueError:
            pass
    elif zoneId and zoneId != "00000" and zoneId != "all" and zoneId.strip():
        try:
            query = query.filter(ApplicationsInDB.zoneId == int(zoneId))
        except ValueError:
            pass

    applications = query.all()

    filtered_apps = []
    for app in applications:
        if search:
            search_str = f"{app.customerName or ''} {app.applicationId or ''} {app.accountNo or ''} {app.category or ''} {app.branchName or ''} {app.status or ''}".lower()
            if search.lower() not in search_str:
                continue

        if financialYear and financialYear != "all" and app.createdAt:
            app_year = app.createdAt.year
            app_month = app.createdAt.month
            app_fy = f"FY {app_year}-{(app_year + 1) % 100:02d}" if app_month >= 4 else f"FY {app_year - 1}-{app_year % 100:02d}"
            if app_fy != financialYear:
                continue

        if month and month != "all" and app.createdAt:
            try:
                if app.createdAt.month != (int(month) + 1):
                    continue
            except ValueError:
                pass

        if startDate and app.createdAt:
            try:
                start_dt = datetime.strptime(startDate, "%Y-%m-%d").date()
                if app.createdAt.date() < start_dt:
                    continue
            except ValueError:
                pass

        if endDate and app.createdAt:
            try:
                end_dt = datetime.strptime(endDate, "%Y-%m-%d").date()
                if app.createdAt.date() > end_dt:
                    continue
            except ValueError:
                pass

        filtered_apps.append(app)

    stage_counts = [0, 0, 0, 0, 0, 0, 0]
    kpis = {"total": len(filtered_apps), "pending": 0, "quotes": 0, "approved": 0}

    for app in filtered_apps:
        if app.isFinalApproved:
            stage_counts[6] += 1
            kpis["approved"] += 1
        elif app.isQuoteAcceptRO:
            stage_counts[5] += 1
            kpis["quotes"] += 1
        elif app.isQuoteReviewCO or app.isMarkUpAddedCO:
            stage_counts[4] += 1
            kpis["quotes"] += 1
        elif app.isQuoteAddedPA or app.isAggregatorAdded:
            stage_counts[3] += 1
            kpis["quotes"] += 1
        elif app.isReviewByCO:
            stage_counts[2] += 1
            kpis["pending"] += 1
        elif app.isReviewByRO or app.isReviewByZO:
            stage_counts[1] += 1
            kpis["pending"] += 1
        else:
            stage_counts[0] += 1
            kpis["pending"] += 1

    return {
        "total": len(filtered_apps),
        "stageCounts": stage_counts,
        "kpis": kpis
    }

