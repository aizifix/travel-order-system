# Trip Destinations Feature - Implementation Checklist

> Last updated: 2026-03-04

## Checklist Rules

- Use `[ ]` for not started or in progress.
- Use `[x]` only when a task/phase is fully implemented and verified.
- Mark phases in order (Phase 1 -> Phase 6).

## Phase Progress (Master Checklist)

- [x] Phase 1: Database and Backend
- [x] Phase 2: API Layer
- [x] Phase 3: Frontend - Create/Edit Form
- [x] Phase 4: Frontend - Drawer and Visualization
- [ ] Phase 5: PDF Generation
- [ ] Phase 6: Admin/Approver Views

## Overview

Refactor the travel order scheduling system to support multiple trip destinations with specific date ranges.

This replaces the current single departure/return date + total days model with a trip-based model where users can add multiple destinations, each with its own date range.

### Current Problems

- Users set departure date, return date, and total days separately.
- Validation requires manual sync between dates and days.
- Single destination/purpose for entire trip.
- No map or timeline view of route.
- Max 5-day limit is confusing for multi-stop trips.

### Proposed Solution

- Trip-based input: each destination has its own start/end date.
- Days auto-calculated per trip; total days is sum of all trips.
- "Days remaining" indicator (max 5 total).
- Same destination can be visited multiple times on different dates.
- Map visualization with Leaflet (OpenStreetMap).
- Vertical timeline view in drawer.

## Phase 1 - Database and Backend

- [x] 1.1 Create migration `011_create_travel_order_trips.sql`  
  Files: `app/migrations/011_create_travel_order_trips.sql`
- [x] 1.2 Update TypeScript types in service layer  
  Files: `app/src/server/travel-orders/service.ts`
- [x] 1.3 Add trip CRUD operations (create/read/update/delete)  
  Files: `app/src/server/travel-orders/service.ts`
- [x] 1.4 Add helper to auto-calculate total days from trips  
  Files: `app/src/server/travel-orders/service.ts`
- [x] 1.5 Update validation (sum of trip days <= 5, no date gaps if required)  
  Files: `app/src/server/travel-orders/service.ts`

## Phase 2 - API Layer

- [x] 2.1 Add trip endpoints in travel-orders API routes  
  Files: `app/api/travel-orders/**/route.ts`
- [x] 2.2 Support nested trip creation in POST/PUT  
  Files: `app/api/travel-orders/**/route.ts`

## Phase 3 - Frontend (Create/Edit Form)

- [x] 3.1 Create `TripDestinationFields` component  
  Files: `app/src/components/regular/travel-orders/trip-destination-fields.tsx` (new)
- [x] 3.2 Replace old date/day inputs with trip builder UI  
  Files: `travel-order-schedule-and-staff-fields.tsx`
- [x] 3.3 Add "days remaining" counter  
  Files: `travel-order-schedule-and-staff-fields.tsx`
- [x] 3.4 Add form validation with remaining days feedback  
  Files: `travel-order-schedule-and-staff-fields.tsx`

## Phase 4 - Frontend (Drawer and Visualization)

- [x] 4.1 Update drawer to show trip timeline  
  Files: `regular-travel-order-drawer.tsx`
- [x] 4.2 Install Leaflet dependencies  
  Files: `package.json`
- [x] 4.3 Create map view component with markers  
  Files: `app/src/components/shared/map-view.tsx` (new)
- [x] 4.4 Integrate map in drawer (all destinations)  
  Files: `regular-travel-order-drawer.tsx`
- [x] 4.5 Create vertical timeline component  
  Files: `app/src/components/shared/timeline-view.tsx` (new)
- [x] 4.6 Integrate timeline in drawer  
  Files: `regular-travel-order-drawer.tsx`
- [x] 4.7 Add calendar range box visualization (Point A to Point B)  
  Files: `app/src/components/shared/date-range-calendar-view.tsx` (new), `trip-destination-fields.tsx`, `regular-travel-order-drawer.tsx`

## Phase 5 - PDF Generation

- [ ] 5.1 Update PDF generator to fetch trips from DB  
  Files: `pdf-generator.ts`
- [ ] 5.2 Remove multiline parsing logic (no longer needed)  
  Files: `pdf-generator.ts`
- [ ] 5.3 Update print service to include trips  
  Files: `print-service.ts`

## Phase 6 - Admin and Approver Views

- [ ] 6.1 Update admin drawer with trip timeline/map  
  Files: `admin-travel-order-drawer.tsx`
- [ ] 6.2 Update approver drawer with trip timeline/map  
  Files: `approver-travel-order-drawer.tsx`

## SQL Migration Reference

```sql
-- Migration 011: Create travel_order_trips table
-- Supports multiple destinations with specific date ranges

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

  -- Foreign Key
  CONSTRAINT `fk_trip_travel_order`
    FOREIGN KEY (`travel_order_id`) REFERENCES `travel_orders` (`travel_order_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Key Decisions to Confirm

- [ ] D1 Date overlap validation
  Choice:
  - A: Disallow overlaps (strict)
  - B: Allow overlaps with warning (flexible)
- [ ] D2 Backwards compatibility strategy
  Choice:
  - Keep old `specificDestination`/`specificPurpose` for old templates
  - Or fully switch to trips table
- [ ] D3 Map provider
  Choice:
  - Leaflet + OpenStreetMap (default, no API key)
  - Switch later to Mapbox/Google Maps if needed

## Data Model Changes

### Before

```text
travel_orders:
- travel_order_specDestination: TEXT
- travel_order_specPurpose: TEXT
- travel_order_days: INT
- travel_order_deptDate: DATE
- travel_order_returnDate: DATE
```

### After

```text
travel_orders:
- travel_order_specDestination: TEXT (deprecated, keep for backfill)
- travel_order_specPurpose: TEXT (deprecated, keep for backfill)
- travel_order_days: INT (auto-calculated from trips)
- travel_order_deptDate: DATE (auto-calculated from first trip)
- travel_order_returnDate: DATE (auto-calculated from last trip)

travel_order_trips (new):
- trip_id: INT (PK)
- travel_order_id: INT (FK)
- trip_order: INT
- specific_destination: TEXT
- specific_purpose: TEXT
- departure_date: DATE
- return_date: DATE
```

## Dependencies

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

## Notes

- Same destination can appear multiple times (example: Manila -> Baguio -> Manila).
- Order of trips should be determined by dates (not drag-and-drop).
- Total days = sum of all trip days (inclusive calculation).
- Validation rule: total days <= 5.
