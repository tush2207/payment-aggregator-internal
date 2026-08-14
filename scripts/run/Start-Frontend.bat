@echo off
setlocal enabledelayedexpansion

:: ============================================================
::  Start-Frontend.bat  --  DAP Frontend (Vite / React)
::  Location: scripts/run/
:: ============================================================

:: ── Resolve project root reliably (handles spaces in path) ───────────────────
:: "for %%i" resolves ..\..\  to the actual absolute path -- no pushd/popd needed
for %%i in ("%~dp0..\..") do set "PROJECT_ROOT=%%~fi"
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"

title DAP -- Frontend  Vite :5174

cls
echo.
echo  +=========================================================+
echo  ^|                                                         ^|
echo  ^|   DAP  --  FRONTEND  ^|  React / Vite                   ^|
echo  ^|   Digital Ambassador Portal                             ^|
echo  ^|                                                         ^|
echo  ^|   URL      :  http://localhost:5174                     ^|
echo  ^|   API Proxy:  /api  ->  http://localhost:8000           ^|
echo  ^|   HMR      :  ON  (Vite hot module replacement)         ^|
echo  ^|                                                         ^|
echo  +=========================================================+
echo.

:: ── Validate frontend directory ───────────────────────────────────────────────
if not exist "%FRONTEND_DIR%\package.json" (
    echo  [ERROR] Could not find: %FRONTEND_DIR%\package.json
    echo  Expected frontend at: %FRONTEND_DIR%
    pause
    exit /b 1
)

:: ── Install deps if node_modules missing ─────────────────────────────────────
if not exist "%FRONTEND_DIR%\node_modules" (
    echo  [!] node_modules not found. Running npm install...
    echo.
    npm install --prefix "%FRONTEND_DIR%"
    echo.
)

echo  [OK] Directory : %FRONTEND_DIR%
echo.
echo  Starting Vite dev server...
echo  ---------------------------------------------------------
echo.

:: Use --prefix so npm runs in the frontend dir regardless of current directory
npm run dev --prefix "%FRONTEND_DIR%"

echo.
echo  [!] Frontend server stopped.
pause
