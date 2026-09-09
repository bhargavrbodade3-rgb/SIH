@echo off
echo ====================================================================
echo  AI-Driven Industrial Approval & Compliance Management Platform (SIH)
echo ====================================================================
echo.
echo Starting Backend Server on http://127.0.0.1:8000 ...
start "Backend - FastAPI" cmd /k "cd /d %~dp0 && .venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Frontend Server on http://localhost:5173 ...
start "Frontend - React Vite" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo Platform launched!
echo Open http://localhost:5173 in your web browser.
echo Pre-seeded accounts:
echo   - Entrepreneur: demo@example.com / Demo123!
echo   - Officer:      officer@example.com / Demo123!
echo   - Admin:        admin@example.com / Demo123!
echo ====================================================================
pause
