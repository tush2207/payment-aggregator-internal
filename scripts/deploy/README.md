# Deploying Changes — `scripts/deploy/`

This folder handles **packaging and applying code changes** between environments
(Dev → UAT → Production) without needing git access on the target server.

These are plain **Command Prompt** batch files — no PowerShell required.
They use `git`, `tar` (built into Windows 10 1803+ / Windows 11), and
`certutil` (built into every Windows version).

## Files

| File | Purpose |
|------|---------|
| `Pack-Changes.bat` | Detect git modified & untracked files, package into `.txt` (Base64) archive |
| `Apply-Changes.bat` | Convert `.txt` extension to `.b64`, decode to ZIP, and apply files |
| `Test-Deploy.bat` | Run end-to-end automated tests for packaging and applying changes |

**Output goes to:** `scripts\changes\` (auto-created)

---

## Workflow

### Step 1 — Pack (on source machine)

Open **Command Prompt**, `cd` into the repo (or anywhere inside it), then:

```cmd
:: Auto-detect all git modified AND new (untracked) files
scripts\deploy\Pack-Changes.bat

:: Exclude new (untracked) files if desired
scripts\deploy\Pack-Changes.bat -ExcludeUntracked

:: Pack specific files only, no prompts
scripts\deploy\Pack-Changes.bat -Files "backend\app\core\config.py" -NonInteractive
```

**Pack Flow:**
1. Check file changes (`git status --porcelain`)
2. Convert changed files to ZIP (`change_YYYYMMDD_HHMMSS.zip`)
3. Convert to Base64 using `certutil -encode -f`
4. Convert extension `.b64` to `.txt`
5. Save as `change_currentdate_currentTime.txt`

**Creates in `scripts\changes\`:**
```
change_20260801_112225.txt   <- share/copy this to deploy
change_20260801_112225.zip   <- same content, open for inspection
```

### Step 2 — Apply (on target machine)

Copy the `.txt` (or `.b64`) file into `scripts\changes\` on the target, then from Command
Prompt in the repo root:

```cmd
:: Auto-picks the latest change_*.txt in scripts\changes\
scripts\deploy\Apply-Changes.bat

:: Apply a specific file
scripts\deploy\Apply-Changes.bat -InputFile scripts\changes\change_20260801_112225.txt

:: Apply with no prompts (automation / CI)
scripts\deploy\Apply-Changes.bat -Force
```

**Apply Flow:**
1. Convert extension `.txt` to `.b64`
2. Convert to ZIP using `certutil -decode -f`
3. Backup existing files (`scripts\changes\backups\backup_YYYYMMDD_HHMMSS.zip`) and apply file changes into project

### Step 3 — Test

Run the automated test script to verify packaging and applying works correctly on your system:

```cmd
scripts\deploy\Test-Deploy.bat
```

### Step 4 — Revert (undo an apply)

```cmd
:: List available backups
dir scripts\changes\backups\

:: Restore from a specific backup
tar -xf "scripts\changes\backups\backup_20260720_102000.zip" -C "."
```

---

## Requirements

- **Git** in PATH (for change detection in Pack)
- **tar** in PATH — bundled with Windows 10 (build 1803+) and Windows 11 by default
- **certutil** — bundled with every Windows version

No execution-policy setup, no `Unblock-File`, no PowerShell flags needed —
just double-click the `.bat` files or run them from `cmd.exe`.

---

See [`scripts/README.md`](../README.md) for the full project guide.