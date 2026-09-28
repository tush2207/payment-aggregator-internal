@echo off
setlocal EnableDelayedExpansion
title Apply Changes Utility (100% Pure CMD)

echo ===========================================
echo   APPLY CHANGES UTILITY (BASE64 - PURE CMD)
echo ===========================================

rem ---------------------------------------------------------------
rem 0. Parse arguments
rem      -InputFile "path\to\change_....txt"
rem      -TargetDir "path"           (defaults to repo root)
rem      -Force                      skip all prompts
rem ---------------------------------------------------------------
set "INPUTFILE="
set "TARGETDIR="
set "FORCEFLAG=0"

:parseargs
if "%~1"=="" goto argsdone
if /I "%~1"=="-Force" (
    set "FORCEFLAG=1"
    shift
    goto parseargs
)
if /I "%~1"=="-InputFile" (
    set "INPUTFILE=%~2"
    shift
    shift
    goto parseargs
)
if /I "%~1"=="-TargetDir" (
    set "TARGETDIR=%~2"
    shift
    shift
    goto parseargs
)
shift
goto parseargs

:argsdone

rem ---------------------------------------------------------------
rem 1. Find Git repository root (walk up from current directory)
rem ---------------------------------------------------------------
set "REPO_ROOT="
set "CUR=%CD%"

:findroot
if exist "%CUR%\.git" (
    set "REPO_ROOT=%CUR%"
    goto rootfound
)
for %%I in ("%CUR%\..") do set "PARENT=%%~fI"
if /I "%PARENT%"=="%CUR%" goto rootnotfound
set "CUR=%PARENT%"
goto findroot

:rootnotfound
pushd "%~dp0..\.."
set "REPO_ROOT=%CD%"
popd
goto rootdone

:rootfound
:rootdone
if "%REPO_ROOT:~-1%"=="\" set "REPO_ROOT=%REPO_ROOT:~0,-1%"
echo [+] Repo root : %REPO_ROOT%

rem ---------------------------------------------------------------
rem 2. Auto-pick latest change file (.txt or .b64) from scripts\changes\ if none given
rem ---------------------------------------------------------------
set "CHANGESDIR=%REPO_ROOT%\scripts\changes"

if "%INPUTFILE%"=="" (
    if exist "%CHANGESDIR%" (
        pushd "%CHANGESDIR%"
        for /f "delims=" %%F in ('dir /b /a-d /o-d change_*.txt 2^>nul') do (
            if "!INPUTFILE!"=="" (
                set "INPUTFILE=%CHANGESDIR%\%%F"
                echo [+] Auto-selected: %%F
            )
        )
        popd
    )
)

if "%INPUTFILE%"=="" (
    echo [-] No change file found in scripts\changes\ and none specified with -InputFile.
    echo     Run Pack-Changes.bat first to create one.
    goto end
)

if not exist "%INPUTFILE%" (
    echo [-] Input file does not exist: %INPUTFILE%
    goto end
)

rem ---------------------------------------------------------------
rem 3. Target dir and Backup folder
rem ---------------------------------------------------------------
set "BACKUPDIR=%REPO_ROOT%\scripts\changes\backups"
if not exist "%BACKUPDIR%" mkdir "%BACKUPDIR%"

if "%TARGETDIR%"=="" set "TARGETDIR=%REPO_ROOT%"
if not exist "%TARGETDIR%" (
    echo [-] Target directory does not exist: %TARGETDIR%
    goto end
)
for %%D in ("%TARGETDIR%") do set "DESTDIR=%%~fD"
if "%DESTDIR:~-1%"=="\" set "DESTDIR=%DESTDIR:~0,-1%"
echo [+] Applying to  : %DESTDIR%
echo [+] Backup folder: scripts\changes\backups\

rem ---------------------------------------------------------------
rem 4. Convert extension .txt -> .b64 and Decode Base64 -> ZIP
rem ---------------------------------------------------------------
set "TEMP_DIR=%TEMP%\ApplyChanges_%RANDOM%_%RANDOM%"
set "TEMP_B64=%TEMP_DIR%\package.b64"
set "TEMPZIP=%TEMP_DIR%\decoded.zip"
set "EXTRACTDIR=%TEMP_DIR%\extracted"
set "BACKUP_STAGE=%TEMP_DIR%\backup_stage"

mkdir "%TEMP_DIR%" >nul 2>&1
mkdir "%EXTRACTDIR%" >nul 2>&1
mkdir "%BACKUP_STAGE%" >nul 2>&1

echo [+] Step 1: Preparing Base64 file...
copy /Y "%INPUTFILE%" "%TEMP_B64%" >nul
if not exist "%TEMP_B64%" (
    echo [-] Error: Failed to prepare temporary .b64 file from %INPUTFILE%.
    goto end
)

for %%N in ("%INPUTFILE%") do set "INPUT_NAME=%%~nxN"
echo [+] Step 2: Decoding Base64 (%INPUT_NAME%) to ZIP using certutil -decode...
certutil.exe -decode "%TEMP_B64%" "%TEMPZIP%" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [-] Error: certutil decoding failed on %INPUTFILE%.
    goto cleanup
)
if not exist "%TEMPZIP%" (
    echo [-] Error: Decoded ZIP file was not created by certutil.
    goto cleanup
)

rem ---------------------------------------------------------------
rem 5. Extract to temp staging folder with native tar.exe
rem ---------------------------------------------------------------
echo [+] Step 3: Extracting decoded archive with tar.exe...
tar.exe -xf "%TEMPZIP%" -C "%EXTRACTDIR%"
if %ERRORLEVEL% NEQ 0 (
    echo [-] Error: Failed to extract archive with tar.exe.
    goto cleanup
)

rem ---------------------------------------------------------------
rem 6. Create TARGETED timestamped backup (only files being replaced)
rem ---------------------------------------------------------------
set "TIMESTAMP="
set "DT="
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul ^| find "="') do set "DT=%%I"
if not "%DT%"=="" set "TIMESTAMP=%DT:~0,8%_%DT:~8,6%"

if "%TIMESTAMP%"=="" (
    set "CUR_DATE=%DATE%"
    set "CUR_TIME=%TIME: =0%"
    set "TIMESTAMP=%CUR_DATE:~6,4%%CUR_DATE:~3,2%%CUR_DATE:~0,2%_%CUR_TIME:~0,2%%CUR_TIME:~3,2%%CUR_TIME:~6,2%"
)

set "BACKUPFILENAME=backup_%TIMESTAMP%.zip"
set "BACKUPZIP=%BACKUPDIR%\%BACKUPFILENAME%"

echo [+] Step 4: Creating targeted backup of existing files being overwritten...
set "OVERWRITE_COUNT=0"
set "NEW_COUNT=0"

pushd "%EXTRACTDIR%"
for /f "delims=" %%I in ('dir /b /s /a-d 2^>nul') do (
    set "FULL_EXTRACTED=%%I"
    set "REL_PATH=!FULL_EXTRACTED:%EXTRACTDIR%\=!"
    set "EXISTING_FILE=%DESTDIR%\!REL_PATH!"

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

if %OVERWRITE_COUNT% GTR 0 (
    tar.exe -a -c -f "%BACKUPZIP%" -C "%BACKUP_STAGE%" . >nul 2>&1
    if exist "%BACKUPZIP%" (
        echo [OK] Targeted backup saved: scripts\changes\backups\%BACKUPFILENAME% (%OVERWRITE_COUNT% files saved)
    )
) else (
    echo [INFO] All incoming files are new; no existing files were overwritten.
)

rem ---------------------------------------------------------------
rem 7. Safely copy extracted files into destination with robocopy
rem ---------------------------------------------------------------
echo [+] Step 5: Applying files into project (%DESTDIR%)...
robocopy "%EXTRACTDIR%" "%DESTDIR%" /E /NFL /NDL /NJH /NJS /nc /ns /np /R:2 /W:1 >nul 2>&1

echo.
echo ===========================================
echo   [SUCCESS] Apply complete! (100%% Pure CMD)
echo ===========================================
echo   Updated Files   : %OVERWRITE_COUNT% file(s)
echo   New Files Added : %NEW_COUNT% file(s)
echo   Untouched Files : 100%% safe and unchanged
echo.
if exist "%BACKUPZIP%" (
    echo   Targeted Backup : scripts\changes\backups\%BACKUPFILENAME%
    echo.
    echo   To REVERT this apply, run:
    echo     tar.exe -xf "scripts\changes\backups\%BACKUPFILENAME%" -C "%DESTDIR%"
)
echo.

:cleanup
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%" >nul 2>&1

:end
echo.
if "%FORCEFLAG%"=="0" pause
exit /b 0