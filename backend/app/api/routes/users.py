from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.api.deps.dependencies import get_db, get_mssql_db, get_current_user
from app.model.models import User, VEmployeeAllDetailsInDB
from app.schemas.schemas import UserCreate
from app.core import config
from app.core.security import get_password_hash

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
        employee = VEmployeeAllDetailsInDB(
            Name="Tushar Kasbe",
            EmployeeId=int(pfId) if str(pfId).isdigit() else 0,
            Branch_Name="Mumbai Main Branch",
            LocationType="CO",
            Locationid=1001,
            RegionId=10,
            Region_Name="Mumbai Region",
            ZoneId=1,
            Zone_Name="West Zone",
            email_addr="tushar.kasbe@centerlbank.co.in",
            phone="9876543210",
            deptDescription="Information Technology",
            Designation="Software Developer",
            GRADE="Scale-II",
            Active="Y",
            deptCd="IT001"
        )
    else:
        employee = db.query(VEmployeeAllDetailsInDB).filter(and_(
            VEmployeeAllDetailsInDB.EmployeeId == pfId, VEmployeeAllDetailsInDB.Active == 'Y')).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

    if employee.deptCd == config.CENTRAL_OFFICE_DEPARTMENT_CODE:
        role = 'CO'
    else:
        role = employee.LocationType

    if role == 'DO':
        raise HTTPException(status_code=403, detail='Access denied. You are not authorized to use this applicaiton.')
    
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
        "deptCd": employee.deptCd
    }
    return response_dict
