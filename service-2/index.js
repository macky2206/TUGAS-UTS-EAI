require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const { body, param, validationResult } = require('express-validator');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 3002;
const SERVICE_NAME = process.env.SERVICE_NAME || 'payment-service';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

// Configure axios with retry logic
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status >= 500;
  },
});

// Initialize SQLite database
const db = new sqlite3.Database('./transactions.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Create tables
function initializeDatabase() {
  // First, check if we need to recreate the table for the new schema
  db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions'", (err, row) => {
    if (row && row.sql && !row.sql.includes("'payment'")) {
      console.log('Migrating transactions table to new schema...');
      db.run('DROP TABLE IF EXISTS transactions', (err) => {
        if (err) {
          console.error('Error dropping old table:', err.message);
        } else {
          createTransactionsTable();
        }
      });
    } else {
      createTransactionsTable();
    }
  });
}

function createTransactionsTable() {
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sender_id INTEGER,
    recipient_id INTEGER,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('credit', 'debit', 'payment', 'topup')),
    status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed')),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Transactions table ready');
      
      // Check and add new columns if they don't exist
      db.all("PRAGMA table_info(transactions)", [], (err, columns) => {
        if (!err) {
          const columnNames = columns.map(col => col.name);
          
          if (!columnNames.includes('sender_id')) {
            db.run('ALTER TABLE transactions ADD COLUMN sender_id INTEGER', (err) => {
              if (err) console.error('Error adding sender_id:', err.message);
            });
          }
          if (!columnNames.includes('recipient_id')) {
            db.run('ALTER TABLE transactions ADD COLUMN recipient_id INTEGER', (err) => {
              if (err) console.error('Error adding recipient_id:', err.message);
            });
          }
          if (!columnNames.includes('status')) {
            db.run('ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT "completed"', (err) => {
              if (err) console.error('Error adding status:', err.message);
            });
          }
        }
      });
      
      // Insert sample data if table is empty
      db.get('SELECT COUNT(*) as count FROM transactions', (err, row) => {
        if (!err && row.count === 0) {
          const sampleTransactions = [
            [1, null, 1, 50000, 'topup', 'completed', 'Initial top up']
          ];
          const stmt = db.prepare('INSERT INTO transactions (user_id, sender_id, recipient_id, amount, type, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
          sampleTransactions.forEach(transaction => stmt.run(transaction));
          stmt.finalize();
          console.log('Sample transactions inserted');
        }
      });
    }
  });
}

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Payment Service API',
      version: '1.0.0',
      description: 'REST API service for managing transactions with User Service integration',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Transaction: {
          type: 'object',
          required: ['user_id', 'amount', 'type'],
          properties: {
            id: {
              type: 'integer',
              description: 'Auto-generated transaction ID',
            },
            user_id: {
              type: 'integer',
              description: 'Associated user ID',
            },
            amount: {
              type: 'number',
              format: 'float',
              description: 'Transaction amount',
            },
            type: {
              type: 'string',
              enum: ['credit', 'debit'],
              description: 'Transaction type',
            },
            description: {
              type: 'string',
              description: 'Transaction description',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
      },
    },
  },
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get all transactions
 *     description: Retrieve a list of all transactions from the database
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 */
app.get('/transactions', (req, res) => {
  db.all('SELECT * FROM transactions ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        error: 'Failed to fetch transactions',
        details: err.message,
      });
    }
    res.json({
      success: true,
      data: rows,
    });
  });
});

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     description: Retrieve a single transaction by its ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction found
 *       404:
 *         description: Transaction not found
 */
app.get('/transactions/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validateRequest
], (req, res) => {
  db.get('SELECT * FROM transactions WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        error: 'Failed to fetch transaction',
        details: err.message,
      });
    }
    if (!row) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }
    res.json({
      success: true,
      data: row,
    });
  });
});

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create new transaction
 *     description: Create a new transaction after verifying user exists in User Service
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - amount
 *               - type
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 1
 *               amount:
 *                 type: number
 *                 format: float
 *                 example: 50.0
 *               type:
 *                 type: string
 *                 enum: [credit, debit]
 *                 example: credit
 *               description:
 *                 type: string
 *                 example: Test transaction
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       503:
 *         description: User service unavailable
 */
app.post('/transactions', [
  body('user_id').isInt().withMessage('user_id must be an integer'),
  body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number'),
  body('type').isIn(['credit', 'debit']).withMessage('type must be credit or debit'),
  body('description').optional().trim(),
  validateRequest
], async (req, res) => {
  const { user_id, amount, type, description } = req.body;

  try {
    // Verify user exists by calling user service with retry logic
    const userResponse = await axios.get(`${USER_SERVICE_URL}/users/${user_id}`, {
      timeout: 5000,
    });

    if (!userResponse.data.success) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Create transaction in database
    db.run(
      'INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
      [user_id, amount, type, description || ''],
      function (err) {
        if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({
            error: 'Failed to create transaction',
            details: err.message,
          });
        }

        db.get('SELECT * FROM transactions WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            return res.status(500).json({
              error: 'Transaction created but failed to retrieve',
            });
          }
          res.status(201).json({
            success: true,
            data: row,
            user: userResponse.data.data,
          });
        });
      }
    );
  } catch (error) {
    console.error('Error verifying user:', error.message);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        error: 'User service unavailable',
        details: 'Cannot connect to user service',
      });
    }
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.status(500).json({
      error: 'Failed to verify user',
      details: error.message,
    });
  }
});

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Update transaction
 *     description: Update an existing transaction's information
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [credit, debit]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       404:
 *         description: Transaction not found
 */
app.put('/transactions/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  body('type').optional().isIn(['credit', 'debit']).withMessage('type must be credit or debit'),
  body('description').optional().trim(),
  validateRequest
], (req, res) => {
  const { type, description } = req.body;
  const updates = [];
  const values = [];

  if (type) {
    updates.push('type = ?');
    values.push(type);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      error: 'No fields to update',
    });
  }

  values.push(req.params.id);
  const query = `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`;

  db.run(query, values, function (err) {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        error: 'Failed to update transaction',
        details: err.message,
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }

    db.get('SELECT * FROM transactions WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).json({
          error: 'Transaction updated but failed to retrieve',
        });
      }
      res.json({
        success: true,
        data: row,
      });
    });
  });
});

// Internal endpoint: Get user by ID (for gateway forwarding)
app.get('/internal/users/:id', async (req, res) => {
  try {
    const userResponse = await axios.get(
      `${USER_SERVICE_URL}/users/${req.params.id}`,
      { timeout: 5000 }
    );
    res.json(userResponse.data);
  } catch (error) {
    console.error('Error fetching user:', error.message);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        error: 'User service unavailable',
      });
    }
    
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch user',
      details: error.message,
    });
  }
});

/**
 * @swagger
 * /transactions/history:
 *   get:
 *     summary: Get transaction history
 *     description: Get all transactions for the authenticated user
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of transactions to return
 *     responses:
 *       200:
 *         description: Transaction history retrieved
 */
app.get('/transactions/history', (req, res) => {
  const userId = req.headers['x-user-id'];
  const limit = parseInt(req.query.limit) || 100;

  console.log(`Transaction history request: userId=${userId}, limit=${limit}, headers:`, req.headers);

  if (!userId) {
    console.log('ERROR: No user ID in request');
    return res.status(400).json({
      error: 'User ID required',
    });
  }

  const query = `
    SELECT * FROM transactions 
    WHERE sender_id = ? OR recipient_id = ? OR user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `;

  db.all(query, [userId, userId, userId, limit], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        error: 'Failed to fetch transactions',
        details: err.message,
      });
    }
    console.log(`Found ${rows.length} transactions for user ${userId}`);
    res.json({
      success: true,
      transactions: rows,
      count: rows.length,
    });
  });
});

/**
 * @swagger
 * /transactions/payment:
 *   post:
 *     summary: Send payment
 *     description: Send payment from authenticated user to another user
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - amount
 *             properties:
 *               recipientId:
 *                 type: integer
 *                 example: 2
 *               amount:
 *                 type: number
 *                 format: float
 *                 example: 50000
 *               description:
 *                 type: string
 *                 example: Payment for services
 *     responses:
 *       201:
 *         description: Payment successful
 *       400:
 *         description: Invalid request or insufficient balance
 *       404:
 *         description: Recipient not found
 */
app.post('/transactions/payment', [
  body('recipientId').isInt().withMessage('recipientId must be an integer'),
  body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number'),
  body('description').optional().trim(),
  validateRequest
], async (req, res) => {
  const senderId = req.headers['x-user-id'];
  const { recipientId, amount, description } = req.body;

  if (!senderId) {
    return res.status(401).json({
      error: 'User ID required',
    });
  }

  if (parseInt(senderId) === parseInt(recipientId)) {
    return res.status(400).json({
      error: 'Cannot send payment to yourself',
    });
  }

  try {
    // Verify sender exists and has sufficient balance
    const senderResponse = await axios.get(`${USER_SERVICE_URL}/users/${senderId}`, {
      timeout: 5000,
    });

    if (!senderResponse.data.success) {
      return res.status(404).json({
        error: 'Sender not found',
      });
    }

    const senderBalance = senderResponse.data.data.balance || 0;
    if (senderBalance < amount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        current_balance: senderBalance,
        required: amount,
      });
    }

    // Verify recipient exists
    const recipientResponse = await axios.get(`${USER_SERVICE_URL}/users/${recipientId}`, {
      timeout: 5000,
    });

    if (!recipientResponse.data.success) {
      return res.status(404).json({
        error: 'Recipient not found',
      });
    }

    // Deduct from sender
    const newSenderBalance = senderBalance - amount;
    await axios.put(
      `${USER_SERVICE_URL}/users/${senderId}`,
      { balance: newSenderBalance },
      { timeout: 5000 }
    );

    // Add to recipient
    const recipientBalance = recipientResponse.data.data.balance || 0;
    const newRecipientBalance = recipientBalance + amount;
    await axios.put(
      `${USER_SERVICE_URL}/users/${recipientId}`,
      { balance: newRecipientBalance },
      { timeout: 5000 }
    );

    // Create transaction record
    db.run(
      `INSERT INTO transactions (user_id, sender_id, recipient_id, amount, type, status, description) 
       VALUES (?, ?, ?, ?, 'payment', 'completed', ?)`,
      [senderId, senderId, recipientId, amount, description || 'Payment'],
      function (err) {
        if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({
            error: 'Payment processed but failed to record transaction',
            details: err.message,
          });
        }

        res.status(201).json({
          success: true,
          message: 'Payment successful',
          transaction: {
            id: this.lastID,
            sender_id: senderId,
            recipient_id: recipientId,
            amount: amount,
            type: 'payment',
            status: 'completed',
            description: description || 'Payment',
            new_balance: newSenderBalance,
          },
        });
      }
    );
  } catch (error) {
    console.error('Payment error:', error.message);

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        error: 'User service unavailable',
        details: 'Cannot connect to user service',
      });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.status(500).json({
      error: 'Payment failed',
      details: error.message,
    });
  }
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the service is running and can connect to dependencies
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    database: 'unknown',
    user_service: 'unknown',
  };

  // Check database
  try {
    await new Promise((resolve, reject) => {
      db.get('SELECT 1', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    health.database = 'connected';
  } catch (err) {
    health.database = 'disconnected';
    health.status = 'unhealthy';
  }

  // Check user service
  try {
    await axios.get(`${USER_SERVICE_URL}/health`, { timeout: 3000 });
    health.user_service = 'reachable';
  } catch (err) {
    health.user_service = 'unreachable';
    health.status = 'degraded';
  }

  res.json(health);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
  console.log(`User Service: ${USER_SERVICE_URL}`);
  console.log(`API docs: http://localhost:${PORT}/api-docs`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
