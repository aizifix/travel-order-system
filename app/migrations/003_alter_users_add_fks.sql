-- ============================================================
-- Migration 003: Add lookup FK columns to users table
-- Now that lookup tables exist, add FKs to users
-- ============================================================

ALTER TABLE `users`
  ADD COLUMN `division_id`          INT NULL AFTER `user_isActive`,
  ADD COLUMN `position_id`          INT NULL AFTER `division_id`,
  ADD COLUMN `designation_id`       INT NULL AFTER `position_id`,
  ADD COLUMN `employment_status_id` INT NULL AFTER `designation_id`;

ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_division`
    FOREIGN KEY (`division_id`) REFERENCES `divisions` (`division_id`)
    ON UPDATE CASCADE ON DELETE SET NULL,

  ADD CONSTRAINT `fk_users_position`
    FOREIGN KEY (`position_id`) REFERENCES `positions` (`position_id`)
    ON UPDATE CASCADE ON DELETE SET NULL,

  ADD CONSTRAINT `fk_users_designation`
    FOREIGN KEY (`designation_id`) REFERENCES `designations` (`designation_id`)
    ON UPDATE CASCADE ON DELETE SET NULL,

  ADD CONSTRAINT `fk_users_employment_status`
    FOREIGN KEY (`employment_status_id`) REFERENCES `employment_statuses` (`employment_status_id`)
    ON UPDATE CASCADE ON DELETE SET NULL;
