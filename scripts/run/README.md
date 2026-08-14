# Running the Project — `scripts/run/`

This folder contains the startup scripts for running the **Digital Ambassador Portal** locally.

## Files

| File | Purpose |
|------|---------|
| `Start-Dev.bat` | **Launch BOTH** backend + frontend (opens 2 CMD windows) |
| `Start-Backend.bat` | Backend only — FastAPI / uvicorn |
| `Start-Frontend.bat` | Frontend only — Vite / React |

---

## Quick Start

### Run both servers at once

```cmd
scripts\run\Start-Dev.bat          REM DEV mode (default)
scripts\run\Start-Dev.bat UAT      REM UAT mode
```

Or from **VS Code**: press **`Ctrl+Shift+B`**

### Run individually

```cmd
scripts\run\Start-Backend.bat DEV      REM Backend only
scripts\run\Start-Frontend.bat         REM Frontend only
```

---

## Ports

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5174 |
| Backend (FastAPI) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## Environments (`API_ENV`)

| Argument | Env File Used | DB Used |
|----------|--------------|---------|
| `DEV` (default) | `backend/.env.dev` | `DEV_DB_URL` — local Oracle |
| `UAT` | `backend/.env.dev` | `UAT_DB_URL` — UAT server |
| `PROD` | `backend/.env.prod` | `PROD_DB_URL` — production |

> **First run?** The script auto-copies `.env.dev.example` → `.env.dev` if missing.
> Open `backend/.env.dev` and fill in your real credentials.

---

See [`scripts/README.md`](../README.md) for the full project guide.
