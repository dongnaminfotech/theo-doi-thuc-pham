@echo off
setlocal
cd /d "%~dp0"
call npm test || exit /b 1
call npm run typecheck || exit /b 1
call npm run build || exit /b 1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\deploy-vps.ps1"
exit /b %errorlevel%
