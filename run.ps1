# ============================================================================
#  PAPG - Payment Aggregator Portal PowerShell Launcher
#  Usage: .\run.ps1
# ============================================================================

$ProjectRoot = $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$AggregatorPortalDir = Join-Path $ProjectRoot "aggregator-portal"

Write-Host ""
Write-Host " +====================================================================+" -ForegroundColor Cyan
Write-Host " |   CENTRAL BANK OF INDIA - PAYMENT AGGREGATOR & RFQ PORTAL          |" -ForegroundColor Cyan
Write-Host " |   Admin Portal      : http://localhost:5173                        |" -ForegroundColor Cyan
Write-Host " |   Aggregator Portal : http://localhost:5174                        |" -ForegroundColor Cyan
Write-Host " |   Backend API Docs  : http://localhost:8000/docs                   |" -ForegroundColor Cyan
Write-Host " +====================================================================+" -ForegroundColor Cyan
Write-Host ""

# 1. Kill any existing processes on ports 8000, 5173, and 5174
Write-Host " [1/4] Clearing stale processes on ports 8000, 5173, and 5174..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 8000,5173,5174 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

# 2. Start Backend Process
Write-Host " [2/4] Starting Backend Server (FastAPI :8000)..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k cd /d `"$BackendDir`" && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --log-level info"

Start-Sleep -Seconds 1

# 3. Start Admin Frontend Process
Write-Host " [3/4] Starting Admin Portal (Vite :5173)..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k cd /d `"$FrontendDir`" && npm run dev"

Start-Sleep -Seconds 1

# 4. Start Aggregator Frontend Process
Write-Host " [4/4] Starting Aggregator Portal (Vite :5174)..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k cd /d `"$AggregatorPortalDir`" && npm run dev"

Write-Host ""
Write-Host " ======================================================================" -ForegroundColor Yellow
Write-Host "  All servers launched in separate windows!" -ForegroundColor Yellow
Write-Host "  Admin Portal      : http://localhost:5173" -ForegroundColor White
Write-Host "  Aggregator Portal : http://localhost:5174" -ForegroundColor White
Write-Host "  Backend           : http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs          : http://localhost:8000/docs" -ForegroundColor White
Write-Host " ======================================================================" -ForegroundColor Yellow
Write-Host ""
