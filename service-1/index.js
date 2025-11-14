require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME || 'user-service';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory user database (replace with SQLite or real DB in production)
let users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    created_at: new Date().toISOString(),
  },
];

let nextUserId = 3;

// GET /users - Get all users
app.get('/users', (req, res) => {
  res.json({
    success: true,
    data: users,
  });
});

// GET /users/:id - Get user by ID
app.get('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
    });
  }

  res.json({
    success: true,
    data: user,
  });
});

// POST /users - Create new user
app.post('/users', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      error: 'Name and email are required',
    });
  }

  const user = {
    id: nextUserId++,
    name,
    email,
    created_at: new Date().toISOString(),
  };

  users.push(user);

  res.status(201).json({
    success: true,
    data: user,
  });
});

// PUT /users/:id - Update user
app.put('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
    });
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;

  res.json({
    success: true,
    data: user,
  });
});

// DELETE /users/:id - Delete user
app.delete('/users/:id', (req, res) => {
  const index = users.findIndex((u) => u.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({
      error: 'User not found',
    });
  }

  const deletedUser = users.splice(index, 1);

  res.json({
    success: true,
    data: deletedUser[0],
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
  });
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/api-docs`);
});
