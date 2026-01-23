@echo off
title Stock Management System
color 0A
cls

echo ===============================================================================
echo                          Stock Management System                         
echo                              System Starting...                          
echo ===============================================================================
echo.

cd /d "%~dp0"

echo Killing existing processes...
taskkill /f /im node.exe 2>nul

echo.
echo Checking Node.js and npm...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

npm --version
if errorlevel 1 (
    echo ERROR: npm not found! Please install Node.js first.
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Setting up database...
call npx prisma generate
call npx prisma db push

echo.
echo Starting Next.js server...
echo URL: http://localhost:3000
echo.
echo Please wait 10 seconds for server to start...
echo Then open your browser and go to: http://localhost:3000
echo.

start "" cmd /c "timeout /t 10 /nobreak > nul && start http://localhost:3000"

npm run dev

echo.
echo Press any key to exit...
pause > nul
