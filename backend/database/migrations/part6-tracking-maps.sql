    -- ============================================
    -- Part 6: Real-Time Tracking & Maps Migration
    -- Run this script in Supabase SQL Editor
    -- ============================================

    -- ============================================
    -- STEP 1: Enable UUID Extension
    -- ============================================

    -- Enable UUID generation (if not already enabled)
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- ============================================
    -- STEP 2: Update Rides Table - Add Tracking Fields
    -- ============================================

    -- Add tracking and status columns to rides table
    ALTER TABLE rides 
    ADD COLUMN IF NOT EXISTS ride_status VARCHAR(50) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS driver_location_lat DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS driver_location_lng DECIMAL(11, 8),
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS actual_distance DECIMAL(8, 2), -- km
    ADD COLUMN IF NOT EXISTS actual_duration INTEGER; -- minutes

    -- Add check constraint for ride status
    ALTER TABLE rides
    DROP CONSTRAINT IF EXISTS check_ride_status;

    ALTER TABLE rides
    ADD CONSTRAINT check_ride_status CHECK (
        ride_status IN ('pending', 'driver_assigned', 'driver_arriving', 'at_pickup', 'in_progress', 'completed', 'cancelled')
    );

    -- Create index on ride_status for filtering
    CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(ride_status);

    -- Create index on driver_id for driver's active rides
    CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);

    -- ============================================
    -- STEP 3: Create Ride Tracking Table
    -- ============================================

    -- Drop table if exists (for development/testing)
    DROP TABLE IF EXISTS ride_tracking CASCADE;

    -- Create ride_tracking table for real-time tracking data
    CREATE TABLE ride_tracking (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ride_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
        
        -- Driver current location
        driver_location_lat DECIMAL(10, 8),
        driver_location_lng DECIMAL(11, 8),
        driver_heading DECIMAL(5, 2), -- 0-360 degrees
        driver_speed DECIMAL(5, 2), -- km/h
        
        -- Pickup location
        pickup_location_lat DECIMAL(10, 8),
        pickup_location_lng DECIMAL(11, 8),
        
        -- Dropoff location
        dropoff_location_lat DECIMAL(10, 8),
        dropoff_location_lng DECIMAL(11, 8),
        
        -- Calculated metrics
        estimated_pickup_time INTEGER, -- minutes
        estimated_dropoff_time INTEGER, -- minutes
        distance_to_pickup DECIMAL(8, 2), -- km
        distance_to_destination DECIMAL(8, 2), -- km
        
        -- Route data
        route_polyline TEXT, -- encoded polyline from Google Maps
        route_distance DECIMAL(8, 2), -- total route distance in km
        route_duration INTEGER, -- total route duration in minutes
        
        -- Status
        tracking_status VARCHAR(50) DEFAULT 'idle',
        is_active BOOLEAN DEFAULT TRUE,
        
        -- Timestamps
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Add check constraint for tracking status
    ALTER TABLE ride_tracking
    ADD CONSTRAINT check_tracking_status CHECK (
        tracking_status IN ('idle', 'en_route_to_pickup', 'at_pickup', 'en_route_to_destination', 'completed')
    );

    -- Create unique index to ensure one active tracking per ride
    CREATE UNIQUE INDEX idx_ride_tracking_active ON ride_tracking(ride_id) WHERE is_active = TRUE;

    -- Create index on last_updated for cleanup queries
    CREATE INDEX idx_ride_tracking_updated ON ride_tracking(last_updated);

    -- ============================================
    -- STEP 4: Create Ride Location History Table
    -- ============================================

    -- Drop table if exists
    DROP TABLE IF EXISTS ride_location_history CASCADE;

    -- Create location history for ride playback
    CREATE TABLE ride_location_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ride_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
        
        -- Location data
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        
        -- Movement data
        speed DECIMAL(5, 2), -- km/h
        heading DECIMAL(5, 2), -- degrees
        accuracy DECIMAL(6, 2), -- meters (GPS accuracy)
        
        -- Additional context
        tracking_status VARCHAR(50), -- status at this point
        distance_traveled DECIMAL(8, 2), -- cumulative distance in km
        
        -- Timestamp
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create index on ride_id and timestamp for efficient queries
    CREATE INDEX idx_location_history_ride ON ride_location_history(ride_id, timestamp DESC);

    -- Create index on timestamp for cleanup/archival
    CREATE INDEX idx_location_history_timestamp ON ride_location_history(timestamp);

    -- ============================================
    -- STEP 5: Create Ride Notifications Table
    -- ============================================

    -- Drop table if exists
    DROP TABLE IF EXISTS ride_notifications CASCADE;

    -- Create notifications table for tracking alerts
    CREATE TABLE ride_notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ride_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        
        -- Notification details
        notification_type VARCHAR(50) NOT NULL, -- 'driver_nearby', 'driver_arrived', 'ride_started', etc.
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        
        -- Status
        is_read BOOLEAN DEFAULT FALSE,
        is_sent BOOLEAN DEFAULT FALSE,
        
        -- Metadata
        metadata JSONB, -- additional data (distance, eta, etc.)
        
        -- Timestamps
        sent_at TIMESTAMP,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create index on user_id for user's notifications
    CREATE INDEX idx_notifications_user ON ride_notifications(user_id, created_at DESC);

    -- Create index on ride_id for ride's notifications
    CREATE INDEX idx_notifications_ride ON ride_notifications(ride_id);

    -- Create index on is_read for unread notifications
    CREATE INDEX idx_notifications_unread ON ride_notifications(user_id, is_read) WHERE is_read = FALSE;

    -- ============================================
    -- STEP 6: Add Comments for Documentation
    -- ============================================

    -- Rides table comments
    COMMENT ON COLUMN rides.ride_status IS 'Current status: pending, driver_assigned, driver_arriving, at_pickup, in_progress, completed, cancelled';
    COMMENT ON COLUMN rides.driver_id IS 'Assigned driver (if matched)';
    COMMENT ON COLUMN rides.vehicle_id IS 'Vehicle used for this ride';
    COMMENT ON COLUMN rides.driver_location_lat IS 'Last known driver latitude';
    COMMENT ON COLUMN rides.driver_location_lng IS 'Last known driver longitude';
    COMMENT ON COLUMN rides.started_at IS 'Timestamp when ride started';
    COMMENT ON COLUMN rides.completed_at IS 'Timestamp when ride completed';
    COMMENT ON COLUMN rides.actual_distance IS 'Actual distance traveled in km';
    COMMENT ON COLUMN rides.actual_duration IS 'Actual ride duration in minutes';

    -- Ride tracking table comments
    COMMENT ON TABLE ride_tracking IS 'Real-time tracking data for active rides';
    COMMENT ON COLUMN ride_tracking.driver_heading IS 'Direction driver is heading (0-360 degrees, 0=North)';
    COMMENT ON COLUMN ride_tracking.driver_speed IS 'Current speed in km/h';
    COMMENT ON COLUMN ride_tracking.estimated_pickup_time IS 'ETA to pickup in minutes';
    COMMENT ON COLUMN ride_tracking.estimated_dropoff_time IS 'ETA to destination in minutes';
    COMMENT ON COLUMN ride_tracking.route_polyline IS 'Encoded polyline string from Google Maps';
    COMMENT ON COLUMN ride_tracking.tracking_status IS 'Current tracking phase: idle, en_route_to_pickup, at_pickup, en_route_to_destination, completed';

    -- Location history table comments
    COMMENT ON TABLE ride_location_history IS 'Historical location points for ride playback and analysis';
    COMMENT ON COLUMN ride_location_history.accuracy IS 'GPS accuracy in meters';
    COMMENT ON COLUMN ride_location_history.distance_traveled IS 'Cumulative distance from ride start in km';

    -- Notifications table comments
    COMMENT ON TABLE ride_notifications IS 'Ride-related notifications and alerts';
    COMMENT ON COLUMN ride_notifications.notification_type IS 'Type: driver_nearby, driver_arrived, ride_started, ride_completed, etc.';
    COMMENT ON COLUMN ride_notifications.metadata IS 'Additional JSON data (distance, eta, location, etc.)';

    -- ============================================
    -- STEP 7: Create Triggers for Auto-Update
    -- ============================================

    -- Function to update last_updated timestamp
    CREATE OR REPLACE FUNCTION update_ride_tracking_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.last_updated = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Trigger for ride_tracking updates
    DROP TRIGGER IF EXISTS trigger_update_ride_tracking ON ride_tracking;
    CREATE TRIGGER trigger_update_ride_tracking
        BEFORE UPDATE ON ride_tracking
        FOR EACH ROW
        EXECUTE FUNCTION update_ride_tracking_timestamp();

    -- Function to auto-update ride status based on tracking
    CREATE OR REPLACE FUNCTION sync_ride_status_from_tracking()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Update rides table with latest tracking status
        UPDATE rides
        SET 
            ride_status = CASE 
                WHEN NEW.tracking_status = 'en_route_to_pickup' THEN 'driver_arriving'
                WHEN NEW.tracking_status = 'at_pickup' THEN 'at_pickup'
                WHEN NEW.tracking_status = 'en_route_to_destination' THEN 'in_progress'
                WHEN NEW.tracking_status = 'completed' THEN 'completed'
                ELSE ride_status
            END,
            driver_location_lat = NEW.driver_location_lat,
            driver_location_lng = NEW.driver_location_lng
        WHERE id = NEW.ride_id;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Trigger to sync ride status when tracking updates
    DROP TRIGGER IF EXISTS trigger_sync_ride_status ON ride_tracking;
    CREATE TRIGGER trigger_sync_ride_status
        AFTER UPDATE ON ride_tracking
        FOR EACH ROW
        WHEN (OLD.tracking_status IS DISTINCT FROM NEW.tracking_status)
        EXECUTE FUNCTION sync_ride_status_from_tracking();

    -- ============================================
    -- STEP 8: Create Helper Functions
    -- ============================================

    -- Function to calculate distance between two points (Haversine formula)
    CREATE OR REPLACE FUNCTION calculate_distance(
        lat1 DECIMAL,
        lng1 DECIMAL,
        lat2 DECIMAL,
        lng2 DECIMAL
    )
    RETURNS DECIMAL AS $$
    DECLARE
        earth_radius DECIMAL := 6371; -- km
        dlat DECIMAL;
        dlng DECIMAL;
        a DECIMAL;
        c DECIMAL;
        distance DECIMAL;
    BEGIN
        -- Convert degrees to radians
        dlat := RADIANS(lat2 - lat1);
        dlng := RADIANS(lng2 - lng1);
        
        -- Haversine formula
        a := SIN(dlat/2) * SIN(dlat/2) + 
            COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
            SIN(dlng/2) * SIN(dlng/2);
        c := 2 * ATAN2(SQRT(a), SQRT(1-a));
        distance := earth_radius * c;
        
        RETURN ROUND(distance, 2);
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;

    -- Function to check if location is near target (geofencing)
    CREATE OR REPLACE FUNCTION is_near_location(
        current_lat DECIMAL,
        current_lng DECIMAL,
        target_lat DECIMAL,
        target_lng DECIMAL,
        radius_km DECIMAL
    )
    RETURNS BOOLEAN AS $$
    BEGIN
        RETURN calculate_distance(current_lat, current_lng, target_lat, target_lng) <= radius_km;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;

    -- ============================================
    -- STEP 9: Create Views for Common Queries
    -- ============================================

    -- View for active rides with tracking data
    CREATE OR REPLACE VIEW active_rides_with_tracking AS
    SELECT 
        r.id as ride_id,
        r.user_id as passenger_id,
        r.driver_id,
        r.vehicle_id,
        r.ride_status,
        r.origin_lat,
        r.origin_lng,
        r.destination_lat,
        r.destination_lng,
        r.created_at,
        r.started_at,
        t.driver_location_lat,
        t.driver_location_lng,
        t.driver_heading,
        t.driver_speed,
        t.estimated_pickup_time,
        t.estimated_dropoff_time,
        t.distance_to_pickup,
        t.distance_to_destination,
        t.tracking_status,
        t.last_updated as tracking_last_updated,
        u.name as passenger_name,
        u.phone as passenger_phone,
        d.name as driver_name,
        d.phone as driver_phone,
        v.model as vehicle_model,
        v.color as vehicle_color,
        v.license_plate
    FROM rides r
    LEFT JOIN ride_tracking t ON r.id = t.ride_id AND t.is_active = TRUE
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN users d ON r.driver_id = d.id
    LEFT JOIN vehicles v ON r.vehicle_id = v.id
    WHERE r.ride_status IN ('driver_assigned', 'driver_arriving', 'at_pickup', 'in_progress');

    -- View for ride statistics
    CREATE OR REPLACE VIEW ride_statistics AS
    SELECT 
        r.id as ride_id,
        r.ride_status,
        r.started_at,
        r.completed_at,
        r.actual_distance,
        r.actual_duration,
        COUNT(lh.id) as location_points,
        MIN(lh.timestamp) as first_location,
        MAX(lh.timestamp) as last_location,
        AVG(lh.speed) as avg_speed,
        MAX(lh.speed) as max_speed
    FROM rides r
    LEFT JOIN ride_location_history lh ON r.id = lh.ride_id
    GROUP BY r.id, r.ride_status, r.started_at, r.completed_at, r.actual_distance, r.actual_duration;

    -- ============================================
    -- STEP 10: Verify Migration
    -- ============================================

    -- Check rides table updates
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'rides' 
    AND column_name IN ('ride_status', 'driver_id', 'vehicle_id', 'driver_location_lat', 'driver_location_lng');

    -- Check ride_tracking table
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ride_tracking'
    ORDER BY ordinal_position;

    -- Check ride_location_history table
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ride_location_history'
    ORDER BY ordinal_position;

    -- Check ride_notifications table
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ride_notifications'
    ORDER BY ordinal_position;

    -- List all indexes
    SELECT tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename IN ('rides', 'ride_tracking', 'ride_location_history', 'ride_notifications')
    ORDER BY tablename, indexname;

    -- Test helper functions
    SELECT 
        calculate_distance(28.7041, 77.1025, 28.5355, 77.3910) as delhi_distance_km,
        is_near_location(28.7041, 77.1025, 28.7050, 77.1030, 0.1) as is_nearby;

    -- ============================================
    -- SUCCESS MESSAGE
    -- ============================================

    DO $$
    BEGIN
        RAISE NOTICE '✅ Part 6 Migration completed successfully!';
        RAISE NOTICE '✅ Rides table updated with tracking fields';
        RAISE NOTICE '✅ ride_tracking table created';
        RAISE NOTICE '✅ ride_location_history table created';
        RAISE NOTICE '✅ ride_notifications table created';
        RAISE NOTICE '✅ Indexes created for performance';
        RAISE NOTICE '✅ Triggers added for auto-updates';
        RAISE NOTICE '✅ Helper functions created (calculate_distance, is_near_location)';
        RAISE NOTICE '✅ Views created for common queries';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Ready for Socket.io & Google Maps integration!';
    END $$;
