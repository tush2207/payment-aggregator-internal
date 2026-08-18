from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
import time
from datetime import datetime
from app.database.engine import SessionLocal
from app.model.models import ApplicationAuditLogInDB

class GlobalAuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Ignore static file mounts or docs
        if path.startswith("/static") or path.startswith("/assets") or path.startswith("/dist") or path in ["/favicon.ico", "/docs", "/openapi.json"]:
            return await call_next(request)

        start_time = time.time()
        response = await call_next(request)
        process_time_ms = round((time.time() - start_time) * 1000, 2)

        # Automatically log API requests to database
        if path.startswith("/api"):
            method = request.method
            status_code = response.status_code
            client_ip = request.client.host if request.client else "unknown"

            # Extract applicationId if present in path
            app_id = None
            parts = path.split("/")
            for p in parts:
                if p.isdigit():
                    app_id = int(p)
                    break

            action = f"{method} {path}"
            details = f"Status Code: {status_code} | Execution Time: {process_time_ms}ms"

            db = SessionLocal()
            try:
                audit_log = ApplicationAuditLogInDB(
                    applicationId=app_id,
                    action=action,
                    stage="API_CALL",
                    performedBy="System/User",
                    userRole="API",
                    details=details,
                    ipAddress=client_ip,
                    createdAt=datetime.now()
                )
                db.add(audit_log)
                db.commit()
            except Exception as err:
                print(f"[GLOBAL AUDIT MIDDLEWARE WARNING] Failed to record API audit log: {err}")
                db.rollback()
            finally:
                db.close()

        return response
