-- ============================================================
-- Banking Management System - Database Schema & Initial Data
-- Database Engine: MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS `banking_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `banking_db`;

-- 1. Disable Foreign Key Checks for safe recreation
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `otp`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `accounts`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `admin_logs`;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 2. Table Structures
-- ============================================================

-- Users Table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin') DEFAULT 'user',
  `profile_pic` VARCHAR(255) DEFAULT NULL,
  `is_blocked` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Accounts Table
CREATE TABLE `accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `account_number` VARCHAR(20) NOT NULL UNIQUE,
  `account_type` ENUM('savings', 'checking') DEFAULT 'savings',
  `balance` DECIMAL(15, 2) DEFAULT 1000.00,
  `status` ENUM('active', 'blocked', 'closed') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Transactions Table
CREATE TABLE `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` VARCHAR(50) NOT NULL UNIQUE,
  `sender_account_id` INT DEFAULT NULL,
  `receiver_account_id` INT DEFAULT NULL,
  `type` ENUM('deposit', 'withdraw', 'transfer') NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('completed', 'failed', 'pending') DEFAULT 'completed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sender_account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`receiver_account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- OTP Verification Table
CREATE TABLE `otp` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `type` ENUM('registration', 'transfer', 'forgot_password') NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_used` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifications Table
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin Activity Logs Table
CREATE TABLE `admin_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `target_user_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. Indexes for Performance Optimization
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_accounts_acc_num ON accounts(account_number);
CREATE INDEX idx_transactions_tx_id ON transactions(transaction_id);
CREATE INDEX idx_transactions_sender ON transactions(sender_account_id);
CREATE INDEX idx_transactions_receiver ON transactions(receiver_account_id);

-- ============================================================
-- 4. Initial Sample Data (Passwords are bcrypt hashed 'Password@123')
-- ============================================================

INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password`, `role`, `is_blocked`) VALUES
(1, 'System Administrator', 'admin@bank.com', '+18005550100', '$2a$10$wN1Q/X8t9i6LhHkFwD/W6u87lC54B73jS/Hl2H5k8j9l0m1n2o3pK', 'admin', 0),
(2, 'John Doe', 'john@example.com', '+15550192834', '$2a$10$wN1Q/X8t9i6LhHkFwD/W6u87lC54B73jS/Hl2H5k8j9l0m1n2o3pK', 'user', 0),
(3, 'Sarah Jenkins', 'sarah@example.com', '+15550198822', '$2a$10$wN1Q/X8t9i6LhHkFwD/W6u87lC54B73jS/Hl2H5k8j9l0m1n2o3pK', 'user', 0),
(4, 'Alex Rivera', 'alex@example.com', '+15550177744', '$2a$10$wN1Q/X8t9i6LhHkFwD/W6u87lC54B73jS/Hl2H5k8j9l0m1n2o3pK', 'user', 0);

-- Accounts
INSERT INTO `accounts` (`id`, `user_id`, `account_number`, `account_type`, `balance`, `status`) VALUES
(1, 2, '1000849201', 'savings', 8500.50, 'active'),
(2, 3, '1000958312', 'checking', 14200.75, 'active'),
(3, 4, '1000472945', 'savings', 2350.00, 'active');

-- Sample Transactions
INSERT INTO `transactions` (`id`, `transaction_id`, `sender_account_id`, `receiver_account_id`, `type`, `amount`, `description`, `status`, `created_at`) VALUES
(1, 'TXN-20260701-8492', NULL, 1, 'deposit', 5000.00, 'Initial Account Funding', 'completed', '2026-07-01 10:15:00'),
(2, 'TXN-20260703-9182', NULL, 1, 'deposit', 4000.00, 'Salary Credit July', 'completed', '2026-07-03 09:00:00'),
(3, 'TXN-20260705-7721', 1, 2, 'transfer', 1200.00, 'Monthly Apartment Rent Share', 'completed', '2026-07-05 14:22:10'),
(4, 'TXN-20260710-3381', 1, NULL, 'withdraw', 300.00, 'ATM Cash Withdrawal', 'completed', '2026-07-10 18:45:00'),
(5, 'TXN-20260712-4490', 2, 1, 'transfer', 1000.00, 'Freelance Web Design Payment', 'completed', '2026-07-12 11:30:00'),
(6, 'TXN-20260715-1192', 1, 3, 'transfer', 150.00, 'Dinner Bill Split', 'completed', '2026-07-15 20:10:00');

-- Notifications
INSERT INTO `notifications` (`user_id`, `title`, `message`, `is_read`, `created_at`) VALUES
(2, 'Welcome to Apex Bank', 'Your digital savings account #1000849201 has been activated successfully.', 1, '2026-07-01 10:15:00'),
(2, 'Funds Received', 'You received $1,000.00 from Sarah Jenkins for Freelance Web Design Payment.', 0, '2026-07-12 11:30:00'),
(3, 'Transfer Successful', 'Your payment of $1,000.00 to John Doe was completed successfully.', 1, '2026-07-12 11:30:00');

-- Admin Log
INSERT INTO `admin_logs` (`admin_id`, `action`, `target_user_id`) VALUES
(1, 'System Initialized and Admin Account Created', 1);
