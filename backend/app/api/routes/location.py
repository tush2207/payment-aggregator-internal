"""
Location hierarchy routes.

GET /applications/locations/hierarchy   -> full nested Zone -> Region -> Branch
GET /applications/locations/zones       -> flat list of all zones
GET /applications/locations/regions     -> flat list of all regions (?zone_id=)
GET /applications/locations/branches    -> flat list of all branches (?zone_id=&region_id=)
"""

from fastapi import APIRouter, Depends, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import Optional, Union

from app.api.deps.dependencies import get_mssql_db
from app.repository.location_repo import LocationRepository
from app.services.location_service import LocationService

router = APIRouter(tags=["Locations"])

@router.get("/applications/locations/hierarchy", summary="Get full Zone -> Region -> Branch hierarchy")
@router.get("/locations/hierarchy", summary="Get full Zone -> Region -> Branch hierarchy")
@router.get("/api/locations/hierarchy", summary="Get full Zone -> Region -> Branch hierarchy")
@router.get("/api/applications/locations/hierarchy", summary="Get full Zone -> Region -> Branch hierarchy")
async def get_zone_region_branch_hierarchy(
    db: Optional[Session] = Depends(get_mssql_db),
):
    location_repo = LocationRepository(db)
    service = LocationService(location_repo)
    data = service.get_zone_branch_region_details()
    return jsonable_encoder(data)


@router.get("/applications/locations/zones", summary="Get all zones")
@router.get("/locations/zones", summary="Get all zones")
@router.get("/api/locations/zones", summary="Get all zones")
@router.get("/api/applications/locations/zones", summary="Get all zones")
@router.get("/zones", summary="Get all zones")
@router.get("/api/zones", summary="Get all zones")
async def get_all_zones(
    db: Optional[Session] = Depends(get_mssql_db),
):
    location_repo = LocationRepository(db)
    service = LocationService(location_repo)
    data = service.get_all_zones()
    return jsonable_encoder(data)


@router.get("/applications/locations/regions", summary="Get all regions (optional: ?zone_id=1)")
@router.get("/locations/regions", summary="Get all regions")
@router.get("/api/locations/regions", summary="Get all regions")
@router.get("/api/applications/locations/regions", summary="Get all regions")
@router.get("/regions", summary="Get all regions")
@router.get("/api/regions", summary="Get all regions")
async def get_all_regions(
    zone_id: Optional[Union[str, int]] = Query(None, description="Filter by zone ID"),
    db: Optional[Session] = Depends(get_mssql_db),
):
    location_repo = LocationRepository(db)
    service = LocationService(location_repo)
    data = service.get_all_regions(zone_id=zone_id)
    return jsonable_encoder(data)


@router.get("/applications/locations/branches", summary="Get all branches (optional: ?zone_id=1&region_id=101)")
@router.get("/locations/branches", summary="Get all branches")
@router.get("/api/locations/branches", summary="Get all branches")
@router.get("/api/applications/locations/branches", summary="Get all branches")
@router.get("/branches", summary="Get all branches")
@router.get("/api/branches", summary="Get all branches")
async def get_all_branches(
    zone_id: Optional[Union[str, int]] = Query(None, description="Filter by zone ID"),
    region_id: Optional[Union[str, int]] = Query(None, description="Filter by region ID"),
    db: Optional[Session] = Depends(get_mssql_db),
):
    location_repo = LocationRepository(db)
    service = LocationService(location_repo)
    data = service.get_all_branches(zone_id=zone_id, region_id=region_id)
    return jsonable_encoder(data)

