@echo off
setlocal enabledelayedexpansion

:: ============================================================
::  Start-Backend.bat  --  DAP Backend (FastAPI / uvicorn)
::  Location: scripts/run/
::  Usage: Start-Backend.bat [DEV|UAT|PROD]   (default: DEV)
:: ============================================================

set "ENV_MODE=%~1"
if "%ENV_MODE%"=="" set "ENV_MODE=DEV"

:: ── Resolve project root (scripts\run\ -> scripts\ -> project root) ───────────
pushd "%~dp0..\.."
set "PROJECT_ROOT=%CD%"
popd

set "BACKEND_DIR=%PROJECT_ROOT%\backend"
title DAP -- Backend [%ENV_MODE%]  FastAPI :8000
set "API_ENV=%ENV_MODE%"

cls
echo.
echo  +=========================================================+
echo  ^|                                                         ^|
echo  ^|   DAP  --  BACKEND  ^|  FastAPI / uvicorn               ^|
echo  ^|   Digital Ambassador Portal                             ^|
echo  ^|                                                         ^|
echo  ^|   URL      :  http://localhost:8000                     ^|
echo  ^|   API Docs :  http://localhost:8000/docs                ^|
echo  ^|   ENV      :  %ENV_MODE%                                    ^|
echo  ^|                                                         ^|
echo  +=========================================================+
echo.

:: ── Determine env file ───────────────────────────────────────────────────────
if /i "%ENV_MODE%"=="PROD" (
    set "ENV_FILE=.env.prod"
    set "ENV_EXAMPLE=.env.prod.example"
) else (
    set "ENV_FILE=.env.dev"
    set "ENV_EXAMPLE=.env.dev.example"
)

:: ── Auto-copy example if real env file is missing ────────────────────────────
if not exist "%BACKEND_DIR%\%ENV_FILE%" (
    echo  [!] %ENV_FILE% not found.
    if exist "%BACKEND_DIR%\%ENV_EXAMPLE%" (
        echo  [>] Auto-copying %ENV_EXAMPLE% to %ENV_FILE% ...
        copy "%BACKEND_DIR%\%ENV_EXAMPLE%" "%BACKEND_DIR%\%ENV_FILE%" >nul
        echo  [OK] Created backend\%ENV_FILE%
        echo.
    ) else if exist "%BACKEND_DIR%\.env" (
        echo  [OK] Using existing backend\.env
    ) else if exist "%BACKEND_DIR%\.env.example" (
        echo  [>] Auto-copying .env.example to .env ...
        copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
        echo  [OK] Created backend\.env
        echo.
    ) else (
        echo  [ERROR] Neither %ENV_FILE% nor .env/.env.example found in backend\
        pause
        exit /b 1
    )
)
echo  [OK] Env file  : backend\%ENV_FILE%
cd /d "%BACKEND_DIR%"
echo  [OK] Directory : %BACKEND_DIR%
echo.
echo  Starting server...
echo  ---------------------------------------------------------
echo.

set "UVICORN=uvicorn"
if exist ".venv\Scripts\uvicorn.exe" set "UVICORN=.venv\Scripts\uvicorn.exe"

if /i "%ENV_MODE%"=="DEV" (
    "%UVICORN%" app.main:app --reload --port 8000 --log-level info
) else (
    "%UVICORN%" app.main:app --port 8000 --log-level info
)

echo.
echo  [!] Backend server stopped.
pause
