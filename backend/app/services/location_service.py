import logging
from typing import List, Optional
from app.repository.location_repo import LocationRepository
from app.utils.location_lookup import LocationLookup

logger = logging.getLogger(__name__)

class LocationService:
    def __init__(self, location_repo: LocationRepository):
        self.location_repo = location_repo
        self.lookup = location_repo.lookup

    def get_zone_branch_region_details(self) -> List[dict]:
        """Returns full nested Zone -> Region -> Branch hierarchy."""
        zones = self.lookup.all_zones()
        result = []
        for z in zones:
            z_id = z.get("zoneId")
            z_name = z.get("zoneName")
            regions = self.lookup.all_regions(zone_id=z_id)
            region_list = []
            for r in regions:
                r_id = r.get("regionId")
                r_name = r.get("regionName")
                branches = self.lookup.all_branches(zone_id=z_id, region_id=r_id)
                region_list.append({
                    "region_id":   r_id,
                    "region_name": r_name,
                    "regionId":    r_id,
                    "regionName":  r_name,
                    "id":          r_id,
                    "name":        r_name,
                    "branches": [
                        {
                            "branch_id":   b.get("branchId"),
                            "branch_name": b.get("branchName"),
                            "branchId":    b.get("branchId"),
                            "branchName":  b.get("branchName"),
                            "id":          b.get("branchId"),
                            "name":        b.get("branchName"),
                        }
                        for b in branches
                    ],
                })
            result.append({
                "zone_id":   z_id,
                "zone_name": z_name,
                "zoneId":    z_id,
                "zoneName":  z_name,
                "id":        z_id,
                "name":      z_name,
                "regions":   region_list,
            })
        return result

    def get_all_zones(self) -> List[dict]:
        return [
            {
                "zone_id":   z["zoneId"],
                "zone_name": z["zoneName"],
                "zoneId":    z["zoneId"],
                "zoneName":  z["zoneName"],
                "id":        z["zoneId"],
                "name":      z["zoneName"],
            }
            for z in self.lookup.all_zones()
        ]

    def get_all_regions(self, zone_id: Optional[int] = None) -> List[dict]:
        return [
            {
                "zone_id":     r.get("zoneId"),
                "zone_name":   r.get("zoneName"),
                "zoneId":      r.get("zoneId"),
                "zoneName":    r.get("zoneName"),
                "region_id":   r.get("regionId"),
                "region_name": r.get("regionName"),
                "regionId":    r.get("regionId"),
                "regionName":  r.get("regionName"),
                "id":          r.get("regionId"),
                "name":        r.get("regionName"),
            }
            for r in self.lookup.all_regions(zone_id=zone_id)
        ]

    def get_all_branches(self, zone_id: Optional[int] = None, region_id: Optional[int] = None) -> List[dict]:
        return [
            {
                "zone_id":     b.get("zoneId"),
                "zone_name":   b.get("zoneName"),
                "zoneId":      b.get("zoneId"),
                "zoneName":    b.get("zoneName"),
                "region_id":   b.get("regionId"),
                "region_name": b.get("regionName"),
                "regionId":    b.get("regionId"),
                "regionName":  b.get("regionName"),
                "branch_id":   b.get("branchId"),
                "branch_name": b.get("branchName"),
                "branchId":    b.get("branchId"),
                "branchName":  b.get("branchName"),
                "id":          b.get("branchId"),
                "name":        b.get("branchName"),
            }
            for b in self.lookup.all_branches(zone_id=zone_id, region_id=region_id)
        ]
