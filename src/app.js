const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { query } = require('./db');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
// Increase body size limit to handle base64-encoded images (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API routes
app.use('/api', routes);

// Health check route
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await query('SELECT NOW()');
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handling middleware - must be last
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;

