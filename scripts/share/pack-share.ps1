# ==============================================================================
# Pack-Share.ps1 - Package and Encode Backend (app) and Frontend (src)
# ==============================================================================
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\share\pack-share.ps1
# ==============================================================================

param (
    [string]$Format = "zip" # "zip" or "7z"
)

$ErrorActionPreference = "Stop"

# 1. Resolve Project Root Dynamically
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$ProjectName = (Split-Path $ProjectRoot -Leaf).Replace(" ", "_")

# Source directories
$BackendAppDir = Join-Path $ProjectRoot "backend\app"
$FrontendSrcDir = Join-Path $ProjectRoot "frontend\src"

# Output directory for share packages
$ShareDir = Join-Path $ProjectRoot "share-packages"
if (-not (Test-Path $ShareDir)) {
    New-Item -ItemType Directory -Path $ShareDir -Force | Out-Null
}

# Generate Timestamp: YYYYMMDD_HHMMSS
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   PACK-SHARE: ENCODE BACKEND (app) & FRONTEND (src)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Project Name : $ProjectName" -ForegroundColor Yellow
Write-Host "Timestamp    : $Timestamp" -ForegroundColor Yellow
Write-Host "Output Dir   : $ShareDir" -ForegroundColor Yellow
Write-Host ""

# Check existence of source folders
if (-not (Test-Path $BackendAppDir)) {
    Write-Host "[ERROR] Backend app folder not found: $BackendAppDir" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $FrontendSrcDir)) {
    Write-Host "[ERROR] Frontend src folder not found: $FrontendSrcDir" -ForegroundColor Red
    exit 1
}

# Temporary Zip paths
$TempBEArchive = Join-Path $ShareDir "temp_app.$Format"
$TempFEArchive = Join-Path $ShareDir "temp_src.$Format"

# Cleanup any previous temporary files
if (Test-Path $TempBEArchive) { Remove-Item $TempBEArchive -Force }
if (Test-Path $TempFEArchive) { Remove-Item $TempFEArchive -Force }

# Helper to check if 7-Zip is installed
$7zExe = $null
if ($Format -eq "7z") {
    $potential7z = @(
        "C:\Program Files\7-Zip\7z.exe",
        "C:\Program Files (x86)\7-Zip\7z.exe",
        (Get-Command 7z.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)
    )
    foreach ($p in $potential7z) {
        if ($p -and (Test-Path $p)) {
            $7zExe = $p
            break
        }
    }
    if (-not $7zExe) {
        Write-Host "[WARN] 7-Zip executable not found, falling back to zip format." -ForegroundColor Yellow
        $Format = "zip"
        $TempBEArchive = Join-Path $ShareDir "temp_app.zip"
        $TempFEArchive = Join-Path $ShareDir "temp_src.zip"
    }
}

# --- Step 1: Compress backend/app ---
Write-Host "[1/6] Compressing backend/app ..." -ForegroundColor Green
if ($7zExe -and $Format -eq "7z") {
    & $7zExe a -t7z "$TempBEArchive" "$BackendAppDir\*" -mx=9 | Out-Null
} else {
    Compress-Archive -Path "$BackendAppDir\*" -DestinationPath "$TempBEArchive" -Force
}

# --- Step 2: Compress frontend/src ---
Write-Host "[2/6] Compressing frontend/src ..." -ForegroundColor Green
if ($7zExe -and $Format -eq "7z") {
    & $7zExe a -t7z "$TempFEArchive" "$FrontendSrcDir\*" -mx=9 | Out-Null
} else {
    Compress-Archive -Path "$FrontendSrcDir\*" -DestinationPath "$TempFEArchive" -Force
}

# Define final file names
$BENameBase = "${ProjectName}_BE_${Timestamp}"
$FENameBase = "${ProjectName}_FE_${Timestamp}"

$BEB64File = Join-Path $ShareDir "$BENameBase.b64"
$FEB64File = Join-Path $ShareDir "$FENameBase.b64"

$BEFinalTxt = Join-Path $ShareDir "$BENameBase.txt"
$FEFinalTxt = Join-Path $ShareDir "$FENameBase.txt"

# --- Step 3: certUtil -encode BE ---
Write-Host "[3/6] Base64 encoding Backend: $BENameBase.b64 ..." -ForegroundColor Green
& certutil -encode "$TempBEArchive" "$BEB64File" | Out-Null

# --- Step 4: certUtil -encode FE ---
Write-Host "[4/6] Base64 encoding Frontend: $FENameBase.b64 ..." -ForegroundColor Green
& certutil -encode "$TempFEArchive" "$FEB64File" | Out-Null

# --- Step 5: Rename .b64 to .txt ---
Write-Host "[5/6] Renaming .b64 to .txt ..." -ForegroundColor Green
if (Test-Path $BEFinalTxt) { Remove-Item $BEFinalTxt -Force }
if (Test-Path $FEFinalTxt) { Remove-Item $FEFinalTxt -Force }

Rename-Item -Path "$BEB64File" -NewName "$BENameBase.txt" -Force
Rename-Item -Path "$FEB64File" -NewName "$FENameBase.txt" -Force

# --- Step 6: Cleanup intermediate archives ---
Write-Host "[6/6] Cleaning up intermediate archive files ..." -ForegroundColor Green
if (Test-Path $TempBEArchive) { Remove-Item $TempBEArchive -Force }
if (Test-Path $TempFEArchive) { Remove-Item $TempFEArchive -Force }

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   PACKAGES CREATED SUCCESSFULLY IN share-packages\" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Backend  Package  : $BENameBase.txt" -ForegroundColor White
Write-Host "Frontend Package  : $FENameBase.txt" -ForegroundColor White
Write-Host "Location          : $ShareDir" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
