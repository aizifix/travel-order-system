-- ============================================================
-- Migration 001: Create users table
-- Travel Order System — User accounts with roles & profile
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
  `user_id`              INT           NOT NULL AUTO_INCREMENT,
  `user_firstName`       VARCHAR(100)  NOT NULL,
  `user_lastName`        VARCHAR(100)  NOT NULL,
  `user_email`           VARCHAR(255)  NOT NULL,
  `user_password`        VARCHAR(255)  NOT NULL,
  `user_role`            ENUM('admin', 'approver', 'regular') NOT NULL DEFAULT 'regular',
  `user_isActive`        TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_email` (`user_email`),
  INDEX `idx_users_role` (`user_role`),
  INDEX `idx_users_isActive` (`user_isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
