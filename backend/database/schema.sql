-- TripSync Database Schema
-- PostgreSQL Database Setup Script
-- Run this script in Supabase SQL Editor

-- ============================================
-- DROP EXISTING TABLES (if any)
-- ============================================
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS user_ratings CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS rides CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS ride_status CASCADE;
DROP TYPE IF EXISTS match_status CASCADE;
DROP TYPE IF EXISTS ride_direction CASCADE;

-- ============================================
-- CREATE CUSTOM TYPES
-- ============================================

CREATE TYPE ride_status AS ENUM ('active', 'matched', 'completed', 'cancelled');
CREATE TYPE match_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');
CREATE TYPE ride_direction AS ENUM ('going_to', 'coming_from');

-- ============================================
-- TABLE 1: USERS
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    university VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_picture VARCHAR(500),
    trust_score DECIMAL(3, 2) DEFAULT 5.00 CHECK (trust_score >= 0 AND trust_score <= 10),
    total_rides INTEGER DEFAULT 0,
    completed_rides INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE 2: RIDES
-- ============================================
CREATE TABLE rides (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_message TEXT NOT NULL,
    destination VARCHAR(255) NOT NULL,
    origin VARCHAR(255),
    direction ride_direction DEFAULT 'going_to',
    destination_lat DECIMAL(10, 8),
    destination_lng DECIMAL(11, 8),
    origin_lat DECIMAL(10, 8),
    origin_lng DECIMAL(11, 8),
    ride_time TIMESTAMP NOT NULL,
    flexibility_minutes INTEGER DEFAULT 30,
    status ride_status DEFAULT 'active',
    seats_available INTEGER DEFAULT 1 CHECK (seats_available >= 0),
    estimated_cost DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE 3: MATCHES
-- ============================================
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    ride1_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    ride2_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    match_score DECIMAL(5, 2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    time_score DECIMAL(5, 2),
    location_score DECIMAL(5, 2),
    trust_score DECIMAL(5, 2),
    status match_status DEFAULT 'pending',
    initiated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT different_rides CHECK (ride1_id != ride2_id)
);

-- Create unique index to prevent duplicate matches (order-independent)
CREATE UNIQUE INDEX unique_match_pair ON matches (
    LEAST(ride1_id, ride2_id), 
    GREATEST(ride1_id, ride2_id)
);

-- ============================================
-- TABLE 4: MESSAGES
-- ============================================
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_users CHECK (sender_id != receiver_id)
);

-- ============================================
-- TABLE 5: USER RATINGS
-- ============================================
CREATE TABLE user_ratings (
    id SERIAL PRIMARY KEY,
    rater_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rated_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_users_rating CHECK (rater_id != rated_user_id),
    CONSTRAINT unique_rating UNIQUE (rater_id, rated_user_id, match_id)
);

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_university ON users(university);
CREATE INDEX idx_rides_user_id ON rides(user_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_ride_time ON rides(ride_time);
CREATE INDEX idx_matches_ride1_id ON matches(ride1_id);
CREATE INDEX idx_matches_ride2_id ON matches(ride2_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_match_id ON messages(match_id);

-- ============================================
-- CREATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
