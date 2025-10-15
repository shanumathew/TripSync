# Part 5: Driver & Vehicle System - Migration Guide

## 🎯 Overview
This migration adds driver functionality to TripSync by:
1. Adding driver fields to the users table
2. Creating a new vehicles table
3. Setting up proper indexes and constraints

---

## 📋 Pre-Migration Checklist

Before running the migration, ensure:
- ✅ Backend server is stopped
- ✅ Database backup is created (optional but recommended)
- ✅ You have access to Supabase SQL Editor
- ✅ You're connected to the correct database

---

## 🚀 Migration Steps

### Step 1: Run SQL Migration

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your TripSync project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Copy & Paste Migration Script**
   - Open `backend/database/migrations/part5-driver-vehicles.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor

4. **Execute Migration**
   - Click "Run" button (or press Ctrl+Enter / Cmd+Enter)
   - Wait for success message

5. **Verify Success**
   - You should see:
     ```
     ✅ Migration completed successfully!
     ✅ Users table updated with driver fields
     ✅ Vehicles table created
     ✅ Indexes created for performance
     ✅ Triggers added for updated_at
     ```

---

### Step 2: Test Migration

1. **Run Test Script**
   ```bash
   cd backend
   node database/test-migration-part5.js
   ```

2. **Expected Output**
   ```
   🧪 Testing Part 5 Database Migration...

   Test 1: Verify users table columns...
   ✅ Users table has all 3 new driver columns:
      - is_driver (boolean)
      - driver_rating (numeric)
      - total_rides_as_driver (integer)

   Test 2: Verify vehicles table exists...
   ✅ Vehicles table exists
      Columns:
      - id (integer)
      - user_id (integer)
      - model (character varying)
      - color (character varying)
      - license_plate (character varying)
      - total_seats (integer)
      - is_active (boolean)
      - created_at (timestamp)
      - updated_at (timestamp)

   Test 3: Verify indexes...
   ✅ Found 4 indexes on vehicles table:
      - vehicles_pkey
      - idx_vehicles_user_id
      - idx_vehicles_license_plate
      - idx_vehicles_active

   Test 4: Test vehicle CRUD operations...
   ✅ Successfully inserted test vehicle
   ✅ Successfully updated vehicle color
   ✅ Successfully queried vehicle
   ✅ Successfully deleted test vehicle

   Test 5: Test license plate uniqueness...
   ✅ Unique constraint working (duplicate rejected)

   Test 6: Count existing vehicles...
   ✅ Total vehicles in database: 0

   Test 7: Verify foreign key constraint...
   ✅ Foreign key constraint exists

   ✅ All migration tests completed!
   ```

---

## 📊 Database Schema Changes

### Users Table (Modified)
```sql
-- New Columns Added:
is_driver BOOLEAN DEFAULT FALSE
driver_rating DECIMAL(3, 2) DEFAULT 5.00
total_rides_as_driver INTEGER DEFAULT 0
```

### Vehicles Table (New)
```sql
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    total_seats INTEGER NOT NULL CHECK (total_seats >= 1 AND total_seats <= 8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes Created
- `idx_vehicles_user_id` - Fast lookup of user's vehicles
- `idx_vehicles_license_plate` - Fast uniqueness checks
- `idx_vehicles_active` - Filter active vehicles

### Constraints
- **UNIQUE**: `license_plate` must be unique
- **FOREIGN KEY**: `user_id` references `users(id)` with CASCADE delete
- **CHECK**: `total_seats` must be between 1 and 8
- **CHECK**: `driver_rating` must be between 0 and 5

---

## 🧪 Manual Testing (Optional)

### Test 1: Insert a Vehicle
```sql
INSERT INTO vehicles (user_id, model, color, license_plate, total_seats)
VALUES (1, 'Honda City', 'White', 'TN01AB1234', 4)
RETURNING *;
```

### Test 2: Update User to Driver
```sql
UPDATE users 
SET is_driver = TRUE 
WHERE id = 1
RETURNING id, name, is_driver, driver_rating;
```

### Test 3: Query User's Vehicles
```sql
SELECT v.*, u.name as owner_name
FROM vehicles v
JOIN users u ON v.user_id = u.id
WHERE v.user_id = 1;
```

### Test 4: Test Unique Constraint (Should Fail)
```sql
-- This should fail with duplicate error
INSERT INTO vehicles (user_id, model, color, license_plate, total_seats)
VALUES (1, 'Toyota Camry', 'Black', 'TN01AB1234', 3);
```

---

## 🔄 Rollback (If Needed)

If something goes wrong, run this rollback script:

```sql
-- Rollback Script
DROP TABLE IF EXISTS vehicles CASCADE;

ALTER TABLE users 
DROP COLUMN IF EXISTS is_driver,
DROP COLUMN IF EXISTS driver_rating,
DROP COLUMN IF EXISTS total_rides_as_driver;

-- Note: This will remove all vehicle data!
```

---

## ✅ Success Criteria

Migration is successful if:
- ✅ All SQL statements execute without errors
- ✅ Test script passes all 7 tests
- ✅ Users table has 3 new columns
- ✅ Vehicles table is created with 9 columns
- ✅ 4 indexes exist on vehicles table
- ✅ Unique constraint works (duplicate license plates rejected)
- ✅ Foreign key constraint works (cascade delete)
- ✅ CRUD operations work (insert, update, select, delete)

---

## 🚨 Troubleshooting

### Error: "column already exists"
- **Solution**: Migration was partially run before. Either skip that part or run rollback first.

### Error: "relation does not exist"
- **Solution**: Ensure you're connected to the correct database and users table exists.

### Error: "permission denied"
- **Solution**: Ensure your database user has CREATE TABLE permissions.

### Test script fails with connection error
- **Solution**: Check your `.env` file has correct database credentials.

---

## 📝 Next Steps

After successful migration:
1. ✅ Step 1 Complete: Database schema updated
2. ⏭️ **Next**: Step 2 - Build Vehicle Model (backend/src/models/Vehicle.model.js)
3. Then: Step 3 - Build Vehicle Controller
4. Then: Step 4 - Create Vehicle Routes

---

## 📞 Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify database connection
3. Review the rollback section
4. Re-run the migration from scratch

---

**Migration Created**: October 15, 2025  
**Part**: 5 - Driver & Vehicle System  
**Status**: Ready to Execute
