@echo off
echo ===================================================
echo   Deploying DanceJudge Pro to Vercel...
echo ===================================================
cd /d "%~dp0"
echo 1. Building production bundle...
call npm run build
if %ERRORLEVEL% NEQ 0 (
  echo Build failed! Please review errors above.
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo 2. Launching Vercel Deployment...
call npx vercel deploy --prod
pause
