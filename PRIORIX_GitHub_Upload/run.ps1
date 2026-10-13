# PRIORIX One-Click Launcher for Windows PowerShell
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   PRIORIX - Intelligent Support Ticket System" -ForegroundColor White
Write-Host "   'Prioritize smarter. Resolve faster.'" -ForegroundColor DarkGray
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "`n[1/3] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d `"$root`" && .\venv\Scripts\python.exe backend/run.py"

Write-Host "[2/3] Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\frontend`" && npm run dev"

Write-Host "[3/3] Waiting 3 seconds for services..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Opening browser at http://localhost:5173/..." -ForegroundColor Green
Start-Process "http://localhost:5173/"

Write-Host "`nPRIORIX is running successfully!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173/" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
