# Trip Destinations UI Adjustments

> **Created:** 2026-03-04
> **Phase:** Structure & Refinement

---

## Overview

This document tracks UI/UX adjustments for the Trip Timeline & Route Map feature in the Travel Order drawer.

---

## Checklist

### Layout & Information Architecture
- [ ] Remove purpose display from header section (redundant - already shown in timeline)
- [ ] Display "Date Posted: Mar 4, 2026" in metadata section
- [ ] Display "Travel Dates: Mar 1, 2026 - Mar 6, 2026" in metadata section
- [ ] Display "Destination: Region 10 - Cagayan de Oro City, Region 10 - Valencia City" in metadata section

### Trip Timeline & Route Map
- [ ] Fix: Currently only 1 trip is being displayed when multiple trips exist
- [ ] Fix: Total days should be calculated per trip card, not aggregated into 1 card
- [ ] Implement: Each trip should have its own map card with route visualization
- [ ] Example structure:
  ```
  Trip 1
    - Place: [Destination]
    - Date (or range): [Start] - [End]
    - Purpose: [Specific purpose]

  Trip 2
    - Place: [Destination]
    - Date (or range): [Start] - [End]
    - Purpose: [Specific purpose]
  ```

### Timeline Section Enhancements
- [ ] Add fixed height to timeline section (e.g., `max-h-[400px]` or similar)
- [ ] Enable vertical scroll within timeline container (`overflow-y-auto`)
- [ ] Set `overflow: hidden` on container to prevent overlap above map view

### Timeline-Map Interaction
- [ ] Clicking timeline item should pan/zoom map to corresponding location
- [ ] Map marker popup should display same timeline info:
  - Place/Destination
  - Date range
  - Purpose
- [ ] Highlight active timeline item when map marker is clicked

### Edit Mode Improvements
- [ ] Replace direct inline editing with pencil icon hover state
- [ ] Show pencil icon on hover over editable fields in drawer
- [ ] Clicking pencil enters edit mode for that specific section
- [ ] "Save Pending Changes" button only appears when in edit mode
- [ ] Cancel/Discard changes option

### Calendar View Styling
- [ ] Match calendar view colors to sidebar main color
- [ ] Find and apply sidebar hex color code with appropriate shades/opacity
- [ ] Sidebar reference color: `[TODO: Extract from sidebar component]`
- [ ] Apply matching color scheme to:
  - Date range highlights
  - Selected date indicators
  - Hover states
  - Range connection lines

---

## Reference Data

### Sample Trip Data Format
```
Date Posted: Mar 4, 2026
Travel Dates: Mar 1, 2026 - Mar 6, 2026
Destination: Region 10 - Cagayan de Oro City, Region 10 - Valencia City
```

### Files to Modify
- `app/src/components/shared/timeline-view.tsx`
- `app/src/components/shared/map-view.tsx`
- `app/src/components/regular/travel-orders/regular-travel-order-drawer.tsx`
- `app/src/components/admin/travel-orders/admin-travel-order-drawer.tsx`
- `app/src/components/approver/travel-orders/approver-travel-order-drawer.tsx`
- `app/src/components/shared/date-range-calendar-view.tsx`

---

## Notes

- Ensure backward compatibility with single-trip travel orders
- Maintain responsive design for mobile/tablet views
- Consider performance impact of multiple map instances
