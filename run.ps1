# ============================================================================
#  PAPG - Payment Aggregator Portal PowerShell Launcher
#  Usage: .\run.ps1
# ============================================================================

$ProjectRoot = $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

Write-Host ""
Write-Host " +====================================================================+" -ForegroundColor Cyan
Write-Host " |   CENTRAL BANK OF INDIA - PAYMENT AGGREGATOR PORTAL (PAPG)          |" -ForegroundColor Cyan
Write-Host " |   Backend  : http://localhost:8000 (API Docs: /docs)               |" -ForegroundColor Cyan
Write-Host " |   Frontend : http://localhost:5173                                 |" -ForegroundColor Cyan
Write-Host " +====================================================================+" -ForegroundColor Cyan
Write-Host ""

# 1. Kill any existing processes on ports 8000 and 5173
Write-Host " [1/3] Clearing stale processes on ports 8000 and 5173..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 8000,5173 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

# 2. Start Backend Process
Write-Host " [2/3] Starting Backend Server (FastAPI :8000)..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k cd /d `"$BackendDir`" && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --log-level info"

Start-Sleep -Seconds 1

# 3. Start Frontend Process
Write-Host " [3/3] Starting Frontend Server (Vite :5173)..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k cd /d `"$FrontendDir`" && npm run dev"

Write-Host ""
Write-Host " ======================================================================" -ForegroundColor Yellow
Write-Host "  Both servers launched in separate windows!" -ForegroundColor Yellow
Write-Host "  Frontend : http://localhost:5173" -ForegroundColor White
Write-Host "  Backend  : http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs : http://localhost:8000/docs" -ForegroundColor White
Write-Host " ======================================================================" -ForegroundColor Yellow
Write-Host ""
