@echo off
setlocal enabledelayedexpansion
title Universal Pack-Share (Pure CMD)

:: ==============================================================================
:: Universal Pack-Share.bat (100% Pure CMD / Batch — Zero PowerShell)
:: Generic full module packaging script for ANY project.
:: - Compresses & Base64 encodes entire backend app and frontend src folders.
:: - Generates two packages in share-packages\:
::     {PROJECT_NAME}_BE_{TIMESTAMP}.txt
::     {PROJECT_NAME}_FE_{TIMESTAMP}.txt
:: - Validates that each package is < 8.5 MB [8,912,896 bytes].
:: Location: scripts/share/
:: ==============================================================================

:: 1. Resolve Project Root Dynamically (parent of scripts/)
pushd "%~dp0..\.."
set "PROJECT_ROOT=%CD%"
popd

:: Extract Project Name from Directory Name (replace spaces with underscores)
for %%I in ("%PROJECT_ROOT%") do set "PROJECT_NAME=%%~nxI"
set "PROJECT_NAME=%PROJECT_NAME: =_%"

:: 2. Auto-Detect Backend Directory (app folder priority)
set "BACKEND_DIR="
set "BE_LABEL="
if exist "%PROJECT_ROOT%\backend\app" (
    set "BACKEND_DIR=%PROJECT_ROOT%\backend\app"
    set "BE_LABEL=backend\app"
) else if exist "%PROJECT_ROOT%\server\app" (
    set "BACKEND_DIR=%PROJECT_ROOT%\server\app"
    set "BE_LABEL=server\app"
) else if exist "%PROJECT_ROOT%\app" (
    set "BACKEND_DIR=%PROJECT_ROOT%\app"
    set "BE_LABEL=app"
) else if exist "%PROJECT_ROOT%\backend" (
    set "BACKEND_DIR=%PROJECT_ROOT%\backend"
    set "BE_LABEL=backend"
) else if exist "%PROJECT_ROOT%\server" (
    set "BACKEND_DIR=%PROJECT_ROOT%\server"
    set "BE_LABEL=server"
)

:: 3. Auto-Detect Frontend Directory (src folder priority)
set "FRONTEND_DIR="
set "FE_LABEL="
if exist "%PROJECT_ROOT%\frontend\src" (
    set "FRONTEND_DIR=%PROJECT_ROOT%\frontend\src"
    set "FE_LABEL=frontend\src"
) else if exist "%PROJECT_ROOT%\client\src" (
    set "FRONTEND_DIR=%PROJECT_ROOT%\client\src"
    set "FE_LABEL=client\src"
) else if exist "%PROJECT_ROOT%\src" (
    set "FRONTEND_DIR=%PROJECT_ROOT%\src"
    set "FE_LABEL=src"
) else if exist "%PROJECT_ROOT%\frontend" (
    set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"
    set "FE_LABEL=frontend"
) else if exist "%PROJECT_ROOT%\client" (
    set "FRONTEND_DIR=%PROJECT_ROOT%\client"
    set "FE_LABEL=client"
)

:: 4. Output Packages Directory
set "SHARE_DIR=%PROJECT_ROOT%\share-packages"
if not exist "%SHARE_DIR%" (
    mkdir "%SHARE_DIR%" >nul 2>&1
)

:: 5. Generate Timestamp in YYYYMMDD_HHMMSS format (Pure CMD)
set "TIMESTAMP="
set "DT="
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul ^| find "="') do set "DT=%%I"
if not "%DT%"=="" set "TIMESTAMP=%DT:~0,8%_%DT:~8,6%"

if "%TIMESTAMP%"=="" (
    set "CUR_DATE=%DATE%"
    set "CUR_TIME=%TIME: =0%"
    set "TIMESTAMP=%CUR_DATE:~6,4%%CUR_DATE:~3,2%%CUR_DATE:~0,2%_%CUR_TIME:~0,2%%CUR_TIME:~3,2%%CUR_TIME:~6,2%"
)

set "MAX_BYTES=8912896"

echo ============================================================
echo    UNIVERSAL PACK-SHARE (100%% PURE CMD)
echo ============================================================
echo Project Name : %PROJECT_NAME%
echo Project Root : %PROJECT_ROOT%
echo Output Dir   : %SHARE_DIR%
echo Timestamp    : %TIMESTAMP%
echo Size Limit   : 8.5 MB [8,912,896 bytes] per package
echo ============================================================
echo.

if not defined BACKEND_DIR (
    echo [WARNING] No backend folder found
) else (
    echo [OK] Backend Target  : %BE_LABEL% - %BACKEND_DIR%
)

if not defined FRONTEND_DIR (
    echo [WARNING] No frontend folder found
) else (
    echo [OK] Frontend Target : %FE_LABEL% - %FRONTEND_DIR%
)
echo.

:: 6. Process Packages
if defined BACKEND_DIR call :ProcessPackageBE
if defined FRONTEND_DIR call :ProcessPackageFE
goto Summary

:ProcessPackageBE
set "BE_ZIP=%SHARE_DIR%\temp_be_%TIMESTAMP%.zip"
set "BE_B64=%SHARE_DIR%\%PROJECT_NAME%_BE_%TIMESTAMP%.b64"
set "BE_TXT=%PROJECT_NAME%_BE_%TIMESTAMP%.txt"
set "BE_FINAL=%SHARE_DIR%\%BE_TXT%"

echo [1/4] Compressing entire %BE_LABEL% with tar.exe ...
if exist "%BE_ZIP%" del /f /q "%BE_ZIP%" >nul 2>&1
tar.exe -a -c -f "%BE_ZIP%" -C "%BACKEND_DIR%" . >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to compress backend.
    goto :eof
)

echo [2/4] Base64 encoding Backend with certutil.exe ...
if exist "%BE_B64%" del /f /q "%BE_B64%" >nul 2>&1
certutil.exe -encode "%BE_ZIP%" "%BE_B64%" >nul 2>&1
if exist "%BE_FINAL%" del /f /q "%BE_FINAL%" >nul 2>&1
ren "%BE_B64%" "%BE_TXT%"
if exist "%BE_ZIP%" del /f /q "%BE_ZIP%" >nul 2>&1
goto :eof

:ProcessPackageFE
set "FE_ZIP=%SHARE_DIR%\temp_fe_%TIMESTAMP%.zip"
set "FE_B64=%SHARE_DIR%\%PROJECT_NAME%_FE_%TIMESTAMP%.b64"
set "FE_TXT=%PROJECT_NAME%_FE_%TIMESTAMP%.txt"
set "FE_FINAL=%SHARE_DIR%\%FE_TXT%"

echo.
echo [3/4] Compressing entire %FE_LABEL% with tar.exe ...
if exist "%FE_ZIP%" del /f /q "%FE_ZIP%" >nul 2>&1
tar.exe -a -c -f "%FE_ZIP%" -C "%FRONTEND_DIR%" . >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to compress frontend.
    goto :eof
)

echo [4/4] Base64 encoding Frontend with certutil.exe ...
if exist "%FE_B64%" del /f /q "%FE_B64%" >nul 2>&1
certutil.exe -encode "%FE_ZIP%" "%FE_B64%" >nul 2>&1
if exist "%FE_FINAL%" del /f /q "%FE_FINAL%" >nul 2>&1
ren "%FE_B64%" "%FE_TXT%"
if exist "%FE_ZIP%" del /f /q "%FE_ZIP%" >nul 2>&1
goto :eof

:Summary
echo.
echo ============================================================
echo    PACKAGE CREATION SUMMARY (PURE CMD)
echo ============================================================

if defined BE_FINAL if exist "%BE_FINAL%" (
    for %%A in ("%BE_FINAL%") do set "BE_BYTES=%%~zA"
    set /a "BE_KB=!BE_BYTES! / 1024"
    set /a "BE_MB=!BE_BYTES! / 1048576"
    echo Backend  Package : %BE_TXT% [!BE_BYTES! bytes / ~!BE_KB! KB / ~!BE_MB! MB]
    if !BE_BYTES! GTR %MAX_BYTES% (
        echo   [!] WARNING: Backend package exceeds 8.5 MB limit!
    ) else (
        echo   [OK] Within 8.5 MB limit.
    )
)

if defined FE_FINAL if exist "%FE_FINAL%" (
    for %%B in ("%FE_FINAL%") do set "FE_BYTES=%%~zB"
    set /a "FE_KB=!FE_BYTES! / 1024"
    set /a "FE_MB=!FE_BYTES! / 1048576"
    echo Frontend Package : %FE_TXT% [!FE_BYTES! bytes / ~!FE_KB! KB / ~!FE_MB! MB]
    if !FE_BYTES! GTR %MAX_BYTES% (
        echo   [!] WARNING: Frontend package exceeds 8.5 MB limit!
    ) else (
        echo   [OK] Within 8.5 MB limit.
    )
)

echo.
echo Output Directory : %SHARE_DIR%
echo ============================================================
echo.
pause
exit /b 0
