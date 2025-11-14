# Quick Reference Card

Essential commands and information for the E-Wallet project.

## 🚀 Start Everything

```powershell
.\start.bat
```

Then open: `http://localhost:5173`

## 🔑 Default Login

```
Username: admin
Password: admin123
```

## 📡 Service Ports

| Service         | Port | URL                   |
| --------------- | ---- | --------------------- |
| Frontend        | 5173 | http://localhost:5173 |
| API Gateway     | 3000 | http://localhost:3000 |
| User Service    | 3001 | http://localhost:3001 |
| Payment Service | 3002 | http://localhost:3002 |

## 📚 API Documentation

| Service         | Swagger UI                     |
| --------------- | ------------------------------ |
| API Gateway     | http://localhost:3000/api-docs |
| User Service    | http://localhost:3001/api-docs |
| Payment Service | http://localhost:3002/api-docs |

## 🔧 Common Commands

### Start Backend Only

```powershell
.\scripts\start-all.bat
```

### Start Frontend Only

```powershell
cd frontend
npm run dev
```

### Install All Dependencies

```powershell
cd api-gateway ; npm install ; cd ..
cd service-1 ; npm install ; cd ..
cd service-2 ; npm install ; cd ..
cd frontend ; npm install ; cd ..
```

### Stop All Services

Close all terminal windows or press `Ctrl+C` in each

### Check Port Usage

```powershell
netstat -ano | findstr "3000 3001 3002 5173"
```

### Kill Process on Port

```powershell
# Find PID
netstat -ano | findstr :<port>

# Kill process (replace <PID>)
taskkill /PID <PID> /F
```

## 🧪 API Endpoints Quick Reference

### Authentication

```http
POST /auth/login
POST /auth/register
```

### Wallet (requires JWT)

```http
GET  /api/wallets/balance
POST /api/wallets/topup
```

### Transactions (requires JWT)

```http
GET  /api/transactions/history
POST /api/transactions/payment
```

### Health Checks

```http
GET /health  (on any service)
```

## 🔐 JWT Authentication

### Get Token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Use Token

```bash
curl http://localhost:3000/api/wallets/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📝 Example API Calls

### Register New User

```http
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "full_name": "John Doe"
}
```

### Top Up Wallet

```http
POST http://localhost:3000/api/wallets/topup
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "amount": 100000
}
```

### Send Payment

```http
POST http://localhost:3000/api/transactions/payment
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "recipient_id": 2,
  "amount": 50000,
  "description": "Payment for services"
}
```

### Get Transaction History

```http
GET http://localhost:3000/api/transactions/history?limit=10
Authorization: Bearer YOUR_TOKEN
```

## 🗄️ Database Files

- `service-1/users.db` - User accounts and balances
- `service-2/transactions.db` - Transaction history

**Note:** These are auto-created on first run. Delete to reset data.

## 🔄 Reset Everything

```powershell
# Stop all services
# Then delete databases:
Remove-Item service-1\users.db
Remove-Item service-2\transactions.db

# Restart services
.\start.bat
```

## 🐛 Troubleshooting Quick Fixes

### Port Already in Use

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Locked

```powershell
# Stop services, delete databases, restart
Remove-Item service-1\*.db
Remove-Item service-2\*.db
.\start.bat
```

### Frontend Can't Connect

1. Check backend services are running
2. Verify ports: 3000, 3001, 3002
3. Restart frontend: `cd frontend ; npm run dev`

### Token Expired

1. Logout from frontend
2. Login again

## 📁 Important Files

```
start.bat                       # One-click start script
README.md                       # Main documentation
docs/INTEGRATION_GUIDE.md       # Complete testing guide
docs/PROJECT_COMPLETION.md      # Feature summary
api-gateway/.env                # Gateway config
service-1/.env                  # User service config
service-2/.env                  # Payment service config
frontend/vite.config.js         # Frontend proxy config
```

## 🌐 Frontend Pages

- `/` or `/login` - Login/Register
- `/dashboard` - Balance overview
- `/wallet` - Top-up wallet
- `/transactions` - Send payment & view history

## 📊 Test Data

After first start, sample data is created:

**Admin User:**

- ID: 1
- Username: admin
- Password: admin123
- Email: admin@example.com
- Initial Balance: 0

## 🎯 Testing Workflow

1. Start: `.\start.bat`
2. Open: `http://localhost:5173`
3. Login: admin / admin123
4. Top up: Add 100000 to balance
5. Register: Create another user (newuser)
6. Send: Pay 50000 to user ID 2
7. History: View all transactions

## 📚 Documentation Links

- [Main README](../README.md)
- [Integration Guide](INTEGRATION_GUIDE.md)
- [Completion Summary](PROJECT_COMPLETION.md)
- [API Gateway README](../api-gateway/README.md)
- [User Service README](../service-1/README.md)
- [Payment Service README](../service-2/README.md)
- [Frontend README](../frontend/README.md)

## 💡 Pro Tips

1. **Use Swagger UI** for testing APIs without Postman
2. **Check terminal logs** for debugging - all requests are logged
3. **Multiple browsers** for testing multi-user scenarios
4. **Postman Collection** in `docs/postman/` for automated testing
5. **Health endpoints** to verify services are running

## 🚨 Common Errors

| Error            | Solution                   |
| ---------------- | -------------------------- |
| EADDRINUSE       | Port in use, kill process  |
| 401 Unauthorized | Token expired, login again |
| Database locked  | Restart services           |
| Failed to fetch  | Backend not running        |
| Module not found | Run `npm install`          |

## 📞 Support

For detailed help, see:

- `docs/INTEGRATION_GUIDE.md` - Complete troubleshooting section
- Swagger UI - Interactive API testing
- Terminal logs - Error messages and stack traces

---

**Last Updated:** $(Get-Date)
**Project:** TUGAS-UTS-EAI
**Tech Stack:** Node.js, Express, React, SQLite, JWT
