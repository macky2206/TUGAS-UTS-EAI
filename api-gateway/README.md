# API Gateway

Central entry point for all microservices. Handles authentication (JWT) and proxies requests to backend services.

## Setup

1. Copy `.env.example` to `.env` and update values:
   ```powershell
   cp .env.example .env
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

## Running

Development mode (with auto-reload):
```powershell
npm run dev
```

Production mode:
```powershell
npm start
```

## Default Port

- Gateway: `http://localhost:3000`

## Login Endpoint

POST `http://localhost:3000/auth/login`

Example credentials:
- username: `admin`
- password: `admin123`

## Proxied Routes

- `/api/user-service/*` → User Service (port 3001)
- `/api/payment-service/*` → Payment Service (port 3002)

## Health Check

GET `http://localhost:3000/health`

All routes (except `/auth/login`) require JWT token in Authorization header:
```
Authorization: Bearer <token>
```
