#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Starting all services from: $PROJECT_ROOT"
echo ""

# Check if directories exist
if [ ! -d "$PROJECT_ROOT/api-gateway" ]; then
    echo "Error: api-gateway directory not found at $PROJECT_ROOT"
    exit 1
fi

if [ ! -d "$PROJECT_ROOT/service-1" ]; then
    echo "Error: service-1 directory not found at $PROJECT_ROOT"
    exit 1
fi

if [ ! -d "$PROJECT_ROOT/service-2" ]; then
    echo "Error: service-2 directory not found at $PROJECT_ROOT"
    exit 1
fi

# Function to handle errors
error_handler() {
    echo "Error: $1"
    kill $GATEWAY_PID $SERVICE1_PID $SERVICE2_PID 2>/dev/null
    exit 1
}

# Start API Gateway
echo "Installing API Gateway dependencies..."
cd "$PROJECT_ROOT/api-gateway" || error_handler "Failed to enter api-gateway directory"
npm install || error_handler "Failed to install API Gateway dependencies"
npm run dev > /tmp/gateway.log 2>&1 &
GATEWAY_PID=$!
echo "API Gateway started (PID: $GATEWAY_PID)"

# Start Service 1 (User Service)
echo "Installing User Service dependencies..."
cd "$PROJECT_ROOT/service-1" || error_handler "Failed to enter service-1 directory"
npm install || error_handler "Failed to install User Service dependencies"
npm run dev > /tmp/service1.log 2>&1 &
SERVICE1_PID=$!
echo "User Service started (PID: $SERVICE1_PID)"

# Start Service 2 (Payment Service)
echo "Installing Payment Service dependencies..."
cd "$PROJECT_ROOT/service-2" || error_handler "Failed to enter service-2 directory"
npm install || error_handler "Failed to install Payment Service dependencies"
npm run dev > /tmp/service2.log 2>&1 &
SERVICE2_PID=$!
echo "Payment Service started (PID: $SERVICE2_PID)"

echo ""
echo "All services started successfully!"
echo ""
echo "API Gateway: http://localhost:3000"
echo "User Service: http://localhost:3001"
echo "Payment Service: http://localhost:3002"
echo ""
echo "Login with admin/admin123 at: http://localhost:3000/auth/login"
echo ""
echo "Logs:"
echo "  Gateway: tail -f /tmp/gateway.log"
echo "  Service 1: tail -f /tmp/service1.log"
echo "  Service 2: tail -f /tmp/service2.log"
echo ""
read -p "Press Enter to stop all services..."

# Kill all processes
echo ""
echo "Stopping services..."
kill $GATEWAY_PID $SERVICE1_PID $SERVICE2_PID 2>/dev/null
wait $GATEWAY_PID $SERVICE1_PID $SERVICE2_PID 2>/dev/null

echo "All services stopped."
