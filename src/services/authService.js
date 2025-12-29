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

// Get user by email
const getUserByEmail = async (email) => {
  const result = await query(
    'SELECT id, email, full_name, phone, user_type, created_at FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

// Create password reset token
const createPasswordResetToken = async (userId) => {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

  // Invalidate any existing tokens for this user
  await query(
    'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND used_at IS NULL',
    [userId]
  );

  // Create new token
  await query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );

  return token;
};

// Verify password reset token
const verifyPasswordResetToken = async (token) => {
  const result = await query(
    `SELECT prt.user_id, prt.expires_at, prt.used_at, u.email, u.full_name
     FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id
     WHERE prt.token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired reset token');
  }

  const tokenData = result.rows[0];

  if (tokenData.used_at) {
    throw new Error('Reset token has already been used');
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    throw new Error('Reset token has expired');
  }

  return {
    userId: tokenData.user_id,
    email: tokenData.email,
    fullName: tokenData.full_name
  };
};

// Reset password using token
const resetPasswordWithToken = async (token, newPassword) => {
  // Verify token
  const tokenData = await verifyPasswordResetToken(token);

  // Hash new password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [passwordHash, tokenData.userId]
  );

  // Mark token as used
  await query(
    'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = $1',
    [token]
  );

  return tokenData;
};

// Change password (for logged-in users)
const changePassword = async (userId, currentPassword, newPassword) => {
  // Get user with password hash
  const result = await query(
    'SELECT id, password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Validate new password
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters');
  }

  // Hash new password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [passwordHash, userId]
  );
};

// Change email (for logged-in users)
const changeEmail = async (userId, newEmail, password) => {
  // Verify password first
  const result = await query(
    'SELECT id, password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Password is incorrect');
  }

  // Check if new email is already taken
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [newEmail]);
  if (existingUser.rows.length > 0 && existingUser.rows[0].id !== userId) {
    throw new Error('Email already registered');
  }

  // Update email
  await query(
    'UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newEmail, userId]
  );
};

// Verify email and phone for password reset (no email needed)
const verifyEmailAndPhoneForReset = async (email, phone) => {
  const result = await query(
    'SELECT id, email, phone, full_name FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('No account found with that email address');
  }

  const user = result.rows[0];

  // Normalize phone numbers for comparison
  // Remove spaces, dashes, parentheses, dots
  // Handles: +1-555-123-4567, (555) 123-4567, 5551234567, +1 555 123 4567, etc.
  const normalizePhone = (phone) => {
    if (!phone) return '';
    // Remove all formatting characters: spaces, dashes, parentheses, dots
    return phone.trim().replace(/[\s\-\(\)\.]/g, '');
  };

  const normalizedUserPhone = normalizePhone(user.phone || '');
  const normalizedInputPhone = normalizePhone(phone || '');

  // Check if phone matches
  // If user has a phone on file, it must match (with flexible country code handling)
  if (normalizedUserPhone) {
    if (!normalizedInputPhone) {
      // User has phone on file but didn't provide one
      throw new Error('Phone number is required for verification');
    }
    
    // Direct match
    if (normalizedUserPhone === normalizedInputPhone) {
      // Perfect match
    } else {
      // Try matching without country code
      // Remove leading +1 or + from both
      const userPhoneNoCountry = normalizedUserPhone.replace(/^\+1/, '').replace(/^\+/, '');
      const inputPhoneNoCountry = normalizedInputPhone.replace(/^\+1/, '').replace(/^\+/, '');
      
      // Compare without country codes
      if (userPhoneNoCountry && inputPhoneNoCountry && userPhoneNoCountry === inputPhoneNoCountry) {
        // Match when country codes are removed
      } else {
        // No match even after removing country codes
        throw new Error('Phone number does not match our records');
      }
    }
  }
  // If user has no phone on file, we allow verification (phone is optional)

  // If user has no phone on file, we still allow (phone is optional)
  // Return user ID for password reset
  return {
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    verified: true
  };
};

// Reset password after email/phone verification (direct reset, no token needed)
const resetPasswordAfterVerification = async (email, phone, newPassword) => {
  // Verify email and phone
  const verification = await verifyEmailAndPhoneForReset(email, phone);

  // Validate new password
  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Hash new password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [passwordHash, verification.userId]
  );

  return verification;
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  getUserByEmail,
  createPasswordResetToken,
  verifyPasswordResetToken,
  resetPasswordWithToken,
  changePassword,
  changeEmail,
  verifyEmailAndPhoneForReset,
  resetPasswordAfterVerification
};




