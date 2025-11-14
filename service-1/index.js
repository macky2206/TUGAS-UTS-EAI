require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const { body, param, validationResult } = require('express-validator');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME || 'user-service';

// Initialize SQLite database
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Create tables
function initializeDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Users table ready');
      // Check if balance column exists, add if not
      db.all("PRAGMA table_info(users)", [], (err, columns) => {
        if (!err) {
          const hasBalance = columns.some(col => col.name === 'balance');
          if (!hasBalance) {
            db.run('ALTER TABLE users ADD COLUMN balance REAL DEFAULT 0', (err) => {
              if (err) console.error('Error adding balance column:', err.message);
              else console.log('Balance column added');
            });
          }
        }
      });
      
      // Insert sample data if table is empty
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (!err && row.count === 0) {
          const sampleUsers = [
            ['John Doe', 'john@example.com', 100000],
            ['Jane Smith', 'jane@example.com', 50000]
          ];
          const stmt = db.prepare('INSERT INTO users (name, email, balance) VALUES (?, ?, ?)');
          sampleUsers.forEach(user => stmt.run(user));
          stmt.finalize();
          console.log('Sample users inserted with initial balance');
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
      title: 'User Service API',
      version: '1.0.0',
      description: 'REST API service for managing users with SQLite database',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            id: {
              type: 'integer',
              description: 'Auto-generated user ID',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
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
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users from the database
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
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
 *                     $ref: '#/components/schemas/User'
 */
app.get('/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        error: 'Failed to fetch users',
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
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a single user by their ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
app.get('/users/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validateRequest
], (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        error: 'Failed to fetch user',
        details: err.message,
      });
    }
    if (!row) {
      return res.status(404).json({
        error: 'User not found',
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
 * /users:
 *   post:
 *     summary: Create new user
 *     description: Create a new user in the database
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
app.post('/users', [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  validateRequest
], (req, res) => {
  const { name, email } = req.body;

  db.run(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({
            error: 'Email already exists',
          });
        }
        console.error('Database error:', err.message);
        return res.status(500).json({
          error: 'Failed to create user',
          details: err.message,
        });
      }

      db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({
            error: 'User created but failed to retrieve',
          });
        }
        res.status(201).json({
          success: true,
          data: row,
        });
      });
    }
  );
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update an existing user's information
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
app.put('/users/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('balance').optional().isFloat({ min: 0 }).withMessage('Balance must be a positive number'),
  validateRequest
], (req, res) => {
  const { name, email, balance } = req.body;
  const updates = [];
  const values = [];

  if (name) {
    updates.push('name = ?');
    values.push(name);
  }
  if (email) {
    updates.push('email = ?');
    values.push(email);
  }
  if (balance !== undefined) {
    updates.push('balance = ?');
    values.push(balance);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      error: 'No fields to update',
    });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);

  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

  db.run(query, values, function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({
          error: 'Email already exists',
        });
      }
      console.error('Database error:', err.message);
      return res.status(500).json({
        error: 'Failed to update user',
        details: err.message,
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).json({
          error: 'User updated but failed to retrieve',
        });
      }
      res.json({
        success: true,
        data: row,
      });
    });
  });
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Delete a user from the database
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
app.delete('/users/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validateRequest
], (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({
        error: 'Failed to fetch user',
      });
    }
    if (!row) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          error: 'Failed to delete user',
          details: err.message,
        });
      }

      res.json({
        success: true,
        data: row,
      });
    });
  });
});

/**
 * @swagger
 * /wallets/balance:
 *   get:
 *     summary: Get user balance
 *     description: Get current wallet balance for authenticated user
 *     tags: [Wallet]
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 */
app.get('/wallets/balance', (req, res) => {
  const userId = req.headers['x-user-id'];
  const username = req.headers['x-user-username'] || 'User';
  
  if (!userId) {
    return res.status(401).json({
      error: 'User ID required',
    });
  }

  db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        error: 'Failed to fetch balance',
        details: err.message,
      });
    }
    if (!row) {
      // Auto-create user if doesn't exist
      const email = `${username}@ewallet.com`;
      db.run(
        'INSERT OR IGNORE INTO users (id, name, email, balance) VALUES (?, ?, ?, 0)',
        [userId, username, email],
        function (err) {
          if (err) {
            console.error('Error creating user:', err.message);
            return res.status(500).json({
              error: 'Failed to create user',
              details: err.message,
            });
          }
          console.log(`Auto-created user: ${username} (ID: ${userId})`);
          res.json({
            success: true,
            balance: 0,
          });
        }
      );
      return;
    }
    res.json({
      success: true,
      balance: row.balance || 0,
    });
  });
});

/**
 * @swagger
 * /wallets/topup:
 *   post:
 *     summary: Top up wallet
 *     description: Add funds to user's wallet balance
 *     tags: [Wallet]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 example: 100000
 *     responses:
 *       200:
 *         description: Top up successful
 *       400:
 *         description: Invalid amount
 */
app.post('/wallets/topup', [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  validateRequest
], (req, res) => {
  const userId = req.headers['x-user-id'];
  const username = req.headers['x-user-username'] || 'User';
  const { amount } = req.body;

  console.log(`Topup request: userId=${userId}, username=${username}, amount=${amount}`);

  if (!userId) {
    return res.status(401).json({
      error: 'User ID required',
    });
  }

  db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      return res.status(500).json({
        error: 'Failed to fetch balance',
      });
    }
    if (!row) {
      // Auto-create user if doesn't exist, then do topup
      const email = `${username}@ewallet.com`;
      db.run(
        'INSERT OR IGNORE INTO users (id, name, email, balance) VALUES (?, ?, ?, ?)',
        [userId, username, email, amount],
        function (err) {
          if (err) {
            console.error('Error creating user:', err.message);
            return res.status(500).json({
              error: 'Failed to create user',
              details: err.message,
            });
          }
          console.log(`Auto-created user: ${username} (ID: ${userId}) with balance: ${amount}`);
          res.json({
            success: true,
            message: 'Top up successful',
            new_balance: amount,
            amount_added: amount,
          });
        }
      );
      return;
    }

    const newBalance = (row.balance || 0) + amount;

    db.run(
      'UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newBalance, userId],
      function (err) {
        if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({
            error: 'Failed to update balance',
            details: err.message,
          });
        }

        res.json({
          success: true,
          message: 'Top up successful',
          new_balance: newBalance,
          amount_added: amount,
        });
      }
    );
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the service is running
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get('/health', (req, res) => {
  db.get('SELECT 1', (err) => {
    res.json({
      status: err ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      service: SERVICE_NAME,
      database: err ? 'disconnected' : 'connected',
    });
  });
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
  console.log(`API docs: http://localhost:${PORT}/api-docs`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
