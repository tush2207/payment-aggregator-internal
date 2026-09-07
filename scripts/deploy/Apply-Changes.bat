@echo off
setlocal EnableDelayedExpansion
title Apply Changes Utility - PAPG Portal

echo ===========================================
echo       APPLY CHANGES UTILITY (BASE64)
echo ===========================================

rem ---------------------------------------------------------------
rem 0. Parse arguments
rem      -InputFile "path\to\change_....txt"
rem      -TargetDir "path"           (defaults to repo root)
rem      -Force                       skip all prompts
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
    shift
    goto setinput
)
if /I "%~1"=="-TargetDir" (
    shift
    goto settarget
)
shift
goto parseargs

:setinput
set "INPUTFILE=%~1"
shift
goto parseargs

:settarget
set "TARGETDIR=%~1"
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
set "REPO_ROOT=%CD%"
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
        for /f "delims=" %%F in ('dir /b /o-d change_*.txt changes_*.txt change_*.b64 changes_*.b64 2^>nul') do (
            if "!INPUTFILE!"=="" (
                set "INPUTFILE=%CHANGESDIR%\%%F"
                echo [+] Auto-selected: %%F
            )
        )
        popd
    )
)

if "%INPUTFILE%"=="" (
    echo [-] No change file (.txt or .b64) found in scripts\changes\ and none specified with -InputFile.
    echo     Run Pack-Changes.bat first to create one.
    goto end
)

if not exist "%INPUTFILE%" (
    echo [-] Input file does not exist: %INPUTFILE%
    goto end
)

rem ---------------------------------------------------------------
rem 3. Backup folder + target dir
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
set "TEMP_B64=%TEMP%\ApplyChanges_%RANDOM%.b64"
set "TEMPZIP=%TEMP%\ApplyChanges_%RANDOM%.zip"

if exist "%TEMP_B64%" del /f /q "%TEMP_B64%"
if exist "%TEMPZIP%" del /f /q "%TEMPZIP%"

echo [+] Step 1: Preparing Base64 file...
copy /Y "%INPUTFILE%" "%TEMP_B64%" >nul
if not exist "%TEMP_B64%" (
    echo [-] Error: Failed to prepare temporary .b64 file from %INPUTFILE%.
    goto end
)

for %%N in ("%INPUTFILE%") do echo [+] Step 2: Decoding Base64 (%%~nxN) to ZIP using certutil -decode...
certutil -decode -f "%TEMP_B64%" "%TEMPZIP%" >nul

if not exist "%TEMPZIP%" (
    echo [-] Error: Decoded ZIP file was not created by certutil.
    goto cleanup
)

set "ZIPSIZE=0"
if exist "%TEMPZIP%" for %%Z in ("%TEMPZIP%") do set "ZIPSIZE=%%~zZ"
if "!ZIPSIZE!"=="0" (
    echo [-] Error: Decoded ZIP file is empty (0 bytes).
    echo     Input file: %INPUTFILE%
    goto cleanup
)

rem ---------------------------------------------------------------
rem 5. List ZIP contents, find which files already exist (will be overwritten)
rem ---------------------------------------------------------------
echo [+] Inspecting ZIP contents...
set "ENTRYLIST=%TEMP%\ApplyEntries_%RANDOM%.txt"
powershell -NoProfile -Command "$zip = [System.IO.Compression.ZipFile]::OpenRead('%TEMPZIP%'); $zip.Entries.FullName; $zip.Dispose()" > "%ENTRYLIST%" 2>nul
if not exist "%ENTRYLIST%" (
    tar -tf "%TEMPZIP%" > "%ENTRYLIST%" 2>nul
)

set "OVERWRITECOUNT=0"
set "TOTALCOUNT=0"
for /f "usebackq delims=" %%E in ("%ENTRYLIST%") do (
    set "ENTRY=%%E"
    set "CLEAN=!ENTRY:/=\!"
    if "!CLEAN:~0,2!"==".\" set "CLEAN=!CLEAN:~2!"
    if "!CLEAN!"=="." set "CLEAN="

    if not "!CLEAN!"=="" (
        if not "!CLEAN:~-1!"=="\" (
            set /a TOTALCOUNT+=1
            set "T!TOTALCOUNT!=!CLEAN!"
            if exist "%DESTDIR%\!CLEAN!" (
                set /a OVERWRITECOUNT+=1
                set "O!OVERWRITECOUNT!=!CLEAN!"
            )
        )
    )
)

if "!TOTALCOUNT!"=="0" (
    echo [-] Warning: No files found inside archive to extract.
    goto cleanup
)

rem ---------------------------------------------------------------
rem 6. Backup existing files that will be overwritten
rem ---------------------------------------------------------------
set "BACKUPFILENAME="
if !OVERWRITECOUNT! GTR 0 (
    echo [!] Found !OVERWRITECOUNT! existing file(s) that will be overwritten:
    for /L %%i in (1,1,!OVERWRITECOUNT!) do echo   - !O%%i!
    if "%FORCEFLAG%"=="0" (
        set /p CONFIRM="Proceed with backup and overwrite? (Y/N): "
        if /I not "!CONFIRM!"=="Y" if /I not "!CONFIRM!"=="Yes" (
            echo [-] Cancelled by user.
            goto cleanup
        )
    )
    set "BACKUPSTAGE=%TEMP%\ApplyBackupStaging_%RANDOM%"
    if exist "!BACKUPSTAGE!" rmdir /s /q "!BACKUPSTAGE!"
    mkdir "!BACKUPSTAGE!"
    echo [+] Backing up existing files...
    for /L %%i in (1,1,!OVERWRITECOUNT!) do (
        set "REL=!O%%i!"
        set "SRC=%DESTDIR%\!REL!"
        set "DST=!BACKUPSTAGE!\!REL!"
        for %%D in ("!DST!") do (
            set "TARGET_DIR=%%~dpD"
            if "!TARGET_DIR:~-1!"=="\" set "TARGET_DIR=!TARGET_DIR:~0,-1!"
            if not exist "!TARGET_DIR!" mkdir "!TARGET_DIR!"
        )
        copy /Y "!SRC!" "!DST!" >nul
    )

    set "TIMESTAMP="
    set "DT="
    for /f "tokens=2 delims==" %%T in ('wmic os get localdatetime /value 2^>nul ^| find "="') do set "DT=%%T"
    if not "!DT!"=="" set "TIMESTAMP=!DT:~0,8!_!DT:~8,6!"

    if "!TIMESTAMP!"=="" (
        for /f "usebackq delims=" %%T in (`powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"` 2^>nul) do set "TIMESTAMP=%%T"
    )

    if "!TIMESTAMP!"=="" (
        set "TIMESTAMP=%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
        set "TIMESTAMP=!TIMESTAMP: =0!"
        set "TIMESTAMP=!TIMESTAMP:/=!"
        set "TIMESTAMP=!TIMESTAMP:-=!"
        set "TIMESTAMP=!TIMESTAMP::=!"
        set "TIMESTAMP=!TIMESTAMP:.=!"
    )

    set "BACKUPFILENAME=backup_!TIMESTAMP!.zip"
    set "BACKUPZIP=%BACKUPDIR%\!BACKUPFILENAME!"
    echo [+] Compressing backup...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '!BACKUPSTAGE!\*' -DestinationPath '!BACKUPZIP!' -Force" >nul 2>&1
    if not exist "!BACKUPZIP!" (
        pushd "!BACKUPSTAGE!"
        tar -a -cf "!BACKUPZIP!" * >nul 2>&1
        popd
    )
    if exist "!BACKUPZIP!" (
        echo [OK] Backup saved: scripts\changes\backups\!BACKUPFILENAME!
    )
    if exist "!BACKUPSTAGE!" rmdir /s /q "!BACKUPSTAGE!"
) else (
    echo [+] No existing files will be overwritten (clean install).
    if "%FORCEFLAG%"=="0" (
        set /p CONFIRM="Proceed to extract files? (Y/N): "
        if /I not "!CONFIRM!"=="Y" if /I not "!CONFIRM!"=="Yes" (
            echo [-] Cancelled by user.
            goto cleanup
        )
    )
)

rem ---------------------------------------------------------------
rem 7. Extract into project
rem ---------------------------------------------------------------
echo [+] Extracting files into project...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%TEMPZIP%' -DestinationPath '%DESTDIR%' -Force" >nul 2>&1
if errorlevel 1 (
    pushd "%DESTDIR%"
    tar -xf "%TEMPZIP%" >nul 2>&1
    popd
)

echo.
echo ===========================================
echo   [SUCCESS] Apply complete!
echo ===========================================
echo   Applied : %TOTALCOUNT% file(s)
if defined BACKUPFILENAME if not "!BACKUPFILENAME!"=="" (
    echo   Backup  : scripts\changes\backups\!BACKUPFILENAME!
    echo.
    echo   To REVERT this apply, run:
    echo     powershell Expand-Archive -Path "scripts\changes\backups\!BACKUPFILENAME!" -DestinationPath "%DESTDIR%" -Force
)
echo.
echo   See scripts\README.md for full instructions.

:cleanup
if exist "%TEMP_B64%" del /f /q "%TEMP_B64%"
if exist "%TEMPZIP%" del /f /q "%TEMPZIP%"
if exist "%ENTRYLIST%" del /f /q "%ENTRYLIST%"

:end
echo.
if "%FORCEFLAG%"=="0" pause
