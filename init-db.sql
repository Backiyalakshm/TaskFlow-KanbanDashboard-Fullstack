-- Initial database setup for Taskflow
-- This file is executed when MySQL container starts

-- Database should already be created by Docker, but we can add initial setup here

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT IGNORE INTO roles (id, name) VALUES
    (1, 'ROLE_ADMIN'),
    (2, 'ROLE_USER'),
    (3, 'ROLE_MODERATOR');

-- You can add more initialization SQL here
-- For example, creating indexes, inserting default data, etc.

-- Verify database is ready
SELECT 'Database initialized successfully' as status;
