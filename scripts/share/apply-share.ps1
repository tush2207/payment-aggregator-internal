# ==============================================================================
# Apply-Share.ps1 - Decode, Backup, and Deploy Backend (app) and Frontend (src)
# ==============================================================================
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\share\apply-share.ps1 [PackageFile(s)]
# ==============================================================================

param (
    [string[]]$PackageFiles
)

$ErrorActionPreference = "Stop"

# 1. Resolve Project Root Dynamically
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..\..")

$BackendAppDir = Join-Path $ProjectRoot "backend\app"
$FrontendSrcDir = Join-Path $ProjectRoot "frontend\src"

$OldVersionDir = Join-Path $ProjectRoot "old-version"
if (-not (Test-Path $OldVersionDir)) {
    New-Item -ItemType Directory -Path $OldVersionDir -Force | Out-Null
}

$ShareDir = Join-Path $ProjectRoot "share-packages"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   APPLY-SHARE: DECODE & SAFELY REPLACE app / src" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Project Root : $ProjectRoot" -ForegroundColor Yellow
Write-Host "Backup Dir   : $OldVersionDir" -ForegroundColor Yellow
Write-Host ""

# Find candidate package files if none supplied
if (-not $PackageFiles -or $PackageFiles.Count -eq 0) {
    if (Test-Path $ShareDir) {
        $found = Get-ChildItem -Path $ShareDir -Filter "*.txt" | Sort-Object LastWriteTime -Descending
        if ($found.Count -gt 0) {
            Write-Host "No file specified. Auto-detecting packages in share-packages\..." -ForegroundColor Cyan
            # Get newest BE and newest FE if available
            $beCandidate = $found | Where-Object { $_.Name -match "_BE_" -or $_.Name -match "BE" } | Select-Object -First 1
            $feCandidate = $found | Where-Object { $_.Name -match "_FE_" -or $_.Name -match "FE" } | Select-Object -First 1
            
            $PackageFiles = @()
            if ($beCandidate) { $PackageFiles += $beCandidate.FullName }
            if ($feCandidate) { $PackageFiles += $feCandidate.FullName }
            
            if ($PackageFiles.Count -eq 0) {
                $PackageFiles = @($found[0].FullName)
            }
        }
    }
}

if (-not $PackageFiles -or $PackageFiles.Count -eq 0) {
    Write-Host "[ERROR] No package (.txt / .b64) files found to apply." -ForegroundColor Red
    Write-Host "Usage: apply-share.ps1 <path-to-package.txt>" -ForegroundColor Yellow
    exit 1
}

function Apply-SinglePackage {
    param (
        [string]$PackagePath
    )

    if (-not (Test-Path $PackagePath)) {
        Write-Host "[ERROR] Package file not found: $PackagePath" -ForegroundColor Red
        return
    }

    $fileName = Split-Path $PackagePath -Leaf
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "Processing Package: $fileName" -ForegroundColor White

    # Determine if this is Backend (app) or Frontend (src)
    $isBE = $fileName -match "_BE_" -or $fileName -match "(^|_)BE(_|$)" -or $fileName -match "backend" -or $fileName -match "app"
    $isFE = $fileName -match "_FE_" -or $fileName -match "(^|_)FE(_|$)" -or $fileName -match "frontend" -or $fileName -match "src"

    if (-not $isBE -and -not $isFE) {
        # Prompt or detect based on content
        Write-Host "[?] Could not auto-determine target (BE or FE) from filename '$fileName'." -ForegroundColor Yellow
        $choice = Read-Host "Is this package for (1) Backend [app] or (2) Frontend [src]? (Enter 1 or 2)"
        if ($choice -eq "1") { $isBE = $true } else { $isFE = $true }
    }

    $targetDir = if ($isBE) { $BackendAppDir } else { $FrontendSrcDir }
    $targetName = if ($isBE) { "backend\app" } else { "frontend\src" }
    $backupPrefix = if ($isBE) { "backup_backend_app" } else { "backup_frontend_src" }

    Write-Host "Target Directory: $targetName" -ForegroundColor Cyan

    # --- Step 1: Backup existing folder to old-version ---
    if (Test-Path $targetDir) {
        $backupZip = Join-Path $OldVersionDir "${backupPrefix}_${Timestamp}.zip"
        Write-Host "[1/4] Creating safety backup in old-version\ -> $(Split-Path $backupZip -Leaf) ..." -ForegroundColor Green
        Compress-Archive -Path "$targetDir\*" -DestinationPath "$backupZip" -Force
    } else {
        Write-Host "[1/4] Target directory does not exist yet; skipping backup." -ForegroundColor Gray
    }

    # --- Step 2: Convert .txt to .b64 ---
    $tempWorkDir = Join-Path ([System.IO.Path]::GetTempPath()) ("apply_share_" + [System.Guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $tempWorkDir -Force | Out-Null

    $b64File = Join-Path $tempWorkDir "encoded.b64"
    $decodedZip = Join-Path $tempWorkDir "decoded.zip"

    Write-Host "[2/4] Preparing Base64 input for decode ..." -ForegroundColor Green
    Copy-Item -Path $PackagePath -Destination $b64File -Force

    # --- Step 3: certUtil -decode to zip ---
    Write-Host "[3/4] Decoding with certutil to zip archive ..." -ForegroundColor Green
    & certutil -decode "$b64File" "$decodedZip" | Out-Null

    if (-not (Test-Path $decodedZip)) {
        Write-Host "[ERROR] Failed to decode zip from $PackagePath" -ForegroundColor Red
        Remove-Item $tempWorkDir -Recurse -Force
        return
    }

    # --- Step 4: Extract and safely replace target directory ---
    Write-Host "[4/4] Replacing $targetName with decoded files ..." -ForegroundColor Green

    $extractTemp = Join-Path $tempWorkDir "extracted"
    New-Item -ItemType Directory -Path $extractTemp -Force | Out-Null
    Expand-Archive -Path "$decodedZip" -DestinationPath "$extractTemp" -Force

    # Ensure target directory exists
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    } else {
        # Clean current target files safely (avoid deleting root if locked)
        Get-ChildItem -Path $targetDir | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }

    # Copy extracted files to target directory using robocopy for Windows file lock handling
    $roboExit = 0
    try {
        & robocopy "$extractTemp" "$targetDir" /E /NFL /NDL /NJH /NJS /nc /ns /np /R:2 /W:1 | Out-Null
        $roboExit = $LASTEXITCODE
    } catch {
        # Fallback to Copy-Item
        Copy-Item -Path "$extractTemp\*" -Destination "$targetDir" -Recurse -Force -ErrorAction SilentlyContinue
    }

    # Robocopy exit codes 0-7 indicate success (files copied / no changes / extra files)
    if ($roboExit -le 7) {
        Write-Host "[SUCCESS] Updated $targetName successfully!" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Some files in $targetName may be locked by a running dev server or IDE." -ForegroundColor Yellow
    }

    # Cleanup temp folder
    Remove-Item -Path $tempWorkDir -Recurse -Force -ErrorAction SilentlyContinue
}

foreach ($pkg in $PackageFiles) {
    Apply-SinglePackage -PackagePath $pkg
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   APPLY-SHARE COMPLETED SUCCESSFULLY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
