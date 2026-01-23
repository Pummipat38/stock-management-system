@echo off
title Stock Management - Starting...
cd /d "%~dp0"

echo Killing processes...
taskkill /f /im node.exe 2>nul

echo Starting server...
start /min cmd /c "npm run dev"

echo Waiting...
ping 127.0.0.1 -n 6 > nul

echo Opening browser...
start http://localhost:3000

echo Done! Check browser at http://localhost:3000
timeout /t 3 > nul
