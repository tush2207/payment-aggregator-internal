# Deployment & Packaging Utility Scripts

This folder contains automated packaging and deployment utilities for the **Payment Aggregator Request Automation Portal (PAPG)**, matching the Digital Ambassador Portal (DAP) packaging workflow.

---

##  File Overview

| Script | Description |
|---|---|
| `Pack-Changes.bat` | Detects git-changed files (or accepts a manual list), packages them into a ZIP archive, and Base64-encodes into a single deployable `.txt` / `.b64` file in `scripts\changes\`. |
| `Apply-Changes.bat` | Automatically selects the newest `.txt` package, backs up any existing destination files that will be overwritten to `scripts\changes\backups\`, decodes the archive, and extracts the changes into the project root. |
| `Test-Deploy.bat` | Creates a temporary test artifact, runs `Pack-Changes.bat`, applies it into a sandbox folder, verifies byte-exact content, and cleans up. |

---

##  How to Use

### 1. Packaging Changes (Source Machine)
Run:
```bat
scripts\deploy\Pack-Changes.bat
```
- It inspects `git status`, displays modified files, confirms with you, and saves `scripts\changes\change_YYYYMMDD_HHMMSS.txt`.

### 2. Applying Changes (Target Server / UAT / PROD)
1. Copy `scripts\changes\change_YYYYMMDD_HHMMSS.txt` to the target machine's repository.
2. Run:
```bat
scripts\deploy\Apply-Changes.bat
```
- Backs up overwritten files to `scripts\changes\backups\backup_TIMESTAMP.zip`.
- Extracts all updated source code cleanly.

---

##  Production Frontend Build & Dist Sync
To build the optimized frontend and deploy directly to `backend/app/dist`:
```bash
cd frontend
npm run build:prod
```
This automatically creates a timestamped zip archive in `backend/app/version/`, deletes old dist, compiles with Vite production optimizations, and syncs the distribution bundle to both `backend/app/dist` and `backend/dist`.
