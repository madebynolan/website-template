--
-- Create database
--
CREATE DATABASE IF NOT EXISTS database_name 
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE database_name;

--
-- Create table for users
--
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(254) NOT NULL UNIQUE,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT 0,
  reset_token VARCHAR(64),
  reset_token_expires DATETIME;
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

--
-- Create table for login attempts
--
DROP TABLE IF EXISTS login_attempts;
CREATE TABLE login_attempts (
  attempt_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email_username VARCHAR(254) NOT NULL,
  ip_address VARCHAR(45),
  success BOOLEAN DEFAULT 0,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_username ON login_attempts (email_username);
CREATE INDEX idx_ip_address ON login_attempts (ip_address);

--
-- Create table for temporary login bans
--
DROP TABLE IF EXISTS temp_bans;
CREATE TABLE temp_bans (
  ban_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email_username VARCHAR(254),
  ip_address VARCHAR(45),
  ban_until TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 30 MINUTE),
  banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ban_email_username ON temp_bans (email_username);
CREATE INDEX idx_ban_ip_address ON temp_bans (ip_address);
CREATE INDEX idx_email_username_ip ON temp_bans (email_username, ip_address);

--
-- Create table for permanent login bans
--
DROP TABLE IF EXISTS perma_bans;
CREATE TABLE perma_bans (
  ban_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email_username VARCHAR(254),
  ip_address VARCHAR(45),
  banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ban_email_username ON perma_bans (email_username);
CREATE INDEX idx_ban_ip_address ON perma_bans (ip_address);
CREATE INDEX idx_email_username_ip ON perma_bans (email_username, ip_address);

--
-- Create table for sessions
--
DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
  session_id CHAR(64) PRIMARY KEY,
  user_id BIGINT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
);

--
-- Create table for cookie tests
--
DROP TABLE IF EXISTS cookie_tests;
CREATE TABLE cookie_tests (
  test_id CHAR(64) PRIMARY KEY,
  ip_address VARCHAR(45),
  cookie_token VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);