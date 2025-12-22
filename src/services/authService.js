const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const config = require('../config');

// Register a new user
const registerUser = async (userData) => {
  const { email, password, full_name, phone, user_type } = userData;

  // Check if user already exists
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new Error('Email already registered');
  }

  // Hash password
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Insert user
  const result = await query(
    'INSERT INTO users (email, password_hash, full_name, phone, user_type) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, user_type, created_at',
    [email, password_hash, full_name, phone || null, user_type]
  );

  const user = result.rows[0];

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, user_type: user.user_type },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type
    },
    token
  };
};

// Login user
const loginUser = async (email, password) => {
  // Find user
  const result = await query(
    'SELECT id, email, password_hash, full_name, user_type FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, user_type: user.user_type },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type
    },
    token
  };
};

// Get user by ID
const getUserById = async (userId) => {
  const result = await query(
    'SELECT id, email, full_name, phone, user_type, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
};

module.exports = {
  registerUser,
  loginUser,
  getUserById
};

