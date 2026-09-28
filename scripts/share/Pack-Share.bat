@echo off
setlocal enabledelayedexpansion
title Universal Pack-Share (Delta - Pure CMD)

:: ==============================================================================
:: Universal Pack-Share.bat (100% Pure CMD / Batch — Zero External Dependencies)
:: Generic Delta Packaging Script for ANY Project.
:: - Packs ONLY changed, modified, or untracked files into a Base64 .txt package.
:: - Enforces maximum file size limit of < 8.5 MB (8,912,896 bytes).
:: - When applied, updates ONLY those specific files without touching the rest.
:: Location: scripts/share/
:: ==============================================================================

:: 1. Resolve Project Root Dynamically (parent of scripts/)
pushd "%~dp0..\.."
set "PROJECT_ROOT=%CD%"
popd

:: Extract Project Name from Directory Name (replace spaces with underscores)
for %%I in ("%PROJECT_ROOT%") do set "PROJECT_NAME=%%~nxI"
set "PROJECT_NAME=%PROJECT_NAME: =_%"

:: 2. Output Packages Directory
set "SHARE_DIR=%PROJECT_ROOT%\share-packages"
if not exist "%SHARE_DIR%" (
    mkdir "%SHARE_DIR%" >nul 2>&1
)

:: 3. Generate Timestamp in YYYYMMDD_HHMMSS format (Pure CMD)
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
echo    UNIVERSAL DELTA PACK-SHARE (100%% PURE CMD)
echo ============================================================
echo Project Name : %PROJECT_NAME%
echo Project Root : %PROJECT_ROOT%
echo Output Dir   : %SHARE_DIR%
echo Timestamp    : %TIMESTAMP%
echo Max Limit    : 8.5 MB [8,912,896 bytes]
echo ============================================================
echo.

:: 4. Collect changed files
set "FILECOUNT=0"
set "INCLUDE_UNTRACKED=1"
set "EXPLICIT_FILES="

:parse_args
if "%~1"=="" goto args_done
if /I "%~1"=="-ExcludeUntracked" (
    set "INCLUDE_UNTRACKED=0"
    shift
    goto parse_args
)
if /I "%~1"=="-Files" (
    set "EXPLICIT_FILES=%~2"
    shift
    shift
    goto parse_args
)
if /I "%~1"=="-All" (
    set "PACK_ALL=1"
    shift
    goto parse_args
)
shift
goto parse_args

:args_done

if not "%EXPLICIT_FILES%"=="" (
    echo [+] Packing manually specified files...
    set "CLEANFILES=%EXPLICIT_FILES:"=%"
    set "CLEANFILES=!CLEANFILES:,= !"
    for %%F in (!CLEANFILES!) do (
        set "RAW=%%~F"
        if not "!RAW!"=="" (
            set "RAW=!RAW:/=\!"
            if not "!RAW:~-1!"=="\" (
                set /a FILECOUNT+=1
                set "F!FILECOUNT!=!RAW!"
            )
        )
    )
    goto prepare_staging
)

:: Check if Git repository
if exist "%PROJECT_ROOT%\.git" (
    echo [+] Detecting changed files via Git [Modified, Added, Untracked]...
    pushd "%PROJECT_ROOT%"
    for /f "usebackq tokens=1* delims= " %%A in (`git status --porcelain 2^>nul`) do (
        set "STAT=%%A"
        set "FPATH=%%B"

        if "!FPATH:~0,1!"==" " set "FPATH=!FPATH:~1!"
        set "FPATH=!FPATH:"=!"

        if not "!STAT!"=="D" if not "!STAT!"=="RD" (
            set "SKIP=0"
            if "!STAT!"=="??" if "%INCLUDE_UNTRACKED%"=="0" set "SKIP=1"

            if "!SKIP!"=="0" (
                if not "!FPATH: -> =!"=="!FPATH!" (
                    for /f "tokens=2 delims=>" %%X in ("!FPATH!") do set "FPATH=%%X"
                    if "!FPATH:~0,1!"==" " set "FPATH=!FPATH:~1!"
                )

                set "FPATH=!FPATH:/=\!"

                echo !FPATH! | findstr /i /b "share-packages\\ old-version\\ backups\\ node_modules\\ .venv\\ .git\\" >nul
                if errorlevel 1 (
                    if not "!FPATH:~-1!"=="\" (
                        set /a FILECOUNT+=1
                        set "F!FILECOUNT!=!FPATH!"
                    )
                )
            )
        )
    )
    popd
)

if "%FILECOUNT%"=="0" (
    echo [-] No uncommitted or modified files detected.
    echo.
    echo Options:
    echo   [1] Enter specific relative file paths manually
    echo   [2] Pack specific folder (e.g. backend\app or frontend\src)
    echo   [3] Cancel
    echo.
    set /p USER_CHOICE="Select an option (1/2/3): "
    if "!USER_CHOICE!"=="1" (
        set /p MANUAL="Enter file paths (comma or space separated): "
        set "CLEANMANUAL=!MANUAL:"=!"
        set "CLEANMANUAL=!CLEANMANUAL:,= !"
        for %%F in (!CLEANMANUAL!) do (
            set "RAW=%%~F"
            if not "!RAW!"=="" (
                set "RAW=!RAW:/=\!"
                if not "!RAW:~-1!"=="\" (
                    set /a FILECOUNT+=1
                    set "F!FILECOUNT!=!RAW!"
                )
            )
        )
    ) else if "!USER_CHOICE!"=="2" (
        set /p TARGET_FOLDER="Enter relative folder path to pack: "
        if not "!TARGET_FOLDER!"=="" (
            pushd "%PROJECT_ROOT%"
            for /f "delims=" %%I in ('dir /b /s /a-d "!TARGET_FOLDER!" 2^>nul') do (
                set "FULL=%%I"
                set "REL=!FULL:%PROJECT_ROOT%\=!"
                set /a FILECOUNT+=1
                set "F!FILECOUNT!=!REL!"
            )
            popd
        )
    ) else (
        echo [INFO] Operation cancelled.
        goto end
    )
)

if "%FILECOUNT%"=="0" (
    echo [ERROR] No files selected for packaging.
    goto end
)

:prepare_staging
echo.
echo ============================================================
echo Files selected for delta packaging (%FILECOUNT% files):
echo ============================================================
set "DISPLAY_LIMIT=30"
for /L %%i in (1,1,%FILECOUNT%) do (
    if %%i LEQ %DISPLAY_LIMIT% (
        echo   [%%i] !F%%i!
    )
)
if %FILECOUNT% GTR %DISPLAY_LIMIT% (
    set /a REMAINING=%FILECOUNT%-%DISPLAY_LIMIT%
    echo   ... and !REMAINING! more files.
)
echo ============================================================
echo.

set "STAGE=%TEMP%\PackShare_%RANDOM%_%RANDOM%"
if exist "%STAGE%" rmdir /s /q "%STAGE%"
mkdir "%STAGE%"

echo [+] Copying %FILECOUNT% files to temporary staging...
set "SUCCESSCOUNT=0"
for /L %%i in (1,1,%FILECOUNT%) do (
    set "FITEM=!F%%i!"
    set "SRC=%PROJECT_ROOT%\!FITEM!"
    set "DEST=%STAGE%\!FITEM!"
    if exist "!SRC!" (
        if not exist "!SRC!\" (
            for %%D in ("!DEST!") do (
                set "TARGET_DIR=%%~dpD"
                if "!TARGET_DIR:~-1!"=="\" set "TARGET_DIR=!TARGET_DIR:~0,-1!"
                if not exist "!TARGET_DIR!" mkdir "!TARGET_DIR!" >nul 2>&1
            )
            copy /Y "!SRC!" "!DEST!" >nul 2>&1
            if not errorlevel 1 (
                set /a SUCCESSCOUNT+=1
            ) else (
                echo   [-] Failed to stage: !FITEM!
            )
        )
    ) else (
        echo   [-] Warning: File not found, skipping: !FITEM!
    )
)

if "%SUCCESSCOUNT%"=="0" (
    echo [ERROR] No files were successfully staged.
    goto cleanup
)

echo [OK] Successfully staged %SUCCESSCOUNT% files.

:: 5. Compress & Base64 Encode
set "BASENAME=%PROJECT_NAME%_share_%TIMESTAMP%"
set "FINAL_ZIP=%SHARE_DIR%\%BASENAME%.zip"
set "FINAL_B64=%SHARE_DIR%\%BASENAME%.b64"
set "FINAL_TXT=%SHARE_DIR%\%BASENAME%.txt"

echo.
echo [+] Compressing delta package with tar.exe ...
if exist "%FINAL_ZIP%" del /f /q "%FINAL_ZIP%" >nul 2>&1
tar.exe -a -c -f "%FINAL_ZIP%" -C "%STAGE%" . >nul 2>&1

if not exist "%FINAL_ZIP%" (
    echo [ERROR] Failed to create ZIP archive with tar.exe.
    goto cleanup
)

echo [+] Encoding to Base64 (.txt) with certutil.exe ...
if exist "%FINAL_B64%" del /f /q "%FINAL_B64%" >nul 2>&1
certutil.exe -encode "%FINAL_ZIP%" "%FINAL_B64%" >nul 2>&1

if exist "%FINAL_TXT%" del /f /q "%FINAL_TXT%" >nul 2>&1
ren "%FINAL_B64%" "%BASENAME%.txt"

:: Clean temporary zip
if exist "%FINAL_ZIP%" del /f /q "%FINAL_ZIP%" >nul 2>&1

:cleanup
if exist "%STAGE%" rmdir /s /q "%STAGE%" >nul 2>&1

:: 6. Validate File Size (< 8.5 MB)
if not exist "%FINAL_TXT%" (
    echo [ERROR] Package generation failed. Output file missing.
    goto end
)

for %%A in ("%FINAL_TXT%") do set "PKG_BYTES=%%~zA"
set /a "PKG_KB=!PKG_BYTES! / 1024"
set /a "PKG_MB=!PKG_BYTES! / 1048576"

echo.
echo ============================================================
echo    DELTA PACKAGE GENERATED SUCCESSFULLY
echo ============================================================
echo   Package File : %BASENAME%.txt
echo   Full Path    : %FINAL_TXT%
echo   Files Packed : %SUCCESSCOUNT% changed file(s)
echo   Size         : !PKG_BYTES! bytes (~!PKG_KB! KB / ~!PKG_MB! MB)
echo   Limit        : 8.5 MB [8,912,896 bytes]
echo ============================================================

if !PKG_BYTES! GTR %MAX_BYTES% (
    echo.
    echo   [!] WARNING: Package size exceeds 8.5 MB limit!
    echo       Size is !PKG_BYTES! bytes - Limit is %MAX_BYTES% bytes.
    echo       Consider packaging fewer files or excluding large binary assets.
) else (
    echo.
    echo   [OK] Package size is well within the 8.5 MB limit.
)

echo.
echo How to Apply on Target Machine:
echo   1. Copy %BASENAME%.txt to target project's share-packages\
echo   2. Run scripts\share\Apply-Share.bat
echo   Note: Only the %SUCCESSCOUNT% changed files will be updated; all other files remain untouched.
echo ============================================================
echo.

:end
pause
exit /b 0
