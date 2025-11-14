# E-Wallet Integration Guide

Complete guide for running and testing the integrated full-stack E-Wallet application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Starting the Application](#starting-the-application)
4. [Testing the Integration](#testing-the-integration)
5. [API Flow](#api-flow)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js v14+ and npm installed
- Windows PowerShell (or bash for Linux/macOS)
- A web browser (Chrome, Firefox, Edge)
- Basic understanding of REST APIs and JWT authentication

## Initial Setup

### 1. Install Backend Dependencies

```powershell
# From project root
cd api-gateway
npm install
cd ..

cd service-1
npm install
cd ..

cd service-2
npm install
cd ..
```

### 2. Install Frontend Dependencies

```powershell
cd frontend
npm install
cd ..
```

### 3. Verify Environment Files

Each service should have a `.env` file. If not, copy from `.env.example`:

```powershell
# API Gateway
cd api-gateway
if (!(Test-Path .env)) { Copy-Item .env.example .env }
cd ..

# Service 1
cd service-1
if (!(Test-Path .env)) { Copy-Item .env.example .env }
cd ..

# Service 2
cd service-2
if (!(Test-Path .env)) { Copy-Item .env.example .env }
cd ..
```

## Starting the Application

### Option 1: Automated Start (Recommended)

```powershell
# Start all backend services
.\scripts\start-all.bat

# In a new terminal, start frontend
cd frontend
npm run dev
```

### Option 2: Manual Start

**Terminal 1 - API Gateway:**

```powershell
cd api-gateway
npm run dev
```

**Terminal 2 - User Service:**

```powershell
cd service-1
npm run dev
```

**Terminal 3 - Payment Service:**

```powershell
cd service-2
npm run dev
```

**Terminal 4 - Frontend:**

```powershell
cd frontend
npm run dev
```

### Verify Services are Running

Open these URLs in your browser:

- ✅ Frontend: http://localhost:5173
- ✅ API Gateway: http://localhost:3000/health
- ✅ User Service: http://localhost:3001/health
- ✅ Payment Service: http://localhost:3002/health
- ✅ Gateway Swagger: http://localhost:3000/api-docs
- ✅ User Service Swagger: http://localhost:3001/api-docs
- ✅ Payment Service Swagger: http://localhost:3002/api-docs

## Testing the Integration

### 1. User Registration Flow

1. Open http://localhost:5173
2. Click "Register" or navigate to registration page
3. Fill in the form:
   - Username: `testuser`
   - Password: `password123`
   - Email: `test@example.com`
   - Full Name: `Test User`
4. Click "Register"
5. You should be logged in automatically and redirected to Dashboard

**What happens behind the scenes:**

```
Frontend → POST /auth/register → API Gateway
                                     ↓
                                 Hashes password with bcrypt
                                     ↓
                                 Proxies to User Service → Creates user in users.db
                                     ↓
                                 Returns JWT token
                                     ↓
Frontend ← JWT token + user data ← API Gateway
```

### 2. Login Flow

1. If not already logged in, go to http://localhost:5173
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click "Login"
4. You should see the Dashboard with your balance

**API Flow:**

```
Frontend → POST /auth/login → API Gateway
                                   ↓
                               Validates password (bcrypt)
                                   ↓
                               Generates JWT token
                                   ↓
Frontend ← JWT token + user ← API Gateway
```

### 3. View Wallet Balance

1. Once logged in, view Dashboard or navigate to "Wallet" page
2. You should see your current balance (new users start with 0)

**API Flow:**

```
Frontend → GET /api/wallets/balance → API Gateway (validates JWT)
                                          ↓
                                      Proxies to User Service
                                          ↓
                                      Queries users.db for balance
                                          ↓
Frontend ← { balance: 0 } ← User Service
```

### 4. Top Up Wallet

1. Go to "Wallet" page
2. Enter amount (e.g., `100000`)
3. Click "Top Up"
4. Balance should update immediately

**API Flow:**

```
Frontend → POST /api/wallets/topup → API Gateway (validates JWT)
           Body: { amount: 100000 }      ↓
                                      Proxies to User Service
                                          ↓
                                      Updates users.db balance
                                          ↓
                                      Creates transaction in transactions.db
                                          ↓
Frontend ← { balance: 100000 } ← User Service
```

### 5. Send Payment

1. Go to "Transactions" page
2. Fill in the payment form:
   - Recipient ID: `1` (admin user)
   - Amount: `50000`
   - Description: `Test payment`
3. Click "Send Payment"
4. Transaction should appear in history

**API Flow:**

```
Frontend → POST /api/transactions/payment → API Gateway (validates JWT)
           Body: { recipient_id: 1,             ↓
                   amount: 50000,           Proxies to Payment Service
                   description: "..." }         ↓
                                            Validates sender balance
                                                ↓
                                            Calls User Service to get sender balance
                                                ↓
                                            Checks balance >= amount
                                                ↓
                                            Updates sender balance (deduct)
                                                ↓
                                            Calls User Service to update sender
                                                ↓
                                            Updates recipient balance (add)
                                                ↓
                                            Calls User Service to update recipient
                                                ↓
                                            Records transaction in transactions.db
                                                ↓
Frontend ← { success, transaction } ← Payment Service
```

### 6. View Transaction History

1. Go to "Transactions" page
2. Scroll to "Transaction History" section
3. You should see all your transactions (sent and received)

**API Flow:**

```
Frontend → GET /api/transactions/history → API Gateway (validates JWT)
                                               ↓
                                           Proxies to Payment Service
                                               ↓
                                           Queries transactions.db WHERE
                                           sender_id = user.id OR
                                           recipient_id = user.id
                                               ↓
Frontend ← [{ id, type, amount, ... }] ← Payment Service
```

## API Flow

### Authentication Flow

```
┌─────────┐      ┌─────────────┐      ┌──────────────┐
│Frontend │      │ API Gateway │      │ User Service │
└────┬────┘      └──────┬──────┘      └──────┬───────┘
     │                  │                     │
     │ POST /auth/login │                     │
     ├─────────────────>│                     │
     │                  │                     │
     │                  │ Query user          │
     │                  ├────────────────────>│
     │                  │                     │
     │                  │ User data           │
     │                  │<────────────────────┤
     │                  │                     │
     │                  │ Verify password     │
     │                  │ Generate JWT        │
     │                  │                     │
     │ JWT + user data  │                     │
     │<─────────────────┤                     │
     │                  │                     │
```

### Payment Flow

```
┌─────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────────┐
│Frontend │   │ API Gateway │   │   Payment   │   │ User Service │
│         │   │             │   │   Service   │   │              │
└────┬────┘   └──────┬──────┘   └──────┬──────┘   └──────┬───────┘
     │               │                  │                  │
     │ POST /payment │                  │                  │
     ├──────────────>│                  │                  │
     │               │                  │                  │
     │               │ Proxy + JWT      │                  │
     │               ├─────────────────>│                  │
     │               │                  │                  │
     │               │                  │ GET sender       │
     │               │                  ├─────────────────>│
     │               │                  │                  │
     │               │                  │ Sender data      │
     │               │                  │<─────────────────┤
     │               │                  │                  │
     │               │                  │ Verify balance   │
     │               │                  │                  │
     │               │                  │ PUT sender (-)   │
     │               │                  ├─────────────────>│
     │               │                  │                  │
     │               │                  │ Success          │
     │               │                  │<─────────────────┤
     │               │                  │                  │
     │               │                  │ PUT recipient (+)│
     │               │                  ├─────────────────>│
     │               │                  │                  │
     │               │                  │ Success          │
     │               │                  │<─────────────────┤
     │               │                  │                  │
     │               │                  │ Save transaction │
     │               │                  │                  │
     │               │ Transaction data │                  │
     │               │<─────────────────┤                  │
     │               │                  │                  │
     │ Success       │                  │                  │
     │<──────────────┤                  │                  │
     │               │                  │                  │
```

## Troubleshooting

### Frontend Can't Connect to Backend

**Symptoms:** Network errors in browser console, "Failed to fetch"

**Solutions:**

1. Verify all backend services are running:
   ```powershell
   # Check if ports are in use
   netstat -ano | findstr "3000 3001 3002"
   ```
2. Check Vite proxy configuration in `frontend/vite.config.js`:
   ```javascript
   proxy: {
     '/api': {
       target: 'http://localhost:3000',
       changeOrigin: true
     }
   }
   ```
3. Restart frontend dev server

### JWT Token Expired

**Symptoms:** 401 Unauthorized after some time

**Solutions:**

1. Logout and login again
2. Check token expiry in `api-gateway/index.js` (default: 24h)
3. Implement token refresh endpoint

### Database Locked Error

**Symptoms:** "Database is locked" in SQLite

**Solutions:**

1. Stop all services
2. Delete `*.db` files (they will be recreated)
3. Restart services

### Port Already in Use

**Symptoms:** `EADDRINUSE` error

**Solutions:**

```powershell
# Find process using port 3000 (or 3001, 3002, 5173)
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Balance Not Updating

**Symptoms:** Top-up or payment succeeds but balance doesn't change

**Solutions:**

1. Check browser console for errors
2. Verify User Service is running and accessible
3. Check Payment Service logs for User Service call failures
4. Ensure axios-retry is installed: `npm install axios-retry`

### CORS Errors

**Symptoms:** CORS policy errors in browser console

**Solutions:**

1. Verify API Gateway has CORS enabled:
   ```javascript
   const cors = require("cors");
   app.use(cors());
   ```
2. Use Vite proxy instead of direct API calls
3. Check that requests go through `/api` prefix

## Testing Checklist

- [ ] All 4 services start without errors
- [ ] Can access frontend at localhost:5173
- [ ] Can register a new user
- [ ] Can login with registered user
- [ ] Dashboard shows balance (0 for new users)
- [ ] Can top up wallet
- [ ] Balance updates after top-up
- [ ] Can send payment to another user
- [ ] Both sender and recipient balances update
- [ ] Transaction appears in history
- [ ] Can view transaction history
- [ ] Swagger docs accessible for all services
- [ ] Health check endpoints respond

## Next Steps

1. **Add Tests:**

   - Unit tests for services
   - Integration tests for API flows
   - E2E tests for frontend flows

2. **Enhance Security:**

   - Add rate limiting
   - Implement token refresh
   - Add HTTPS in production

3. **Improve UX:**

   - Add loading states
   - Better error messages
   - Transaction notifications

4. **Deploy:**
   - Set up production database
   - Deploy to cloud provider
   - Configure environment variables

## Additional Resources

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Documentation](https://react.dev/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Microservices Patterns](https://microservices.io/patterns/microservices.html)
