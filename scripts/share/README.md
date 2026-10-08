# Universal Full Module Share Utility (100% Pure CMD)

Generic and portable code sharing scripts designed to transfer the entire `backend\app` and `frontend\src` modules between machines.

---

## 📦 Package Naming & Structure

Packages are generated in `share-packages\` using the project name and timestamp:
- **Backend Package:** `{PROJECT_NAME}_BE_{TIMESTAMP}.txt` (e.g. `PAPG-INTERNAL_BE_20260928_114555.txt`)
- **Frontend Package:** `{PROJECT_NAME}_FE_{TIMESTAMP}.txt` (e.g. `PAPG-INTERNAL_FE_20260928_114555.txt`)

Both packages are compressed with `tar.exe` and Base64 encoded with `certutil.exe`.  
Each package is strictly validated to stay under **`< 8.5 MB` (8,912,896 bytes)**.

---

## 🚀 How to Use

### **1. Pack Entire Modules (Source Machine):**
```cmd
scripts\share\Pack-Share.bat
```
- Compresses and encodes the entire `backend\app` folder into `{PROJECT_NAME}_BE_{TIMESTAMP}.txt`.
- Compresses and encodes the entire `frontend\src` folder into `{PROJECT_NAME}_FE_{TIMESTAMP}.txt`.
- Saves both files into `share-packages\`.

### **2. Apply Packages (Target Machine):**
```cmd
scripts\share\Apply-Share.bat
```
*(Or drag and drop any `.txt` package file directly onto `Apply-Share.bat`)*

- Auto-detects `_BE_` and `_FE_` packages.
- **Automatic Backup:** Backs up the existing `backend\app` or `frontend\src` into `backups\backup_backend_<TIMESTAMP>.zip` and `backups\backup_frontend_<TIMESTAMP>.zip`.
- Safely extracts and replaces `backend\app` and `frontend\src`.
- **All other files outside `app` and `src` (environment, configurations, docker, git, etc.) remain untouched.**
