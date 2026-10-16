@echo off
REM Change directory to current backend folder
cd /d "%~dp0"
if exist ..\scripts\kill-ports.bat call ..\scripts\kill-ports.bat 8000
call .venv\Scripts\activate.bat
REM Start uvicorn
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 >> paws_service.log 2>&1