import time
from typing import Any, Dict, Optional
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

# ── High-Performance In-Memory User Profile Cache & Circuit Breaker ──────────
_USER_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL_SECONDS = 300  # Cache user details for 5 minutes

_MSSQL_BREAKER = {
    "tripped": False,
    "last_failed": 0.0,
    "cooldown_seconds": 300.0,  # 5 minute cooldown before retrying unreachable host
}

def _is_mssql_available() -> bool:
    if getattr(config, "DEV_MODE", False):
        return False
    if MSSQLSessionLocal is None:
        return False
    if _MSSQL_BREAKER["tripped"]:
        if time.time() - _MSSQL_BREAKER["last_failed"] < _MSSQL_BREAKER["cooldown_seconds"]:
            return False
        # Reset breaker to test connection once cooldown has passed
        _MSSQL_BREAKER["tripped"] = False
    return True

def _record_mssql_failure():
    _MSSQL_BREAKER["tripped"] = True
    _MSSQL_BREAKER["last_failed"] = time.time()

def get_mssql_db():
    if not _is_mssql_available():
        yield None
        return
    db = None
    try:
        db = MSSQLSessionLocal()
        yield db
    except Exception as e:
        print(f"Warning: MSSQL connection failed (circuit breaker tripped): {e}")
        _record_mssql_failure()
        yield None
    finally:
        if db is not None:
            try:
                db.close()
            except Exception:
                pass

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

def _get_fallback_user(username: str) -> VEmployeeAllDetailsInDB:
    emp_str = str(username).strip()
    emp_id = int(emp_str) if emp_str.isdigit() else 1001
    is_admin = emp_str in config.ADMIN_USERS or emp_str in ("139822", "115019", "CE25000014", "138922")
    
    if is_admin:
        role = "CO"
        name = "Tushar Kasbe" if emp_str in ("139822", "138922") else (f"Central Admin {emp_str}" if emp_str == "115019" else f"Admin {emp_str}")
        designation = "Central Office Administrator"
        branch_name = "Central Office Mumbai"
        region_name = "Corporate Office"
        zone_name = "Central Office"
        branch_id = 1000
        region_id = 100
        zone_id = 0
        dept_cd = getattr(config, "CENTRAL_OFFICE_DEPARTMENT_CODE", "CO08646")
        dept_desc = "Information Technology"
        grade = "Scale-IV"
    elif emp_str.upper().startswith("CO") or emp_str in ("CO1001", "CO_VIEW", "CO_USER"):
        role = "CO"
        name = f"CO Officer {emp_str} (View Only)"
        designation = "Central Office Officer"
        branch_name = "Central Office Mumbai"
        region_name = "Corporate Office"
        zone_name = "Central Office"
        branch_id = 1000
        region_id = 100
        zone_id = 0
        dept_cd = getattr(config, "CENTRAL_OFFICE_DEPARTMENT_CODE", "CO08646")
        dept_desc = "Payment Operations"
        grade = "Scale-III"
    elif emp_str.upper().startswith("ZO"):
        role = "ZO"
        name = f"Zonal Manager {emp_str}"
        designation = "Zonal Head"
        branch_name = "West Zonal Office"
        region_name = "Mumbai Metropolitan Region"
        zone_name = "West Zone"
        branch_id = 1002
        region_id = 10
        zone_id = 1
        dept_cd = "ZO001"
        dept_desc = "Zonal Management"
        grade = "Scale-IV"
    elif emp_str.upper().startswith("RO"):
        role = "RO"
        name = f"Regional Manager {emp_str}"
        designation = "Regional Head"
        branch_name = "Mumbai South Regional Office"
        region_name = "Mumbai Region"
        zone_name = "West Zone"
        branch_id = 1003
        region_id = 10
        zone_id = 1
        dept_cd = "RO001"
        dept_desc = "Regional Operations"
        grade = "Scale-III"
    else:
        role = "BO"
        name = f"Branch Officer {emp_str}"
        designation = "Branch Manager / Officer"
        branch_name = "Mumbai Main Branch"
        region_name = "Mumbai Region"
        zone_name = "West Zone"
        branch_id = 1001
        region_id = 10
        zone_id = 1
        dept_cd = "BO001"
        dept_desc = "Retail Banking"
        grade = "Scale-II"

    return VEmployeeAllDetailsInDB(
        Name=name,
        EmployeeId=emp_id,
        Branch_Name=branch_name,
        LocationType=role,
        Locationid=branch_id,
        RegionId=region_id,
        Region_Name=region_name,
        ZoneId=zone_id,
        Zone_Name=zone_name,
        email_addr=f"{emp_str.lower()}@cbi.co.in",
        phone="9876543210",
        deptDescription=dept_desc,
        Designation=designation,
        GRADE=grade,
        Active="Y",
        deptCd=dept_cd
    )

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

    now = time.time()
    cache_key = str(token_data.username)

    # 1. Check in-memory cache for instant 0.005ms resolution
    if cache_key in _USER_CACHE:
        entry = _USER_CACHE[cache_key]
        if now - entry["timestamp"] < _CACHE_TTL_SECONDS:
            return entry["user"]

    # 2. Check if DB is available (and circuit breaker not tripped)
    user = None
    if db is not None:
        try:
            user = db.query(VEmployeeAllDetailsInDB).filter(
                VEmployeeAllDetailsInDB.EmployeeId == token_data.username
            ).first()
        except Exception as err:
            _record_mssql_failure()
            user = None

    if user is None:
        user = _get_fallback_user(token_data.username)

    # Cache resolved user profile
    _USER_CACHE[cache_key] = {
        "user": user,
        "timestamp": now,
    }

    return user

READ_ONLY_USERS = set()

def is_admin_user(user: Any) -> bool:
    """Checks if a user is in the configured ADMIN_USERS list (139822, 115019, CE25000014, 138922)."""
    if not user:
        return False
    user_id = str(getattr(user, "EmployeeId", "") or getattr(user, "username", "")).strip()
    role = str(getattr(user, "LocationType", "") or getattr(user, "role", "")).upper().strip()
    
    if user_id in config.ADMIN_USERS or user_id in ("139822", "115019", "CE25000014", "138922"):
        return True
    if role == "ADMIN":
        return True
    return False

def verify_write_permission(current_user: Any = Depends(get_current_user)):
    user_id = str(getattr(current_user, "EmployeeId", "") or getattr(current_user, "username", "")).strip()
    if user_id in READ_ONLY_USERS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User {user_id} has STRICT VIEW-ONLY access. Creation, modification, approval, or deletion of data is strictly not permitted."
        )
    return current_user

def verify_admin_permission(current_user: Any = Depends(verify_write_permission)):
    """Ensures only configured Admin users or Central Office administrators can perform administrative mutations."""
    if not is_admin_user(current_user):
        user_id = str(getattr(current_user, "EmployeeId", "") or getattr(current_user, "username", "Unknown"))
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. User {user_id} does not have administrator privileges."
        )
    return current_user

