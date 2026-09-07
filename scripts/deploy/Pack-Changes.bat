@echo off
setlocal EnableDelayedExpansion
title Pack Changes Utility - PAPG Portal

echo ===========================================
echo        PACK CHANGES UTILITY (BASE64)
echo ===========================================

rem ---------------------------------------------------------------
rem 0. Parse arguments
rem      -ExcludeUntracked        skip git-untracked (new) files
rem      -IncludeUntracked        include git-untracked files (default)
rem      -NonInteractive           skip all prompts
rem      -Files "a.txt,b\c.txt"    explicit comma-separated file list
rem ---------------------------------------------------------------
set "INCLUDEUNTRACKED=1"
set "NONINTERACTIVE=0"
set "EXPLICITFILES="

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
    shift
    goto setfiles
)
shift
goto parseargs

:setfiles
set "EXPLICITFILES=%~1"
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
echo [-] Git repository root not found. Defaulting to current directory: %CD%
set "REPO_ROOT=%CD%"
goto rootdone

:rootfound
echo [+] Found Git repository root: %REPO_ROOT%

:rootdone
if "%REPO_ROOT:~-1%"=="\" set "REPO_ROOT=%REPO_ROOT:~0,-1%"

rem ---------------------------------------------------------------
rem 2. Build the list of files to pack
rem ---------------------------------------------------------------
set "FILECOUNT=0"

if not "%EXPLICITFILES%"=="" (
    echo [+] Using manually specified files.
    for %%F in ("%EXPLICITFILES:,=" "%") do (
        set "RAW=%%~F"
        if not "!RAW!"=="" (
            set "RAW=!RAW:/=\!"
            set "RAW=!RAW:"=!"
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

        rem Filter deleted files
        if not "!STAT!"=="D" if not "!STAT!"=="RD" (
            set "SKIP=0"
            if "!STAT!"=="??" if "%INCLUDEUNTRACKED%"=="0" set "SKIP=1"

            if "!SKIP!"=="0" (
                rem Handle rename syntax "old -> new"
                if not "!FPATH: -> =!"=="!FPATH!" (
                    for /f "tokens=2 delims=>" %%X in ("!FPATH!") do set "FPATH=%%X"
                    if "!FPATH:~0,1!"==" " set "FPATH=!FPATH:~1!"
                )

                set "FPATH=!FPATH:/=\!"

                if not "!FPATH:~-1!"=="\" (
                    set /a FILECOUNT+=1
                    set "F!FILECOUNT!=!FPATH!"
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
            for %%F in ("!MANUAL:,=" "!") do (
                set "RAW=%%~F"
                if not "!RAW!"=="" (
                    set "RAW=!RAW:/=\!"
                    set "RAW=!RAW:"=!"
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
    set /p CONFIRM="Do you want to package these %FILECOUNT% file(s)? (Y/N): "
    if /I not "!CONFIRM!"=="Y" if /I not "!CONFIRM!"=="Yes" (
        echo [-] Cancelled by user.
        goto end
    )
)

rem ---------------------------------------------------------------
rem 3. Copy files into a staging folder, preserving folder structure
rem ---------------------------------------------------------------
set "STAGE=%TEMP%\PackChanges_%RANDOM%"
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
                if not exist "!TARGET_DIR!" mkdir "!TARGET_DIR!"
            )
            copy /Y "!SRC!" "!DEST!" >nul
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

rem ---------------------------------------------------------------
rem 4. Output folder: scripts\changes\
rem ---------------------------------------------------------------
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
    for /f "usebackq delims=" %%T in (`powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"` 2^>nul) do set "TIMESTAMP=%%T"
)

if "%TIMESTAMP%"=="" (
    set "TIMESTAMP=%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
    set "TIMESTAMP=!TIMESTAMP: =0!"
    set "TIMESTAMP=!TIMESTAMP:/=!"
    set "TIMESTAMP=!TIMESTAMP:-=!"
    set "TIMESTAMP=!TIMESTAMP::=!"
    set "TIMESTAMP=!TIMESTAMP:.=!"
)

set "BASENAME=change_%TIMESTAMP%"
set "FINALZIP=%CHANGESDIR%\%BASENAME%.zip"
set "FINALB64=%CHANGESDIR%\%BASENAME%.b64"
set "FINALTXT=%CHANGESDIR%\%BASENAME%.txt"

echo [+] Creating ZIP archive...
if exist "%FINALZIP%" del /f /q "%FINALZIP%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%STAGE%\*' -DestinationPath '%FINALZIP%' -Force" >nul 2>&1

if not exist "%FINALZIP%" (
    pushd "%STAGE%"
    tar -a -cf "%FINALZIP%" * >nul 2>&1
    popd
)

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

set "B64SIZE=0"
if exist "%FINALB64%" for %%B in ("%FINALB64%") do set "B64SIZE=%%~zB"
if "!B64SIZE!"=="0" (
    echo [-] Error: Encoded Base64 file is empty.
    goto cleanup
)

echo [+] Converting extension from .b64 to .txt...
if exist "%FINALTXT%" del /f /q "%FINALTXT%"
move /y "%FINALB64%" "%FINALTXT%" >nul

if not exist "%FINALTXT%" (
    echo [-] Error: Failed to convert extension to .txt.
    goto cleanup
)

:cleanup
if exist "%STAGE%" rmdir /s /q "%STAGE%"

if exist "%FINALTXT%" (
    echo.
    echo ===========================================
    echo   [SUCCESS] Pack complete! Packed %SUCCESSCOUNT% file(s).
    echo ===========================================
    echo   TXT  : scripts\changes\%BASENAME%.txt
    echo   ZIP  : scripts\changes\%BASENAME%.zip
    echo.
    echo   To apply on the target machine:
    echo     Copy scripts\changes\%BASENAME%.txt to the target repo
    echo     Then run: scripts\deploy\Apply-Changes.bat
    echo.
    echo   See scripts\README.md for full instructions.
) else (
    echo [-] Failed to generate output text file.
)

:end
echo.
if "%NONINTERACTIVE%"=="0" pause
