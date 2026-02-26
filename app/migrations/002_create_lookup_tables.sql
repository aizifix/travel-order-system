-- ============================================================
-- Migration 002: Create all lookup / master-data tables
-- Travel Order System — Reference tables for dropdowns & FKs
-- ============================================================

-- -----------------------------------------------
-- 1. Divisions
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `divisions` (
  `division_id`    INT          NOT NULL AUTO_INCREMENT,
  `division_name`  VARCHAR(255) NOT NULL,
  `is_active`      TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`division_id`),
  UNIQUE KEY `uq_divisions_name` (`division_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 2. Employment Statuses
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `employment_statuses` (
  `employment_status_id`    INT          NOT NULL AUTO_INCREMENT,
  `employment_status_name`  VARCHAR(100) NOT NULL,
  `is_active`               TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`employment_status_id`),
  UNIQUE KEY `uq_employment_statuses_name` (`employment_status_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 3. Designations
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `designations` (
  `designation_id`    INT          NOT NULL AUTO_INCREMENT,
  `designation_name`  VARCHAR(150) NOT NULL,
  `is_active`         TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`designation_id`),
  UNIQUE KEY `uq_designations_name` (`designation_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 4. Positions (optional)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `positions` (
  `position_id`    INT          NOT NULL AUTO_INCREMENT,
  `position_name`  VARCHAR(150) NOT NULL,
  `is_active`      TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`position_id`),
  UNIQUE KEY `uq_positions_name` (`position_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 5. Travel Types
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `travel_types` (
  `travel_type_id`    INT          NOT NULL AUTO_INCREMENT,
  `travel_type_name`  VARCHAR(200) NOT NULL,
  `is_active`         TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`travel_type_id`),
  UNIQUE KEY `uq_travel_types_name` (`travel_type_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 6. Transportations (Means of Transportation)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `transportations` (
  `transportation_id`    INT          NOT NULL AUTO_INCREMENT,
  `transportation_name`  VARCHAR(100) NOT NULL,
  `is_active`            TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`transportation_id`),
  UNIQUE KEY `uq_transportations_name` (`transportation_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 7. Programs
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `programs` (
  `program_id`    INT          NOT NULL AUTO_INCREMENT,
  `program_name`  VARCHAR(255) NOT NULL,
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`program_id`),
  UNIQUE KEY `uq_programs_name` (`program_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 8. Travel Statuses (TO lifecycle states)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS `travel_statuses` (
  `travel_status_id`    INT          NOT NULL AUTO_INCREMENT,
  `travel_status_name`  VARCHAR(100) NOT NULL,
  `travel_status_desc`  VARCHAR(255) NULL,
  `is_active`           TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`travel_status_id`),
  UNIQUE KEY `uq_travel_statuses_name` (`travel_status_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
