const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { query } = require('./db');

// Initialize Express app
const app = express();

// CORS configuration - allow frontend domain and handle preflight requests
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow requests from localhost (development)
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Allow requests from Railway domains
    if (origin.includes('.up.railway.app') || origin.includes('.railway.app')) {
      return callback(null, true);
    }
    
    // Allow requests from specific frontend domains
    const allowedOrigins = [
      'https://local-services-booking-frontend-production.up.railway.app', // Old Railway domain (keep for backwards compatibility)
      'https://atencio.app', // Custom domain
      'https://www.atencio.app' // www subdomain
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
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
  if (res.headers