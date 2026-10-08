from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Request, Body, Query
from fastapi.responses import JSONResponse, StreamingResponse, Response, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
from datetime import date, datetime
import io
from pathlib import Path
import os

import logging
from app.api.deps.dependencies import get_db, get_current_user, verify_write_permission
from app.model.models import (ApplicationsInDB, ProjectionDetailsInDB, PaymentAggregatorInDB, 
                              FileStoreInDB, ManageAggregatorInDB, User, HelpDesk)
from app.schemas.schemas import (Applications, ApplicationsUpdate, ProjectionDetails, 
                                 ProjectionDetailsUpdate)
from app.services.generate_po_service import PurchaseOrderService
from app.services.generate_sanction_letter_service import SanctionLetterService
from app.services.email_service import EmailService
from app.api.routes.audit import create_audit_entry
from app.api.routes.notifications import create_notification

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post('/api/applications', status_code=status.HTTP_201_CREATED)
@router.post('/applications', status_code=status.HTTP_201_CREATED)
def create_application(application: Applications, db: Session = Depends(get_db), current_user: User = Depends(verify_write_permission)):
    try:
        app_data = application.dict()

        # Fallback to current_user attributes if branch/region/zone attributes are omitted
        if not app_data.get("branchName") and hasattr(current_user, "Branch_Name") and current_user.Branch_Name:
            app_data["branchName"] = current_user.Branch_Name
        if not app_data.get("branchId") and hasattr(current_user, "Locationid") and current_user.Locationid:
            app_data["branchId"] = current_user.Locationid

        if not app_data.get("regionName") and hasattr(current_user, "Region_Name") and current_user.Region_Name:
            app_data["regionName"] = current_user.Region_Name
        if not app_data.get("regionId") and hasattr(current_user, "RegionId") and current_user.RegionId:
            app_data["regionId"] = current_user.RegionId

        if not app_data.get("zoneName") and hasattr(current_user, "Zone_Name") and current_user.Zone_Name:
            app_data["zoneName"] = current_user.Zone_Name
        if not app_data.get("zoneId") and hasattr(current_user, "ZoneId") and current_user.ZoneId:
            app_data["zoneId"] = current_user.ZoneId

        valid_keys = {c.key for c in ApplicationsInDB.__table__.columns}
        filtered_data = {k: v for k, v in app_data.items() if k in valid_keys}
        filtered_data["isDeleted"] = False

        new_application = ApplicationsInDB(**filtered_data)
        db.add(new_application)
        db.commit()
        db.refresh(new_application)

        # Trigger notification to respective RO
        try:
            user_role_str = str(getattr(current_user, "LocationType", "") or getattr(current_user, "role", "BO")).upper()
            if user_role_str == "RO":
                create_notification(
                    db=db,
                    applicationId=new_application.applicationId,
                    title="Application Initiated",
                    message=f"Application #{new_application.applicationId} for {new_application.customerName or 'Customer'} initiated by Regional Office. Pending review & approval.",
                    type="info",
                    stage="Application Submission",
                    targetRole="RO",
                    regionName=new_application.regionName
                )
            else:
                create_notification(
                    db=db,
                    applicationId=new_application.applicationId,
                    title="New Application Submitted",
                    message=f"Branch {new_application.branchName or 'Branch'} submitted Application #{new_application.applicationId} for {new_application.customerName or 'Customer'}. Pending RO verification.",
                    type="info",
                    stage="Application Submission",
                    targetRole="RO",
                    regionName=new_application.regionName
                )
        except Exception as notif_err:
            print(f"[NOTIFICATION WARNING] {notif_err}")

        response_dict = {
            "applicationId": new_application.applicationId,
            "status": new_application.status or "Submitted",
            "data": serialize_application(new_application)
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
@router.get('/get-single-applications/{applicationId}')
def get_single_application(applicationId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    application = db.query(ApplicationsInDB).filter( 
        and_(or_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.isDeleted.is_(None)), ApplicationsInDB.applicationId == applicationId)).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return serialize_application(application)

@router.get('/api/get-all-applications/{zoneId}')
@router.get('/get-all-applications/{zoneId}')
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
    userRole: Optional[str] = None,
    export: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    new_applications = []
    today = date.today()
    current_date = today.strftime("%Y-%m-%d")

    query = db.query(ApplicationsInDB).filter(or_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.isDeleted.is_(None)))

    # Determine effective role for workflow stage-gate filtering (Requirement 9)
    effective_role = (userRole or getattr(current_user, "LocationType", None) or getattr(current_user, "role", None) or "CO").upper().strip()

    if effective_role == "BO":
        # BO sees all applications belonging to their branch
        eff_branch = branchId or getattr(current_user, "Locationid", None) or getattr(current_user, "branchId", None) or getattr(current_user, "BranchId", None)
        if eff_branch and str(eff_branch).strip() not in ("all", "0", "00000", "undefined", "null", ""):
            try:
                query = query.filter(ApplicationsInDB.branchId == int(eff_branch))
            except ValueError:
                pass

    elif effective_role == "RO":
        # RO sees all applications belonging to their region (pending review, approved, or rejected)
        eff_region = regionId or getattr(current_user, "RegionId", None) or getattr(current_user, "regionId", None) or getattr(current_user, "Region_Id", None)
        if eff_region and str(eff_region).strip() not in ("all", "0", "00000", "undefined", "null", ""):
            try:
                query = query.filter(ApplicationsInDB.regionId == int(eff_region))
            except ValueError:
                pass

    elif effective_role == "ZO":
        # ZO sees applications in their zone ONLY AFTER RO approval is complete (or rejected at ZO/CO stage)
        eff_zone = zoneId or getattr(current_user, "ZoneId", None) or getattr(current_user, "zoneId", None) or getattr(current_user, "Zone_Id", None)
        if eff_zone and str(eff_zone).strip() not in ("all", "0", "00000", "undefined", "null", ""):
            try:
                query = query.filter(ApplicationsInDB.zoneId == int(eff_zone))
            except ValueError:
                pass
        query = query.filter(
            or_(
                ApplicationsInDB.isReviewByRO == True,
                ApplicationsInDB.status.in_([
                    "approvedbyro", "approvedbyzo", "approvedbyco", 
                    "quoterequested", "quotesubmitted", "reviewquote", 
                    "quoteaccepted", "finalapproval", "completed", "finalapproved"
                ]),
                and_(
                    ApplicationsInDB.status == "rejected",
                    ApplicationsInDB.rejectedRole.in_(["ZO", "CO"])
                )
            )
        )

    else:
        # CO / ADMIN: Sees bank-wide applications across all zones (or filtered by specific zone/region/branch if requested)
        if zoneId and str(zoneId).strip() not in ("all", "0", "00000", "undefined", "null", ""):
            try:
                query = query.filter(ApplicationsInDB.zoneId == int(zoneId))
            except ValueError:
                pass
        if regionId and str(regionId).strip() not in ("all", "0", "00000", "undefined", "null", ""):
            try:
                query = query.filter(ApplicationsInDB.regionId == int(regionId))
            except ValueError:
                pass
        if branchId and str(branchId).strip() not in ("all", "0", "00000", "undefined", "null", ""):
            try:
                query = query.filter(ApplicationsInDB.branchId == int(branchId))
            except ValueError:
                pass

    applications = query.order_by(ApplicationsInDB.createdAt.desc(), ApplicationsInDB.applicationId.desc()).all()


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

        # 2. search filter across multiple fields and identifiers
        if search and search.strip():
            s = str(search.strip()).lower()
            app_id_str = str(app.applicationId or "").lower()
            cust_name_str = str(app.customerName or "").lower()
            acc_no_str = str(app.accountNo or "").lower()
            email_str = str(app.email or "").lower()
            cat_str = str(app.category or "").lower()
            bus_cat_str = str(getattr(app, "businessCategory", "") or "").lower()
            branch_str = str(app.branchName or "").lower()
            branch_id_str = str(app.branchId or "").lower()
            region_str = str(app.regionName or "").lower()
            region_id_str = str(app.regionId or "").lower()
            zone_str = str(app.zoneName or "").lower()
            zone_id_str = str(app.zoneId or "").lower()
            status_str = str(app.status or "").lower()
            if not (
                s in app_id_str
                or s in cust_name_str
                or s in acc_no_str
                or s in email_str
                or s in cat_str
                or s in bus_cat_str
                or s in branch_str
                or s in branch_id_str
                or s in region_str
                or s in region_id_str
                or s in zone_str
                or s in zone_id_str
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
            "Sr No.", "Application ID", "Customer Name", "Zone Name", "Region Name",
            "Branch Name", "Category", "Business Category", "Status", "Finalized Aggregator",
            "Avg Ticket Size (Rs)", "Expected Annual Txns", "Expected Annual Volume (Rs)",
            "Created Date", "Reason of Rejection"
        ]
        
        rows = []
        for idx, app in enumerate(new_applications, 1):
            created_dt = app.createdAt.strftime("%Y-%m-%d %H:%M:%S") if isinstance(app.createdAt, datetime) else str(app.createdAt)
            annual_vol = app.totalAnnualTransaction or app.aggregateDepositAmt or ((app.avgTransactionYearly or 0) * (app.avgTransactionSize or 0))
            rows.append([
                idx,
                app.applicationId,
                app.customerName or "N/A",
                getattr(app, "zoneName", None) or (f"Zone {app.zoneId}" if app.zoneId else "N/A"),
                app.regionName or (f"Region {app.regionId}" if app.regionId else "N/A"),
                app.branchName or (f"Branch {app.branchId}" if app.branchId else "N/A"),
                app.category or "N/A",
                getattr(app, "businessCategory", None) or "N/A",
                (app.status or "Pending").upper(),
                app.finalizedAggregatorName or "Pending Finalization",
                app.avgTransactionSize if app.avgTransactionSize is not None else 0.0,
                app.avgTransactionYearly if app.avgTransactionYearly is not None else 0,
                annual_vol if annual_vol is not None else 0.0,
                created_dt,
                app.reasonOfRejection or "-"
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

def check_application_not_rejected(application_id: int, db: Session):
    app = db.query(ApplicationsInDB).filter(and_(ApplicationsInDB.applicationId == application_id, or_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.isDeleted.is_(None)))).first()
    if app and (("reject" in str(app.status or "").lower()) or bool(app.reasonOfRejection)):
        raise HTTPException(status_code=400, detail=f"Application #{application_id} is REJECTED. Actions on rejected applications are disabled.")

@router.delete('/api/applications/{id}')
@router.delete('/applications/{id}')
def delete_applications(id: int, db: Session = Depends(get_db), current_user: User = Depends(verify_write_permission)):
    check_application_not_rejected(id, db)
    existing_Applications = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == id).first()
    existing_Applications.isDeleted = True
    db.commit()
    response_dict = {
        "applicationId": existing_Applications.applicationId,
        "status": "Deleted"
    }
    return JSONResponse(content=response_dict, media_type="application/json")

def to_dict(obj, keys):
    if not obj:
        return {}
    return {key: getattr(obj, key, None) for key in keys}

def _extract_commercial_charges_context(application, manage_agg, projection_details):
    today = date.today()
    current_financial_year = f"{today.year}-{(today.year + 1) % 100:02d}"
    current_date = today.strftime("%d/%m/%Y")

    agg_name = ""
    if manage_agg and manage_agg.aggregatorName:
        agg_name = manage_agg.aggregatorName
    elif application and (getattr(application, 'finalizedAggregatorName', None) or getattr(application, 'selectedAggregatorName', None)):
        agg_name = application.finalizedAggregatorName or application.selectedAggregatorName or 'Payment Aggregator'
    else:
        agg_name = 'Payment Aggregator'

    agg_short = agg_name
    if '(' in agg_short:
        agg_short = agg_short.split('(')[0].strip()
    if agg_short.startswith('M/s '):
        agg_short = agg_short[4:].strip()

    legal_agg_name = agg_name
    if not legal_agg_name.startswith('M/s '):
        legal_agg_name = f"M/s {legal_agg_name}"

    app_dict = to_dict(application, [
        'applicationId', 'customerName', 'address', 'businessCategory', 'accountNo', 'category',
        'branchName', 'branchId', 'regionName', 'zoneName', 'totalAnnualTransaction',
        'avgTransactionSize', 'approvedByCOId', 'customerAcceptanceRequired',
        'finalizedAggregatorId', 'finalizedAggregatorName', 'rccMailId', 'rccMobileNo',
        'rccContactPersonName', 'authorisedPersonName', 'authorisedPersonDesignation'
    ]) if application else {}

    if not app_dict.get('zoneName') and application:
        app_dict['zoneName'] = f"Zone {application.zoneId}" if getattr(application, 'zoneId', None) else 'West Zone'
    if not app_dict.get('regionName') and application:
        app_dict['regionName'] = f"Region {application.regionId}" if getattr(application, 'regionId', None) else 'Mumbai Region'
    if not app_dict.get('branchName') and application:
        app_dict['branchName'] = f"Branch {application.branchId}" if getattr(application, 'branchId', None) else 'Mumbai Main Branch'

    agg_dict = to_dict(manage_agg, [
        'aggregatorId', 'aggregatorName', 'contactPersonName', 'email', 'mobileNo', 'location', 'services'
    ]) if manage_agg else {}

    effective_agg_id = (manage_agg.aggregatorId if manage_agg else None) or (application.finalizedAggregatorId if application else None)

    # Standard benchmark defaults
    charges_proposed_map = {
        'net_banking': 2.50,
        'credit_card': 1.75,
        'amex': 1.85,
        'debit_upto_2k': 0.40,
        'debit_above_2k': 0.90,
        'wallet': 1.60,
        'neft': 7.0,
        'intl': 2.60,
        'emi': 1.95,
    }

    rates_map = {
        'hdfc': 1.60,
        'sbi': 1.20,
        'icici': 1.60,
        'axis': 1.20,
        'others': 0.60,
        'credit_card': 1.25,
        'amex': 1.35,
        'debit_upto_2k': 0.25,
        'debit_above_2k': 0.75,
        'wallet': 1.50,
        'neft': 5.0,
        'intl': 2.50,
        'emi': 1.85,
    }

    has_proj = bool(projection_details and len(projection_details) > 0)
    flags = {
        'hasNetBanking': not has_proj,
        'hasCreditCard': not has_proj,
        'hasAmex': not has_proj,
        'hasDebitCard': not has_proj,
        'hasDebitUpto2k': not has_proj,
        'hasDebitAbove2k': not has_proj,
        'hasRupayDebit': not has_proj,
        'hasUpi': not has_proj,
        'hasWallet': not has_proj,
        'hasNeft': not has_proj,
        'hasIntl': not has_proj,
        'hasEmi': not has_proj,
    }

    for item in (projection_details or []):
        ttype = str(getattr(item, 'transactionType', None) or (item.get('transactionType') if isinstance(item, dict) else '') or '').strip().lower()
        ibtype = getattr(item, 'isIB', None) if not isinstance(item, dict) else item.get('isIB')
        cp_val = getattr(item, 'chargesProposed', None) if not isinstance(item, dict) else item.get('chargesProposed')
        rt_val = getattr(item, 'rate', None) if not isinstance(item, dict) else item.get('rate')
        vol_raw = (getattr(item, 'aggregateAmount', None) or getattr(item, 'transactionValue', None) or getattr(item, 'volume', None)) if not isinstance(item, dict) else (item.get('aggregateAmount') or item.get('transactionValue') or item.get('volume'))
        cnt_raw = (getattr(item, 'estimatedTransactions', None) or getattr(item, 'transactionCount', None) or getattr(item, 'count', None)) if not isinstance(item, dict) else (item.get('estimatedTransactions') or item.get('transactionCount') or item.get('count'))
        item_agg_id = getattr(item, 'aggregatorId', None) if not isinstance(item, dict) else item.get('aggregatorId')

        is_item_for_this_agg = (effective_agg_id is None or item_agg_id is None or item_agg_id == 0 or item_agg_id == effective_agg_id)
        
        try:
            cp_num = float(str(cp_val).replace('%', '').replace('₹', '').strip()) if cp_val is not None and str(cp_val).strip() != '' else 0.0
        except Exception:
            cp_num = 0.0

        try:
            rt_num = float(str(rt_val).replace('%', '').replace('₹', '').strip()) if rt_val is not None and str(rt_val).strip() != '' else 0.0
        except Exception:
            rt_num = 0.0

        try:
            vol_num = float(str(vol_raw).replace('%', '').replace('₹', '').replace(',', '').strip()) if vol_raw is not None and str(vol_raw).strip() != '' else 0.0
        except Exception:
            vol_num = 0.0

        try:
            cnt_num = float(str(cnt_raw).replace('%', '').replace(',', '').strip()) if cnt_raw is not None and str(cnt_raw).strip() != '' else 0.0
        except Exception:
            cnt_num = 0.0

        is_active = (vol_num > 0 or cnt_num > 0 or cp_num > 0 or rt_num > 0)

        if ibtype is True or 'net banking' in ttype or 'internet' in ttype or 'ib' == ttype:
            if is_active:
                flags['hasNetBanking'] = True
            if cp_num > 0:
                charges_proposed_map['net_banking'] = cp_num
            if is_item_for_this_agg and rt_num > 0:
                if 'sbi' in ttype:
                    rates_map['sbi'] = rt_num
                elif 'hdfc' in ttype:
                    rates_map['hdfc'] = rt_num
                elif 'icici' in ttype:
                    rates_map['icici'] = rt_num
                elif 'axis' in ttype:
                    rates_map['axis'] = rt_num
                elif 'other' in ttype or 'all other' in ttype:
                    rates_map['others'] = rt_num
        elif 'amex' in ttype or 'diner' in ttype:
            if is_active:
                flags['hasAmex'] = True
            if cp_num > 0:
                charges_proposed_map['amex'] = cp_num
            if is_item_for_this_agg and rt_num > 0:
                rates_map['amex'] = rt_num
        elif ('credit card' in ttype or 'cc' == ttype or 'visa/mastercard' in ttype) and not ('debit' in ttype):
            if is_active:
                flags['hasCreditCard'] = True
            if cp_num > 0:
                charges_proposed_map['credit_card'] = cp_num
            if is_item_for_this_agg and rt_num > 0:
                rates_map['credit_card'] = rt_num
        elif 'upto 2000' in ttype or 'upto2k' in ttype or 'upto 2k' in ttype:
            if is_active:
                flags['hasDebitCard'] = True
                flags['hasDebitUpto2k'] = True
            if cp_num > 0:
                charges_proposed_map['debit_upto_2k'] = cp_num
            if is_item_for_this_agg and rt_num > 0:
                rates_map['debit_upto_2k'] = rt_num
        elif 'above 2000' in ttype or 'above2k' in ttype or 'above 2k' in ttype:
            if is_active:
                flags['hasDebitCard'] = True
                flags['hasDebitAbove2k'] = True
            if cp_num > 0:
                charges_proposed_map['debit_above_2k'] = cp_num
            if is_item_for_this_agg and rt_num > 0:
                rates_map['debit_above_2k'] = rt_num
        elif 'rupay' in ttype and 'debit' in ttype:
            if is_active:
                flags['hasDebitCard'] = True
                flags['hasRupayDebit'] = True
        elif 'upi' in ttype:
            if is_active:
                flags['hasUpi'] = True
        elif 'wallet' in ttype or 'prepaid' in ttype:
            if is_active:
                flags['hasWallet'] = True
            if cp_num > 0:
                charges_proposed_map['wallet'] = cp_num
            if is_item_for_this_agg and rt_num > 0:
                rates_map['wallet'] = rt_num
        elif 'neft' in ttype or 'rtgs' in ttype or 'challan' in ttype:
            if is_active:
                flags['hasNeft'] = True
            if cp_num > 0:
                charges_proposed_map['neft'] = cp_num
            if is_item_for_this_agg and rt_num > 0:
                rates_map['neft'] = rt_num
        elif 'intl' in ttype or 'international' in ttype:
            if is_active:
                flags['hasIntl'] = True
            if cp_num > 0:
                charges_proposed_map['intl'] = cp_num
            if is_item_for_this_agg and rt_num > 0:
                rates_map['intl'] = rt_num
        elif 'emi' in ttype:
            if is_active:
                flags['hasEmi'] = True
            if cp_num > 0:
                charges_proposed_map['emi'] = cp_num
            if is_item_for_this_agg and rt_num > 0:
                rates_map['emi'] = rt_num

    if flags['hasDebitUpto2k'] or flags['hasDebitAbove2k']:
        flags['hasDebitCard'] = True

    ib_cp = charges_proposed_map['net_banking']
    cc_cp = charges_proposed_map['credit_card']
    amex_cp = charges_proposed_map['amex']
    dc_upto_cp = charges_proposed_map['debit_upto_2k']
    dc_above_cp = charges_proposed_map['debit_above_2k']
    wallet_cp = charges_proposed_map['wallet']
    neft_cp = charges_proposed_map['neft']
    intl_cp = charges_proposed_map['intl']
    emi_cp = charges_proposed_map['emi']

    hdfc_rt = rates_map['hdfc']
    sbi_rt = rates_map['sbi']
    icici_rt = rates_map['icici']
    axis_rt = rates_map['axis']
    others_rt = rates_map['others']
    cc_rt = rates_map['credit_card']
    amex_rt = rates_map['amex']
    dc_upto_rt = rates_map['debit_upto_2k']
    dc_above_rt = rates_map['debit_above_2k']
    wallet_rt = rates_map['wallet']
    neft_rt = rates_map['neft']
    intl_rt = rates_map['intl']
    emi_rt = rates_map['emi']

    result = {
        'ibChargePurposed': f"{ib_cp:.2f}%",
        'hdfcRate': f"{hdfc_rt:.2f}%",
        'hdfcBankShare': f"{max(0.0, round(ib_cp - hdfc_rt, 2)):.2f}%",
        'sbiRate': f"{sbi_rt:.2f}%",
        'sbiBankShare': f"{max(0.0, round(ib_cp - sbi_rt, 2)):.2f}%",
        'iciciRate': f"{icici_rt:.2f}%",
        'iciciBankShare': f"{max(0.0, round(ib_cp - icici_rt, 2)):.2f}%",
        'axisRate': f"{axis_rt:.2f}%",
        'axisBankShare': f"{max(0.0, round(ib_cp - axis_rt, 2)):.2f}%",
        'othersRate': f"{others_rt:.2f}%",
        'othersBankShare': f"{max(0.0, round(ib_cp - others_rt, 2)):.2f}%",

        'cdChargePurposed': f"{cc_cp:.2f}%",
        'cdRate': f"{cc_rt:.2f}%",
        'cdBankShare': f"{max(0.0, round(cc_cp - cc_rt, 2)):.2f}%",

        'amexChargePurposed': f"{amex_cp:.2f}%",
        'amexRate': f"{amex_rt:.2f}%",
        'amexBankShare': f"{max(0.0, round(amex_cp - amex_rt, 2)):.2f}%",

        'ddupto2kChargePurposed': f"{dc_upto_cp:.2f}%",
        'ddupto2kRate': f"{dc_upto_rt:.2f}%",
        'ddupto2kBankShare': f"{max(0.0, round(dc_upto_cp - dc_upto_rt, 2)):.2f}%",

        'ddabove2kChargePurposed': f"{dc_above_cp:.2f}%",
        'ddabove2kRate': f"{dc_above_rt:.2f}%",
        'ddabove2kBankShare': f"{max(0.0, round(dc_above_cp - dc_above_rt, 2)):.2f}%",

        'walletChargePurposed': f"{wallet_cp:.2f}%",
        'walletRate': f"{wallet_rt:.2f}%",
        'walletBankShare': f"{max(0.0, round(wallet_cp - wallet_rt, 2)):.2f}%",

        'neftChargePurposed': f"₹ {int(neft_cp) if neft_cp.is_integer() else neft_cp}/-",
        'neftRate': f"₹ {int(neft_rt) if neft_rt.is_integer() else neft_rt}/-",
        'neftBankShare': f"₹ {int(max(0.0, neft_cp - neft_rt)) if (neft_cp - neft_rt).is_integer() else max(0.0, round(neft_cp - neft_rt, 2))}/-",

        'intlChargePurposed': f"{intl_cp:.2f}%",
        'intlRate': f"{intl_rt:.2f}%",
        'intlBankShare': f"{max(0.0, round(intl_cp - intl_rt, 2)):.2f}%",

        'emiChargePurposed': f"{emi_cp:.2f}%",
        'emiRate': f"{emi_rt:.2f}%",
        'emiBankShare': f"{max(0.0, round(emi_cp - emi_rt, 2)):.2f}%",
    }

    return {
        **app_dict,
        **agg_dict,
        'aggregatorShortName': agg_short,
        'legalAggregatorName': legal_agg_name,
        'currentFinancialYear': current_financial_year,
        'currentDate': current_date,
        'branchLocation': (getattr(application, 'branchName', None) if application else None) or 'Mumbai',
        **result,
        **flags
    }

def dispatch_po_email_to_vendor(application_id: int, db: Session) -> bool:
    app = db.query(ApplicationsInDB).filter(
        and_(or_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.isDeleted.is_(None)), ApplicationsInDB.applicationId == application_id)
    ).first()
    if not app or not app.finalizedAggregatorId:
        return False

    if app.poMailStatus == "SENT":
        print(f"[PO EMAIL] Email already sent for Application #{application_id}. Skipping duplicate trigger.")
        return True

    agg_id = app.finalizedAggregatorId

    manage_agg = db.query(ManageAggregatorInDB).filter(
        and_(ManageAggregatorInDB.isDeleted == False, ManageAggregatorInDB.aggregatorId == agg_id)
    ).first()

    pa_record = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.isDeleted == False, 
             PaymentAggregatorInDB.applicationId == application_id,
             PaymentAggregatorInDB.aggregatorId == agg_id)
    ).first()

    agg_name = (manage_agg.aggregatorName if manage_agg else None) or (pa_record.aggregatorName if pa_record else None) or app.finalizedAggregatorName or "Payment Aggregator"
    agg_email = (pa_record.email if pa_record and pa_record.email else None) or (manage_agg.email if manage_agg and manage_agg.email else None)

    if not agg_email or not agg_email.strip():
        print(f"[PO EMAIL] No email found for aggregator {agg_name} (ID: {agg_id}).")
        app.poMailStatus = "NO_EMAIL"
        db.commit()
        return False

    projectionDetails = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False,
             ProjectionDetailsInDB.applicationId == application_id)).all()

    poDetails = _extract_commercial_charges_context(app, manage_agg, projectionDetails)

    po_service = PurchaseOrderService()
    doc_bytes = po_service.generate_purchase_order(poDetails, logo_path=None)

    sent = EmailService.send_po_issuance_email(
        aggregator_name=agg_name,
        aggregator_email=agg_email.strip(),
        contact_person=manage_agg.contactPersonName if manage_agg else None,
        application=app,
        po_data=poDetails,
        po_docx_bytes=doc_bytes
    )

    if sent:
        app.poMailStatus = "SENT"
        app.poMailSentAt = datetime.now()
        app.poMailRecipient = agg_email.strip()
        db.commit()
        try:
            create_audit_entry(
                db,
                action="PO_MAIL_DISPATCHED",
                applicationId=application_id,
                stage="PO Details",
                performedBy="System / Approval Trigger",
                details=f"PO document successfully emailed to {agg_name} ({agg_email})"
            )
        except Exception as e:
            print(f"[AUDIT ERROR] {e}")

        # Dispatch non-selection regret emails to all other aggregators
        try:
            other_aggregators = db.query(PaymentAggregatorInDB).filter(
                and_(
                    PaymentAggregatorInDB.applicationId == application_id,
                    PaymentAggregatorInDB.isDeleted == False,
                    PaymentAggregatorInDB.aggregatorId != app.finalizedAggregatorId
                )
            ).all()
            for other_agg in other_aggregators:
                m_agg = db.query(ManageAggregatorInDB).filter(
                    and_(
                        ManageAggregatorInDB.aggregatorId == other_agg.aggregatorId,
                        ManageAggregatorInDB.isDeleted == False
                    )
                ).first()
                target_email = (m_agg.email if m_agg else None) or getattr(other_agg, "email", None)
                if target_email and target_email.strip():
                    target_name = (m_agg.aggregatorName if m_agg else None) or other_agg.aggregatorName or "Payment Aggregator"
                    target_contact = (m_agg.contactPersonName if m_agg else None) or ""
                    EmailService.send_quote_regret_email(
                        aggregator_name=target_name,
                        aggregator_email=target_email.strip(),
                        contact_person=target_contact,
                        application=app
                    )
                    create_audit_entry(
                        db,
                        action="QUOTE_REGRET_EMAIL_DISPATCHED",
                        applicationId=application_id,
                        stage="Final Approval",
                        performedBy="System / Approval Trigger",
                        details=f"Non-selection regret notification emailed to {target_name} ({target_email})"
                    )
        except Exception as regret_err:
            print(f"[REGRET EMAIL DISPATCH ERROR] {regret_err}")

        return True
    else:
        app.poMailStatus = "FAILED"
        db.commit()
        return False


@router.put('/api/applications/{id}')
@router.put('/applications/{id}')
def update_applications(id: int, new_application: ApplicationsUpdate, db: Session = Depends(get_db), current_user: User = Depends(verify_write_permission)):
    existing_Applications = db.query(ApplicationsInDB).filter(
        and_(ApplicationsInDB.applicationId == id, or_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.isDeleted.is_(None)))).first()
    if not existing_Applications:
        raise HTTPException(status_code=404, detail="Applications not found")

    # 1. Guard: Check if application is already rejected
    existing_status_lower = str(existing_Applications.status or "").lower()
    is_already_rejected = "reject" in existing_status_lower or bool(existing_Applications.reasonOfRejection)
    if is_already_rejected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application #{id} is REJECTED. All further workflow actions and modifications are disabled."
        )

    # 2. Capture rejection metadata if application is now being rejected
    is_becoming_rejected = (
        (new_application.status and "reject" in str(new_application.status).lower())
        or bool(new_application.reasonOfRejection)
    )
    if is_becoming_rejected:
        user_display = str(getattr(current_user, "Name", "") or getattr(current_user, "username", "User") or getattr(current_user, "EmployeeId", "User"))
        user_role_str = str(getattr(current_user, "LocationType", "") or getattr(current_user, "role", "CO"))
        existing_Applications.rejectedBy = user_display
        existing_Applications.rejectedRole = user_role_str
        existing_Applications.rejectedDate = datetime.now()

    valid_keys = {c.key for c in ApplicationsInDB.__table__.columns}
    for key, value in new_application.__dict__.items():
        if value is not None and key in valid_keys:
            setattr(existing_Applications, key, value)

    db.commit()
    db.refresh(existing_Applications)

    # Automatic Audit Trail Logging & Role-Based Notifications
    try:
        user_name = str(getattr(current_user, "username", "User") or "User")
        app_cust = existing_Applications.customerName or "Customer"
        app_branch = existing_Applications.branchName or "Branch"
        app_region = existing_Applications.regionName or "Region"
        app_zone = existing_Applications.zoneName or "Zone"

        if new_application.customerAcceptanceRequired is False:
            create_audit_entry(db, action="WAIVE_CUSTOMER_ACCEPTANCE", applicationId=id, stage="Customer Acceptance", performedBy=user_name, details="Customer acceptance waived by Central Office")
        if new_application.isProjectionAdded is True:
            create_audit_entry(db, action="UPDATE_PROJECTION", applicationId=id, stage="Update Projection", performedBy=user_name, details="Projections updated or skipped")
        if new_application.isAggregatorAdded is True:
            create_audit_entry(db, action="ADD_AGGREGATOR", applicationId=id, stage="Add Aggregator", performedBy=user_name, details="Aggregators selected and requested for quote")
        
        # 1. RO Review Approval
        if new_application.isReviewByRO is True or (new_application.status and "approvedbyro" in str(new_application.status).lower()):
            create_audit_entry(db, action="RO_APPROVAL", applicationId=id, stage="RO Review", performedBy=user_name, details="Application approved by Regional Office")
            create_notification(db, id, "Application Approved by RO", f"Application #{id} for {app_cust} was approved by Regional Office and forwarded to ZO & CO.", "success", "RO Review", "BO", branchName=app_branch)
            create_notification(db, id, "Application Forwarded from RO", f"Regional Office approved Application #{id} for {app_cust}. Forwarded to ZO & CO.", "info", "RO Review", "ZO", zoneName=app_zone)
            create_notification(db, id, "Application Forwarded to CO", f"Regional Office approved Application #{id} for {app_cust}. Ready for Central Office review.", "info", "RO Review", "CO")

        # 2. CO Review Approval
        if new_application.isReviewByCO is True or (new_application.status and "approvedbyco" in str(new_application.status).lower()):
            create_audit_entry(db, action="CO_APPROVAL", applicationId=id, stage="CO Review", performedBy=user_name, details="Application approved by Central Office")
            create_notification(db, id, "Application Approved by CO", f"Central Office approved Application #{id} for {app_cust}. Proceeding to Quotation stage.", "success", "CO Review", "BO", branchName=app_branch)
            create_notification(db, id, "Application Approved by CO", f"Central Office approved Application #{id} for {app_cust}. Proceeding to Quotation stage.", "success", "CO Review", "RO", regionName=app_region)
            create_notification(db, id, "Application Approved by CO", f"Central Office approved Application #{id} for {app_cust}. Proceeding to Quotation stage.", "success", "CO Review", "ZO", zoneName=app_zone)

        # 3. Send for Customer Acceptance (Markup added)
        if new_application.isMarkUpAddedCO is True or new_application.isQuoteReviewCO is True or (new_application.status and "reviewquote" in str(new_application.status).lower()):
            create_audit_entry(db, action="ADD_MARKUP", applicationId=id, stage="Add Markup", performedBy=user_name, details="Markup applied by CO and sent to RO for customer acceptance")
            create_notification(db, id, "Sent for Customer Acceptance", f"Application #{id} ({app_cust}) has been processed with bank markup by CO. Sent for Customer Acceptance.", "info", "Customer Acceptance", "RO", regionName=app_region)

        # 4. Customer Acceptance Received
        if new_application.isQuoteAcceptRO is True or (new_application.status and "quoteaccepted" in str(new_application.status).lower()):
            create_audit_entry(db, action="ACCEPT_QUOTE", applicationId=id, stage="Customer Acceptance", performedBy=user_name, details="Quote accepted by customer/RO")
            create_notification(db, id, "Customer Acceptance Completed", f"Customer Acceptance has been submitted by RO for Application #{id} ({app_cust}). Ready for Final Approval.", "success", "Customer Acceptance", "CO")

        # 5. Final Approval / Release Order (PO)
        if new_application.isFinalApproved is True or (new_application.status and "finalapproval" in str(new_application.status).lower()):
            create_audit_entry(db, action="FINALIZE_PO", applicationId=id, stage="PO Details", performedBy=user_name, details="Purchase Order / Release Order finalized")
            create_notification(db, id, "Application Final Approved", f"Central Office completed Final Approval and issued Release Order / Purchase Order for Application #{id} ({app_cust}).", "success", "Final Approval", "BO", branchName=app_branch)
            create_notification(db, id, "Application Final Approved", f"Central Office completed Final Approval and issued Release Order / Purchase Order for Application #{id} ({app_cust}).", "success", "Final Approval", "RO", regionName=app_region)
            create_notification(db, id, "Application Final Approved", f"Central Office completed Final Approval and issued Release Order / Purchase Order for Application #{id} ({app_cust}).", "success", "Final Approval", "ZO", zoneName=app_zone)

        # 6. Rejections
        if is_becoming_rejected:
            rej_role = (existing_Applications.rejectedRole or "CO").upper()
            create_audit_entry(db, action="REJECT_APPLICATION", applicationId=id, stage=f"{rej_role} Rejection", performedBy=user_name, details=f"Rejection reason: {new_application.reasonOfRejection or 'N/A'}")
            if rej_role == "RO":
                create_notification(db, id, "Application Rejected by RO", f"Application #{id} for {app_cust} was rejected by Regional Office. Reason: {new_application.reasonOfRejection or 'N/A'}", "error", "RO Rejection", "BO", branchName=app_branch)
            elif rej_role == "ZO":
                create_notification(db, id, "Application Rejected by ZO", f"Application #{id} for {app_cust} was rejected by Zonal Office. Reason: {new_application.reasonOfRejection or 'N/A'}", "error", "ZO Rejection", "BO", branchName=app_branch)
                create_notification(db, id, "Application Rejected by ZO", f"Application #{id} for {app_cust} was rejected by Zonal Office. Reason: {new_application.reasonOfRejection or 'N/A'}", "error", "ZO Rejection", "RO", regionName=app_region)
            else:
                create_notification(db, id, "Application Rejected by CO", f"Application #{id} for {app_cust} was rejected by Central Office. Reason: {new_application.reasonOfRejection or 'N/A'}", "error", "CO Rejection", "BO", branchName=app_branch)
                create_notification(db, id, "Application Rejected by CO", f"Application #{id} for {app_cust} was rejected by Central Office. Reason: {new_application.reasonOfRejection or 'N/A'}", "error", "CO Rejection", "RO", regionName=app_region)
                create_notification(db, id, "Application Rejected by CO", f"Application #{id} for {app_cust} was rejected by Central Office. Reason: {new_application.reasonOfRejection or 'N/A'}", "error", "CO Rejection", "ZO", zoneName=app_zone)
    except Exception as audit_err:
        print(f"[AUDIT / NOTIFICATION LOG WARNING] {audit_err}")


    application = db.query(ApplicationsInDB).filter( 
        and_(or_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.isDeleted.is_(None)), ApplicationsInDB.applicationId == id)).first()
    
    if application.finalizedAggregatorId is not None and application.isFinalApproved == True:
        paymentAggregators = db.query(PaymentAggregatorInDB).filter(
            and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == id)).all()
        for aggregator in paymentAggregators:
            if aggregator.aggregatorId == application.finalizedAggregatorId:
                aggregator.quoteStatus = "accepted"
            else:
                aggregator.quoteStatus = "rejected"
            db.commit()

        # Automatic PO mail trigger after final approval (prevents duplicate triggers if already SENT)
        if application.poMailStatus != "SENT":
            try:
                dispatch_po_email_to_vendor(application.applicationId, db)
            except Exception as mail_err:
                print(f"[PO EMAIL AUTO DISPATCH ERROR] {mail_err}")

    return existing_Applications 

@router.put('/api/applications/test/{id}')
def update_applications_test(id: int, db: Session = Depends(get_db)):
    application = db.query(ApplicationsInDB).filter( 
        and_(or_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.isDeleted.is_(None)), ApplicationsInDB.applicationId == id)).first()
    
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
def create_projectionDetails(
    applicationId: int,
    aggregatorId: int,
    projectionDetails: List[ProjectionDetails],
    isRevision: Optional[bool] = Query(False),
    revisionRemarks: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_write_permission)
):
    check_application_not_rejected(applicationId, db)
    app = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == applicationId).first()
    
    # Query all historical projections for this app + agg to determine current max version
    existing_all = db.query(ProjectionDetailsInDB).filter(
        and_(
            ProjectionDetailsInDB.applicationId == applicationId,
            ProjectionDetailsInDB.aggregatorId == aggregatorId
        )
    ).all()
    
    existing_versions = [p.quoteVersion for p in existing_all if p.quoteVersion is not None]
    max_ver = max(existing_versions) if existing_versions else 0
    
    # Check if application is currently in negotiation_requested OR isRevision requested
    is_neg = bool(app and (app.isNegotiationRequested or app.status == 'negotiation_requested'))
    has_prior_rates = any((p.rate or 0) > 0 for p in existing_all)
    
    if isRevision or is_neg:
        target_version = max_ver + 1 if max_ver >= 1 else 2
    elif has_prior_rates and max_ver > 0:
        target_version = max_ver
    else:
        target_version = 1

    # Save new projections with target_version
    valid_cols = {c.name for c in ProjectionDetailsInDB.__table__.columns}
    new_objs = []

    try:
        # Soft-archive current active records (retaining their version number)
        projectionDetailsOld = db.query(ProjectionDetailsInDB).filter(
            and_(
                ProjectionDetailsInDB.isDeleted == False,
                ProjectionDetailsInDB.applicationId == applicationId, 
                ProjectionDetailsInDB.aggregatorId == aggregatorId
            )
        ).all()
        
        for projectionDetail in projectionDetailsOld:
            projectionDetail.isDeleted = True

        # Determine current max id in projection_details to guarantee primary key safety in Oracle/SQLite
        max_id_record = db.query(func.max(ProjectionDetailsInDB.id)).scalar()
        current_max_id = int(max_id_record) if max_id_record is not None else 0

        # Baseline volumes from application
        tot_txns = float(app.avgTransactionYearly or 0.0) if app else 0.0
        tot_amt = float(app.aggregateDepositAmt or 0.0) if app else 0.0
        if tot_amt == 0.0 and app and app.avgTransactionSize and tot_txns > 0:
            tot_amt = float(app.avgTransactionSize) * tot_txns

        # Parent IB volume reference
        ib_parent_txns = 0.0
        ib_parent_amt = 0.0
        for p in projectionDetails:
            p_raw = p.dict() if hasattr(p, "dict") else dict(p)
            t_name = str(p_raw.get("transactionType") or "").lower()
            if "internet" in t_name and not bool(p_raw.get("isIB")):
                c_str = str(p_raw.get("transactionCount") or "0").replace("%", "").strip()
                v_str = str(p_raw.get("transactionValue") or "0").replace("%", "").strip()
                try:
                    c_pct = float(c_str) / 100.0 if float(c_str or 0) > 0 else 0.10
                    v_pct = float(v_str) / 100.0 if float(v_str or 0) > 0 else 0.22
                except Exception:
                    c_pct, v_pct = 0.10, 0.22
                ib_parent_txns = float(p_raw.get("estimatedTransactions") or 0.0)
                ib_parent_amt = float(p_raw.get("aggregateAmount") or 0.0)
                if ib_parent_txns <= 0 and tot_txns > 0:
                    ib_parent_txns = round(tot_txns * c_pct)
                if ib_parent_amt <= 0 and tot_amt > 0:
                    ib_parent_amt = round(tot_amt * v_pct, 2)
                break

        for idx, projectionDetail in enumerate(projectionDetails):
            p_dict = projectionDetail.dict() if hasattr(projectionDetail, "dict") else dict(projectionDetail)
            p_dict["quoteVersion"] = target_version
            p_dict["isDeleted"] = False
            p_dict["applicationId"] = int(applicationId)
            p_dict["aggregatorId"] = int(aggregatorId)
            p_dict["isIB"] = bool(p_dict.get("isIB"))
            p_dict["allow"] = bool(p_dict.get("allow", True))
            p_dict["transactionType"] = str(p_dict.get("transactionType") or "")
            p_dict["unit"] = str(p_dict.get("unit") or "₹")
            p_dict["bankUnit"] = str(p_dict.get("bankUnit") or p_dict.get("unit") or "₹")
            p_dict["transactionCount"] = str(p_dict.get("transactionCount") or "")
            p_dict["transactionValue"] = str(p_dict.get("transactionValue") or "")
            p_dict["transactionTypePercent"] = str(p_dict.get("transactionTypePercent") or "")

            if revisionRemarks:
                p_dict["revisionRemarks"] = revisionRemarks

            # Clean up order if float or invalid
            if "order" in p_dict and p_dict["order"] is not None:
                try:
                    p_dict["order"] = int(round(float(p_dict["order"])))
                except Exception:
                    p_dict["order"] = idx + 1
            else:
                p_dict["order"] = idx + 1

            # Clean numeric fields
            for f_col in ["chargesProposed", "rate", "grossAmount", "vendorShare", "expectedRevenue", "estimatedTransactions", "aggregateAmount"]:
                if f_col in p_dict:
                    try:
                        p_dict[f_col] = float(p_dict[f_col]) if p_dict[f_col] not in (None, "") else 0.0
                    except Exception:
                        p_dict[f_col] = 0.0
                else:
                    p_dict[f_col] = 0.0

            # Recalculate estimatedTransactions and aggregateAmount if missing/zero
            if not p_dict["isIB"]:
                c_str = str(p_dict.get("transactionCount") or "0").replace("%", "").strip()
                v_str = str(p_dict.get("transactionValue") or "0").replace("%", "").strip()
                try:
                    c_pct = float(c_str) / 100.0 if float(c_str or 0) > 0 else 0.0
                    v_pct = float(v_str) / 100.0 if float(v_str or 0) > 0 else 0.0
                except Exception:
                    c_pct, v_pct = 0.0, 0.0
                if p_dict["estimatedTransactions"] <= 0 and c_pct > 0 and tot_txns > 0:
                    p_dict["estimatedTransactions"] = round(tot_txns * c_pct)
                if p_dict["aggregateAmount"] <= 0 and v_pct > 0 and tot_amt > 0:
                    p_dict["aggregateAmount"] = round(tot_amt * v_pct, 2)
            else:
                sub_pct_str = str(p_dict.get("transactionTypePercent") or "0").replace("%", "").strip()
                t_lower = p_dict["transactionType"].lower()
                try:
                    sub_pct = float(sub_pct_str) / 100.0 if float(sub_pct_str or 0) > 0 else 0.0
                except Exception:
                    sub_pct = 0.0
                if sub_pct <= 0:
                    if "sbi" in t_lower: sub_pct = 0.6861
                    elif "hdfc" in t_lower: sub_pct = 0.1078
                    elif "icici" in t_lower: sub_pct = 0.0557
                    elif "axis" in t_lower: sub_pct = 0.0447
                    elif "other" in t_lower: sub_pct = 0.1056

                if p_dict["estimatedTransactions"] <= 0 and ib_parent_txns > 0:
                    p_dict["estimatedTransactions"] = round(ib_parent_txns * sub_pct, 2)
                if p_dict["aggregateAmount"] <= 0 and ib_parent_amt > 0:
                    p_dict["aggregateAmount"] = round(ib_parent_amt * sub_pct, 2)

            # Recompute grossAmount, vendorShare, expectedRevenue
            r_val = float(p_dict["rate"])
            c_val = float(p_dict["chargesProposed"])
            u_val = str(p_dict["unit"]).strip()
            bu_val = str(p_dict["bankUnit"]).strip()

            if u_val in ("%", "Percentage"):
                p_dict["vendorShare"] = round(float(p_dict["aggregateAmount"]) * (r_val / 100.0), 2)
            else:
                p_dict["vendorShare"] = round(float(p_dict["estimatedTransactions"]) * r_val, 2)

            if bu_val in ("%", "Percentage"):
                p_dict["grossAmount"] = round(float(p_dict["aggregateAmount"]) * (c_val / 100.0), 2)
            else:
                p_dict["grossAmount"] = round(float(p_dict["estimatedTransactions"]) * c_val, 2)

            p_dict["expectedRevenue"] = round(p_dict["grossAmount"] - p_dict["vendorShare"], 2)

            filtered_dict = {k: v for k, v in p_dict.items() if k in valid_cols and k not in ("id", "createdAt", "updatedAt")}
            filtered_dict["id"] = current_max_id + idx + 1
            filtered_dict["createdAt"] = datetime.now()
            new_projectionDetail = ProjectionDetailsInDB(**filtered_dict)
            db.add(new_projectionDetail)
            new_objs.append(filtered_dict)

        # Sync totals to PaymentAggregatorInDB
        agg = db.query(PaymentAggregatorInDB).filter(
            and_(
                PaymentAggregatorInDB.applicationId == applicationId,
                PaymentAggregatorInDB.aggregatorId == aggregatorId,
                or_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.isDeleted.is_(None))
            )
        ).first()
        if agg:
            total_gross = sum(float(p.get("grossAmount") or 0.0) for p in new_objs)
            total_vendor = sum(float(p.get("vendorShare") or 0.0) for p in new_objs)
            total_rev = total_gross - total_vendor
            agg.totalGrossAmount = round(total_gross, 3)
            agg.totalVendorShare = round(total_vendor, 3)
            agg.totalExpectedRevenue = round(total_rev, 3)
            agg.sumOfRate = sum(float(p.get("rate") or 0.0) for p in new_objs)
            if total_vendor > 0 or (agg.sumOfRate and agg.sumOfRate > 0):
                agg.status = "submitted"

        # If app exists, update version metadata and reset negotiation flag
        if app:
            app.currentQuoteVersion = target_version
            if is_neg:
                app.isNegotiationRequested = False
                app.status = 'quotesubmitted'
                app.isQuoteReviewCO = False
                app.isQuoteAcceptRO = False

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating projection details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save projections: {str(e)}")

    projectionDetailsNew = db.query(ProjectionDetailsInDB).filter(
        and_(
            ProjectionDetailsInDB.isDeleted == False, 
            ProjectionDetailsInDB.applicationId == applicationId, 
            ProjectionDetailsInDB.aggregatorId == aggregatorId
        )
    ).order_by(ProjectionDetailsInDB.id.asc()).all()
    
    result = []
    for p in projectionDetailsNew:
        p_data = {c.name: getattr(p, c.name) for c in ProjectionDetailsInDB.__table__.columns}
        result.append(p_data)
    return result

@router.get('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections/{projectionId}')
def get_single_projectionDetails(projectionId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projectionDetail = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False, ProjectionDetailsInDB.id == projectionId)).first()
    if projectionDetail:
        return {c.name: getattr(projectionDetail, c.name) for c in ProjectionDetailsInDB.__table__.columns}
    return None

@router.get('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections')
def get_all_projectionDetails(
    applicationId: int,
    aggregatorId: int,
    version: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ProjectionDetailsInDB).filter(
        ProjectionDetailsInDB.applicationId == applicationId
    )
    if aggregatorId != 0:
        query = query.filter(ProjectionDetailsInDB.aggregatorId == aggregatorId)
    else:
        query = query.filter(or_(ProjectionDetailsInDB.aggregatorId.is_(None), ProjectionDetailsInDB.aggregatorId == 0))
    
    if version is not None:
        query = query.filter(ProjectionDetailsInDB.quoteVersion == version)
    else:
        query = query.filter(ProjectionDetailsInDB.isDeleted == False)
        
    projectionDetails = query.order_by(ProjectionDetailsInDB.order.asc(), ProjectionDetailsInDB.id.asc()).all()

    # Fallback to base projections if aggregator specific items are not populated
    is_fallback = False
    if not projectionDetails and aggregatorId != 0:
        is_fallback = True
        base_query = db.query(ProjectionDetailsInDB).filter(
            ProjectionDetailsInDB.applicationId == applicationId,
            or_(ProjectionDetailsInDB.aggregatorId.is_(None), ProjectionDetailsInDB.aggregatorId == 0),
            ProjectionDetailsInDB.isDeleted == False
        ).order_by(ProjectionDetailsInDB.order.asc(), ProjectionDetailsInDB.id.asc()).all()
        if not base_query:
            base_query = db.query(ProjectionDetailsInDB).filter(
                ProjectionDetailsInDB.applicationId == applicationId,
                ProjectionDetailsInDB.isDeleted == False
            ).order_by(ProjectionDetailsInDB.order.asc(), ProjectionDetailsInDB.id.asc()).all()
        projectionDetails = base_query
    
    # Reference maps for chargesProposed and rates across this application
    all_app_projs = db.query(ProjectionDetailsInDB).filter(
        ProjectionDetailsInDB.applicationId == applicationId
    ).order_by(ProjectionDetailsInDB.id.desc()).all()
    
    charges_map = {}
    rates_map = {}
    for ap in all_app_projs:
        k = (ap.transactionType or "").strip().lower()
        if k:
            if float(ap.chargesProposed or 0.0) > 0 and k not in charges_map:
                charges_map[k] = (float(ap.chargesProposed), ap.bankUnit or ap.unit or "%")
            if ap.aggregatorId == aggregatorId and float(ap.rate or 0.0) > 0 and k not in rates_map:
                rates_map[k] = (float(ap.rate), ap.unit or "%")

    # Deduplicate by transactionType (pick latest entry per channel)
    unique_projections = []
    seen_types = set()
    for p in projectionDetails:
        t_type = (p.transactionType or "").strip()
        if t_type and t_type in seen_types:
            continue
        if t_type:
            seen_types.add(t_type)
        p_data = {c.name: getattr(p, c.name) for c in ProjectionDetailsInDB.__table__.columns}
        k = t_type.lower()

        if is_fallback:
            p_data["aggregatorId"] = aggregatorId
            p_data["rate"] = 0
            p_data["vendorShare"] = 0
            p_data["expectedRevenue"] = 0

        # If rate is 0 but we have a recorded rate for this aggregator, attach it
        if float(p_data.get("rate") or 0.0) <= 0 and k in rates_map:
            p_data["rate"] = rates_map[k][0]
            if rates_map[k][1]:
                p_data["unit"] = rates_map[k][1]

        # If chargesProposed is 0 or missing, resolve from charges_map or standard banking benchmarks
        if float(p_data.get("chargesProposed") or 0.0) <= 0:
            if k in charges_map:
                p_data["chargesProposed"] = charges_map[k][0]
                if charges_map[k][1]:
                    p_data["bankUnit"] = charges_map[k][1]
            elif any(b in k for b in ["sbi", "hdfc", "icici", "axis", "other"]):
                p_data["chargesProposed"] = 25.0
                p_data["bankUnit"] = "₹"
            elif "master" in k or "visa" in k:
                p_data["chargesProposed"] = 0.9
                p_data["bankUnit"] = "%"
            elif "credit" in k:
                p_data["chargesProposed"] = 1.0
                p_data["bankUnit"] = "%"
            elif "wallet" in k or "prepaid" in k:
                p_data["chargesProposed"] = 0.9
                p_data["bankUnit"] = "%"

        # Ensure allow flag is set properly
        if not bool(p_data.get("isIB")) and "internet" in k:
            p_data["allow"] = False
        elif float(p_data.get("chargesProposed") or 0.0) > 0 or float(p_data.get("rate") or 0.0) > 0:
            p_data["allow"] = True

        unique_projections.append(p_data)

    return unique_projections

@router.post('/api/applications/{applicationId}/request-negotiation')
def request_quote_negotiation(
    applicationId: int,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_write_permission)
):
    app = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == applicationId).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    remarks = payload.get("remarks") or payload.get("reasonOfRejection") or "Customer requested quotation rate negotiation"
    requested_by = str(current_user.id or current_user.username or "Customer")
    
    app.isNegotiationRequested = True
    app.negotiationRemarks = remarks
    app.negotiationRequestedBy = requested_by
    app.negotiationRequestedDate = datetime.utcnow()
    app.status = 'negotiation_requested'
    app.isQuoteReviewCO = False
    app.isQuoteAcceptRO = False
    
    create_audit_entry(
        db=db,
        action="QUOTE_NEGOTIATION_REQUESTED",
        applicationId=applicationId,
        stage="Customer Acceptance",
        performedBy=str(getattr(current_user, "username", "Customer")),
        details=f"Rate negotiation requested: {remarks}"
    )
    
    create_notification(
        db=db,
        applicationId=applicationId,
        title=f"Rate Negotiation Requested - App #{applicationId}",
        message=f"Customer requested quote negotiation for {app.customerName}. Remarks: {remarks}",
        type="warning",
        stage="negotiation_requested",
        targetRole="CO",
        branchName=app.branchName,
        regionName=app.regionName,
        zoneName=app.zoneName
    )
    
    db.commit()
    db.refresh(app)
    return {
        "status": "success",
        "message": "Quote negotiation requested successfully. Central Office has been notified.",
        "application": {
            "applicationId": app.applicationId,
            "status": app.status,
            "isNegotiationRequested": app.isNegotiationRequested,
            "negotiationRemarks": app.negotiationRemarks,
            "currentQuoteVersion": app.currentQuoteVersion
        }
    }

@router.get('/api/applications/{applicationId}/aggregators/{aggregatorId}/quote-versions')
def get_quote_versions(
    applicationId: int,
    aggregatorId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    all_projs = db.query(ProjectionDetailsInDB).filter(
        and_(
            ProjectionDetailsInDB.applicationId == applicationId,
            ProjectionDetailsInDB.aggregatorId == aggregatorId
        )
    ).all()
    
    if not all_projs:
        return []
    
    # Sort: active rows first, then highest ID first
    sorted_projs = sorted(all_projs, key=lambda p: (0 if not p.isDeleted else 1, -(p.id or 0)))
    
    # Check which versions have active rows
    active_versions = {p.quoteVersion or 1 for p in all_projs if not p.isDeleted}
    all_versions = {p.quoteVersion or 1 for p in all_projs}
    latest_active_version = max(active_versions) if active_versions else max(all_versions)
    
    versions_map = {}
    for p in sorted_projs:
        v = p.quoteVersion or 1
        if v not in versions_map:
            is_cur = True if len(all_versions) <= 1 else (v == latest_active_version)
            versions_map[v] = {
                "version": v,
                "createdAt": p.createdAt.isoformat() if hasattr(p.createdAt, 'isoformat') else (str(p.createdAt) if p.createdAt else None),
                "isCurrent": is_cur,
                "revisionRemarks": getattr(p, 'revisionRemarks', None),
                "totalEstimatedTransactions": 0.0,
                "totalAggregateAmount": 0.0,
                "totalGrossAmount": 0.0,
                "totalVendorShare": 0.0,
                "totalExpectedRevenue": 0.0,
                "channelCount": 0,
                "channels": []
            }
        if not any(c.get("transactionType") == p.transactionType for c in versions_map[v]["channels"]):
            gross = round(float(p.grossAmount or 0.0), 2)
            vendor = round(float(p.vendorShare or 0.0), 2)
            revenue = round(float(p.expectedRevenue or (gross - vendor)), 2)
            versions_map[v]["channels"].append({
                "transactionType": p.transactionType,
                "rate": p.rate,
                "unit": p.unit,
                "vendorShare": vendor,
                "expectedRevenue": revenue,
                "grossAmount": gross
            })
            versions_map[v]["totalVendorShare"] = round(versions_map[v]["totalVendorShare"] + vendor, 2)
            versions_map[v]["totalExpectedRevenue"] = round(versions_map[v]["totalExpectedRevenue"] + revenue, 2)
            versions_map[v]["totalGrossAmount"] = round(versions_map[v]["totalGrossAmount"] + gross, 2)
            versions_map[v]["channelCount"] += 1

    return sorted(list(versions_map.values()), key=lambda x: x["version"], reverse=True)

@router.get('/api/applications/{applicationId}/aggregators/{aggregatorId}/quote-versions/{version}')
def get_quote_version_details(
    applicationId: int,
    aggregatorId: int,
    version: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projs = db.query(ProjectionDetailsInDB).filter(
        and_(
            ProjectionDetailsInDB.applicationId == applicationId,
            ProjectionDetailsInDB.aggregatorId == aggregatorId,
            ProjectionDetailsInDB.quoteVersion == version
        )
    ).all()
    
    # Sort so active rows come first, then latest ID first
    sorted_projs = sorted(projs, key=lambda p: (0 if not p.isDeleted else 1, -(p.id or 0)))
    
    unique_projs = []
    seen = set()
    for p in sorted_projs:
        t_type = (p.transactionType or "").strip()
        if t_type and t_type not in seen:
            seen.add(t_type)
            unique_projs.append(p)
            
    return unique_projs

@router.get('/api/applications/{applicationId}/aggregators/{aggregatorId}/quote-versions-compare')
def compare_quote_versions(
    applicationId: int,
    aggregatorId: int,
    v1: int = Query(1),
    v2: int = Query(2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agg = db.query(ManageAggregatorInDB).filter(ManageAggregatorInDB.aggregatorId == aggregatorId).first()
    app = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == applicationId).first()
    
    rows_v1 = db.query(ProjectionDetailsInDB).filter(
        and_(
            ProjectionDetailsInDB.applicationId == applicationId,
            ProjectionDetailsInDB.aggregatorId == aggregatorId,
            ProjectionDetailsInDB.quoteVersion == v1
        )
    ).all()
    
    rows_v2 = db.query(ProjectionDetailsInDB).filter(
        and_(
            ProjectionDetailsInDB.applicationId == applicationId,
            ProjectionDetailsInDB.aggregatorId == aggregatorId,
            ProjectionDetailsInDB.quoteVersion == v2
        )
    ).all()
    
    map_v1 = { (r.transactionType or '').strip(): r for r in rows_v1 }
    map_v2 = { (r.transactionType or '').strip(): r for r in rows_v2 }
    
    all_channels = sorted(list(set(list(map_v1.keys()) + list(map_v2.keys()))))
    comparison_channels = []
    
    total_v1_share = 0.0
    total_v2_share = 0.0
    total_v1_rev = 0.0
    total_v2_rev = 0.0
    
    for ch in all_channels:
        if not ch:
            continue
        p1 = map_v1.get(ch)
        p2 = map_v2.get(ch)
        
        rate1 = p1.rate if p1 and p1.rate is not None else 0.0
        rate2 = p2.rate if p2 and p2.rate is not None else 0.0
        share1 = p1.vendorShare if p1 and p1.vendorShare is not None else 0.0
        share2 = p2.vendorShare if p2 and p2.vendorShare is not None else 0.0
        rev1 = p1.expectedRevenue if p1 and p1.expectedRevenue is not None else 0.0
        rev2 = p2.expectedRevenue if p2 and p2.expectedRevenue is not None else 0.0
        
        total_v1_share += share1
        total_v2_share += share2
        total_v1_rev += rev1
        total_v2_rev += rev2
        
        comparison_channels.append({
            "transactionType": ch,
            "unit": (p2 and p2.unit) or (p1 and p1.unit) or "%",
            "v1_rate": rate1,
            "v2_rate": rate2,
            "rate_diff": round(rate2 - rate1, 4),
            "v1_vendorShare": share1,
            "v2_vendorShare": share2,
            "share_diff": round(share2 - share1, 2),
            "v1_expectedRevenue": rev1,
            "v2_expectedRevenue": rev2,
            "revenue_diff": round(rev2 - rev1, 2)
        })
        
    return {
        "applicationId": applicationId,
        "aggregatorId": aggregatorId,
        "aggregatorName": agg.aggregatorName if agg else f"Aggregator #{aggregatorId}",
        "v1": v1,
        "v2": v2,
        "merchantRemarks": app.negotiationRemarks if app else None,
        "summary": {
            "total_v1_vendorShare": round(total_v1_share, 2),
            "total_v2_vendorShare": round(total_v2_share, 2),
            "vendor_cost_savings": round(total_v1_share - total_v2_share, 2),
            "total_v1_expectedRevenue": round(total_v1_rev, 2),
            "total_v2_expectedRevenue": round(total_v2_rev, 2),
            "bank_revenue_gain": round(total_v2_rev - total_v1_rev, 2)
        },
        "channels": comparison_channels
    }

@router.post('/api/applications/{applicationId}/aggregators/{aggregatorId}/resend-quote-email')
def resend_quote_email(
    applicationId: int,
    aggregatorId: int,
    payload: Optional[Dict[str, Any]] = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
    contact_person = aggregator.contactPersonName

    # Gather primary and alternate emails
    recipients = []
    if aggregator.email and aggregator.email.strip():
        recipients.append(aggregator.email.strip())
    if hasattr(aggregator, "alternateEmail") and aggregator.alternateEmail and aggregator.alternateEmail.strip():
        alt = aggregator.alternateEmail.strip()
        if alt not in recipients:
            recipients.append(alt)

    if not recipients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No recipient email addresses found for aggregator '{agg_name}'."
        )

    recipients_str = ", ".join(recipients)

    # Dispatch email
    try:
        sent = EmailService.send_quote_request_email(
            aggregator_name=agg_name,
            aggregator_email=recipients,
            contact_person=contact_person,
            application=app,
            end_date_str=str(app.endDate) if hasattr(app, "endDate") and app.endDate else None,
            projections=unique_projs,
            custom_data=payload
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
            details=f"Quotation email to {agg_name} ({recipients_str}). Dispatch Status: {'SUCCESS' if sent else 'FAILED'}"
        )
    except Exception as audit_err:
        print(f"[AUDIT ERROR] Failed to record audit log: {audit_err}")

    if not sent:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Quotation request email delivery failed to {recipients_str}. Please verify SMTP settings in .env and recipient addresses."
        )

    return {
        "status": "success",
        "message": f"Quotation request email dispatched to {agg_name} ({recipients_str})",
        "recipients": recipients,
        "sent": True
    }

@router.delete('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections/{projectionId}')
def delete_projectionDetails(applicationId: int, aggregatorId: int, projectionId: int, db: Session = Depends(get_db), current_user: User = Depends(verify_write_permission)):
    check_application_not_rejected(applicationId, db)
    projectionDetails = db.query(ProjectionDetailsInDB).filter(
        ProjectionDetailsInDB.id == projectionId).first()
    projectionDetails.isDeleted = True
    db.commit()
    return "done"

@router.put('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections/{projectionId}')
def update_projectionDetails(applicationId: int, aggregatorId: int, projectionId: int, new_projectionDetails: ProjectionDetailsUpdate, db: Session = Depends(get_db), current_user: User = Depends(verify_write_permission)):
    check_application_not_rejected(applicationId, db)
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
async def bulk_update_charges(applicationId: int, request: Request, db: Session = Depends(get_db), current_user: User = Depends(verify_write_permission)):
    check_application_not_rejected(applicationId, db)
    projectionUpdates = await request.json()

    # 1. Update ApplicationsInDB.projection with all channels present in projectionUpdates
    app = db.query(ApplicationsInDB).filter(
        and_(
            or_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.isDeleted.is_(None)),
            ApplicationsInDB.applicationId == applicationId
        )
    ).first()

    if app and isinstance(projectionUpdates, list):
        channels = []
        for p in projectionUpdates:
            t_type = p.get("transactionType")
            if t_type and not p.get("isIB") and t_type not in channels:
                channels.append(t_type)
        if channels:
            app.projection = " | ".join(channels)

    # 2. Query existing projections
    existing_projectionDetails = db.query(ProjectionDetailsInDB).filter(
        and_(
            or_(ProjectionDetailsInDB.isDeleted == False, ProjectionDetailsInDB.isDeleted.is_(None)),
            ProjectionDetailsInDB.applicationId == applicationId
        )
    ).all()

    # 3. Update or Insert Base Projections (aggregatorId=None)
    base_projs = [p for p in existing_projectionDetails if p.aggregatorId is None or p.aggregatorId == 0]
    base_types = {p.transactionType for p in base_projs}

    for projectionUpdate in projectionUpdates:
        t_type = projectionUpdate.get("transactionType")
        if not t_type:
            continue
        count_str = str(projectionUpdate.get("transactionCount") or "")
        val_str = str(projectionUpdate.get("transactionValue") or "")
        est_txn = 0.0
        agg_amt = 0.0
        try:
            est_txn = float(projectionUpdate.get("estimatedTransactions") or 0.0)
        except (ValueError, TypeError):
            pass
        try:
            agg_amt = float(projectionUpdate.get("aggregateAmount") or 0.0)
        except (ValueError, TypeError):
            pass

        if t_type in base_types:
            for bp in base_projs:
                if bp.transactionType == t_type:
                    bp.transactionCount = count_str
                    bp.transactionValue = val_str
                    bp.estimatedTransactions = est_txn
                    bp.aggregateAmount = agg_amt
                    bp.allow = bool(projectionUpdate.get("allow", True))
                    bp.isIB = bool(projectionUpdate.get("isIB", False))
                    bp.order = int(float(projectionUpdate.get("order") or 0))
        else:
            new_base = ProjectionDetailsInDB(
                applicationId=applicationId,
                aggregatorId=None,
                order=int(float(projectionUpdate.get("order") or 0)),
                allow=bool(projectionUpdate.get("allow", True)),
                transactionType=t_type,
                transactionCount=count_str,
                transactionValue=val_str,
                isIB=bool(projectionUpdate.get("isIB", False)),
                estimatedTransactions=est_txn,
                aggregateAmount=agg_amt,
                rate=0.0,
                unit="₹",
                chargesProposed=0.0,
                bankUnit="₹",
                grossAmount=0.0,
                vendorShare=0.0,
                expectedRevenue=0.0,
                isDeleted=False,
                quoteVersion=1
            )
            db.add(new_base)
            existing_projectionDetails.append(new_base)

    # 4. Query assigned payment aggregators
    paymentAggregators = db.query(PaymentAggregatorInDB).filter(
        and_(
            or_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.isDeleted.is_(None)),
            PaymentAggregatorInDB.applicationId == applicationId
        )
    ).all()

    # 5. For each assigned aggregator, update existing projection rows or insert newly added channels
    for agg in paymentAggregators:
        agg_projs = [p for p in existing_projectionDetails if p.aggregatorId == agg.aggregatorId]
        existing_types = {p.transactionType for p in agg_projs}

        for projectionUpdate in projectionUpdates:
            t_type = projectionUpdate.get("transactionType")
            if not t_type:
                continue

            charges_val = projectionUpdate.get("chargesProposed")
            try:
                c_float = float(charges_val) if charges_val not in (None, "") else 0.0
            except (ValueError, TypeError):
                c_float = 0.0

            bank_unit = projectionUpdate.get("bankUnit") or "₹"

            if t_type in existing_types:
                for existingProjection in agg_projs:
                    if existingProjection.transactionType == t_type:
                        existingProjection.chargesProposed = c_float
                        existingProjection.bankUnit = bank_unit
                        if projectionUpdate.get("estimatedTransactions") is not None:
                            try:
                                existingProjection.estimatedTransactions = float(projectionUpdate.get("estimatedTransactions"))
                            except (ValueError, TypeError):
                                pass
                        if projectionUpdate.get("aggregateAmount") is not None:
                            try:
                                existingProjection.aggregateAmount = float(projectionUpdate.get("aggregateAmount"))
                            except (ValueError, TypeError):
                                pass
                        if projectionUpdate.get("transactionCount"):
                            existingProjection.transactionCount = str(projectionUpdate.get("transactionCount"))
                        if projectionUpdate.get("transactionValue"):
                            existingProjection.transactionValue = str(projectionUpdate.get("transactionValue"))

                        # Recalculate row-level commercial values
                        agg_unit = existingProjection.unit or "₹"
                        agg_amt = float(existingProjection.aggregateAmount or 0.0)
                        est_txn = float(existingProjection.estimatedTransactions or 0.0)
                        rate_val = float(existingProjection.rate or 0.0)

                        gross = (agg_amt * c_float) / 100.0 if bank_unit == "%" else est_txn * c_float
                        vendor = (agg_amt * rate_val) / 100.0 if agg_unit == "%" else est_txn * rate_val
                        rev = gross - vendor

                        existingProjection.grossAmount = round(gross, 3)
                        existingProjection.vendorShare = round(vendor, 3)
                        existingProjection.expectedRevenue = round(rev, 3)
            else:
                # Insert missing projection row for this aggregator (new channel added)
                est_txn = 0.0
                agg_amt = 0.0
                try:
                    est_txn = float(projectionUpdate.get("estimatedTransactions") or 0.0)
                except (ValueError, TypeError):
                    pass
                try:
                    agg_amt = float(projectionUpdate.get("aggregateAmount") or 0.0)
                except (ValueError, TypeError):
                    pass

                gross = (agg_amt * c_float) / 100.0 if bank_unit == "%" else est_txn * c_float
                rev = gross

                new_p = ProjectionDetailsInDB(
                    applicationId=applicationId,
                    aggregatorId=agg.aggregatorId,
                    order=int(float(projectionUpdate.get("order") or 0)),
                    allow=bool(projectionUpdate.get("allow", False)),
                    transactionType=t_type,
                    transactionCount=str(projectionUpdate.get("transactionCount") or ""),
                    transactionValue=str(projectionUpdate.get("transactionValue") or ""),
                    isIB=bool(projectionUpdate.get("isIB", False)),
                    estimatedTransactions=est_txn,
                    aggregateAmount=agg_amt,
                    rate=0.0,
                    unit="₹",
                    chargesProposed=c_float,
                    bankUnit=bank_unit,
                    grossAmount=round(gross, 3),
                    vendorShare=0.0,
                    expectedRevenue=round(rev, 3),
                    isDeleted=False,
                    quoteVersion=1
                )
                db.add(new_p)
                existing_projectionDetails.append(new_p)

    # 5. Recalculate summary totals for all payment aggregators of this application
    for agg in paymentAggregators:
        agg_projs = [p for p in existing_projectionDetails if p.aggregatorId == agg.aggregatorId and not p.isDeleted]
        if agg_projs:
            t_gross = sum(float(p.grossAmount or 0.0) for p in agg_projs)
            t_vendor = sum(float(p.vendorShare or 0.0) for p in agg_projs)
            t_rev = t_gross - t_vendor
            agg.totalGrossAmount = round(t_gross, 3)
            agg.totalVendorShare = round(t_vendor, 3)
            agg.totalExpectedRevenue = round(t_rev, 3)

    db.commit()
    return {
        "status": "success",
        "applicationId": applicationId,
    }
    
@router.post('/api/applications/aggregators/complex-projections', status_code=status.HTTP_201_CREATED)
async def create_complex_projectionDetails(request: Request, db: Session = Depends(get_db), current_user: User = Depends(verify_write_permission)):
    projectionDetails = await request.json() 
    applicationId = projectionDetails[0]["applicationId"]
    check_application_not_rejected(applicationId, db)
    paymentAggregators = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == applicationId)).all()
    
    aggregator_codes = [item.aggregatorId for item in paymentAggregators]
    new_projections = []

    for code in aggregator_codes:
        # Check if active projections already exist for this aggregator to prevent duplicate rows
        existing_count = db.query(ProjectionDetailsInDB).filter(
            and_(
                ProjectionDetailsInDB.applicationId == applicationId,
                ProjectionDetailsInDB.aggregatorId == code,
                ProjectionDetailsInDB.isDeleted == False
            )
        ).count()
        if existing_count > 0:
            continue

        for projection in projectionDetails:
            new_projection = projection.copy()  
            new_projection["aggregatorId"] = code
            new_projectionDetails = ProjectionDetailsInDB(
                applicationId=new_projection["applicationId"],
                order=int(float(new_projection.get("order") or 0)),
                allow=bool(new_projection.get("allow", False)),
                aggregatorId=code,
                transactionCount=str(new_projection.get("transactionCount") or ""),
                transactionValue=str(new_projection.get("transactionValue") or ""),
                transactionType=str(new_projection.get("transactionType") or ""),
                transactionTypePercent=str(new_projection.get("transactionTypePercent") or ""), 
                isIB=bool(new_projection.get("isIB", False)),
                estimatedTransactions=float(new_projection.get("estimatedTransactions") or 0.0),
                aggregateAmount=float(new_projection.get("aggregateAmount") or 0.0),
                rate=float(new_projection.get("rate") or 0.0),
                unit=str(new_projection.get("unit") or "Percentage"),
                chargesProposed=float(new_projection.get("chargesProposed") or 0.0),
                grossAmount=float(new_projection.get("grossAmount") or 0.0),
                vendorShare=float(new_projection.get("vendorShare") or 0.0),
                expectedRevenue=float(new_projection.get("expectedRevenue") or 0.0),
                isDeleted=bool(new_projection.get("isDeleted", False)),
                bankUnit=str(new_projection.get("bankUnit") or new_projection.get("unit") or "Percentage"),
                quoteVersion=int(new_projection.get("quoteVersion") or 1),
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
async def uploadFile(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(verify_write_permission)):
    content = await file.read()
    file_size = len(content)
    db_file = FileStoreInDB(
        filename=file.filename,
        content_type=file.content_type,
        file_contents=content,
        file_size=file_size
    )
    db.add(db_file)
    db.commit()
    # Avoid db.refresh(db_file) which re-reads entire binary LOB across DB network
    return {
        "fileId": db_file.fileId,
        "filename": db_file.filename,
        "type": db_file.content_type,
        "size": file_size,
        "uploaded_at": getattr(db_file, "uploaded_at", None) or datetime.now()
    }

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
def deleteFile(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(verify_write_permission)):
    db_file = db.query(FileStoreInDB).filter(FileStoreInDB.fileId == file_id).first()
    if not db_file:
        return {"success": False, "message": "File not found", "fileId": file_id}
    
    db.delete(db_file)
    db.commit()
    return {"success": True, "message": "File deleted successfully", "fileId": file_id}

# --- PO Generation ---

def to_dict(obj, keys):
    if not obj:
        return {key: "" for key in keys}
    return {key: getattr(obj, key, "") if getattr(obj, key, "") is not None else "" for key in keys}

@router.get("/api/generate-purchase-order/applicationId/{applicationId}/aggregatorId/{aggregatorId}")
def create_purchase_order_details_for_print(applicationId: int, aggregatorId: int, db: Session = Depends(get_db)):
    application = db.query(ApplicationsInDB).filter( 
        and_(or_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.isDeleted.is_(None)), ApplicationsInDB.applicationId == applicationId)).first()
    
    if not application:
        raise HTTPException(status_code=404, detail=f"Application #{applicationId} not found")

    target_agg_id = aggregatorId or application.finalizedAggregatorId
    manageAggregator = db.query(ManageAggregatorInDB).filter(
        and_(ManageAggregatorInDB.isDeleted == False, ManageAggregatorInDB.aggregatorId == target_agg_id)).first()

    if not manageAggregator and application.finalizedAggregatorId:
        manageAggregator = db.query(ManageAggregatorInDB).filter(
            and_(ManageAggregatorInDB.isDeleted == False, ManageAggregatorInDB.aggregatorId == application.finalizedAggregatorId)).first()

    projectionDetails = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False,
             ProjectionDetailsInDB.applicationId == applicationId)).all()

    poDetails = _extract_commercial_charges_context(application, manageAggregator, projectionDetails)

    po_service = PurchaseOrderService()
    doc_bytes = po_service.generate_purchase_order(poDetails, logo_path=None)
    safe_cust = (application.customerName or "Merchant").replace(" ", "_")
    filename = f"Purchase_Order_{application.applicationId}_{safe_cust}.docx"

    return Response(
        content=doc_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.post('/api/applications/{id}/resend-po-email')
def resend_po_email(id: int, db: Session = Depends(get_db), current_user: User = Depends(verify_write_permission)):
    """
    Manual trigger to dispatch or retry sending the Purchase Order email to the finalized vendor.
    """
    check_application_not_rejected(id, db)
    app = db.query(ApplicationsInDB).filter(
        and_(or_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.isDeleted.is_(None)), ApplicationsInDB.applicationId == id)
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if not app.finalizedAggregatorId:
        raise HTTPException(status_code=400, detail="Cannot dispatch PO email: No payment aggregator finalized for this application.")

    # Reset poMailStatus to allow explicit manual re-trigger
    app.poMailStatus = "PENDING"
    success = dispatch_po_email_to_vendor(id, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to dispatch PO email to vendor. Please verify aggregator email address and SMTP settings."
        )
    return {
        "message": "Purchase Order email dispatched successfully to finalized aggregator.",
        "poMailStatus": app.poMailStatus,
        "poMailSentAt": app.poMailSentAt,
        "poMailRecipient": app.poMailRecipient
    }

# --- Sanction Letter Generation Endpoint ---

@router.get('/api/applications/generate-sanction-letter/{applicationId}')
@router.get('/api/applications/{applicationId}/sanction-letter')
def generate_sanction_letter_document(
    applicationId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates an editable Sanction Letter in .docx format with real application data.
    """
    application = db.query(ApplicationsInDB).filter(
        and_(or_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.isDeleted.is_(None)), ApplicationsInDB.applicationId == applicationId)
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    agg_id = application.finalizedAggregatorId
    manage_agg = None
    if agg_id:
        manage_agg = db.query(ManageAggregatorInDB).filter(
            and_(ManageAggregatorInDB.isDeleted == False, ManageAggregatorInDB.aggregatorId == agg_id)
        ).first()

    projectionDetails = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False,
             ProjectionDetailsInDB.applicationId == applicationId)
    ).all()

    sanction_data = _extract_commercial_charges_context(application, manage_agg, projectionDetails)

    sanction_service = SanctionLetterService()
    doc_bytes = sanction_service.generate_sanction_letter(sanction_data)
    safe_cust = (application.customerName or "Merchant").replace(" ", "_")
    filename = f"Sanction_Letter_{application.applicationId}_{safe_cust}.docx"

    return Response(
        content=doc_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

# --- Workflow Stage Metrics & Status Counts Endpoint ---

@router.get('/api/applications/stage-metrics')
@router.get('/applications/stage-metrics')
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
    query = db.query(ApplicationsInDB).filter(or_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.isDeleted.is_(None)))

    if branchId and str(branchId).strip() not in ("all", "0", "00000", "undefined", "null", ""):
        try:
            query = query.filter(ApplicationsInDB.branchId == int(branchId))
        except ValueError:
            pass
    elif regionId and str(regionId).strip() not in ("all", "0", "00000", "undefined", "null", ""):
        try:
            query = query.filter(ApplicationsInDB.regionId == int(regionId))
        except ValueError:
            pass
    elif zoneId and str(zoneId).strip() not in ("all", "0", "00000", "undefined", "null", ""):
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
    total_count = len(filtered_apps)
    pending_count = 0
    in_progress_count = 0
    approved_count = 0
    rejected_count = 0
    query_count = 0

    for app in filtered_apps:
        status_str = str(app.status or "").lower()
        is_rej = "reject" in status_str or bool(app.reasonOfRejection and app.reasonOfRejection.strip()) or (app.rejectedDate is not None)
        is_appr = not is_rej and (app.isFinalApproved is True or status_str in ("finalapproved", "approved", "completed"))
        is_query = not is_rej and ("query" in status_str or status_str == "query")

        if is_rej:
            rejected_count += 1
        elif is_appr:
            approved_count += 1
            stage_counts[6] += 1
        elif is_query:
            query_count += 1
            in_progress_count += 1
        elif app.isQuoteAcceptRO:
            in_progress_count += 1
            stage_counts[5] += 1
        elif app.isQuoteReviewCO or app.isMarkUpAddedCO:
            in_progress_count += 1
            stage_counts[4] += 1
        elif app.isQuoteAddedPA or app.isAggregatorAdded:
            in_progress_count += 1
            stage_counts[3] += 1
        elif app.isReviewByCO:
            in_progress_count += 1
            stage_counts[2] += 1
        elif app.isReviewByRO or app.isReviewByZO:
            pending_count += 1
            stage_counts[1] += 1
        else:
            pending_count += 1
            stage_counts[0] += 1

    try:
        open_tickets = db.query(HelpDesk).filter(HelpDesk.status != "closed").count()
        query_count = max(query_count, open_tickets)
    except Exception:
        pass

    kpis = {
        "total": total_count,
        "pending": pending_count,
        "inProgress": in_progress_count,
        "approved": approved_count,
        "rejected": rejected_count,
        "query": query_count,
        "quotes": in_progress_count,  # backward compatibility
    }

    return {
        "total": total_count,
        "pending": pending_count,
        "inProgress": in_progress_count,
        "approved": approved_count,
        "rejected": rejected_count,
        "query": query_count,
        "stageCounts": stage_counts,
        "kpis": kpis
    }


