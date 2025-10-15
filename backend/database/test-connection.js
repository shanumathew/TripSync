// Test Database Connection
// Run this file to verify your database setup
// Command: node database/test-connection.js

require('dotenv').config();
const { pool } = require('../src/config/database');

const testConnection = async () => {
  console.log('\n🔍 Testing Database Connection...\n');
  
  try {
    // Test 1: Basic connection
    console.log('Test 1: Connecting to database...');
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Connection successful!');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Database: PostgreSQL`);
    console.log('');

    // Test 2: Check if tables exist
    console.log('Test 2: Checking if tables exist...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const expectedTables = ['users', 'rides', 'matches', 'messages', 'user_ratings'];
    const foundTables = tables.rows.map(row => row.table_name);
    
    console.log('   Expected tables:', expectedTables.join(', '));
    console.log('   Found tables:', foundTables.join(', '));
    
    const allTablesExist = expectedTables.every(table => foundTables.includes(table));
    
    if (allTablesExist) {
      console.log('✅ All tables exist!');
    } else {
      const missingTables = expectedTables.filter(table => !foundTables.includes(table));
      console.log('⚠️  Missing tables:', missingTables.join(', '));
      console.log('   Run the schema.sql file in Supabase SQL Editor');
    }
    console.log('');

    // Test 3: Check table structure
    if (allTablesExist) {
      console.log('Test 3: Checking table structures...');
      
      // Check users table
      const usersCols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);
      console.log(`   users table: ${usersCols.rows.length} columns`);
      
      // Check rides table
      const ridesCols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'rides'
        ORDER BY ordinal_position;
      `);
      console.log(`   rides table: ${ridesCols.rows.length} columns`);
      
      // Check matches table
      const matchesCols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'matches'
        ORDER BY ordinal_position;
      `);
      console.log(`   matches table: ${matchesCols.rows.length} columns`);
      
      console.log('✅ Table structures verified!');
      console.log('');
    }

    // Test 4: Check indexes
    console.log('Test 4: Checking indexes...');
    const indexes = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%';
    `);
    console.log(`✅ Found ${indexes.rows.length} custom indexes`);
    console.log('');

    // Test 5: Check triggers
    console.log('Test 5: Checking triggers...');
    const triggers = await pool.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public';
    `);
    console.log(`✅ Found ${triggers.rows.length} triggers`);
    console.log('');

    // Final summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 DATABASE SETUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Connection: Working');
    console.log(`✅ Tables: ${foundTables.length} created`);
    console.log(`✅ Indexes: ${indexes.rows.length} created`);
    console.log(`✅ Triggers: ${triggers.rows.length} created`);
    console.log('');
    console.log('🚀 Ready to continue with Part 2: Models!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Database Connection Error:\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to database. Please check:');
      console.error('1. Is your DATABASE_URL correct in .env?');
      console.error('2. If using Supabase, is your project fully provisioned?');
      console.error('3. Is your database password correct?');
    } else if (error.message.includes('password authentication failed')) {
      console.error('Password authentication failed. Please check:');
      console.error('1. Is your password correct in DATABASE_URL?');
      console.error('2. Did you replace [YOUR-PASSWORD] with actual password?');
    } else if (error.message.includes('does not exist')) {
      console.error('Table does not exist. Please:');
      console.error('1. Run database/schema.sql in Supabase SQL Editor');
      console.error('2. Or follow SUPABASE_SETUP.md guide');
    } else {
      console.error('Error details:', error.message);
    }
    
    console.error('\n📖 See SUPABASE_SETUP.md for detailed setup instructions\n');
  } finally {
    await pool.end();
  }
};

// Run the test
testConnection();
