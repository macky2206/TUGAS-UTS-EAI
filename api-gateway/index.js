require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gateway',
      version: '1.0.0',
      description: 'Central API Gateway with JWT Authentication for UTS EAI Microservices',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              example: 'admin',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'admin123',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            token: {
              type: 'string',
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
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

// Service URLs
const services = {
  userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  paymentService: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002',
};

// Dummy user database (in production, use real database)
// Password: admin123 (hashed with bcrypt)
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$4/Zf28.UTfzNoyV35MFOHOQcz.3jg/tne6E6jcR9.mD5Z5jou4KRK', // admin123
    email: 'admin@ewallet.com',
    fullName: 'Administrator',
    role: 'admin',
  },
];

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Invalid or expired token.',
    });
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and receive JWT token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
app.post('/auth/login', [
  body('username').notEmpty().trim().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
], async (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
    });
  }

  try {
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`User ${username} logged in successfully`);

    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      details: error.message,
    });
  }
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     description: Create a new user account with hashed password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - fullName
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user exists
 */
app.post('/auth/register', [
  body('username').notEmpty().trim().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('fullName').notEmpty().trim().withMessage('Full name is required'),
  validateRequest
], async (req, res) => {
  const { username, password, email, fullName } = req.body;

  // Check if user already exists
  if (users.find((u) => u.username === username)) {
    return res.status(400).json({
      error: 'Username already exists',
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length + 1,
      username,
      password: hashedPassword,
      email,
      fullName,
      role: 'user',
    };

    users.push(newUser);

    const token = jwt.sign(
      {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`New user registered: ${username}`);

    res.status(201).json({
      success: true,
      token: token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      details: error.message,
    });
  }
});

// Proxy middleware with JWT forwarding
const createAuthProxy = (service) => {
  return createProxyMiddleware({
    target: services[service],
    changeOrigin: true,
    pathRewrite: {
      [`^/api/${service}`]: '',
    },
    onProxyReq: (proxyReq, req, res) => {
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
        proxyReq.setHeader('X-User-Username', req.user.username);
      }
    },
  });
};

// Protected routes
app.use('/api/user-service', authenticateJWT, createAuthProxy('userService'));
app.use('/api/payment-service', authenticateJWT, createAuthProxy('paymentService'));

// Wallet routes (proxy to user service)
app.use('/api/wallets', authenticateJWT, createProxyMiddleware({
  target: services.userService,
  changeOrigin: true,
  pathRewrite: {
    '^/api/wallets': '/wallets',
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
      proxyReq.setHeader('X-User-Username', req.user.username);
    }
    // Fix for POST requests with body
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
}));

// Transaction routes (proxy to payment service)
app.use('/api/transactions', authenticateJWT, createProxyMiddleware({
  target: services.paymentService,
  changeOrigin: true,
  pathRewrite: {
    '^/api/transactions': '/transactions',
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
      proxyReq.setHeader('X-User-Username', req.user.username);
    }
    // Fix for POST requests with body
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
}));

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verify JWT token
 *     description: Verify if the current JWT token is valid
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       403:
 *         description: Invalid or expired token
 */
app.get('/auth/verify', authenticateJWT, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     description: Get a new JWT token using current valid token
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: New token generated
 *       403:
 *         description: Invalid or expired token
 */
app.post('/auth/refresh', authenticateJWT, (req, res) => {
  const newToken = jwt.sign(
    {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token: newToken,
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if API Gateway and backend services are running
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: Service health status
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    services: {
      userService: services.userService,
      paymentService: services.paymentService,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down API Gateway gracefully...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`API Gateway with JWT running on port ${PORT}`);
  console.log(`Login endpoint: http://localhost:${PORT}/auth/login`);
  console.log(`API docs: http://localhost:${PORT}/api-docs`);
  console.log(`User Service: ${services.userService}`);
  console.log(`Payment Service: ${services.paymentService}`);
});
