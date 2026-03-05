-- ============================================================
-- Migration 011: Create travel_order_trips table
-- Travel Order System - Multi-destination trip segments
-- ============================================================

CREATE TABLE IF NOT EXISTS `travel_order_trips` (
  `trip_id` INT NOT NULL AUTO_INCREMENT,
  `travel_order_id` INT NOT NULL,
  `trip_order` INT NOT NULL DEFAULT 1,

  -- Trip details
  `specific_destination` TEXT NOT NULL,
  `specific_purpose` TEXT NOT NULL,

  -- Date range for this specific trip
  `departure_date` DATE NOT NULL,
  `return_date` DATE NOT NULL,

  -- Timestamps
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Keys
  PRIMARY KEY (`trip_id`),

  -- Indexes
  INDEX `idx_trips_travel_order` (`travel_order_id`),
  INDEX `idx_trips_dates` (`departure_date`, `return_date`),
  UNIQUE KEY `uq_travel_order_trip_order` (`travel_order_id`, `trip_order`),

  -- Foreign Key
  CONSTRAINT `fk_trip_travel_order`
    FOREIGN KEY (`travel_order_id`) REFERENCES `travel_orders` (`travel_order_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
