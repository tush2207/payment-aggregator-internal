# Share Scripts: Automated Package Encoding & Decoding

Automated zero-hardcoded scripts to package, encode, backup, and deploy updates for **Backend (`backend/app`)** and **Frontend (`frontend/src`)**.

---

## 1. How It Works

### **Pack-Share (`Pack-Share.bat` / `pack-share.ps1`)**
1. Auto-detects project root, project name, and current timestamp (`YYYYMMDD_HHMMSS`).
2. Compresses:
   - `backend/app` -> Temporary Archive
   - `frontend/src` -> Temporary Archive
3. Base64 encodes using Windows native `certutil -encode`:
   - `certutil -encode <BE_ARCHIVE> <ProjectName>_BE_<Timestamp>.b64`
   - `certutil -encode <FE_ARCHIVE> <ProjectName>_FE_<Timestamp>.b64`
4. Renames `.b64` to `.txt`:
   - `<ProjectName>_BE_<Timestamp>.txt`
   - `<ProjectName>_FE_<Timestamp>.txt`
5. Saves all packages in `share-packages/` and cleans up temporary archives.

### **Apply-Share (`Apply-Share.bat` / `apply-share.ps1`)**
1. Accepts input package file(s) via:
   - Command line: `Apply-Share.bat C:\path\to\PAPG_BE_20260925_105000.txt`
   - Drag-and-drop onto `Apply-Share.bat`
   - Double-clicking `Apply-Share.bat` (automatically detects newest packages in `share-packages/`)
2. **Safety Backup**: Backs up existing `backend/app` or `frontend/src` into `old-version/` as timestamped zip files.
3. Prepares `.b64` and decodes using `certutil -decode`.
4. Safely replaces `backend/app` (for BE) and `frontend/src` (for FE) with the decoded contents.
5. Cleans up temporary artifacts.

---

## 2. Usage Examples

### **Create New Share Packages**
Simply run from terminal or double-click:
```cmd
.\scripts\share\Pack-Share.bat
```
Output files will appear in:
```
d:\Projects\PAPG-INTERNAL\share-packages\
  ├── PAPG_INTERNAL_BE_20260925_105500.txt
  └── PAPG_INTERNAL_FE_20260925_105500.txt
```

### **Apply Received Packages**
Double-click `Apply-Share.bat` or run:
```cmd
.\scripts\share\Apply-Share.bat .\share-packages\PAPG_INTERNAL_BE_20260925_105500.txt
```
The previous version is automatically backed up in:
```
d:\Projects\PAPG-INTERNAL\old-version\
  └── backup_backend_app_20260925_105500.zip
```
