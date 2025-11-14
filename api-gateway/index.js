require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Service URLs
const services = {
  userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  paymentService: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002',
};

// Dummy user database (in production, use real database)
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$rqFz8K7W7W7W7W7W7W7W7.W7W7W7W7W7W7W7W7W7W7W7W7W7W7',
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

// Login endpoint
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Username and password are required',
    });
  }

  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
    });
  }

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

  res.json({
    success: true,
    token: token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
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

// Public health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    services: Object.keys(services),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway with JWT running on port ${PORT}`);
  console.log(`Login endpoint: http://localhost:${PORT}/auth/login`);
  console.log(`User Service: ${services.userService}`);
  console.log(`Payment Service: ${services.paymentService}`);
});
