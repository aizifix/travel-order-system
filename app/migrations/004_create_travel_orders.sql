-- ============================================================
-- Migration 004: Create travel_orders table
-- Travel Order System — Main travel order record
-- ============================================================

CREATE TABLE IF NOT EXISTS `travel_orders` (
  `travel_order_id`              INT           NOT NULL AUTO_INCREMENT,
  `travel_order_no`              VARCHAR(50)   NOT NULL,
  `travel_order_date`            DATE          NOT NULL DEFAULT (CURRENT_DATE),

  -- Requester
  `requester_user_id`            INT           NOT NULL,

  -- Lookup references
  `division_id`                  INT           NOT NULL,
  `position_id`                  INT           NULL,
  `designation_id`               INT           NULL,
  `employment_status_id`         INT           NOT NULL,
  `travel_type_id`               INT           NOT NULL,
  `transportation_id`            INT           NOT NULL,
  `program_id`                   INT           NULL,

  -- Travel details
  `travel_order_specDestination` TEXT          NOT NULL,
  `travel_order_specPurpose`     TEXT          NOT NULL,
  `travel_order_fundingSource`   VARCHAR(255)  NULL,
  `travel_order_remarks`         TEXT          NULL,

  -- Schedule
  `travel_order_days`            INT           NOT NULL DEFAULT 1,
  `travel_order_deptDate`        DATE          NOT NULL,
  `travel_order_returnDate`      DATE          NOT NULL,

  -- Staff
  `has_other_staff`              TINYINT(1)    NOT NULL DEFAULT 0,

  -- Status
  `travel_status_id`             INT           NOT NULL DEFAULT 1,
  `travel_status_remarks`        TEXT          NULL,

  -- Approval chain
  `recommending_approver_id`     INT           NULL,
  `approved_by_user_id`          INT           NULL,

  -- Timestamps
  `created_at`                   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Keys
  PRIMARY KEY (`travel_order_id`),
  UNIQUE KEY `uq_travel_orders_no` (`travel_order_no`),

  -- Indexes
  INDEX `idx_travel_orders_requester` (`requester_user_id`),
  INDEX `idx_travel_orders_status` (`travel_status_id`),
  INDEX `idx_travel_orders_date` (`travel_order_date`),
  INDEX `idx_travel_orders_dept_date` (`travel_order_deptDate`),

  -- Foreign Keys
  CONSTRAINT `fk_to_requester`
    FOREIGN KEY (`requester_user_id`) REFERENCES `users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT `fk_to_division`
    FOREIGN KEY (`division_id`) REFERENCES `divisions` (`division_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT `fk_to_position`
    FOREIGN KEY (`position_id`) REFERENCES `positions` (`position_id`)
    ON UPDATE CASCADE ON DELETE SET NULL,

  CONSTRAINT `fk_to_designation`
    FOREIGN KEY (`designation_id`) REFERENCES `designations` (`designation_id`)
    ON UPDATE CASCADE ON DELETE SET NULL,

  CONSTRAINT `fk_to_employment_status`
    FOREIGN KEY (`employment_status_id`) REFERENCES `employment_statuses` (`employment_status_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT `fk_to_travel_type`
    FOREIGN KEY (`travel_type_id`) REFERENCES `travel_types` (`travel_type_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT `fk_to_transportation`
    FOREIGN KEY (`transportation_id`) REFERENCES `transportations` (`transportation_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT `fk_to_program`
    FOREIGN KEY (`program_id`) REFERENCES `programs` (`program_id`)
    ON UPDATE CASCADE ON DELETE SET NULL,

  CONSTRAINT `fk_to_travel_status`
    FOREIGN KEY (`travel_status_id`) REFERENCES `travel_statuses` (`travel_status_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT `fk_to_recommending_approver`
    FOREIGN KEY (`recommending_approver_id`) REFERENCES `users` (`user_id`)
    ON UPDATE CASCADE ON DELETE SET NULL,

  CONSTRAINT `fk_to_approved_by`
    FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`user_id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
