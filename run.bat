@echo off
setlocal
cd /d "%~dp0"
title New Green - Development Server

where node >nul 2>&1 || (echo [ERROR] Chua cai Node.js 22+ & pause & exit /b 1)
if not exist ".env" (echo [ERROR] Thieu file .env. Hay sao chep .env.example thanh .env va cau hinh lai. & pause & exit /b 1)

if not exist "node_modules" (
  echo [1/3] Installing dependencies...
  call npm ci || goto :error
) else (
  echo [1/3] Dependencies are ready.
)

echo [2/3] Generating Prisma client...
call npm run prisma:generate || goto :error

echo [3/3] Starting http://localhost:3000 ...
call npm run dev
exit /b %errorlevel%

:error
echo.
echo [ERROR] Khong the khoi dong ung dung.
pause
exit /b 1
