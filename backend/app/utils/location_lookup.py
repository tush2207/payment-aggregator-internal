"""
app/utils/location_lookup.py

Reads zone / region / branch names from MSSQL stored procedure
(EXEC LoadZoneRegionBranchDetails) and provides fast ID -> name lookup.

MSSQL is READ-ONLY. This utility never writes to MSSQL.
Cache TTL: 7 days.
"""

import time
import logging
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger(__name__)
TTL = 60 * 60 * 24 * 7  # 7 days

class LocationLookup:
    # ── Shared in-process cache across all requests ──────────────────
    _cache: Dict = {
        "zone_map":   {},   # str(zone_id)   -> {"zoneId", "zoneName"}
        "region_map": {},   # str(region_id) -> {"regionId", "regionName", "zoneId", "zoneName"}
        "branch_map": {},   # str(branch_id) -> {"branchId", "branchName", "regionId", "regionName", "zoneId", "zoneName"}
        "ts":         0,
    }

    def __init__(self, db: Optional[Session] = None):
        self._db = db
        self._ensure()

    def _ensure(self):
        c = LocationLookup._cache
        if not c["zone_map"] or (time.time() - c["ts"]) > TTL:
            self._load()

    def _load(self):
        rows = []
        if self._db:
            # 1. Try stored procedure on MSSQL
            try:
                rows = self._db.execute(text("EXEC LoadZoneRegionBranchDetails")).fetchall()
            except Exception:
                pass

            # 2. Try BRANCH_LOCATION_MASTER table
            if not rows:
                try:
                    rows = self._db.execute(text(
                        "SELECT ZONE_ID AS ZO_CD, ZONE_NAME AS ZO_NAME, REGION_ID AS RegionID, REGION_NAME AS Region, BRANCH_ID AS br_cd, BRANCH_NAME AS br_name FROM BRANCH_LOCATION_MASTER"
                    )).fetchall()
                except Exception:
                    pass

            # 3. Try VEmployeeAllDetails distinct query
            if not rows:
                try:
                    rows = self._db.execute(text(
                        "SELECT DISTINCT ZoneId AS ZO_CD, Zone_Name AS ZO_NAME, RegionId AS RegionID, Region_Name AS Region, Locationid AS br_cd, Branch_Name AS br_name FROM VEmployeeAllDetails"
                    )).fetchall()
                except Exception:
                    pass

        zm, rm, bm = {}, {}, {}

        for r in rows:
            try:
                row_dict = {str(k).upper(): v for k, v in r._mapping.items()}
            except Exception:
                row_dict = {}
                for k in ["ZO_CD", "ZO_NAME", "RegionID", "Region", "br_cd", "br_name"]:
                    val = getattr(r, k, None)
                    if val is None:
                        for key_var in [k.upper(), k.lower()]:
                            val = getattr(r, key_var, None)
                            if val is not None:
                                break
                    row_dict[k.upper()] = val

            zi = self._norm_id(row_dict.get("ZO_CD"))
            zn = str(row_dict.get("ZO_NAME") or "").strip()
            ri = self._norm_id(row_dict.get("REGIONID"))
            rn = str(row_dict.get("REGION") or "").strip()
            bi = self._norm_id(row_dict.get("BR_CD"))
            bn = str(row_dict.get("BR_NAME") or "").strip()

            if zi and zi not in zm:
                zm[zi] = {"zoneId": zi, "zoneName": zn, "id": zi, "name": zn}

            if ri and ri not in rm:
                rm[ri] = {
                    "regionId":   ri,
                    "regionName": rn,
                    "zoneId":     zi,
                    "zoneName":   zn,
                    "id":         ri,
                    "name":       rn,
                }

            if bi and bi not in bm:
                bm[bi] = {
                    "branchId":   bi,
                    "branchName": bn,
                    "regionId":   ri,
                    "regionName": rn,
                    "zoneId":     zi,
                    "zoneName":   zn,
                    "id":         bi,
                    "name":       bn,
                }

        LocationLookup._cache.update(
            zone_map=zm, region_map=rm, branch_map=bm, ts=time.time()
        )

    def _norm_id(self, v) -> str:
        if v is None:
            return ""
        s = str(v).strip()
        if s.endswith(".0"):
            s = s[:-2]
        return s

    def zone_name(self, zone_id) -> Optional[str]:
        if not zone_id:
            return None
        entry = LocationLookup._cache["zone_map"].get(self._norm_id(zone_id))
        return entry["zoneName"] if entry else None

    def region_name(self, region_id) -> Optional[str]:
        if not region_id:
            return None
        entry = LocationLookup._cache["region_map"].get(self._norm_id(region_id))
        return entry["regionName"] if entry else None

    def branch_name(self, branch_id) -> Optional[str]:
        if not branch_id:
            return None
        entry = LocationLookup._cache["branch_map"].get(self._norm_id(branch_id))
        return entry["branchName"] if entry else None

    def get_zone(self, zone_id) -> Optional[dict]:
        return LocationLookup._cache["zone_map"].get(self._norm_id(zone_id)) if zone_id else None

    def get_region(self, region_id) -> Optional[dict]:
        return LocationLookup._cache["region_map"].get(self._norm_id(region_id)) if region_id else None

    def get_branch(self, branch_id) -> Optional[dict]:
        return LocationLookup._cache["branch_map"].get(self._norm_id(branch_id)) if branch_id else None

    def enrich(self, record: dict) -> dict:
        """Fills zoneName, regionName, branchName if missing."""
        if not record.get("zoneName") and record.get("zoneId"):
            record["zoneName"] = self.zone_name(record.get("zoneId"))
        if not record.get("regionName") and record.get("regionId"):
            record["regionName"] = self.region_name(record.get("regionId"))
        if not record.get("branchName") and record.get("branchId"):
            record["branchName"] = self.branch_name(record.get("branchId"))
        return record

    def all_zones(self) -> list:
        return sorted(
            LocationLookup._cache["zone_map"].values(),
            key=lambda x: str(x.get("zoneName") or "")
        )

    def all_regions(self, zone_id=None) -> list:
        regions = list(LocationLookup._cache["region_map"].values())
        if zone_id:
            regions = [r for r in regions if self._norm_id(r.get("zoneId")) == self._norm_id(zone_id)]
        return sorted(regions, key=lambda x: str(x.get("regionName") or ""))

    def all_branches(self, zone_id=None, region_id=None) -> list:
        branches = list(LocationLookup._cache["branch_map"].values())
        if zone_id:
            branches = [b for b in branches if self._norm_id(b.get("zoneId")) == self._norm_id(zone_id)]
        if region_id:
            branches = [b for b in branches if self._norm_id(b.get("regionId")) == self._norm_id(region_id)]
        return sorted(branches, key=lambda x: str(x.get("branchName") or ""))

    @classmethod
    def invalidate(cls):
        cls._cache["ts"] = 0
