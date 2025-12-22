require('dotenv').config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is required');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL
};

