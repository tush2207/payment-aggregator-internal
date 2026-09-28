# Share Scripts: 100% Pure CMD / Batch (No PowerShell)

Zero-hardcoded, standalone Windows Command Prompt (`.bat`) batch scripts using native Windows tools (`tar.exe`, `certutil.exe`, `robocopy.exe`).

---

## 1. Scripts Overview

* **`scripts\share\Pack-Share.bat`**:
  - Compresses `backend\app` and `frontend\src` into zip archives using native `tar.exe`.
  - Base64-encodes them using `certutil.exe -encode`.
  - Renames `.b64` to `.txt` format.
  - Automatically verifies that each file is **within the 9.0 MB limit**.
  - Outputs to `share-packages\`.

* **`scripts\share\Apply-Share.bat`**:
  - Automatically creates timestamped backups in `old-version\` before touching any file.
  - Decodes `.txt` via `certutil.exe -decode`.
  - Extracts and safely updates `backend\app` and `frontend\src`.
  - Cleans up all temporary decode artifacts.

---

## 2. How to Use

### **To Create Packages:**
Double-click `Pack-Share.bat` or run in CMD:
```cmd
.\scripts\share\Pack-Share.bat
```
Output packages will appear in `share-packages\`:
* `bank-unified-portal_BE_<TIMESTAMP>.txt` (~0.4 MB - Well under 9MB)
* `bank-unified-portal_FE_<TIMESTAMP>.txt` (~1.2 MB - Well under 9MB)

### **To Apply Packages:**
1. **Option A (Auto)**: Place `.txt` files into `share-packages\` and double-click `Apply-Share.bat`.
2. **Option B (Drag & Drop)**: Drag and drop any `.txt` package file directly onto `Apply-Share.bat`.
3. **Option C (Command Line)**:
```cmd
.\scripts\share\Apply-Share.bat path\to\bank-unified-portal_BE_<TIMESTAMP>.txt
```
