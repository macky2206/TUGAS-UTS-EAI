# E-Wallet Frontend

Modern React-based frontend for the E-Wallet Digital Payment Service.

## Features

- **User Authentication**: Login and registration with JWT
- **Dashboard**: View balance and recent transactions
- **Wallet Management**: Check balance and top up funds
- **Transactions**: Send payments and view transaction history
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **React 18** - UI framework
- **React Router 6** - Navigation
- **Axios** - HTTP client
- **Vite** - Build tool and dev server

## Setup

1. **Install dependencies:**

   ```powershell
   cd frontend
   npm install
   ```

2. **Start development server:**

   ```powershell
   npm run dev
   ```

3. **Access the app:**
   Open `http://localhost:5173` in your browser

## Requirements

Make sure the backend services are running:

- API Gateway: `http://localhost:3000`
- User Service: `http://localhost:3001`
- Payment Service: `http://localhost:3002`

## API Integration

The frontend connects to the API Gateway at `http://localhost:3000` and uses the following endpoints:

### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Wallet

- `GET /api/wallets/balance` - Get wallet balance
- `POST /api/wallets/topup` - Top up wallet

### Transactions

- `GET /api/transactions/history` - Get transaction history
- `POST /api/transactions/payment` - Send payment

## Development

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Default Credentials

- Username: `admin`
- Password: `admin123`

Or register a new account using the registration form.
