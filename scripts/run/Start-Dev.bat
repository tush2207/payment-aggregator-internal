@echo off
setlocal enabledelayedexpansion
title Universal Dev Launcher (100% Pure CMD)

:: ============================================================
:: Universal Start-Dev.bat (100% Pure CMD / Batch)
:: Generic development launcher for ANY fullstack / multi-service project.
:: Location: scripts/run/
:: ============================================================

set "ENV_MODE=%~1"
if "%ENV_MODE%"=="" set "ENV_MODE=DEV"

:: ── Resolve project root dynamically ─────────────────────────
pushd "%~dp0..\.."
set "PROJECT_ROOT=%CD%"
popd

for %%I in ("%PROJECT_ROOT%") do set "PROJECT_NAME=%%~nxI"
set "RUN_DIR=%PROJECT_ROOT%\scripts\run"

cls
echo.
echo  ============================================================
echo     %PROJECT_NAME%  --  DEV LAUNCHER
echo  ============================================================
echo  Environment  :  %ENV_MODE%
echo  Project Root :  %PROJECT_ROOT%
echo.
echo  Opening application services in dedicated windows.
echo  Press Ctrl+C in any window to stop that service.
echo  ------------------------------------------------------------
echo.

:: ── Launch Backend window ────────────────────────────────────────────────────
if exist "%RUN_DIR%\Start-Backend.bat" (
    echo  [>] Opening Backend window ...
    start "%PROJECT_NAME% -- Backend [%ENV_MODE%]" cmd /k ""%RUN_DIR%\Start-Backend.bat" %ENV_MODE%"
) else (
    echo  [!] Start-Backend.bat not found in %RUN_DIR%
)

timeout /t 1 /nobreak >nul

:: ── Launch Frontend window ───────────────────────────────────────────────────
if exist "%RUN_DIR%\Start-Frontend.bat" (
    echo  [>] Opening Frontend window ...
    start "%PROJECT_NAME% -- Frontend" cmd /k ""%RUN_DIR%\Start-Frontend.bat""
) else (
    echo  [!] Start-Frontend.bat not found in %RUN_DIR%
)

echo.
echo  ============================================================
echo  Services initiated!
echo  ============================================================
echo.
