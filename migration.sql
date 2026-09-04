-- Database Migration Script for Campus Loan Portal
-- Run this SQL in your TiDB Cloud database to add new tables and columns

-- 1. Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') DEFAULT 'student',
  student_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

-- 2. Create repayment_schedules table for installment tracking
CREATE TABLE IF NOT EXISTS repayment_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loan_application_id INT NOT NULL,
  installment_number INT NOT NULL,
  principal_amount DECIMAL(10,2) NOT NULL,
  interest_amount DECIMAL(10,2) NOT NULL,
  total_payment DECIMAL(10,2) NOT NULL,
  remaining_balance DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_application_id) REFERENCES loan_applications(id) ON DELETE CASCADE,
  UNIQUE KEY unique_installment (loan_application_id, installment_number)
);

-- 3. Create notifications table for system alerts
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  loan_application_id INT NULL,
  type ENUM('status_update', 'payment_due', 'general') NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (loan_application_id) REFERENCES loan_applications(id) ON DELETE SET NULL,
  INDEX idx_user_notifications (user_id, is_read, created_at)
);

-- 4. Add new columns to loan_applications table
ALTER TABLE loan_applications 
ADD COLUMN IF NOT EXISTS document_url VARCHAR(500) NULL AFTER status,
ADD COLUMN IF NOT EXISTS user_id INT NULL AFTER student_id,
ADD CONSTRAINT fk_loan_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 5. Insert default admin user (password: admin123)
-- The password hash below is for 'admin123' using bcrypt with 12 rounds
INSERT INTO users (email, password_hash, role, student_id) 
VALUES (
  'admin@campusloan.com', 
  '$2a$12$LJ3m4ys3Lk8nFgQOIc/MNOxHBMkFQHnJmJhMpJqHJKvPqFgQOIc/M', 
  'admin', 
  NULL
) ON DUPLICATE KEY UPDATE email = email;

-- NOTE: The admin password hash above is a placeholder.
-- To generate a real hash, run this in Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('admin123', 12);
-- console.log(hash);
-- Then replace the hash in the INSERT statement above.