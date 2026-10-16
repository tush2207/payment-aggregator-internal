@echo off
setlocal enabledelayedexpansion
title Universal Frontend Server (100% Pure CMD)

:: ============================================================
:: Universal Start-Frontend.bat (100% Pure CMD / Batch)
:: Generic Frontend launcher for Vite, React, Next.js, Vue, Angular.
:: Location: scripts/run/
:: ============================================================

:: ── Resolve project root dynamically ─────────────────────────
pushd "%~dp0..\.."
set "PROJECT_ROOT=%CD%"
popd

for %%I in ("%PROJECT_ROOT%") do set "PROJECT_NAME=%%~nxI"

:: Auto-detect Frontend directory
set "FRONTEND_DIR="
if exist "%PROJECT_ROOT%\frontend" (
    set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"
) else if exist "%PROJECT_ROOT%\client" (
    set "FRONTEND_DIR=%PROJECT_ROOT%\client"
) else if exist "%PROJECT_ROOT%\web" (
    set "FRONTEND_DIR=%PROJECT_ROOT%\web"
) else if exist "%PROJECT_ROOT%\ui" (
    set "FRONTEND_DIR=%PROJECT_ROOT%\ui"
) else if exist "%PROJECT_ROOT%\package.json" (
    set "FRONTEND_DIR=%PROJECT_ROOT%"
)

title %PROJECT_NAME% -- Frontend

cls
echo.
echo  +=========================================================+
echo  ^|   %PROJECT_NAME%  --  FRONTEND SERVICE
echo  ^|   DIR : %FRONTEND_DIR%
echo  +=========================================================+
echo.

if not defined FRONTEND_DIR (
    echo  [ERROR] Could not find frontend directory with package.json.
    pause
    exit /b 1
)

:: ── Install deps if node_modules missing ─────────────────────
if not exist "%FRONTEND_DIR%\node_modules" (
    echo  [!] node_modules not found. Running npm install...
    echo.
    npm install --prefix "%FRONTEND_DIR%"
    echo.
)

echo  Starting Frontend dev server...
echo  ---------------------------------------------------------
echo.

cd /d "%FRONTEND_DIR%"
npm run dev

echo.
echo  [!] Frontend server stopped.
pause
