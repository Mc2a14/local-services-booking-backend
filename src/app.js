const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { query } = require('./db');

// Initialize Express app
const app = express();

// CORS configuration - allow frontend domain and handle preflight requests
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) or from the frontend domain
    const allowedOrigins = [
      'https://local-services-booking-frontend-production.up.railway.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080'
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
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

