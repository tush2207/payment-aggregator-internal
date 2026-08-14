# Digital Ambassador Portal — Scripts Guide

Scripts are organized into two folders:

```
scripts/
├── run/                       <- Start the project (servers)
│   ├── Start-Dev.bat          <- Launch BOTH backend + frontend
│   ├── Start-Backend.bat      <- Backend only (FastAPI :8000)
│   ├── Start-Frontend.bat     <- Frontend only (Vite :5174)
│   └── README.md
│
├── deploy/                    <- Package & deploy code changes
│   ├── Pack-Changes.bat       <- Pack git modified & untracked files into .txt
│   ├── Apply-Changes.bat      <- Apply a .txt / .b64 change archive to the project
│   ├── Test-Deploy.bat        <- Automated test suite for deploy scripts
│   └── README.md
│
├── changes/                   <- Auto-created by Pack-Changes.bat
│   ├── change_YYYYMMDD_HHMMSS.txt <- Share this to deploy
│   ├── change_YYYYMMDD_HHMMSS.zip <- For inspection
│   └── backups/               <- Auto-backup before each apply
│
└── README.md                  <- This file
```

---

## Running the Project

### VS Code (2 terminal tabs inside IDE)

Press **`Ctrl+Shift+B`** — opens Backend + Frontend tabs automatically.

Or: `Ctrl+Shift+P` → **Tasks: Run Task**

| Task | Action |
|------|--------|
| `DAP: Start All [DEV]` | Both servers — DEV mode |
| `DAP: Start All [UAT]` | Both servers — UAT mode |
| `DAP: Backend [DEV]` | Backend only |
| `DAP: Frontend` | Frontend only |
| `DAP: Pack Changes` | Run Pack-Changes.bat |
| `DAP: Apply Changes` | Run Apply-Changes.bat |

### CMD (2 separate windows)

```cmd
scripts\run\Start-Dev.bat           DEV mode (default)
scripts\run\Start-Dev.bat UAT       UAT mode
scripts\run\Start-Backend.bat DEV   Backend only
scripts\run\Start-Frontend.bat      Frontend only
```

---

## Deploying Changes

### Pack (create patch from your changes)

```cmd
scripts\deploy\Pack-Changes.bat                   :: auto-detect modified + untracked files
scripts\deploy\Pack-Changes.bat -NonInteractive   :: no prompts
```

### Apply (deploy patch to another machine)

```cmd
scripts\deploy\Apply-Changes.bat          :: auto-picks latest .b64
scripts\deploy\Apply-Changes.bat -Force   :: no prompts
```

### Test

```cmd
scripts\deploy\Test-Deploy.bat
```

### Revert (undo an apply)

```cmd
tar -xf "scripts\changes\backups\backup_xxx.zip" -C "."
```

---

## Environment Setup (Backend)

| File | Committed? | Used for |
|------|-----------|---------|
| `backend/.env.dev.example` | YES | Template — copy to `.env.dev` |
| `backend/.env.prod.example` | YES | Template — copy to `.env.prod` |
| `backend/.env.dev` | NO | Real DEV/UAT credentials |
| `backend/.env.prod` | NO | Real PROD credentials |

```cmd
copy backend\.env.dev.example backend\.env.dev
```
Then fill in your real credentials.

| `API_ENV` | Env File | DB URL Used |
|-----------|---------|------------|
| `DEV` | `.env.dev` | `DEV_DB_URL` — local Oracle |
| `UAT` | `.env.dev` | `UAT_DB_URL` — UAT server |
| `PROD` | `.env.prod` | `PROD_DB_URL` — production |

See [`scripts/run/README.md`](run/README.md) and [`scripts/deploy/README.md`](deploy/README.md) for details.
