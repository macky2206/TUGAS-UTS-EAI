# User Service

REST API service for managing users.

## Setup

1. Copy `.env.example` to `.env`:
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

- Service: `http://localhost:3001`

## Endpoints

### Get All Users
- **Method**: GET
- **URL**: `/users`
- **Response**: Array of users

### Get User by ID
- **Method**: GET
- **URL**: `/users/:id`
- **Response**: Single user

### Create User
- **Method**: POST
- **URL**: `/users`
- **Body**: `{ name, email }`

### Update User
- **Method**: PUT
- **URL**: `/users/:id`
- **Body**: `{ name?, email? }`

### Delete User
- **Method**: DELETE
- **URL**: `/users/:id`

### Health Check
- **Method**: GET
- **URL**: `/health`

## Access via Gateway

All endpoints are also accessible through the API Gateway at `/api/user-service`:
- GET `/api/user-service/users`
- POST `/api/user-service/users` (requires JWT token)
