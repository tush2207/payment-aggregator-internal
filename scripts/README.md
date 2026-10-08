# Universal Project Scripts (100% Pure CMD / Batch)

Generic, portable, and drop-in ready development, deployment, and file-sharing scripts for **ANY project**.  
Uses 100% native Windows tools (`tar.exe`, `certutil.exe`, `robocopy.exe`, `netstat`, `taskkill`) with **zero dependencies** and **no PowerShell required**.

---

## 📁 Directory Structure

```text
scripts/
├── share/                     <- Full Module Sharing (< 8.5 MB packages)
│   ├── Pack-Share.bat         <- Packs entire backend app & frontend src into Base64 .txt (< 8.5 MB)
│   ├── Apply-Share.bat        <- Auto-backups & safely replaces backend app & frontend src
│   └── README.md
│
├── run/                       <- Universal Multi-Service Runner
│   ├── Start-Dev.bat          <- Launches both Backend & Frontend in dual windows
│   ├── Start-Backend.bat      <- Auto-detects FastAPI, Flask, Django, Node, Go, Spring Boot
│   ├── Start-Frontend.bat     <- Auto-detects React, Vite, Next.js, Vue, Angular
│   └── README.md
│
├── deploy/                    <- Patch & Deploy Utility
│   ├── Pack-Changes.bat       <- Packs Git changes / explicit files with < 8.5 MB limit
│   ├── Apply-Changes.bat      <- Non-destructive patch applier with targeted rollback
│   ├── Test-Deploy.bat        <- Automated test suite verifying pack -> apply -> rollback
│   └── README.md
│
├── kill-ports.bat             <- Frees active dev ports (9003, 3001, 5173, 8000, 3000, etc.)
├── changes/                   <- Output directory for deployment change archives
├── share-packages/            <- Output directory for share .txt packages (< 8.5 MB)
├── backups/                   <- Lightweight pre-apply backups
└── README.md                  <- This guide
```

---

## ⚡ 1. Share Entire Modules (`scripts\share\`)

Designed for sharing full code modules between machines via chat, email, or tickets where files must stay under **8.5 MB (8,912,896 bytes)**.

### **Pack Full Backend & Frontend Modules:**
```cmd
scripts\share\Pack-Share.bat
```
- Compresses the entire `backend\app` folder into `share-packages\<ProjectName>_BE_<TIMESTAMP>.txt`.
- Compresses the entire `frontend\src` folder into `share-packages\<ProjectName>_FE_<TIMESTAMP>.txt`.
- Validates that each package is under the **8.5 MB** limit.

### **Apply Packages:**
```cmd
scripts\share\Apply-Share.bat
```
*(Or drag and drop any `.txt` package directly onto `Apply-Share.bat`)*
- Backs up the existing target module to `backups\`.
- Decodes Base64 and replaces `backend\app` and/or `frontend\src`.
- **All other files outside `app` and `src` remain completely untouched.**

---

## 🚀 2. Run Services (`scripts\run\`)

Works out-of-the-box on any project by auto-detecting the technology stack:

```cmd
scripts\run\Start-Dev.bat
```
- Spawns Backend and Frontend in separate labeled CMD windows.
- Auto-detects Python virtual environments (`.venv\`, `venv\`) or Node runtimes.
- Auto-copies `.env.example` -> `.env` if missing.

---

## 📦 3. Patch & Deploy Changed Files (`scripts\deploy\`)

```cmd
scripts\deploy\Pack-Changes.bat
scripts\deploy\Apply-Changes.bat
scripts\deploy\Test-Deploy.bat
```
- Package only Git modified / untracked files into `scripts\changes\change_<TIMESTAMP>.txt`.
- Apply patches on target environments with automatic targeted rollback zip generation.

---

## 🛑 4. Free Ports (`scripts\kill-ports.bat`)

```cmd
scripts\kill-ports.bat
```
- Frees common development ports (9003, 3001, 5173, 5174, 8000, 8080, 3000).
