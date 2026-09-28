@echo off
setlocal enabledelayedexpansion
title Universal Backend Server (100% Pure CMD)

:: ============================================================
:: Universal Start-Backend.bat (100% Pure CMD / Batch)
:: Generic Backend launcher for FastAPI, Flask, Django, Node, Go, Java.
:: Location: scripts/run/
:: ============================================================

set "ENV_MODE=%~1"
if "%ENV_MODE%"=="" set "ENV_MODE=DEV"

:: ── Resolve project root dynamically ─────────────────────────
pushd "%~dp0..\.."
set "PROJECT_ROOT=%CD%"
popd

for %%I in ("%PROJECT_ROOT%") do set "PROJECT_NAME=%%~nxI"

:: Auto-detect Backend directory
set "BACKEND_DIR="
if exist "%PROJECT_ROOT%\backend" (
    set "BACKEND_DIR=%PROJECT_ROOT%\backend"
) else if exist "%PROJECT_ROOT%\server" (
    set "BACKEND_DIR=%PROJECT_ROOT%\server"
) else if exist "%PROJECT_ROOT%\api" (
    set "BACKEND_DIR=%PROJECT_ROOT%\api"
) else if exist "%PROJECT_ROOT%\app" (
    set "BACKEND_DIR=%PROJECT_ROOT%"
) else (
    set "BACKEND_DIR=%PROJECT_ROOT%"
)

title %PROJECT_NAME% -- Backend [%ENV_MODE%]
set "API_ENV=%ENV_MODE%"

cls
echo.
echo  +=========================================================+
echo  ^|   %PROJECT_NAME%  --  BACKEND SERVICE
echo  ^|   ENV      :  %ENV_MODE%
echo  ^|   DIR      :  %BACKEND_DIR%
echo  +=========================================================+
echo.

:: ── Prepare Environment File ──────────────────────────────────
if /i "%ENV_MODE%"=="PROD" (
    set "ENV_FILE=.env.prod"
    set "ENV_EXAMPLE=.env.prod.example"
) else (
    set "ENV_FILE=.env.dev"
    set "ENV_EXAMPLE=.env.dev.example"
)

if not exist "%BACKEND_DIR%\%ENV_FILE%" (
    if exist "%BACKEND_DIR%\%ENV_EXAMPLE%" (
        echo  [>] Auto-copying %ENV_EXAMPLE% to %ENV_FILE% ...
        copy "%BACKEND_DIR%\%ENV_EXAMPLE%" "%BACKEND_DIR%\%ENV_FILE%" >nul
    ) else if not exist "%BACKEND_DIR%\.env" (
        if exist "%BACKEND_DIR%\.env.example" (
            echo  [>] Auto-copying .env.example to .env ...
            copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
        )
    )
)

cd /d "%BACKEND_DIR%"

:: ── Detect Python virtual environment or system Python ────────
set "PYTHON_EXE=python"
set "UVICORN_EXE=uvicorn"

if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
    set "UVICORN_EXE=.venv\Scripts\uvicorn.exe"
) else if exist "venv\Scripts\python.exe" (
    set "PYTHON_EXE=venv\Scripts\python.exe"
    set "UVICORN_EXE=venv\Scripts\uvicorn.exe"
) else if exist "%PROJECT_ROOT%\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%PROJECT_ROOT%\.venv\Scripts\python.exe"
    set "UVICORN_EXE=%PROJECT_ROOT%\.venv\Scripts\uvicorn.exe"
)

:: Auto-detect port (Default 9003 or 8000)
set "PORT=9003"
if exist ".env" findstr /i "PORT=" .env > %TEMP%\_port_detect.tmp 2>nul
if exist ".env.dev" findstr /i "PORT=" .env.dev >> %TEMP%\_port_detect.tmp 2>nul
if exist ".env.prod" findstr /i "PORT=" .env.prod >> %TEMP%\_port_detect.tmp 2>nul

if exist "%TEMP%\_port_detect.tmp" (
    for /f "tokens=2 delims==" %%P in (%TEMP%\_port_detect.tmp) do (
        set "DETECTED_PORT=%%P"
        set "DETECTED_PORT=!DETECTED_PORT: =!"
        if not "!DETECTED_PORT!"=="" set "PORT=!DETECTED_PORT!"
    )
    del /f /q "%TEMP%\_port_detect.tmp" >nul 2>&1
)

echo  Starting backend service on port %PORT%...
echo  Local URL: http://localhost:%PORT%
echo  ---------------------------------------------------------
echo.

:: Detect Framework & Entry Point
if exist "app\main.py" (
    if /i "%ENV_MODE%"=="DEV" (
        "%PYTHON_EXE%" -m uvicorn app.main:app --reload --port %PORT% --log-level info
    ) else (
        "%PYTHON_EXE%" -m uvicorn app.main:app --port %PORT% --log-level info
    )
) else if exist "main.py" (
    if /i "%ENV_MODE%"=="DEV" (
        "%PYTHON_EXE%" -m uvicorn main:app --reload --port %PORT% --log-level info
    ) else (
        "%PYTHON_EXE%" -m uvicorn main:app --port %PORT% --log-level info
    )
) else if exist "manage.py" (
    "%PYTHON_EXE%" manage.py runserver 0.0.0.0:%PORT%
) else if exist "package.json" (
    npm run dev
) else if exist "pom.xml" (
    mvn spring-boot:run
) else if exist "main.go" (
    go run main.go
) else (
    echo [ERROR] No recognized backend entry point found (checked FastAPI, Django, Node, Spring, Go).
)

echo.
echo  [!] Backend service stopped.
pause
