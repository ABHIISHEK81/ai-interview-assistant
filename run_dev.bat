@echo off
TITLE InterviewAI - Full Stack Platform Launcher
COLOR 0A

echo ==============================================================================
echo              InterviewAI Career Command Center Launcher
echo ==============================================================================
echo.
echo [1/3] Checking Node.js runtime environment...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please download and install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
node -v

echo.
echo [2/3] Checking dependencies...
if not exist "node_modules\" (
    echo Initializing root dependencies...
    call npm.cmd install
)
if not exist "backend\node_modules\" (
    echo Initializing backend dependencies...
    cd backend && call npm.cmd install && cd ..
)
if not exist "frontend\node_modules\" (
    echo Initializing frontend dependencies...
    cd frontend && call npm.cmd install && cd ..
)

echo.
echo [3/3] Starting Full Stack Platform (Concurrent Backend & Frontend)...
echo ------------------------------------------------------------------------------
echo   * Backend REST API & WebSockets: http://localhost:5000
echo   * Frontend Client SPA:          http://localhost:5173
echo   * Admin Panel Login:            http://localhost:5173/admin/login
echo ------------------------------------------------------------------------------
echo.

call npm.cmd run dev

pause
