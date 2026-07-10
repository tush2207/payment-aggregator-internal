@echo off
REM change directory to app folder
cd /d "E:\Digital Ambassador Portal - FullStack\digital-ambassador-portal-latest-backend"
call .venv\Scripts\activate
REM start uvicorn (this writes to stdout which NSSM can capture)
uvicorn main:app --host 0.0.0.0 --port 9002 >> paws_service.log 2>&1