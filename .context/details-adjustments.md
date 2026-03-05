# Details Adjustments

> **Created:** 2026-03-04
> **Phase:** UI/UX Refinement

---

## Checklist

### Information Display
- [x] Remove purpose section from header area (redundant with timeline)
- [x] Add "Date Posted: Mar 4, 2026" field
- [x] Add "Travel Dates: Mar 1, 2026 - Mar 6, 2026" field
- [x] Add "Destination: Region 10 - Cagayan de Oro City, Region 10 - Valencia City" field

### Trip Timeline & Route Map
- [x] Fix issue: Currently only 1 trip displays when multiple exist
- [x] Fix issue: Total days aggregated in 1 card instead of per-trip
- [x] Restructure: Each trip should have its own map card
  - Trip 1: Place, Date (or range), Purpose
  - Trip 2: Place, Date (or range), Purpose
  - (Continue for additional trips)

### Timeline Section
- [x] Add fixed max-height to timeline container
- [x] Enable internal vertical scrolling within timeline
- [x] Set overflow-hidden on timeline wrapper (prevent overlap above map)

### Timeline-Map Interactivity
- [x] Click timeline item -> navigate map to that location
- [x] Map marker popup -> show timeline info (Place, Date, Purpose)
- [x] Sync active state between timeline and map markers
- [x] Show only one map for all trip destinations

### Edit Mode Enhancement
- [x] Replace inline editing with pencil icon on hover
- [x] Click pencil to enter edit mode for specific section
- [x] Show "Save Pending Changes" button only in edit mode
- [x] Add cancel/discard option for pending changes

### Calendar View Styling
- [x] Match calendar colors to sidebar main color
- [x] Apply sidebar hex color with shades/opacity
- [x] Update: date range highlights, selected indicators, hover states, range lines

---

## Reference

### Sample Display Data
```
Date Posted: Mar 4, 2026
Travel Dates: Mar 1, 2026 - Mar 6, 2026
Destination: Region 10 - Cagayan de Oro City, Region 10 - Valencia City
Purpose:
  Aa
  bbb
```

### Trip Card Structure
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Trip 1                              â”‚
â”‚   Place: Cagayan de Oro City        â”‚
â”‚   Date: Mar 1, 2026 - Mar 3, 2026   â”‚
â”‚   Purpose: Aa                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Trip 2                              â”‚
â”‚   Place: Valencia City              â”‚
â”‚   Date: Mar 4, 2026 - Mar 6, 2026   â”‚
â”‚   Purpose: bbb                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Files to Update
- `app/src/components/shared/timeline-view.tsx`
- `app/src/components/shared/map-view.tsx`
- `app/src/components/regular/travel-orders/regular-travel-order-drawer.tsx`
- `app/src/components/admin/travel-orders/admin-travel-order-drawer.tsx`
- `app/src/components/approver/travel-orders/approver-travel-order-drawer.tsx`
- `app/src/components/shared/date-range-calendar-view.tsx`

