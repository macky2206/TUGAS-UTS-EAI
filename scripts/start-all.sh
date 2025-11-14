#!/bin/bash

echo "Starting all services..."

# Start API Gateway
cd api-gateway
echo "Installing API Gateway dependencies..."
npm install
npm run dev &
GATEWAY_PID=$!
cd ..

# Start Service 1 (User Service)
cd service-1
echo "Installing User Service dependencies..."
npm install
npm run dev &
SERVICE1_PID=$!
cd ..

# Start Service 2 (Payment Service)
cd service-2
echo "Installing Payment Service dependencies..."
npm install
npm run dev &
SERVICE2_PID=$!
cd ..

echo "All services started!"
echo ""
echo "API Gateway: http://localhost:3000"
echo "User Service: http://localhost:3001"
echo "Payment Service: http://localhost:3002"
echo ""
echo "Login with admin/admin123 at: http://localhost:3000/auth/login"
echo ""
read -p "Press Enter to stop all services..."

# Kill all processes
kill $GATEWAY_PID $SERVICE1_PID $SERVICE2_PID

echo "All services stopped."
