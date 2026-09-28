# Universal Project Scripts (100% Pure CMD / Batch)

Generic, portable, and drop-in ready development, deployment, and file-sharing scripts for **ANY project**.  
Uses 100% native Windows tools (`tar.exe`, `certutil.exe`, `robocopy.exe`, `netstat`, `taskkill`) with **zero dependencies** and **no PowerShell required**.

---

## 📁 Directory Structure

```text
scripts/
├── share/                     <- Delta File Sharing (< 8.5 MB packages)
│   ├── Pack-Share.bat         <- Packs ONLY modified/added files into Base64 .txt (< 8.5 MB)
│   ├── Apply-Share.bat        <- Creates targeted backup & safely updates ONLY the packed files
│   └── README.md
│
├── run/                       <- Universal Multi-Service Runner
│   ├── Start-Dev.bat          <- Launches both Backend & Frontend in dual windows
│   ├── Start-Backend.bat      <- Auto-detects FastAPI, Flask, Django, Node, Go, Spring Boot
│   ├── Start-Frontend.bat     <- Auto-detects React, Vite, Next.js, Vue, Angular
│   └── README.md
│
├── deploy/                    <- Patch & Deploy Utility
│   ├── Pack-Changes.bat       <- Packs Git changes/explicit files with < 8.5 MB limit
│   ├── Apply-Changes.bat      <- Non-destructive patch applier with targeted rollback
│   ├── Test-Deploy.bat        <- Automated test suite verifying pack -> apply -> rollback
│   └── README.md
│
├── kill-ports.bat             <- Frees active dev ports (9003, 3001, 5173, 8000, 3000, etc.)
├── changes/                   <- Output directory for deployment change archives
├── share-packages/            <- Output directory for delta .txt packages (< 8.5 MB)
├── backups/                   <- Lightweight targeted pre-apply backups (only overwritten files)
└── README.md                  <- This guide
```

---

## ⚡ 1. Share Delta Files (`scripts\share\`)

Designed for sharing file updates across machines via chat/email/tickets where files must stay under **8.5 MB (8,912,896 bytes)**.

### **Pack ONLY Changed Files:**
```cmd
scripts\share\Pack-Share.bat
```
- Automatically detects changed / uncommitted files via `git status` (or prompts for files).
- Preserves relative project paths.
- Compresses with `tar.exe` and encodes to Base64 `.txt`.
- Enforces strict size validation (< 8.5 MB).
- Saves to `share-packages\<ProjectName>_share_<TIMESTAMP>.txt`.

### **Apply Delta Package:**
```cmd
scripts\share\Apply-Share.bat
```
*(Or drag and drop any `.txt` package directly onto `Apply-Share.bat`)*
- Backs up **ONLY** the specific existing files that are being replaced (saved to `backups\`).
- Overwrites / adds only the packaged files.
- **100% Non-destructive:** All other project files remain completely untouched.

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

## 📦 3. Patch & Deploy (`scripts\deploy\`)

```cmd
scripts\deploy\Pack-Changes.bat
scripts\deploy\Apply-Changes.bat
scripts\deploy\Test-Deploy.bat
```
- Package Git changes or specific files into `scripts\changes\change_<TIMESTAMP>.txt`.
- Apply patches on target environments with automatic targeted rollback zip generation.

---

## 🛑 4. Free Ports (`scripts\kill-ports.bat`)

```cmd
scripts\kill-ports.bat
```
- Frees common development ports (9003, 3001, 5173, 5174, 8000, 8080, 3000).
