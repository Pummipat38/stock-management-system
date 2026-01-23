@echo off
cd /d "%~dp0"
echo Starting Stock Management System...
echo.
echo Checking if port 3000 is available...
netstat -ano | findstr :3000
if %errorlevel% == 0 (
    echo Port 3000 is in use. Killing existing processes...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /f /pid %%a
    timeout /t 2 /nobreak > nul
)

echo.
echo Starting Next.js development server...
npm run dev
