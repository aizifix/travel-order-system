-- ============================================================
-- Migration 005: Create travel_order_staff junction table
-- Travel Order System — Many-to-many: TO ↔ additional staff
-- ============================================================

CREATE TABLE IF NOT EXISTS `travel_order_staff` (
  `travel_order_staff_id`  INT       NOT NULL AUTO_INCREMENT,
  `travel_order_id`        INT       NOT NULL,
  `user_id`                INT       NOT NULL,
  `created_at`             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`travel_order_staff_id`),
  UNIQUE KEY `uq_to_staff` (`travel_order_id`, `user_id`),

  INDEX `idx_to_staff_user` (`user_id`),

  CONSTRAINT `fk_to_staff_travel_order`
    FOREIGN KEY (`travel_order_id`) REFERENCES `travel_orders` (`travel_order_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT `fk_to_staff_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
