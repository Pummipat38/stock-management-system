@echo off
title Stock Management System - Easy Start
color 0A
cls

echo ===============================================================================
echo                          Stock Management System                         
echo                              EASY START VERSION                          
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/4] Killing existing processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak > nul

echo [2/4] Starting development server...
start "Stock Management Server" cmd /c "npm run dev"

echo [3/4] Waiting for server to start...
timeout /t 8 /nobreak > nul

echo [4/4] Opening browser...
start "" "http://localhost:3000"

echo.
echo ===============================================================================
echo                              SYSTEM READY!                              
echo ===============================================================================
echo.
echo Your Stock Management System is now running at:
echo http://localhost:3000
echo.
echo Keep this window open while using the system.
echo Close this window to stop the server.
echo.
pause
