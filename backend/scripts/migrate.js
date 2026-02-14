const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runMigrations() {
  // Connection config from environment variables
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL_ENABLED === 'true' ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
    } : false
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration: 001_initial_schema.sql');
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Database schema created:');
    console.log('   - users table');
    console.log('   - shopping_lists table');
    console.log('   - list_members table');
    console.log('   - list_items table');
    console.log('   - common_items table');
    console.log('\n🎉 Your database is ready to use!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your DATABASE_URL in .env file');
    console.error('2. Verify database credentials are correct');
    console.error('3. Ensure DB_SSL_ENABLED is set correctly (true for cloud, false for local)');
    console.error('4. For cloud databases, check IP whitelisting');
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
