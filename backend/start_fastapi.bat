@echo off
cd /d "%~dp0"
if exist ..\scripts\kill-ports.bat call ..\scripts\kill-ports.bat 8000
call .venv\Scripts\activate.bat
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --log-level info
pause
