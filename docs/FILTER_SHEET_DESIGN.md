# Filter Sheet Component Design

## Overview
A reusable bottom sheet component for filtering events and statistics across the app.

## Component: FilterSheet

### Props
```typescript
interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  events: Event[];
  showTimeFilter?: boolean;
  showEventFilter?: boolean;
  showCategoryFilter?: boolean;
  showStatusFilter?: boolean;
}

interface FilterOptions {
  selectedEventId: string | null;
  timeFilter: 'week' | 'month' | 'year' | 'all';
  category: string | null;
  status: 'upcoming' | 'past' | 'all';
}
```

### Features
1. **Filter by Event**
   - Dropdown list of all events
   - "All Events" option
   - Search functionality for events

2. **Filter by Time Period**
   - Week, Month, Year, All buttons
   - Visual selection state

3. **Filter by Category** (optional)
   - Corporate Event
   - Conference
   - Workshop
   - Restaurant/Club
   - School/University

4. **Filter by Status** (optional)
   - Upcoming
   - Past
   - All

### Design
- Bottom sheet modal (slides up from bottom)
- Header with "Filters" title and close button
- Reset button to clear all filters
- Apply button at bottom
- Smooth animations
- Theme-aware colors

## Usage Locations

### 1. Stats Screen
- Filter icon in header (top right)
- Shows: Event filter + Time filter
- Updates all charts and statistics

### 2. Event List Screen (Home)
- Filter icon in header (top right)
- Shows: Event filter + Category filter + Status filter
- Updates event list

### 3. Event Detail Page
- Add "View Stats" action button
- Navigates to `/event/stats/[id]` with event pre-selected
- Shows all stats for that specific event

## New Screen: Event Stats Detail

### Route: `/app/event/stats/[id].tsx`

Shows comprehensive statistics for a single event:
- Event info header
- Attendee stats (total, checked-in, rate)
- Check-in timeline chart
- Attendee type distribution
- Check-in speed metrics
- Export PDF button

### Navigation
- From Event Detail page → "View Stats" button
- From Stats screen → Tap on event in charts

## Implementation Plan

1. Create `components/FilterSheet.tsx`
2. Create `app/event/stats/[id].tsx`
3. Update Stats screen to use FilterSheet
4. Update Event list screen to use FilterSheet
5. Add "View Stats" button to Event detail page

## Visual Reference
Based on the provided screenshots:
- Clean white/dark background
- Rounded corners
- Chip-style filter options
- Clear visual hierarchy
- Reset and Apply buttons
