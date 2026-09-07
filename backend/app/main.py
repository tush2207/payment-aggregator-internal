import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager
import threading
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.database.engine import (
    init_db,
    check_oracle_health,
    check_mssql_health,
    oracle_engine,
    mssql_engine,
)
from app.api.routes import auth, users, aggregators, applications, helpdesk, audit
from app.middleware.audit_middleware import GlobalAuditMiddleware

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# DIRECTORY PATHS & STATIC FILE CONFIGURATION (App / dist)
# ─────────────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent          # backend/app
BACKEND_DIR = BASE_DIR.parent                      # backend

# Support both backend/app/dist and backend/dist
STATIC_DIR = BASE_DIR / "dist"
if not STATIC_DIR.is_dir() and (BACKEND_DIR / "dist").is_dir():
    STATIC_DIR = BACKEND_DIR / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database in background thread to avoid blocking server boot
    t = threading.Thread(target=init_db, daemon=True)
    t.start()
    yield


app = FastAPI(
    title="PAPG API - Central Bank of India",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

origins = [
    "*",
    "http://localhost:5173",      # React local dev
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://yourserverip:5173",
    "https://yourdomain.com",
]

app.add_middleware(GlobalAuditMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL EXCEPTION HANDLER
# ─────────────────────────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, StarletteHTTPException):
        from fastapi.exception_handlers import http_exception_handler
        return await http_exception_handler(request, exc)
    logger.error(f"Unhandled server exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "statusCode": 500,
            "status": "error",
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred on the server. Please try again shortly.",
            "data": None,
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# MOUNT STATIC ASSETS
# ─────────────────────────────────────────────────────────────────────────────
if STATIC_DIR.is_dir():
    if (STATIC_DIR / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")
    if (STATIC_DIR / "fonts").is_dir():
        app.mount("/fonts", StaticFiles(directory=str(STATIC_DIR / "fonts")), name="fonts")

static_folder = BASE_DIR / "static"
if static_folder.is_dir():
    app.mount("/static", StaticFiles(directory=str(static_folder)), name="static")


# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK ENDPOINTS (Ensures service status verification)
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check():
    oracle_ok = check_oracle_health()
    mssql_ok = check_mssql_health()
    return {
        "status": "up",
        "api": "operational",
        "oracleDb": "up" if oracle_ok else "degraded",
        "mssqlDb": "up" if mssql_ok else "degraded",
        "staticDistMounted": STATIC_DIR.is_dir(),
    }


@app.get("/health/db", tags=["Health"])
async def health_db():
    oracle_ok = check_oracle_health()
    mssql_ok = check_mssql_health()
    return {
        "oracle": "connected" if oracle_ok else "disconnected",
        "mssql": "connected" if mssql_ok else "disconnected",
    }


# ─────────────────────────────────────────────────────────────────────────────
# INCLUDE API ROUTERS
# ─────────────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(aggregators.router)
app.include_router(applications.router)
app.include_router(helpdesk.router)
app.include_router(audit.router)


# ─────────────────────────────────────────────────────────────────────────────
# SPA SERVE & CATCH-ALL ROUTING (Matches DAP architecture)
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def serve_index():
    try:
        index_file = STATIC_DIR / "index.html"
        if index_file.is_file():
            return FileResponse(str(index_file))
    except Exception as e:
        logger.warning(f"Failed to serve index.html: {e}")
    return JSONResponse(
        {"message": "Frontend build not detected. API is running. Check /docs for API documentation."},
        status_code=200,
    )


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_catch_all(full_path: str):
    # Never intercept API / docs / health / openapi routes
    NON_SPA_PREFIXES = (
        "api", "v1", "health", "docs", "redoc", "openapi.json",
        "secure-data", "ldaplogin", "users",
        "favicon.ico", "robots.txt",
    )
    if any(full_path == p or full_path.startswith(p + "/") for p in NON_SPA_PREFIXES):
        return JSONResponse({"message": f"Endpoint '{full_path}' not found"}, status_code=404)

    try:
        # Try to serve an exact static file first (favicon, manifest, images, etc.)
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
    except Exception:
        pass

    try:
        # For any SPA route (e.g. /login, /dashboard, /service-down) fall back to index.html
        index_file = STATIC_DIR / "index.html"
        if index_file.is_file():
            return FileResponse(str(index_file))
    except Exception:
        pass

    return JSONResponse({"message": f"Resource '/{full_path}' not found"}, status_code=404)
