@echo off
REM iOS App Setup Script for OtaNet Mobile (Windows)

echo.
echo ============================================
echo   OtaNet iOS App Setup
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [X] Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%
echo.

REM Check if npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    echo [X] npm is not installed.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm found: %NPM_VERSION%
echo.

REM Check if Expo CLI is installed
where expo >nul 2>nul
if errorlevel 1 (
    echo [!] Installing Expo CLI globally...
    call npm install -g expo-cli
    echo.
) else (
    echo [OK] Expo CLI found
    echo.
)

REM Install dependencies
echo [*] Installing dependencies...
call npm install

echo.
echo [OK] Setup complete!
echo.
echo Next steps:
echo   1. Create .env.local file with your API endpoint:
echo      EXPO_PUBLIC_API_BASE=https://your-ec2-instance.amazonaws.com
echo.
echo   2. Start the development server:
echo      npm start
echo.
echo   3. For iOS Simulator:
echo      Press 'i' in the Expo dev tools
echo.
echo   4. For physical device:
echo      Download Expo Go app and scan the QR code
echo.
echo Documentation:
echo   - README.md - Quick start guide
echo   - DEVELOPMENT.md - Development guide
echo   - FEATURE_MAPPING.md - Feature mapping from web app
echo.
pause
