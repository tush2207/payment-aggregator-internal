@echo off
SETLOCAL

REM --- Configuration ---
REM Set the directory containing the .whl files.
REM "." means the current directory where you run the script.
SET WHEEL_DIR=.
REM ---------------------

echo Starting Python Wheel Installation process...

REM Check if pip is installed
pip --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: pip not found. Make sure Python and pip are installed and in your PATH.
    pause
    exit /b 1
)

echo Installing wheels located in: %WHEEL_DIR%

REM Iterate over all .whl files in the specified directory and install them
REM using pip's dependency resolution within the local directory.
FOR %%f IN ("%WHEEL_DIR%\*.whl") DO (
    echo Installing: %%f
    REM The --no-index and --find-links options tell pip to only look for
    REM dependencies within the local directory, not PyPI.
    pip install "%%f" --no-index --find-links "%WHEEL_DIR%" --upgrade
    
    REM Check if the installation was successful
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install %%f
        REM Continue to try others, or uncomment the next line to stop on error
        REM pause
        REM exit /b 1 
    ) else (
        echo Successfully installed %%f
    )
)

echo.
echo Installation process finished.
pause
ENDLOCAL