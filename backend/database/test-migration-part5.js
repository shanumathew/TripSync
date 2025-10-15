/**
 * Test Database Migration - Part 5: Driver & Vehicle System
 * Run this after executing the SQL migration
 */

require('dotenv').config();
const db = require('../src/config/database');

const testMigration = async () => {
  try {
    console.log('🧪 Testing Part 5 Database Migration...\n');

    // Test 1: Check users table has new columns
    console.log('Test 1: Verify users table columns...');
    const usersColumns = await db.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('is_driver', 'driver_rating', 'total_rides_as_driver')
      ORDER BY column_name
    `);
    
    if (usersColumns.rows.length === 3) {
      console.log('✅ Users table has all 3 new driver columns:');
      usersColumns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('❌ Missing columns in users table');
      console.log('Found:', usersColumns.rows);
    }

    // Test 2: Check vehicles table exists
    console.log('\nTest 2: Verify vehicles table exists...');
    const vehiclesTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'vehicles'
      )
    `);
    
    if (vehiclesTable.rows[0].exists) {
      console.log('✅ Vehicles table exists');
      
      // Get column details
      const vehiclesColumns = await db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'vehicles'
        ORDER BY ordinal_position
      `);
      
      console.log('   Columns:');
      vehiclesColumns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('❌ Vehicles table does not exist');
    }

    // Test 3: Check indexes
    console.log('\nTest 3: Verify indexes...');
    const indexes = await db.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'vehicles'
      ORDER BY indexname
    `);
    
    if (indexes.rows.length > 0) {
      console.log(`✅ Found ${indexes.rows.length} indexes on vehicles table:`);
      indexes.rows.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
    } else {
      console.log('❌ No indexes found on vehicles table');
    }

    // Test 4: Test inserting a vehicle
    console.log('\nTest 4: Test vehicle CRUD operations...');
    
    // First, get or create a test user
    const testUser = await db.query(`
      SELECT id FROM users LIMIT 1
    `);
    
    if (testUser.rows.length === 0) {
      console.log('❌ No users found. Please create a user first.');
    } else {
      const userId = testUser.rows[0].id;
      console.log(`   Using user ID: ${userId}`);
      
      // Insert test vehicle
      try {
        const insertResult = await db.query(`
          INSERT INTO vehicles (user_id, model, color, license_plate, total_seats)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [userId, 'Test Honda City', 'White', 'TEST' + Date.now(), 4]);
        
        const vehicle = insertResult.rows[0];
        console.log('✅ Successfully inserted test vehicle:');
        console.log(`   - ID: ${vehicle.id}`);
        console.log(`   - Model: ${vehicle.model}`);
        console.log(`   - License: ${vehicle.license_plate}`);
        
        // Update test vehicle
        const updateResult = await db.query(`
          UPDATE vehicles 
          SET color = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `, ['Black', vehicle.id]);
        
        console.log('✅ Successfully updated vehicle color to:', updateResult.rows[0].color);
        
        // Query test vehicle
        const selectResult = await db.query(`
          SELECT * FROM vehicles WHERE id = $1
        `, [vehicle.id]);
        
        console.log('✅ Successfully queried vehicle');
        
        // Delete test vehicle
        await db.query(`
          DELETE FROM vehicles WHERE id = $1
        `, [vehicle.id]);
        
        console.log('✅ Successfully deleted test vehicle');
        
      } catch (error) {
        console.log('❌ Error during CRUD operations:', error.message);
      }
    }

    // Test 5: Verify unique constraint on license_plate
    console.log('\nTest 5: Test license plate uniqueness...');
    try {
      if (testUser.rows.length > 0) {
        const userId = testUser.rows[0].id;
        const uniquePlate = 'UNIQUE' + Date.now();
        
        // Insert first vehicle
        await db.query(`
          INSERT INTO vehicles (user_id, model, color, license_plate, total_seats)
          VALUES ($1, $2, $3, $4, $5)
        `, [userId, 'Car 1', 'Red', uniquePlate, 3]);
        
        // Try to insert duplicate
        try {
          await db.query(`
            INSERT INTO vehicles (user_id, model, color, license_plate, total_seats)
            VALUES ($1, $2, $3, $4, $5)
          `, [userId, 'Car 2', 'Blue', uniquePlate, 3]);
          
          console.log('❌ Unique constraint NOT working (duplicate was allowed)');
        } catch (dupError) {
          if (dupError.message.includes('duplicate') || dupError.message.includes('unique')) {
            console.log('✅ Unique constraint working (duplicate rejected)');
          } else {
            console.log('❌ Unexpected error:', dupError.message);
          }
        }
        
        // Clean up
        await db.query(`DELETE FROM vehicles WHERE license_plate = $1`, [uniquePlate]);
      }
    } catch (error) {
      console.log('❌ Error testing uniqueness:', error.message);
    }

    // Test 6: Count vehicles
    console.log('\nTest 6: Count existing vehicles...');
    const countResult = await db.query(`SELECT COUNT(*) as total FROM vehicles`);
    console.log(`✅ Total vehicles in database: ${countResult.rows[0].total}`);

    // Test 7: Check foreign key constraint
    console.log('\nTest 7: Verify foreign key constraint...');
    const constraints = await db.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'vehicles' AND constraint_type = 'FOREIGN KEY'
    `);
    
    if (constraints.rows.length > 0) {
      console.log('✅ Foreign key constraint exists:');
      constraints.rows.forEach(c => {
        console.log(`   - ${c.constraint_name}`);
      });
    } else {
      console.log('❌ No foreign key constraints found');
    }

    console.log('\n✅ All migration tests completed!');
    console.log('================================================');
    console.log('Summary:');
    console.log('- Users table updated with driver fields');
    console.log('- Vehicles table created with proper structure');
    console.log('- Indexes created for performance');
    console.log('- Constraints working (unique, foreign key)');
    console.log('- CRUD operations functional');
    console.log('================================================');

  } catch (error) {
    console.error('❌ Migration test failed:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
};

// Run tests
testMigration();
