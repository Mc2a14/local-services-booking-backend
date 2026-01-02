const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables manually
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migrations...');
    
    // First, ensure we have a migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Run main schema.sql first (contains initial structure)
    console.log('📄 Running main schema...');
    const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    try {
      await client.query(schemaSQL);
    } catch (error) {
      // If schema already exists or column/index issues, that's OK - migrations will handle it
      if (error.code === '42P07' || // duplicate_table
          error.code === '42710' || // duplicate_object
          error.code === '42701' || // duplicate_column
          error.code === '42P16' || // invalid_table_definition
          error.message.includes('already exists') ||
          error.message.includes('does not exist') ||
          error.message.includes('duplicate')) {
        console.log('⚠️  Schema objects may already exist or need migration (safe to ignore, migrations will handle)');
      } else {
        // For other errors, log but continue - migrations will fix schema issues
        console.log('⚠️  Schema execution had issues (migrations will handle):', error.message);
      }
    }
    
    // Run individual migration files
    const migrationsDir = path.join(__dirname, 'src', 'db', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run in alphabetical order
    
    for (const file of migrationFiles) {
      // Check if migration has already been run
      const checkResult = await client.query(
        'SELECT filename FROM schema_migrations WHERE filename = $1',
        [file]
      );
      
      if (checkResult.rows.length > 0) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`📝 Running migration: ${file}`);
      const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        await client.query('BEGIN');
        await client.query(migrationSQL)