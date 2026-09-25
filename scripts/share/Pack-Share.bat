@echo off
setlocal enabledelayedexpansion

:: ==============================================================================
:: Pack-Share.bat - Package & Encode Backend (app) and Frontend (src)
:: Location: scripts/share/
:: ==============================================================================

pushd "%~dp0..\.."
set "PROJECT_ROOT=%CD%"
popd

set "PS_SCRIPT=%PROJECT_ROOT%\scripts\share\pack-share.ps1"

if not exist "%PS_SCRIPT%" (
    echo [ERROR] PowerShell script not found: %PS_SCRIPT%
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Packaging failed with error code %ERRORLEVEL%.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Operation completed successfully.
pause
