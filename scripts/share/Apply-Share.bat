@echo off
setlocal enabledelayedexpansion
title Universal Apply-Share (Delta - Pure CMD)

:: ==============================================================================
:: Universal Apply-Share.bat (100% Pure CMD / Batch — Zero External Dependencies)
:: Generic Delta Applier for ANY Project.
:: - Decodes Base64 .txt packages created by Pack-Share.bat.
:: - Creates a targeted backup of ONLY the specific files being overwritten.
:: - Safely updates ONLY the packaged files.
:: - All other files in the project remain completely untouched.
:: Location: scripts/share/
:: ==============================================================================

:: 1. Resolve Project Root Dynamically (parent of scripts/)
pushd "%~dp0..\.."
set "PROJECT_ROOT=%CD%"
popd

for %%I in ("%PROJECT_ROOT%") do set "PROJECT_NAME=%%~nxI"

set "SHARE_DIR=%PROJECT_ROOT%\share-packages"
set "BACKUP_DIR=%PROJECT_ROOT%\backups"

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%" >nul 2>&1

:: Generate Timestamp
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
echo    UNIVERSAL DELTA APPLY-SHARE (100%% PURE CMD)
echo ============================================================
echo Project Name : %PROJECT_NAME%
echo Project Root : %PROJECT_ROOT%
echo Backup Dir   : %BACKUP_DIR%
echo Timestamp    : %TIMESTAMP%
echo ============================================================
echo.

:: 2. Identify Package File
set "PKG_PATH=%~1"

if "%PKG_PATH%"=="" (
    echo [INFO] No file specified. Searching %SHARE_DIR% for latest .txt package...
    if exist "%SHARE_DIR%" (
        pushd "%SHARE_DIR%"
        for /f "delims=" %%F in ('dir /b /a-d /o-d *.txt 2^>nul') do (
            if "!PKG_PATH!"=="" set "PKG_PATH=%SHARE_DIR%\%%F"
        )
        popd
    )
)

if "%PKG_PATH%"=="" (
    echo [-] No package found automatically in share-packages\
    set /p "PKG_PATH=Enter full path to .txt package file (or drag & drop here): "
    set "PKG_PATH=!PKG_PATH:"=!"
)

if not exist "%PKG_PATH%" (
    echo [ERROR] Package file not found: %PKG_PATH%
    pause
    exit /b 1
)

for %%N in ("%PKG_PATH%") do set "PKG_NAME=%%~nxN"
echo [+] Selected Package : %PKG_NAME%
echo.

:: 3. Decode Base64 to ZIP
set "TEMP_DIR=%TEMP%\ApplyShare_%RANDOM%_%RANDOM%"
set "EXTRACT_DIR=%TEMP_DIR%\extracted"
set "TEMP_B64=%TEMP_DIR%\package.b64"
set "TEMP_ZIP=%TEMP_DIR%\decoded.zip"
set "BACKUP_STAGE=%TEMP_DIR%\backup_stage"

mkdir "%TEMP_DIR%" >nul 2>&1
mkdir "%EXTRACT_DIR%" >nul 2>&1
mkdir "%BACKUP_STAGE%" >nul 2>&1

echo [1/4] Preparing and decoding Base64 package (%PKG_NAME%)...
copy /Y "%PKG_PATH%" "%TEMP_B64%" >nul 2>&1

certutil.exe -decode "%TEMP_B64%" "%TEMP_ZIP%" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] certutil failed to decode Base64 package. File may be corrupted.
    goto cleanup
)

if not exist "%TEMP_ZIP%" (
    echo [ERROR] Decoded zip archive was not generated.
    goto cleanup
)

:: 4. Extract package to temp staging
echo [2/4] Extracting package contents with tar.exe...
tar.exe -xf "%TEMP_ZIP%" -C "%EXTRACT_DIR%" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to extract archive with tar.exe.
    goto cleanup
)

:: 5. Targeted Pre-Apply Backup (Backup ONLY the files being overwritten)
echo [3/4] Scanning target project and creating targeted backup...
set "OVERWRITE_COUNT=0"
set "NEW_COUNT=0"
set "TOTAL_TOUCHED=0"

pushd "%EXTRACT_DIR%"
for /f "delims=" %%I in ('dir /b /s /a-d 2^>nul') do (
    set "FULL_EXTRACTED=%%I"
    set "REL_PATH=!FULL_EXTRACTED:%EXTRACT_DIR%\=!"
    set "EXISTING_FILE=%PROJECT_ROOT%\!REL_PATH!"
    set /a TOTAL_TOUCHED+=1

    if exist "!EXISTING_FILE!" (
        set /a OVERWRITE_COUNT+=1
        set "BACKUP_DEST=%BACKUP_STAGE%\!REL_PATH!"
        for %%D in ("!BACKUP_DEST!") do (
            set "TARGET_BDIR=%%~dpD"
            if "!TARGET_BDIR:~-1!"=="\" set "TARGET_BDIR=!TARGET_BDIR:~0,-1!"
            if not exist "!TARGET_BDIR!" mkdir "!TARGET_BDIR!" >nul 2>&1
        )
        copy /Y "!EXISTING_FILE!" "!BACKUP_DEST!" >nul 2>&1
    ) else (
        set /a NEW_COUNT+=1
    )
)
popd

set "BACKUP_ZIP=%BACKUP_DIR%\backup_pre_share_%TIMESTAMP%.zip"

if %OVERWRITE_COUNT% GTR 0 (
    if exist "%BACKUP_ZIP%" del /f /q "%BACKUP_ZIP%" >nul 2>&1
    tar.exe -a -c -f "%BACKUP_ZIP%" -C "%BACKUP_STAGE%" . >nul 2>&1
    if exist "%BACKUP_ZIP%" (
        echo [OK] Targeted backup created: backups\backup_pre_share_%TIMESTAMP%.zip (%OVERWRITE_COUNT% existing files saved)
    )
) else (
    echo [INFO] All incoming files are new; no existing files overwritten.
)

:: 6. Apply only the extracted files into project root
echo [4/4] Applying delta files into project (%PROJECT_ROOT%)...
robocopy "%EXTRACT_DIR%" "%PROJECT_ROOT%" /E /NFL /NDL /NJH /NJS /nc /ns /np /R:2 /W:1 >nul 2>&1

echo.
echo ============================================================
echo    [SUCCESS] APPLY COMPLETE!
echo ============================================================
echo   Package Applied : %PKG_NAME%
echo   Total Files     : %TOTAL_TOUCHED% file(s)
echo   Updated Files   : %OVERWRITE_COUNT% file(s)
echo   New Files Added : %NEW_COUNT% file(s)
echo.
echo   NOTE: All other existing files in your project remain 100%% untouched!
if exist "%BACKUP_ZIP%" (
    echo.
    echo   To rollback these changes:
    echo     tar.exe -xf "backups\backup_pre_share_%TIMESTAMP%.zip" -C "%PROJECT_ROOT%"
)
echo ============================================================
echo.

:cleanup
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%" >nul 2>&1

:end
pause
exit /b 0
