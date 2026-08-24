@echo off
setlocal

set "ROOT=%~dp0"

echo ====================================================================
echo Starting Central Bank of India - Payment Aggregator Portal (PAPG)
echo ====================================================================

:: 1. Clear any zombie processes holding the ports
echo [1/3] Clearing stale processes on ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 "') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do taskkill /F /PID %%a >nul 2>&1

:: 2. Launch Backend Server
echo [2/3] Launching Backend on http://localhost:8000 ...
start "PAPG Backend (FastAPI :8000)" /D "%ROOT%backend" cmd /k ".venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --log-level info"

timeout /t 1 /nobreak >nul

:: 3. Launch Frontend Server
echo [3/3] Launching Frontend on http://localhost:5173 ...
start "PAPG Frontend (Vite :5173)" /D "%ROOT%frontend" cmd /k "npm run dev"

echo ====================================================================
echo Both servers started!
echo Frontend : http://localhost:5173
echo Backend  : http://localhost:8000
echo Docs     : http://localhost:8000/docs
echo ====================================================================
