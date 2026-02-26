-- ============================================================
-- Migration 006: Create travel_order_approvals table
-- Travel Order System — Step-based approval audit trail
-- ============================================================

CREATE TABLE IF NOT EXISTS `travel_order_approvals` (
  `approval_id`        INT                                        NOT NULL AUTO_INCREMENT,
  `travel_order_id`    INT                                        NOT NULL,
  `step_no`            INT                                        NOT NULL COMMENT '1 = recommending approval, 2 = final approval',
  `approver_user_id`   INT                                        NOT NULL,
  `action`             ENUM('APPROVED', 'REJECTED', 'RETURNED')   NOT NULL,
  `remarks`            TEXT                                       NULL,
  `action_at`          TIMESTAMP                                  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`approval_id`),

  INDEX `idx_approvals_travel_order` (`travel_order_id`),
  INDEX `idx_approvals_approver` (`approver_user_id`),
  INDEX `idx_approvals_action_at` (`action_at`),

  CONSTRAINT `fk_approvals_travel_order`
    FOREIGN KEY (`travel_order_id`) REFERENCES `travel_orders` (`travel_order_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT `fk_approvals_approver`
    FOREIGN KEY (`approver_user_id`) REFERENCES `users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
