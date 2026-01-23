@echo off
cls
color 0A

echo ========================================
echo    QUICK DATA RESTORE
echo ========================================
echo.

echo Current location: %CD%
echo.

echo Step 1: Generate Prisma Client...
call npx prisma generate

echo.
echo Step 2: Restore your data...
call node restore-real-data.js

echo.
echo DONE! Press any key to continue...
pause >nul
