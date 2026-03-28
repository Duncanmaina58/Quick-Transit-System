-- QuickTransit Database Initialization Script
-- This runs automatically when PostgreSQL container starts

-- Enable UUID extension (for unique IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types for better data integrity
DO $$ 
BEGIN
    -- User Roles
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'driver',
            'conductor', 
            'manager',
            'ntsa',
            'admin'
        );
    END IF;

    -- Vehicle Status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
        CREATE TYPE vehicle_status AS ENUM (
            'active',
            'inactive', 
            'maintenance',
            'banned'
        );
    END IF;

    -- Trip Status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
        CREATE TYPE trip_status AS ENUM (
            'scheduled',
            'active',
            'completed', 
            'cancelled'
        );
    END IF;

    -- Alert Types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_type') THEN
        CREATE TYPE alert_type AS ENUM (
            'overloading',
            'off_route',
            'speeding',
            'breakdown', 
            'emergency'
        );
    END IF;

    -- Violation Severity
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'violation_severity') THEN
        CREATE TYPE violation_severity AS ENUM (
            'low',
            'medium',
            'high',
            'critical'
        );
    END IF;
END $$;

-- Create a test table to verify setup (optional)
CREATE TABLE IF NOT EXISTS database_setup_check (
    id SERIAL PRIMARY KEY,
    setup_completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT
);

-- Insert a test record
INSERT INTO database_setup_check (message) 
VALUES ('Database initialized successfully for QuickTransit project');

-- Display success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ QuickTransit database initialized successfully!';
END $$;