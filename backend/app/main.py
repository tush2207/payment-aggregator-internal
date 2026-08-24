from contextlib import asynccontextmanager
import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database.engine import init_db
from app.api.routes import auth, users, aggregators, applications, helpdesk, audit
from app.middleware.audit_middleware import GlobalAuditMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database in background thread to avoid blocking server boot
    t = threading.Thread(target=init_db, daemon=True)
    t.start()
    yield

app = FastAPI(docs_url="/docs", redoc_url="/redoc", lifespan=lifespan)

origins = [
    "*",
    "http://localhost:5173",      # React local dev
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://yourserverip:5173",
    "https://yourdomain.com"
]

app.add_middleware(GlobalAuditMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
except RuntimeError:
    pass # Directory might not exist

try:
    app.mount("/dist", StaticFiles(directory="dist"), name="dist")
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
except RuntimeError:
    pass # Directory might not exist

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(aggregators.router)
app.include_router(applications.router)
app.include_router(helpdesk.router)
app.include_router(audit.router)

@app.get("/")
async def serve_react():
    return FileResponse("dist/index.html")

@app.get("/{full_path:path}")
async def serve_react_spa(full_path: str):
    return FileResponse("dist/index.html")
