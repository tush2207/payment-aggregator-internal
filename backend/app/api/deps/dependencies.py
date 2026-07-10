from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasicCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.database.engine import SessionLocal, MSSQLSessionLocal
from app.model.models import VEmployeeAllDetailsInDB
from app.schemas.schemas import TokenData
from app.core.security import oauth2_scheme, ALGORITHM, public_key, security
from app.core import config
from app.services.auth_service import ldap_authenticate

def get_mssql_db():
    db = MSSQLSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def authenticate_user(credentials: HTTPBasicCredentials = Depends(security)):
    if not ldap_authenticate(credentials.username, credentials.password):
        raise HTTPException(status_code=401, detail="Invalid LDAP credentials")
    return credentials.username

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_mssql_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, public_key, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    if getattr(config, "DEV_MODE", False):
        user = VEmployeeAllDetailsInDB(
            Name="Tushar Kasbe",
            EmployeeId=int(token_data.username) if str(token_data.username).isdigit() else 0,
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
        return user

    user = db.query(VEmployeeAllDetailsInDB).filter(
        VEmployeeAllDetailsInDB.EmployeeId == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user
