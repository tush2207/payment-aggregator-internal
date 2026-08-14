@echo off
setlocal enabledelayedexpansion

:: ============================================================
::  Start-Dev.bat  --  Launch BOTH servers (Backend + Frontend)
::  Location: scripts/run/
::
::  Usage:
::    Start-Dev.bat           -- DEV mode (default)
::    Start-Dev.bat UAT       -- UAT mode
::    Start-Dev.bat PROD      -- PROD mode
::
::  See scripts/README.md for full documentation.
:: ============================================================

set "ENV_MODE=%~1"
if "%ENV_MODE%"=="" set "ENV_MODE=DEV"

:: ── Resolve project root (scripts\run\ -> scripts\ -> project root) ───────────
pushd "%~dp0..\.."
set "PROJECT_ROOT=%CD%"
popd

set "RUN_DIR=%PROJECT_ROOT%\scripts\run"

cls
echo.
echo  ============================================================
echo.
echo     DIGITAL AMBASSADOR PORTAL  --  DEV LAUNCHER
echo.
echo  ============================================================
echo.
echo  Environment  :  %ENV_MODE%
echo  Backend      :  http://localhost:8000        (FastAPI)
echo  API Docs     :  http://localhost:8000/docs   (Swagger)
echo  Frontend     :  http://localhost:5174        (Vite/React)
echo.
echo  Two CMD windows will open -- one per server.
echo  Press Ctrl+C in a window to stop that server.
echo  TIP: Use Ctrl+Shift+B in VS Code to run inside the IDE.
echo.
echo  ------------------------------------------------------------
echo.

:: ── Validate env file ────────────────────────────────────────────────────────
if /i "%ENV_MODE%"=="PROD" (
    set "ENV_FILE=.env.prod"
) else (
    set "ENV_FILE=.env.dev"
)

:: Auto-copy example if missing
if not exist "%PROJECT_ROOT%\backend\%ENV_FILE%" (
    if exist "%PROJECT_ROOT%\backend\%ENV_FILE%.example" (
        echo  [!] %ENV_FILE% not found -- auto-copying from example...
        copy "%PROJECT_ROOT%\backend\%ENV_FILE%.example" "%PROJECT_ROOT%\backend\%ENV_FILE%" >nul
        echo  [OK] Created backend\%ENV_FILE%
        echo  IMPORTANT: Fill in real credentials in backend\%ENV_FILE%
        echo.
    ) else if exist "%PROJECT_ROOT%\backend\.env" (
        set "ENV_FILE=.env"
    ) else if exist "%PROJECT_ROOT%\backend\.env.example" (
        echo  [!] .env not found -- auto-copying from .env.example...
        copy "%PROJECT_ROOT%\backend\.env.example" "%PROJECT_ROOT%\backend\.env" >nul
        set "ENV_FILE=.env"
        echo  [OK] Created backend\.env
        echo.
    ) else (
        echo  [ERROR] Missing environment config in backend\
        echo  Create backend\.env or backend\%ENV_FILE%
        pause
        exit /b 1
    )
)
echo  [OK] Env file found: backend\%ENV_FILE%
echo.

:: ── Launch Backend window ────────────────────────────────────────────────────
echo  [>] Opening Backend  window (FastAPI :8000) ...
start "DAP -- Backend [%ENV_MODE%]" "%RUN_DIR%\Start-Backend.bat" %ENV_MODE%

timeout /t 1 /nobreak >nul

:: ── Launch Frontend window ───────────────────────────────────────────────────
echo  [>] Opening Frontend window (Vite   :5174) ...
start "DAP -- Frontend [Vite]" "%RUN_DIR%\Start-Frontend.bat"

echo.
echo  ============================================================
echo  Both servers are starting up!
echo.
echo  Frontend  ->  http://localhost:5174
echo  Backend   ->  http://localhost:8000
echo  API Docs  ->  http://localhost:8000/docs
echo  ============================================================
echo.
