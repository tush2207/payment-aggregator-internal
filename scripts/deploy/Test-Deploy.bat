@echo off
setlocal EnableDelayedExpansion
title Test Deploy Scripts Utility - PAPG Portal

echo ===========================================
echo      TEST DEPLOY SCRIPTS UTILITY
echo ===========================================
echo.

set "SCRIPTDIR=%~dp0"
if "%SCRIPTDIR:~-1%"=="\" set "SCRIPTDIR=%SCRIPTDIR:~0,-1%"

for %%I in ("%SCRIPTDIR%\..\..") do set "REPO_ROOT=%%~fI"

echo [+] Repo root: %REPO_ROOT%
echo [+] Script dir: %SCRIPTDIR%

rem ---------------------------------------------------------------
rem Step 1. Create a dummy test file in repo root
rem ---------------------------------------------------------------
set "TESTFILE_REL=scripts\deploy\_test_sample.txt"
set "TESTFILE_ABS=%REPO_ROOT%\%TESTFILE_REL%"
set "TESTCONTENT=Test Deploy Script Content - %RANDOM%"

echo %TESTCONTENT% > "%TESTFILE_ABS%"
if not exist "%TESTFILE_ABS%" (
    echo [-] FAIL: Could not create temporary test file: %TESTFILE_ABS%
    goto testfailed
)
echo [+] Created test file: %TESTFILE_REL%

rem ---------------------------------------------------------------
rem Step 2. Run Pack-Changes.bat non-interactively for the test file
rem ---------------------------------------------------------------
echo.
echo [+] Running Pack-Changes.bat...
call "%SCRIPTDIR%\Pack-Changes.bat" -Files "%TESTFILE_REL%" -NonInteractive

rem Find generated txt change file
set "LATEST_TXT="
for /f "delims=" %%F in ('dir /b /o-d "%REPO_ROOT%\scripts\changes\change_*.txt" "%REPO_ROOT%\scripts\changes\changes_*.txt" 2^>nul') do (
    if "!LATEST_TXT!"=="" set "LATEST_TXT=%REPO_ROOT%\scripts\changes\%%F"
)

if "%LATEST_TXT%"=="" (
    echo [-] FAIL: No .txt change file generated in scripts\changes\
    goto testfailed
)
echo [+] Packaging verified: %LATEST_TXT%

rem ---------------------------------------------------------------
rem Step 3. Run Apply-Changes.bat into a temporary target directory
rem ---------------------------------------------------------------
set "TEST_TARGET=%TEMP%\TestDeployTarget_%RANDOM%"
if exist "%TEST_TARGET%" rmdir /s /q "%TEST_TARGET%"
mkdir "%TEST_TARGET%"

echo.
echo [+] Running Apply-Changes.bat targeting: %TEST_TARGET%
call "%SCRIPTDIR%\Apply-Changes.bat" -InputFile "%LATEST_TXT%" -TargetDir "%TEST_TARGET%" -Force

set "APPLIED_FILE=%TEST_TARGET%\%TESTFILE_REL%"
if not exist "%APPLIED_FILE%" (
    echo [-] FAIL: Applied file missing in target directory: %APPLIED_FILE%
    goto testfailed
)

set /p READ_CONTENT=<"%APPLIED_FILE%"
if not "!READ_CONTENT!"=="%TESTCONTENT%" (
    echo [-] FAIL: Content mismatch in applied file!
    echo     Expected: %TESTCONTENT%
    echo     Got     : !READ_CONTENT!
    goto testfailed
)

echo.
echo ===========================================
echo   [SUCCESS] ALL TESTS PASSED SUCCESSFULLY!
echo ===========================================
goto cleanup

:testfailed
echo.
echo ===========================================
echo   [FAILURE] TEST SUITE FAILED!
echo ===========================================

:cleanup
echo.
echo [+] Cleaning up test artifacts...
if exist "%TESTFILE_ABS%" del /f /q "%TESTFILE_ABS%"
if exist "%TEST_TARGET%" rmdir /s /q "%TEST_TARGET%"

echo.
pause
