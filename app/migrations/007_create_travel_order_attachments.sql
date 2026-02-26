-- ============================================================
-- Migration 007: Create travel_order_attachments table
-- Travel Order System — PDF supporting letter uploads
-- ============================================================

CREATE TABLE IF NOT EXISTS `travel_order_attachments` (
  `attachment_id`    INT          NOT NULL AUTO_INCREMENT,
  `travel_order_id`  INT          NOT NULL,
  `file_name`        VARCHAR(255) NOT NULL,
  `file_path`        VARCHAR(500) NOT NULL,
  `file_size`        INT          NULL COMMENT 'File size in bytes',
  `mime_type`        VARCHAR(100) NULL DEFAULT 'application/pdf',
  `uploaded_by`      INT          NOT NULL,
  `uploaded_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`attachment_id`),

  INDEX `idx_attachments_travel_order` (`travel_order_id`),
  INDEX `idx_attachments_uploaded_by` (`uploaded_by`),

  CONSTRAINT `fk_attachments_travel_order`
    FOREIGN KEY (`travel_order_id`) REFERENCES `travel_orders` (`travel_order_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT `fk_attachments_uploaded_by`
    FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
