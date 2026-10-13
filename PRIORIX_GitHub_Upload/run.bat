@echo off
title PRIORIX Launcher
echo ========================================================
echo    PRIORIX - Intelligent Support Ticket System
echo    "Prioritize smarter. Resolve faster."
echo ========================================================
echo.
echo [1/3] Starting FastAPI Backend on http://localhost:8000...
start "PRIORIX Backend (FastAPI)" cmd /k "cd /d %~dp0 && .\venv\Scripts\python.exe backend/run.py"

echo [2/3] Starting Vite Frontend on http://localhost:5173...
start "PRIORIX Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173/...
start http://localhost:5173/

echo.
echo ========================================================
echo  PRIORIX is running!
echo  - Frontend: http://localhost:5173/
echo  - API Docs: http://localhost:8000/docs
echo ========================================================
echo.
pause
