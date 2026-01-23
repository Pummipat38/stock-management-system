@echo off
echo Restarting Stock Management System...
echo.

REM Kill any existing Node processes
taskkill /f /im node.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak > nul

REM Clear port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Killing process %%a on port 3000
    taskkill /f /pid %%a 2>nul
)

REM Wait another moment
timeout /t 2 /nobreak > nul

REM Start the development server
echo Starting Next.js server...
npm run dev

pause
