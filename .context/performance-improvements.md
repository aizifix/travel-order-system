# Performance & Best Practices Improvements

This document tracks the suggested improvements from the web app evaluation.

## Priority 1 - Critical (Large Data Handling)

### Server-side Pagination/Filtering
- **Files**: `regular-travel-orders-table.tsx`, `admin-travel-orders-table.tsx`, `users-table.tsx`
- **Issue**: All filtering/sorting done client-side. For datasets >500 items, this causes performance issues.
- **Fix**: Implement server-side filtering/sorting via URL query params

### Bundle Optimization
- **Files**: Drawer/modal components
- **Issue**: Heavy components (travel order drawer, user detail drawer) rendered inline
- **Fix**: Use `next/dynamic` for lazy loading:
```tsx
const TravelOrderDrawer = dynamic(() => import('./TravelOrderDrawer'), { ssr: false })
```

## Priority 2 - Accessibility

### Table Row Keyboard Navigation
- **Files**: `regular-travel-orders-table.tsx:427`, `users-table.tsx:180`
- **Issue**: Row click uses `<tr onClick>` - not keyboard accessible
- **Fix**: Use proper button elements or add keyboard handlers

### Focus Management in Drawers
- **Files**: All drawer components
- **Issue**: No focus trap or focus return on close
- **Fix**: Implement focus trap and return focus to trigger element

## Priority 3 - UI/UX Improvements

### prefers-reduced-motion
- **Files**: All animated components
- **Issue**: Animations don't respect user preference
- **Fix**: Add reduced motion variants or disable on preference

### Loading States
- **Fix**: Add loading spinners to form submissions (login ✅ done)

## Priority 4 - Performance Enhancements

### Virtual Scrolling
- **Files**: All table components
- **Issue**: No virtualization for large datasets
- **Fix**: Add `virtua` or `react-window` for lists >50 visible items

### content-visibility
- **Files**: Table components
- **Issue**: Off-screen rows still rendered
- **Fix**: Add `content-visibility: auto` to table rows

## Implementation Status

- [x] Login loading spinner - DONE
- [x] Server-side pagination - DONE (regular, admin, approver travel orders pages)
- [x] Bundle code splitting
- [x] Table row accessibility
- [x] Focus management
- [x] Reduced motion support
- [x] Virtual scrolling
