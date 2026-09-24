@echo off
setlocal

set "ROOT=%~dp0"

echo ====================================================================
echo Starting Central Bank of India - Payment Aggregator Portal (PAPG)
echo ====================================================================

:: 1. Clear any zombie processes holding the ports
echo [1/4] Clearing stale processes on ports 8000, 5173, and 5174...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 "') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5174 "') do taskkill /F /PID %%a >nul 2>&1

:: 2. Launch Backend Server
echo [2/4] Launching Backend on http://localhost:8000 ...
start "PAPG Backend (FastAPI :8000)" /D "%ROOT%backend" cmd /k "python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --log-level info"

timeout /t 1 /nobreak >nul

:: 3. Launch Admin Frontend Server
echo [3/4] Launching Admin Portal on http://localhost:5173 ...
start "PAPG Admin Portal (Vite :5173)" /D "%ROOT%frontend" cmd /k "npm run dev"

timeout /t 1 /nobreak >nul

:: 4. Launch Aggregator Portal Server
echo [4/4] Launching Aggregator Portal on http://localhost:5174 ...
start "PAPG Aggregator Portal (Vite :5174)" /D "%ROOT%aggregator-portal" cmd /k "npm run dev"

echo ====================================================================
echo All servers started!
echo Admin Portal      : http://localhost:5173
echo Aggregator Portal : http://localhost:5174
echo Backend API       : http://localhost:8000
echo API Docs          : http://localhost:8000/docs
echo ====================================================================
