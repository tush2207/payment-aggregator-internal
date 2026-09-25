import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from app.utils.location_lookup import LocationLookup

logger = logging.getLogger(__name__)

class LocationRepository:
    def __init__(self, db: Optional[Session]):
        self.db = db
        self.lookup = LocationLookup(db)

    def execute_load_zone_region_branch_details(self) -> List[dict]:
        """Execute location retrieval via LocationLookup."""
        bm = LocationLookup._cache.get("branch_map", {})
        if bm:
            return [
                {
                    "zi": item.get("zoneId"),
                    "zn": item.get("zoneName"),
                    "ri": item.get("regionId"),
                    "rn": item.get("regionName"),
                    "bi": item.get("branchId"),
                    "bn": item.get("branchName"),
                }
                for item in bm.values()
            ]
        return []
