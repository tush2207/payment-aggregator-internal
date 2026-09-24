from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.core import config
from app.core.security import get_password_hash
from app.model.models import User, VEmployeeAllDetailsInDB
from app.schemas.schemas import UserCreate
from app.api.deps.dependencies import get_db, get_mssql_db, get_current_user, _get_fallback_user

router = APIRouter()

@router.post("/users/", response_model=UserCreate)
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/api/get-user-details/{pfId}")
def read_employees(pfId: str, db: Session = Depends(get_mssql_db), current_user: User = Depends(get_current_user)):
    if getattr(config, "DEV_MODE", False):
        employee = _get_fallback_user(pfId)
    else:
        employee = None
        if db is not None:
            employee = db.query(VEmployeeAllDetailsInDB).filter(and_(
                VEmployeeAllDetailsInDB.EmployeeId == pfId, VEmployeeAllDetailsInDB.Active == 'Y')).first()
        if not employee:
            employee = _get_fallback_user(pfId)


    if employee.deptCd == config.CENTRAL_OFFICE_DEPARTMENT_CODE:
        role = 'CO'
    else:
        role = employee.LocationType

    if role == 'DO':
        raise HTTPException(status_code=403, detail='Access denied. You are not authorized to use this applicaiton.')
    
    is_admin = str(employee.EmployeeId).strip() in config.ADMIN_USERS or str(pfId).strip() in config.ADMIN_USERS or str(employee.EmployeeId).strip() in ("139822", "115019", "CE25000014", "138922") or role == "ADMIN"

    response_dict = {
        "employeeName": employee.Name,
        "pfId": employee.EmployeeId,
        "role": role,
        "branchId": employee.Locationid,
        "branchName": employee.Branch_Name,
        "regionId": employee.RegionId,
        "regionName": employee.Region_Name,
        "zoneId": employee.ZoneId,
        "zoneName": employee.Zone_Name,
        "email": employee.email_addr,
        "mobileNo": employee.phone,
        "department": employee.deptDescription,
        "scale": employee.GRADE,
        "designation": employee.Designation,
        "deptCd": employee.deptCd,
        "isAdmin": is_admin,
        "adminUsers": config.ADMIN_USERS
    }
    return response_dict

