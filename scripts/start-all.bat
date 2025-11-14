@echo off
setlocal enabledelayedexpansion

REM Get the directory where this script is located (scripts folder)
set SCRIPT_DIR=%~dp0
REM Go up one level to get project root
for %%A in ("%SCRIPT_DIR:~0,-1%") do set PROJECT_ROOT=%%~dpA

echo Starting all services from: %PROJECT_ROOT%
echo.

REM Check if directories exist
if not exist "%PROJECT_ROOT%api-gateway" (
    echo Error: api-gateway directory not found at %PROJECT_ROOT%
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%service-1" (
    echo Error: service-1 directory not found at %PROJECT_ROOT%
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%service-2" (
    echo Error: service-2 directory not found at %PROJECT_ROOT%
    pause
    exit /b 1
)

REM Start API Gateway
echo Installing API Gateway dependencies...
cd /d "%PROJECT_ROOT%api-gateway"
call npm install
start "API Gateway" cmd /k "npm run dev"
if errorlevel 1 (
    echo Error starting API Gateway
    pause
    exit /b 1
)

REM Start Service 1 (User Service)
echo Installing User Service dependencies...
cd /d "%PROJECT_ROOT%service-1"
call npm install
start "User Service" cmd /k "npm run dev"
if errorlevel 1 (
    echo Error starting User Service
    pause
    exit /b 1
)

REM Start Service 2 (Payment Service)
echo Installing Payment Service dependencies...
cd /d "%PROJECT_ROOT%service-2"
call npm install
start "Payment Service" cmd /k "npm run dev"
if errorlevel 1 (
    echo Error starting Payment Service
    pause
    exit /b 1
)

echo.
echo All services started successfully!
echo.
echo API Gateway: http://localhost:3000
echo User Service: http://localhost:3001
echo Payment Service: http://localhost:3002
echo.
echo Login with admin/admin123 at: http://localhost:3000/auth/login
echo.
pause
