import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.model.models import VEmployeeAllDetailsInDB

logger = logging.getLogger(__name__)

class EmployeeRepository:
    def __init__(self, db: Optional[Session]):
        self.db = db

    def get_by_id(self, employee_id: str) -> Optional[VEmployeeAllDetailsInDB]:
        if self.db is None:
            return None
        try:
            emp_id_int = int(str(employee_id).strip())
            employee = (
                self.db.query(VEmployeeAllDetailsInDB)
                .filter(VEmployeeAllDetailsInDB.EmployeeId == emp_id_int)
                .first()
            )
            return employee
        except ValueError:
            # Non-integer employee ID
            return None
        except Exception as e:
            logger.warning(f"Error querying employee details from MSSQL for {employee_id}: {e}")
            return None
