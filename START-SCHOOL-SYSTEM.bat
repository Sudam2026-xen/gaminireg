@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)
echo.
echo ========================================
echo DIGITAL SCHOOL REGISTRATION SYSTEM
echo ========================================
call npm start
pause
