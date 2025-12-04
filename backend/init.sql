CREATE DATABASE IF NOT EXISTS db_347;
USE db_347;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create scores table
CREATE TABLE IF NOT EXISTS scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fk_user INT NOT NULL,
    score INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_scores FOREIGN KEY (fk_user) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on fk_user for better query performance
CREATE INDEX idx_scores_fk_user ON scores(fk_user);