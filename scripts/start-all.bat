@echo off
echo Starting all services...

REM Start API Gateway
cd api-gateway
echo Installing API Gateway dependencies...
call npm install
start cmd /k "npm run dev"
cd ..

REM Start Service 1 (User Service)
cd service-1
echo Installing User Service dependencies...
call npm install
start cmd /k "npm run dev"
cd ..

REM Start Service 2 (Payment Service)
cd service-2
echo Installing Payment Service dependencies...
call npm install
start cmd /k "npm run dev"
cd ..

echo All services started!
echo.
echo API Gateway: http://localhost:3000
echo User Service: http://localhost:3001
echo Payment Service: http://localhost:3002
echo.
echo Login with admin/admin123 at: http://localhost:3000/auth/login
pause
