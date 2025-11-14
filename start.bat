@echo off
echo ================================================
echo E-Wallet Application - Quick Start
echo ================================================
echo.

REM Check if node_modules exist, if not install
if not exist "api-gateway\node_modules" (
    echo Installing API Gateway dependencies...
    cd api-gateway
    call npm install
    cd ..
)

if not exist "service-1\node_modules" (
    echo Installing User Service dependencies...
    cd service-1
    call npm install
    cd ..
)

if not exist "service-2\node_modules" (
    echo Installing Payment Service dependencies...
    cd service-2
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing Frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ================================================
echo Starting all services...
echo ================================================
echo.

REM Start backend services
echo Starting API Gateway on port 3000...
start "API Gateway" cmd /k "cd api-gateway && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting User Service on port 3001...
start "User Service" cmd /k "cd service-1 && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting Payment Service on port 3002...
start "Payment Service" cmd /k "cd service-2 && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting Frontend on port 5173...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ================================================
echo All services started!
echo ================================================
echo.
echo Services:
echo   - Frontend:       http://localhost:5173
echo   - API Gateway:    http://localhost:3000
echo   - User Service:   http://localhost:3001
echo   - Payment Service: http://localhost:3002
echo.
echo API Documentation (Swagger):
echo   - Gateway:  http://localhost:3000/api-docs
echo   - Users:    http://localhost:3001/api-docs
echo   - Payments: http://localhost:3002/api-docs
echo.

echo.
echo To stop all services, close all terminal windows.
echo ================================================
pause
