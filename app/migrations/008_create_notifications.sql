-- ============================================================
-- Migration 008: Create notifications table
-- Travel Order System — In-app notification records
-- ============================================================

CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id`       INT          NOT NULL AUTO_INCREMENT,
  `user_id`               INT          NOT NULL COMMENT 'Recipient user',
  `travel_order_id`       INT          NULL     COMMENT 'Related TO (optional)',
  `notification_title`    VARCHAR(255) NOT NULL,
  `notification_message`  TEXT         NOT NULL,
  `notification_type`     ENUM('INFO', 'APPROVAL', 'REJECTION', 'RETURN', 'SYSTEM') NOT NULL DEFAULT 'INFO',
  `is_read`               TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`notification_id`),

  INDEX `idx_notifications_user` (`user_id`),
  INDEX `idx_notifications_is_read` (`is_read`),
  INDEX `idx_notifications_created_at` (`created_at`),

  CONSTRAINT `fk_notifications_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT `fk_notifications_travel_order`
    FOREIGN KEY (`travel_order_id`) REFERENCES `travel_orders` (`travel_order_id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
