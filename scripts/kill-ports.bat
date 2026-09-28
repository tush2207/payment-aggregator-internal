@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: Universal kill-ports.bat (100% Pure CMD / Batch)
:: Frees application ports using netstat and taskkill.
:: Usage:
::   kill-ports.bat              (cleans default dev ports)
::   kill-ports.bat 9003 3001    (cleans specific ports)
:: ============================================================

echo [Kill-Ports] Checking and freeing active development ports...

set "PORTS=9003 3001 5173 5174 8000 8080 3000"
if not "%~1"=="" set "PORTS=%*"

for %%P in (%PORTS%) do (
    for /f "tokens=5" %%A in ('netstat -aon ^| findstr ":%%P " 2^>nul') do (
        if not "%%A"=="" if not "%%A"=="0" (
            echo   Killing PID %%A on port %%P
            taskkill /F /PID %%A >nul 2>&1
        )
    )
)

echo [OK] Selected ports cleared.
