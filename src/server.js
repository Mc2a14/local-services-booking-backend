const fs = require('fs');
const path = require('path');
const app = require('./app');
const config = require('./config');
const { pool } = require('./db');

// Run database migrations if enabled
const runMigrations = async () => {
  if (process.env.RUN_MIGRATIONS !== 'true') {
    return;
  }

  try {
    console.log('🔄 Running database migrations...');
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Create UUID extension first (needs to be in separate query)
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    } catch (err) {
      // Ignore if extension already exists or can't be created (some databases have it by default)
      if (!err.message.includes('already exists')) {
        console.log('⚠️  Could not create uuid-ossp extension (may already exist or not available)');
      }
    }
    
    // Remove CREATE EXTENSION line from schema SQL since we handle it separately
    // Execute the rest of the schema SQL
    const schemaWithoutExtension = schemaSQL.replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/gi, '');
    
    // PostgreSQL handles IF NOT EXISTS gracefully
    await pool.query(schemaWithoutExtension);
    
    // Run guest bookings migration
    try {
      const guestMigrationPath = path.join(__dirname, 'db', 'migrations', 'add_guest_bookings.sql');
      if (fs.existsSync(guestMigrationPath)) {
        const guestMigrationSQL = fs.readFileSync(guestMigrationPath, 'utf8');
        await pool.query(guestMigrationSQL);
        console.log('✅ Guest bookings migration completed');
      }
    } catch (err) {
      // Ignore if columns already exist
      if (!err.message.includes('already exists') && !err.code === '42701') {
        console.log('⚠️  Guest bookings migration:', err.message);
      }
    }

    // Run email error field migration
    try {
      const emailMigrationPath = path.join(__dirname, 'db', 'migrations', 'add_email_error_field.sql');
      if (fs.existsSync(emailMigrationPath)) {
        const emailMigrationSQL = fs.readFileSync(emailMigrationPath, 'utf8');
        await pool.query(emailMigrationSQL);
        console.log('✅ Email error field migration completed');
      }
    } catch (err) {
      // Ignore if column already exists
      if (!err.message.includes('already exists') && err.code !== '42701') {
        console.log('⚠️  Email error field migration:', err.message);
      }
    }

    // Run provider email config migration
    try {
      const providerEmailMigrationPath = path.join(__dirname, 'db', 'migrations', 'add_provider_email_config.sql');
      if (fs.existsSync(providerEmailMigrationPath)) {
        const providerEmailMigrationSQL = fs.readFileSync(providerEmailMigrationPath, 'utf8');
        await pool.query(providerEmailMigrationSQL);
        console.log('✅ Provider email config migration completed');
      }
    } catch (err) {
      // Ignore if columns already exist
      if (!err.message.includes('already exists') && err.code !== '42701') {
        console.log('⚠️  Provider email config migration:', err.message);
      }
    }

    // Run business slug migration
    try {
      const businessSlugMigrationPath = path.join(__dirname, 'db', 'migrations', 'add_business_slug.sql');
      if (fs.existsSync(businessSlugMigrationPath)) {
        const businessSlugMigrationSQL = fs.readFileSync(businessSlugMigrationPath, 'utf8');
        await pool.query(businessSlugMigrationSQL);
        console.log('✅ Business slug migration completed');
      }
    } catch (err) {
      // Ignore if columns already exist
      if (!err.message.includes('already exists') && err.code !== '42701') {
        console.log('⚠️  Business slug migration:', err.message);
      }
    }

    // Run business image migration
    try {
      const businessImageMigrationPath = path.join(__dirname, 'db', 'migrations', 'add_business_image.sql');
      if (fs.existsSync(businessImageMigrationPath)) {
        const businessImageMigrationSQL = fs.readFileSync(businessImageMigrationPath, 'utf8');
        await pool.query(businessImageMigrationSQL);
        console.log('✅ Business image migration completed');
      }
    } catch (err) {
      // Ignore if columns already exist
      if (!err.message.includes('already exists') && err.code !== '42701') {
        console.log('⚠️  Business image migration:', err.message);
      }
    }

    // Fix business image column type (change VARCHAR(500) to TEXT if needed)
    try {
      const fixBusinessImageTypePath = path.join(__dirname, 'db', 'migrations', 'fix_business_image_type.sql');
      if (fs.existsSync(fixBusinessImageTypePath)) {
        const fixBusinessImageTypeSQL = fs.readFileSync(fixBusinessImageTypePath, 'utf8');
        await pool.query(fixBusinessImageTypeSQL);
        console.log('✅ Business image type fix migration completed');
      }
    } catch (err) {
      // Ignore if already TEXT type or column doesn't exist
      if (!err.message.includes('type') && !err.message.includes('does not exist') && err.code !== '42704') {
        console.log('⚠️  Business image type fix migration:', err.message);
      }
    }
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    // Check if error is about things already existing (safe to ignore)
    if (error.code === '42P07' || // duplicate_table
        error.code === '42710' || // duplicate_object
        error.message.includes('already exists')) {
      console.log('ℹ️  Some database objects already exist (this is OK if migrations ran before)');
      console.log('✅ Database migrations completed successfully');
      return;
    }
    
    // For other errors, show details and exit
    console.error('❌ Database migration failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.detail);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await runMigrations();
  
  const PORT = config.port;
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
  });
  
  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    console.log(`${signal} signal received: closing HTTP server`);
    
    server.close(async () => {
      console.log('HTTP server closed');
      await pool.end();
      console.log('Database pool closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  return server;
};

const server = startServer();

module.exports = server;


