require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;
const SERVICE_NAME = process.env.SERVICE_NAME || 'payment-service';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory transaction database (replace with SQLite or real DB in production)
let transactions = [
  {
    id: 1,
    user_id: 1,
    amount: 100.5,
    type: 'credit',
    description: 'Initial deposit',
    created_at: new Date().toISOString(),
  },
];

let nextTransactionId = 2;

// GET /transactions - Get all transactions
app.get('/transactions', (req, res) => {
  res.json({
    success: true,
    data: transactions,
  });
});

// GET /transactions/:id - Get transaction by ID
app.get('/transactions/:id', (req, res) => {
  const transaction = transactions.find(
    (t) => t.id === parseInt(req.params.id)
  );

  if (!transaction) {
    return res.status(404).json({
      error: 'Transaction not found',
    });
  }

  res.json({
    success: true,
    data: transaction,
  });
});

// POST /transactions - Create new transaction (calls user service)
app.post('/transactions', async (req, res) => {
  const { user_id, amount, type, description } = req.body;

  if (!user_id || !amount || !type) {
    return res.status(400).json({
      error: 'user_id, amount, and type are required',
    });
  }

  try {
    // Verify user exists by calling user service
    const userResponse = await axios.get(`${USER_SERVICE_URL}/users/${user_id}`);

    if (!userResponse.data.success) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const transaction = {
      id: nextTransactionId++,
      user_id,
      amount,
      type,
      description: description || '',
      created_at: new Date().toISOString(),
    };

    transactions.push(transaction);

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error verifying user:', error.message);
    res.status(500).json({
      error: 'Failed to verify user',
    });
  }
});

// PUT /transactions/:id - Update transaction
app.put('/transactions/:id', (req, res) => {
  const transaction = transactions.find((t) => t.id === parseInt(req.params.id));

  if (!transaction) {
    return res.status(404).json({
      error: 'Transaction not found',
    });
  }

  if (req.body.type) transaction.type = req.body.type;
  if (req.body.description) transaction.description = req.body.description;

  res.json({
    success: true,
    data: transaction,
  });
});

// Internal endpoint: Get user by ID (for gateway forwarding)
app.get('/internal/users/:id', async (req, res) => {
  try {
    const userResponse = await axios.get(
      `${USER_SERVICE_URL}/users/${req.params.id}`
    );
    res.json(userResponse.data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user',
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    user_service: USER_SERVICE_URL,
  });
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
  console.log(`User Service: ${USER_SERVICE_URL}`);
  console.log(`API docs: http://localhost:${PORT}/api-docs`);
});
