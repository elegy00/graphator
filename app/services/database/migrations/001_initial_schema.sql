-- ABOUTME: Initial database schema for Graphator sensor monitoring system
-- ABOUTME: Creates tables for sensors and sensor readings with appropriate indexes

-- Create sensors table
CREATE TABLE IF NOT EXISTS sensors (
  id VARCHAR(255) PRIMARY KEY,
  entity_id VARCHAR(255) UNIQUE NOT NULL,
  friendly_name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('temperature', 'humidity', 'both')),
  unit VARCHAR(20) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('online', 'offline', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sensor_readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id SERIAL PRIMARY KEY,
  sensor_id VARCHAR(255) NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  temperature DOUBLE PRECISION,
  humidity DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT at_least_one_value CHECK (
    temperature IS NOT NULL OR humidity IS NOT NULL
  )
);

-- Create indexes for sensors table
CREATE INDEX IF NOT EXISTS idx_sensors_status ON sensors(status);
CREATE INDEX IF NOT EXISTS idx_sensors_entity_id ON sensors(entity_id);

-- Create indexes for sensor_readings table
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_timestamp
  ON sensor_readings(sensor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp
  ON sensor_readings(timestamp);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sensors_updated_at
  BEFORE UPDATE ON sensors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
