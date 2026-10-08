@echo off
setlocal enabledelayedexpansion
title Universal Apply-Share (Pure CMD)

:: ==============================================================================
:: Universal Apply-Share.bat (100% Pure CMD / Batch — Zero PowerShell)
:: Generic code update script for ANY project.
:: - Decodes Base64 .txt packages, creates automatic backups, and replaces
::   entire backend app and frontend src folders safely.
:: - Location: scripts/share/
:: ==============================================================================

:: 1. Resolve Project Root Dynamically (parent of scripts/)
pushd "%~dp0..\.."
set "PROJECT_ROOT=%CD%"
popd

for %%I in ("%PROJECT_ROOT%") do set "PROJECT_NAME=%%~nxI"

:: Auto-detect targets in project
set "DEFAULT_BE="
set "DEFAULT_BE_LABEL="
if exist "%PROJECT_ROOT%\backend\app" (
    set "DEFAULT_BE=%PROJECT_ROOT%\backend\app"
    set "DEFAULT_BE_LABEL=backend\app"
) else if exist "%PROJECT_ROOT%\server\app" (
    set "DEFAULT_BE=%PROJECT_ROOT%\server\app"
    set "DEFAULT_BE_LABEL=server\app"
) else if exist "%PROJECT_ROOT%\app" (
    set "DEFAULT_BE=%PROJECT_ROOT%\app"
    set "DEFAULT_BE_LABEL=app"
) else if exist "%PROJECT_ROOT%\backend" (
    set "DEFAULT_BE=%PROJECT_ROOT%\backend"
    set "DEFAULT_BE_LABEL=backend"
) else if exist "%PROJECT_ROOT%\server" (
    set "DEFAULT_BE=%PROJECT_ROOT%\server"
    set "DEFAULT_BE_LABEL=server"
)

set "DEFAULT_FE="
set "DEFAULT_FE_LABEL="
if exist "%PROJECT_ROOT%\frontend\src" (
    set "DEFAULT_FE=%PROJECT_ROOT%\frontend\src"
    set "DEFAULT_FE_LABEL=frontend\src"
) else if exist "%PROJECT_ROOT%\client\src" (
    set "DEFAULT_FE=%PROJECT_ROOT%\client\src"
    set "DEFAULT_FE_LABEL=client\src"
) else if exist "%PROJECT_ROOT%\src" (
    set "DEFAULT_FE=%PROJECT_ROOT%\src"
    set "DEFAULT_FE_LABEL=src"
) else if exist "%PROJECT_ROOT%\frontend" (
    set "DEFAULT_FE=%PROJECT_ROOT%\frontend"
    set "DEFAULT_FE_LABEL=frontend"
) else if exist "%PROJECT_ROOT%\client" (
    set "DEFAULT_FE=%PROJECT_ROOT%\client"
    set "DEFAULT_FE_LABEL=client"
)

set "BACKUP_DIR=%PROJECT_ROOT%\backups"
set "SHARE_DIR=%PROJECT_ROOT%\share-packages"

if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%" >nul 2>&1
)

:: Generate Timestamp in YYYYMMDD_HHMMSS format (Pure CMD)
set "TIMESTAMP="
set "DT="
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul ^| find "="') do set "DT=%%I"
if not "%DT%"=="" set "TIMESTAMP=%DT:~0,8%_%DT:~8,6%"

if "%TIMESTAMP%"=="" (
    set "CUR_DATE=%DATE%"
    set "CUR_TIME=%TIME: =0%"
    set "TIMESTAMP=%CUR_DATE:~6,4%%CUR_DATE:~3,2%%CUR_DATE:~0,2%_%CUR_TIME:~0,2%%CUR_TIME:~3,2%%CUR_TIME:~6,2%"
)

echo ============================================================
echo    UNIVERSAL APPLY-SHARE (100%% PURE CMD): DECODE ^& UPDATE
echo ============================================================
echo Project Root : %PROJECT_ROOT%
echo Backup Dir   : %BACKUP_DIR%
echo Timestamp    : %TIMESTAMP%
echo ============================================================
echo.

:: 2. Check Input Files
set "INPUT_FILE=%~1"
if not "%INPUT_FILE%"=="" goto ProcessArguments

:AutoDetectMode
echo [INFO] No package file specified. Checking share-packages\ for latest packages...

set "LATEST_BE="
set "LATEST_FE="

for /f "delims=" %%F in ('dir /b /a-d /o-d "%SHARE_DIR%\*BE*.txt" 2^>nul') do (
    if "!LATEST_BE!"=="" set "LATEST_BE=%SHARE_DIR%\%%F"
)
for /f "delims=" %%F in ('dir /b /a-d /o-d "%SHARE_DIR%\*FE*.txt" 2^>nul') do (
    if "!LATEST_FE!"=="" set "LATEST_FE=%SHARE_DIR%\%%F"
)

if not defined LATEST_BE if not defined LATEST_FE (
    echo [ERROR] No TXT package files found in %SHARE_DIR%.
    echo Usage: Drag and drop a TXT package onto Apply-Share.bat
    echo    or: Apply-Share.bat path\to\package.txt
    pause
    exit /b 1
)

if defined LATEST_BE call :ApplySinglePackage "!LATEST_BE!"
if defined LATEST_FE call :ApplySinglePackage "!LATEST_FE!"
goto Finish

:ProcessArguments
if "%~1"=="" goto Finish
call :ApplySinglePackage "%~1"
shift
goto ProcessArguments

:Finish
echo.
echo ============================================================
echo    APPLY-SHARE COMPLETED SUCCESSFULLY (PURE CMD)
echo ============================================================
echo.
pause
exit /b 0

:: ==============================================================================
:: Subroutine: ApplySinglePackage <FilePath>
:: ==============================================================================
:ApplySinglePackage
set "PKG_PATH=%~1"
if not exist "%PKG_PATH%" (
    echo [ERROR] File not found: %PKG_PATH%
    goto :eof
)

set "PKG_NAME=%~nx1"
echo ------------------------------------------------------------
echo Processing Package : %PKG_NAME%

:: Determine Target (BE or FE)
echo !PKG_NAME! | findstr /i "_BE_ -BE- _be_ -be-" >nul
if !ERRORLEVEL! EQU 0 (
    set "TARGET_DIR=%DEFAULT_BE%"
    set "TARGET_LABEL=%DEFAULT_BE_LABEL%"
    set "BACKUP_ZIP=%BACKUP_DIR%\backup_backend_%TIMESTAMP%.zip"
) else (
    echo !PKG_NAME! | findstr /i "_FE_ -FE- _fe_ -fe-" >nul
    if !ERRORLEVEL! EQU 0 (
        set "TARGET_DIR=%DEFAULT_FE%"
        set "TARGET_LABEL=%DEFAULT_FE_LABEL%"
        set "BACKUP_ZIP=%BACKUP_DIR%\backup_frontend_%TIMESTAMP%.zip"
    ) else (
        echo [?] Could not auto-determine target from filename: !PKG_NAME!
        set /p "CHOICE=Apply to [1] Backend [!DEFAULT_BE_LABEL!] or [2] Frontend [!DEFAULT_FE_LABEL!]? "
        if "!CHOICE!"=="1" (
            set "TARGET_DIR=%DEFAULT_BE%"
            set "TARGET_LABEL=%DEFAULT_BE_LABEL%"
            set "BACKUP_ZIP=%BACKUP_DIR%\backup_backend_%TIMESTAMP%.zip"
        ) else (
            set "TARGET_DIR=%DEFAULT_FE%"
            set "TARGET_LABEL=%DEFAULT_FE_LABEL%"
            set "BACKUP_ZIP=%BACKUP_DIR%\backup_frontend_%TIMESTAMP%.zip"
        )
    )
)

if not defined TARGET_DIR (
    echo [ERROR] Could not determine target directory in project.
    goto :eof
)

echo Target Directory   : %TARGET_LABEL% - %TARGET_DIR%

:: --- Step 1: Backup Existing Folder ---
if exist "%TARGET_DIR%" (
    echo [1/4] Backing up existing %TARGET_LABEL% to backups\ ...
    tar.exe -a -c -f "%BACKUP_ZIP%" -C "%TARGET_DIR%" . >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo       Backup created: %BACKUP_ZIP%
    ) else (
        echo       [WARN] Could not create backup zip.
    )
) else (
    echo [1/4] Target directory does not exist yet. Creating: %TARGET_DIR%
    mkdir "%TARGET_DIR%" >nul 2>&1
)

:: --- Step 2: Prepare temp b64 and zip ---
set "TEMP_DIR=%TEMP%\apply_share_%RANDOM%_%RANDOM%"
mkdir "%TEMP_DIR%" >nul 2>&1

set "TEMP_B64=%TEMP_DIR%\package.b64"
set "TEMP_ZIP=%TEMP_DIR%\decoded.zip"
set "EXTRACT_DIR=%TEMP_DIR%\extracted"
mkdir "%EXTRACT_DIR%" >nul 2>&1

copy /y "%PKG_PATH%" "%TEMP_B64%" >nul

:: --- Step 3: certUtil -decode ---
echo [2/4] Decoding Base64 with certutil.exe ...
certutil.exe -decode "%TEMP_B64%" "%TEMP_ZIP%" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] certutil decoding failed on %PKG_NAME%.
    rd /s /q "%TEMP_DIR%" >nul 2>&1
    goto :eof
)

:: --- Step 4: Extract and safely copy to target ---
echo [3/4] Extracting decoded archive with tar.exe ...
tar.exe -xf "%TEMP_ZIP%" -C "%EXTRACT_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to extract decoded zip archive.
    rd /s /q "%TEMP_DIR%" >nul 2>&1
    goto :eof
)

echo [4/4] Safely copying files into %TARGET_LABEL% ...
robocopy "%EXTRACT_DIR%" "%TARGET_DIR%" /E /NFL /NDL /NJH /NJS /nc /ns /np /R:2 /W:1 >nul 2>&1

:: Clean up temp directory
rd /s /q "%TEMP_DIR%" >nul 2>&1

echo [SUCCESS] Updated %TARGET_LABEL% successfully!
echo ------------------------------------------------------------
goto :eof
