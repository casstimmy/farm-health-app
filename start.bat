@echo off
REM Farm Health Management System - Quick Start Script (Windows)

echo 🐑 Farm Health Management System
echo ==================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo ✓ Dependencies installed
    echo.
)

REM Check .env.local
if not exist ".env.local" (
    echo ⚠️ .env.local not found. Creating from template...
    (
        echo MONGODB_URI=mongodb://localhost:27017/farm-health-app
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
        echo NEXT_PUBLIC_API_URL=http://localhost:3000
    ) > .env.local
    echo ✓ .env.local created. Please update MongoDB URI if needed.
    echo.
)

echo Environment configuration found.
echo.

REM Optional: Seed database
set /p SEED="Do you want to seed the database with sample data? (y/n): "
if /i "%SEED%"=="y" (
    echo Seeding database...
    node seeders/seed.js
    echo.
)

REM Start development server
echo Starting development server...
echo Open http://localhost:3000 in your browser
echo.
echo Demo credentials:
echo   SuperAdmin: admin@farm.com / admin123
echo   Manager: manager@farm.com / manager123
echo   Attendant: attendant@farm.com / attendant123
echo.
call npm run dev
