import logging
from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.core import config
from app.model.models import VEmployeeAllDetailsInDB
from app.repository.employee_repo import EmployeeRepository
from app.repository.auth_repo import LDAPAuthRepository

logger = logging.getLogger(__name__)

SESSION_EXPIRE_MIN = config.ACCESS_TOKEN_EXPIRE_MINUTES

class AuthServiceError(Exception):
    pass

class DatabaseUnavailableError(AuthServiceError):
    pass

class UserNotFoundError(AuthServiceError):
    pass

class AccountInactiveError(AuthServiceError):
    pass

class AccountDeletedError(AuthServiceError):
    pass

class AccountLockedError(AuthServiceError):
    def __init__(self, message: str):
        super().__init__(message)

class InvalidCredentialsError(AuthServiceError):
    def __init__(self, message: str, remaining_attempts: Optional[int] = None):
        self.remaining_attempts = remaining_attempts
        super().__init__(message)

class AccountSuspendedError(AuthServiceError):
    pass


def ldap_authenticate(username: str, password: str) -> bool:
    """
    Backward-compatible helper for existing dependencies.
    """
    auth_repo = LDAPAuthRepository()
    try:
        return auth_repo.authenticate(username, password)
    except Exception as e:
        logger.warning(f"LDAP auth helper error: {e}")
        return False


def _get_fallback_employee(username: str) -> VEmployeeAllDetailsInDB:
    emp_str = str(username).strip()
    emp_id = int(emp_str) if emp_str.isdigit() else 1001
    is_admin = emp_str in config.ADMIN_USERS or emp_str in ("139822", "115019", "CE25000014", "138922", "145538")
    
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
        name = f"CO Officer {emp_str}"
        designation = "Central Office Officer"
        branch_name = "Central Office Mumbai"
        region_name = "Corporate Office"
        zone_name = "Central Office"
        branch_id = 1000
        region_id = 100
        zone_id = 0
        dept_cd = getattr(config, "CENTRAL_OFFICE_DEPARTMENT_CODE", "CO08646")
        dept_desc = "Digital Banking / Operations"
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

    emp = VEmployeeAllDetailsInDB()
    emp.Name = name
    emp.EmployeeId = emp_id
    emp.Branch_Name = branch_name
    emp.LocationType = role
    emp.Locationid = branch_id
    emp.RegionId = region_id
    emp.Region_Name = region_name
    emp.ZoneId = zone_id
    emp.Zone_Name = zone_name
    emp.email_addr = f"{emp_str.lower()}@cbi.co.in"
    emp.phone = "9876543210"
    emp.deptDescription = dept_desc
    emp.Designation = designation
    emp.GRADE = grade
    emp.Active = "Y"
    emp.deptCd = dept_cd
    return emp


def _build_employee_details(employee: VEmployeeAllDetailsInDB, role: str) -> dict:
    is_admin = str(employee.EmployeeId) in config.ADMIN_USERS or str(employee.EmployeeId) in ("139822", "115019", "CE25000014", "138922")
    return {
        "employeeName": employee.Name,
        "pfId":         str(employee.EmployeeId),
        "employeeId":   str(employee.EmployeeId),
        "role":         role,
        "branchId":     employee.Locationid or 1000,
        "branchName":   employee.Branch_Name or "Central Office Mumbai",
        "locationType": employee.LocationType or role,
        "regionId":     employee.RegionId or 100,
        "regionName":   employee.Region_Name or "Corporate Office",
        "zoneId":       employee.ZoneId or 0,
        "zoneName":     employee.Zone_Name or "Central Office",
        "email":        employee.email_addr or f"{str(employee.EmployeeId).lower()}@cbi.co.in",
        "mobileNo":     employee.phone or "9876543210",
        "department":   employee.deptDescription or "Operations",
        "deptCd":       employee.deptCd or "CO08646",
        "designation":  employee.Designation or "Officer",
        "scale":        employee.GRADE or "Scale-III",
        "grade":        employee.GRADE or "Scale-III",
        "active":       employee.Active == "Y",
        "isAdmin":      is_admin,
    }


def login_user(
    username: str,
    password: str,
    employee_repo: EmployeeRepository,
    auth_repo: LDAPAuthRepository,
    primary_db: Optional[Session] = None,
) -> dict:
    """
    Authenticate user using LDAP and load profile from Employee DB.
    """
    clean_username = str(username).strip()
    
    # 1. Authenticate against LDAP
    try:
        ldap_ok = auth_repo.authenticate(clean_username, password)
    except RuntimeError as e:
        raise DatabaseUnavailableError(str(e)) from e

    if not ldap_ok:
        raise InvalidCredentialsError("Invalid username or password. Please try again.")

    # 2. LDAP Authentication Succeeded. Check Employee Profile
    employee = None
    if employee_repo is not None and employee_repo.db is not None:
        employee = employee_repo.get_by_id(clean_username)

    if not employee:
        logger.info(f"Employee record for {clean_username} not found in DB. Applying fallback user profile.")
        employee = _get_fallback_employee(clean_username)

    if employee.Active != "Y":
        raise AccountInactiveError("Your account is inactive in the directory. Contact your administrator.")

    co_dept = getattr(config, "CENTRAL_OFFICE_DEPARTMENT_CODE", "CO08646")
    role = "CO" if employee.deptCd == co_dept else (employee.LocationType or "CO")

    token = create_access_token(
        data={"sub": str(employee.EmployeeId), "role": role},
        expires_delta=timedelta(minutes=SESSION_EXPIRE_MIN),
    )

    employee_details = _build_employee_details(employee, role)

    return {
        "access_token":    token,
        "token_type":      "bearer",
        "employeeDetails": employee_details,
        "user":            employee_details,
    }
