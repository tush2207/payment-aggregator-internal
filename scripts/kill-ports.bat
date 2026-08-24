@echo off
echo [Kill-Ports] Freeing ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 "') do (
    echo Killing PID %%a on port 8000
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
    echo Killing PID %%a on port 5173
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5174 "') do (
    echo Killing PID %%a on port 5174
    taskkill /F /PID %%a >nul 2>&1
)
echo [OK] Ports cleared.
