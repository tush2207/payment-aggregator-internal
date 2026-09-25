from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

endpoints = [
    # Health & System
    ("GET", "/health"),
    ("GET", "/api/health"),
    ("GET", "/health/db"),
    ("GET", "/api/system/db-status"),
    
    # Locations (All variations)
    ("GET", "/applications/locations/zones"),
    ("GET", "/locations/zones"),
    ("GET", "/api/locations/zones"),
    ("GET", "/api/applications/locations/zones"),
    ("GET", "/zones"),
    ("GET", "/api/zones"),
    
    ("GET", "/applications/locations/regions?zone_id=1"),
    ("GET", "/locations/regions?zone_id=1"),
    ("GET", "/api/locations/regions?zone_id=1"),
    ("GET", "/api/applications/locations/regions?zone_id=1"),
    ("GET", "/regions?zone_id=1"),
    ("GET", "/api/regions?zone_id=1"),
    
    ("GET", "/applications/locations/branches?zone_id=1&region_id=10"),
    ("GET", "/locations/branches?zone_id=1&region_id=10"),
    ("GET", "/api/locations/branches?zone_id=1&region_id=10"),
    ("GET", "/api/applications/locations/branches?zone_id=1&region_id=10"),
    ("GET", "/branches?zone_id=1&region_id=10"),
    ("GET", "/api/branches?zone_id=1&region_id=10"),
    
    ("GET", "/applications/locations/hierarchy"),
    ("GET", "/locations/hierarchy"),
    ("GET", "/api/locations/hierarchy"),
    
    # Applications
    ("GET", "/api/get-all-applications/00000"),
    ("GET", "/get-all-applications/00000"),
    ("GET", "/api/applications/stage-metrics"),
    ("GET", "/applications/stage-metrics"),
    
    # Aggregators
    ("GET", "/api/all-manage-aggregator"),
    ("GET", "/all-manage-aggregator"),
    
    # Helpdesk
    ("GET", "/api/helpdesk/"),
    ("GET", "/helpdesk/"),
    
    # Annexures
    ("GET", "/api/annexures"),
    ("GET", "/annexures"),
    
    # Notifications
    ("GET", "/api/application-notifications"),
    ("GET", "/application-notifications"),
]

print(f"{'METHOD':<7} | {'ENDPOINT':<50} | {'STATUS':<6} | {'RESULT'}")
print("-" * 75)

for method, path in endpoints:
    try:
        if method == "GET":
            res = client.get(path)
        else:
            res = client.post(path)
        status_code = res.status_code
        status_str = "OK" if status_code in (200, 201) else f"ERR {status_code}"
        print(f"{method:<7} | {path:<50} | {status_code:<6} | {status_str}")
    except Exception as e:
        print(f"{method:<7} | {path:<50} | EXCEPTION: {e}")
