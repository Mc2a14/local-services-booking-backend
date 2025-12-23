const jwt = require('jsonwebtoken');
const config = require('../config');

// Verify JWT token and attach user to request
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, config.jwtSecret);
    
    req.user = decoded; // Attach user info (id, email, user_type) to request
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Optional: Middleware to check if user is a provider
const requireProvider = (req, res, next) => {
  if (req.user.user_type !== 'provider') {
    return res.status(403).json({ error: 'Provider access required' });
  }
  next();
};

// Optional: Middleware to check if user is a customer
const requireCustomer = (req, res, next) => {
  if (req.user.user_type !== 'customer') {
    return res.status(403).json({ error: 'Customer access required' });
  }
  next();
};

module.exports = {
  authenticate,
  requireProvider,
  requireCustomer
};


