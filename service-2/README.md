# Payment Service

REST API service for managing transactions. Communicates with User Service to verify users.

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

- Service: `http://localhost:3002`

## Endpoints

### Get All Transactions

- **Method**: GET
- **URL**: `/transactions`
- **Response**: Array of transactions

### Get Transaction by ID

- **Method**: GET
- **URL**: `/transactions/:id`
- **Response**: Single transaction

### Create Transaction

- **Method**: POST
- **URL**: `/transactions`
- **Body**: `{ user_id, amount, type ('credit'|'debit'), description? }`
- **Note**: Verifies user exists via User Service before creating

### Update Transaction

- **Method**: PUT
- **URL**: `/transactions/:id`
- **Body**: `{ type?, description? }`

### Health Check

- **Method**: GET
- **URL**: `/health`

## Access via Gateway

All endpoints are also accessible through the API Gateway at `/api/payment-service`:

- GET `/api/payment-service/transactions`
- POST `/api/payment-service/transactions` (requires JWT token)

## Service Communication

This service calls the User Service at `/users/:id` to verify user existence before creating transactions.
