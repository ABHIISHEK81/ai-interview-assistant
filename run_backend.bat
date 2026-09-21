@echo off
cd /d "%~dp0"
echo ========================================================
echo Starting InterviewAI Backend Server...
echo ========================================================

where py >nul 2>nul
if %errorlevel% equ 0 (
    py main.py
    pause
    exit /b
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    python main.py
    pause
    exit /b
)

echo [ERROR] Neither 'py' nor 'python' was found in PATH.
pause
