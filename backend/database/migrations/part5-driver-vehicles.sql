-- ============================================
-- Part 5: Driver & Vehicle System Migration
-- Run this script in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Update Users Table - Add Driver Fields
-- ============================================

-- Add driver-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_driver BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS driver_rating DECIMAL(3, 2) DEFAULT 5.00 CHECK (driver_rating >= 0 AND driver_rating <= 5),
ADD COLUMN IF NOT EXISTS total_rides_as_driver INTEGER DEFAULT 0;

-- Update existing users to have default values
UPDATE users 
SET is_driver = FALSE, 
    driver_rating = 5.00, 
    total_rides_as_driver = 0
WHERE is_driver IS NULL;

-- ============================================
-- STEP 2: Create Vehicles Table
-- ============================================

-- Drop table if exists (for development/testing)
DROP TABLE IF EXISTS vehicles CASCADE;

-- Create vehicles table
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

-- ============================================
-- STEP 3: Add Indexes for Performance
-- ============================================

-- Index on user_id for fast lookup of user's vehicles
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);

-- Index on license_plate for fast uniqueness checks
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);

-- Index on is_active for filtering active vehicles
CREATE INDEX idx_vehicles_active ON vehicles(is_active);

-- ============================================
-- STEP 4: Add Comments for Documentation
-- ============================================

COMMENT ON TABLE vehicles IS 'Stores vehicle information for drivers';
COMMENT ON COLUMN vehicles.user_id IS 'Foreign key to users table - vehicle owner';
COMMENT ON COLUMN vehicles.model IS 'Vehicle model (e.g., Honda City, Toyota Camry)';
COMMENT ON COLUMN vehicles.color IS 'Vehicle color for identification';
COMMENT ON COLUMN vehicles.license_plate IS 'Unique license plate number';
COMMENT ON COLUMN vehicles.total_seats IS 'Number of available seats for passengers (excluding driver)';
COMMENT ON COLUMN vehicles.is_active IS 'Whether vehicle is currently active/available';

COMMENT ON COLUMN users.is_driver IS 'Whether user is registered as a driver';
COMMENT ON COLUMN users.driver_rating IS 'Average rating as a driver (1-5 stars)';
COMMENT ON COLUMN users.total_rides_as_driver IS 'Total number of rides completed as driver';

-- ============================================
-- STEP 5: Create Updated At Trigger Function
-- ============================================

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to vehicles table
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 6: Insert Sample Data for Testing (Optional)
-- ============================================

-- Uncomment below to insert sample vehicles for testing
/*
-- Assuming user with id=1 exists, add sample vehicles
INSERT INTO vehicles (user_id, model, color, license_plate, total_seats) VALUES
(1, 'Honda City', 'White', 'TN01AB1234', 3),
(1, 'Toyota Innova', 'Silver', 'TN02CD5678', 6);

-- Make user a driver
UPDATE users SET is_driver = TRUE WHERE id = 1;
*/

-- ============================================
-- STEP 7: Verify Migration
-- ============================================

-- Check users table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('is_driver', 'driver_rating', 'total_rides_as_driver');

-- Check vehicles table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'vehicles';

-- Count vehicles
SELECT COUNT(*) as total_vehicles FROM vehicles;

-- List all indexes on vehicles
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'vehicles';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '✅ Users table updated with driver fields';
    RAISE NOTICE '✅ Vehicles table created';
    RAISE NOTICE '✅ Indexes created for performance';
    RAISE NOTICE '✅ Triggers added for updated_at';
END $$;
