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
      // If schema already exists, that's OK
      if (error.code === '42P07' || error.message.includes('already exists')) {
        console.log('⚠️  Schema objects already exist (safe to ignore)');
      } else {
        throw error;
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
        await client.query(migrationSQL);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ Migration ${file} completed`);
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {}); // Ignore rollback errors
        
        // Check if error is because objects already exist (safe to ignore)
        if (error.code === '42P07' || // duplicate_table
            error.code === '42710' || // duplicate_object
            error.code === '42701' || // du