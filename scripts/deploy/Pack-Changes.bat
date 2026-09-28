@echo off
setlocal EnableDelayedExpansion
title Pack Changes Utility (100% Pure CMD)

echo ===========================================
echo   PACK CHANGES UTILITY (BASE64 - PURE CMD)
echo ===========================================

set "INCLUDEUNTRACKED=1"
set "NONINTERACTIVE=0"
set "EXPLICITFILES="
set "MAX_BYTES=8912896"

:parseargs
if "%~1"=="" goto argsdone
if /I "%~1"=="-IncludeUntracked" (
    set "INCLUDEUNTRACKED=1"
    shift
    goto parseargs
)
if /I "%~1"=="-ExcludeUntracked" (
    set "INCLUDEUNTRACKED=0"
    shift
    goto parseargs
)
if /I "%~1"=="-NonInteractive" (
    set "NONINTERACTIVE=1"
    shift
    goto parseargs
)
if /I "%~1"=="-Files" (
    set "EXPLICITFILES=%~2"
    shift
    shift
    goto parseargs
)
shift
goto parseargs

:argsdone

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
echo [+] Found Git repository root: %REPO_ROOT%

:rootdone
if "%REPO_ROOT:~-1%"=="\" set "REPO_ROOT=%REPO_ROOT:~0,-1%"

set "FILECOUNT=0"

if not "%EXPLICITFILES%"=="" (
    echo [+] Using manually specified files.
    set "CLEANFILES=%EXPLICITFILES:"=%"
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
) else (
    echo [+] Detecting changed files via Git...
    pushd "%REPO_ROOT%"
    for /f "usebackq tokens=1* delims= " %%A in (`git status --porcelain 2^>nul`) do (
        set "STAT=%%A"
        set "FPATH=%%B"

        if "!FPATH:~0,1!"==" " set "FPATH=!FPATH:~1!"
        set "FPATH=!FPATH:"=!"

        if not "!STAT!"=="D" if not "!STAT!"=="RD" (
            set "SKIP=0"
            if "!STAT!"=="??" if "%INCLUDEUNTRACKED%"=="0" set "SKIP=1"

            if "!SKIP!"=="0" (
                if not "!FPATH: -> =!"=="!FPATH!" (
                    for /f "tokens=2 delims=>" %%X in ("!FPATH!") do set "FPATH=%%X"
                    if "!FPATH:~0,1!"==" " set "FPATH=!FPATH:~1!"
                )

                set "FPATH=!FPATH:/=\!"

                echo !FPATH! | findstr /i /b "scripts\\changes\\ share-packages\\ old-version\\ backups\\ node_modules\\ .venv\\ .git\\" >nul
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
    echo [-] No changed files detected.
    if "%NONINTERACTIVE%"=="0" (
        set /p MANUAL="Enter file paths to pack (comma-separated, relative to root) or press Enter to cancel: "
        if not "!MANUAL!"=="" (
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
        )
    )
)

if "%FILECOUNT%"=="0" (
    echo [-] No files selected. Exiting.
    goto end
)

echo.
echo Files to package:
for /L %%i in (1,1,%FILECOUNT%) do echo   - !F%%i!

if "%NONINTERACTIVE%"=="0" (
    set /p CONFIRM="Do you want to package these %FILECOUNT% files? (Y/N): "
    if /I not "!CONFIRM!"=="Y" if /I not "!CONFIRM!"=="Yes" (
        echo [-] Cancelled by user.
        goto end
    )
)

set "STAGE=%TEMP%\PackChanges_%RANDOM%_%RANDOM%"
if exist "%STAGE%" rmdir /s /q "%STAGE%"
mkdir "%STAGE%"

echo.
echo [+] Copying files to temporary staging...
set "SUCCESSCOUNT=0"
for /L %%i in (1,1,%FILECOUNT%) do (
    set "FITEM=!F%%i!"
    set "SRC=%REPO_ROOT%\!FITEM!"
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
                echo   [+] Packed: !FITEM!
            ) else (
                echo   [-] Failed to copy: !FITEM!
            )
        )
    ) else (
        echo   [-] Warning: File not found, skipping: !FITEM!
    )
)

if "%SUCCESSCOUNT%"=="0" (
    echo [-] Error: No files were successfully copied into staging. Exiting.
    goto cleanup
)

set "CHANGESDIR=%REPO_ROOT%\scripts\changes"
if not exist "%CHANGESDIR%" (
    mkdir "%CHANGESDIR%"
    echo [+] Created output folder: scripts\changes\
)

set "TIMESTAMP="
set "DT="
for /f "tokens=2 delims==" %%T in ('wmic os get localdatetime /value 2^>nul ^| find "="') do set "DT=%%T"
if not "%DT%"=="" set "TIMESTAMP=%DT:~0,8%_%DT:~8,6%"

if "%TIMESTAMP%"=="" (
    set "CUR_DATE=%DATE%"
    set "CUR_TIME=%TIME: =0%"
    set "TIMESTAMP=%CUR_DATE:~6,4%%CUR_DATE:~3,2%%CUR_DATE:~0,2%_%CUR_TIME:~0,2%%CUR_TIME:~3,2%%CUR_TIME:~6,2%"
)

set "BASENAME=change_%TIMESTAMP%"
set "FINALZIP=%CHANGESDIR%\%BASENAME%.zip"
set "FINALB64=%CHANGESDIR%\%BASENAME%.b64"
set "FINALTXT=%CHANGESDIR%\%BASENAME%.txt"

echo [+] Creating ZIP archive using native tar.exe...
if exist "%FINALZIP%" del /f /q "%FINALZIP%"

tar.exe -a -c -f "%FINALZIP%" -C "%STAGE%" .

if not exist "%FINALZIP%" (
    echo [-] Failed to create ZIP archive.
    goto cleanup
)

set "ZIPSIZE=0"
if exist "%FINALZIP%" for %%Z in ("%FINALZIP%") do set "ZIPSIZE=%%~zZ"
if "!ZIPSIZE!"=="0" (
    echo [-] Error: Created ZIP archive is empty.
    goto cleanup
)

echo [+] Saved ZIP  -^> scripts\changes\%BASENAME%.zip

echo [+] Converting ZIP to Base64 using certutil -encode...
if exist "%FINALB64%" del /f /q "%FINALB64%"
certutil -encode -f "%FINALZIP%" "%FINALB64%" >nul

if not exist "%FINALB64%" (
    echo [-] Error: certutil -encode failed to generate Base64 file.
    goto cleanup
)

echo [+] Converting extension from .b64 to .txt...
if exist "%FINALTXT%" del /f /q "%FINALTXT%"
ren "%FINALB64%" "%BASENAME%.txt"

:cleanup
if exist "%STAGE%" rmdir /s /q "%STAGE%"

if not exist "%FINALTXT%" (
    echo [-] Failed to generate output text file.
    goto end
)

for %%A in ("%FINALTXT%") do set "PKG_BYTES=%%~zA"
set /a "PKG_KB=!PKG_BYTES! / 1024"
set /a "PKG_MB=!PKG_BYTES! / 1048576"

echo.
echo ===========================================
echo   [SUCCESS] Pack complete - Packed %SUCCESSCOUNT% files.
echo ===========================================
echo   TXT  : scripts\changes\%BASENAME%.txt
echo   ZIP  : scripts\changes\%BASENAME%.zip
echo   Size : !PKG_BYTES! bytes (~!PKG_KB! KB / ~!PKG_MB! MB)
echo   Limit: 8.5 MB [8,912,896 bytes]
echo.

if !PKG_BYTES! GTR %MAX_BYTES% (
    echo   [!] WARNING: Package size exceeds 8.5 MB limit!
    echo       Size is !PKG_BYTES! bytes - Limit is %MAX_BYTES% bytes.
) else (
    echo   [OK] Within 8.5 MB size limit.
)

echo.
echo   To apply on the target machine:
echo     Copy scripts\changes\%BASENAME%.txt to the target repo
echo     Then run: scripts\deploy\Apply-Changes.bat
echo.

:end
echo.
if "%NONINTERACTIVE%"=="0" pause
exit /b 0