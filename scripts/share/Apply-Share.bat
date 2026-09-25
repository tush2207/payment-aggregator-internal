@echo off
setlocal enabledelayedexpansion

:: ==============================================================================
:: Apply-Share.bat - Decode, Backup & Safely Replace Backend (app) and Frontend (src)
:: Location: scripts/share/
:: ==============================================================================

pushd "%~dp0..\.."
set "PROJECT_ROOT=%CD%"
popd

set "PS_SCRIPT=%PROJECT_ROOT%\scripts\share\apply-share.ps1"

if not exist "%PS_SCRIPT%" (
    echo [ERROR] PowerShell script not found: %PS_SCRIPT%
    pause
    exit /b 1
)

:: Pass any arguments (or drag-and-dropped files) to the PowerShell script
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -PackageFiles %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Apply-Share failed with error code %ERRORLEVEL%.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Operation completed successfully.
pause
