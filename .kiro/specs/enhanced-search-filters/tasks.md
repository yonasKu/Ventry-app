# Implementation Plan: Enhanced Search and Filters

## Overview

This implementation plan breaks down the Enhanced Search and Filters feature into discrete coding tasks. The approach follows an incremental strategy: build core services first, then add UI components, and finally integrate everything together. Each task builds on previous work, with property-based tests placed close to implementation to catch errors early.

## Tasks

- [x] 1. Set up project structure and core interfaces
  - Create `services/SearchService.ts` with interface definitions
  - Create `services/FilterService.ts` with interface definitions
  - Create `services/StorageService.ts` with interface definitions
  - Define TypeScript types and interfaces for RecentSearch, SavedSearch, FilterType, FilterConfig, SearchState
  - Set up fast-check for property-based testing
  - _Requirements: 1.1, 2.1, 3.1, 7.5_

- [x] 2. Implement StorageService for persistence
  - [x] 2.1 Implement AsyncStorage wrapper methods
    - Write `saveRecentSearches(eventId, searches)` method
    - Write `loadRecentSearches(eventId)` method
    - Write `saveSavedSearches(eventId, searches)` method
    - Write `loadSavedSearches(eventId)` method
    - Implement storage key generation with event ID scoping
    - Add error handling for storage failures
    - _Requirements: 1.7, 3.6, 4.6, 7.5_

  - [ ]* 2.2 Write property test for recent search persistence round-trip
    - **Property 1: Search History Persistence Round-Trip**
    - **Validates: Requirements 1.7, 6.3, 6.4**

  - [ ]* 2.3 Write property test for saved search persistence round-trip
    - **Property 2: Saved Search Persistence Round-Trip**
    - **Validates: Requirements 3.6, 6.3, 6.5**

  - [ ]* 2.4 Write unit tests for storage error handling
    - Test AsyncStorage capacity errors
    - Test corrupted data handling
    - Test invalid JSON parsing
    - _Requirements: 4.6_

- [x] 3. Implement FilterService for attendee filtering
  - [x] 3.1 Implement filter predicates and configurations
    - Define FILTER_CONFIGS object with all filter types
    - Implement "All" filter predicate
    - Implement "Checked In" filter predicate
    - Implement "Not Checked In" filter predicate
    - Implement "Added This Week" filter predicate
    - Implement "Missing Info" filter predicate
    - Add error handling for filter predicate exceptions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Implement filter application methods
    - Write `applyFilter(attendees, filterType)` method
    - Write `combineFilters(attendees, query, filterType)` method with text search
    - Write `getFilterCount(attendees, filterType)` method
    - Write `getFilterConfig(filterType)` method
    - _Requirements: 2.6, 2.8, 2.9_

  - [ ]* 3.3 Write property tests for filter correctness
    - **Property 10: All Filter Returns All Attendees**
    - **Validates: Requirements 2.1**

  - [ ]* 3.4 Write property test for Checked In filter
    - **Property 11: Checked In Filter Correctness**
    - **Validates: Requirements 2.2**

  - [ ]* 3.5 Write property test for Not Checked In filter
    - **Property 12: Not Checked In Filter Correctness**
    - **Validates: Requirements 2.3**

  - [ ]* 3.6 Write property test for Added This Week filter
    - **Property 13: Added This Week Filter Correctness**
    - **Validates: Requirements 2.4**

  - [ ]* 3.7 Write property test for Missing Info filter
    - **Property 14: Missing Info Filter Correctness**
    - **Validates: Requirements 2.5**

  - [ ]* 3.8 Write property test for combined search and filter
    - **Property 16: Combined Search and Filter**
    - **Validates: Requirements 2.9**

  - [ ]* 3.9 Write property test for filter badge count accuracy
    - **Property 15: Filter Badge Count Accuracy**
    - **Validates: Requirements 2.8**

  - [ ]* 3.10 Write unit tests for filter edge cases
    - Test empty attendee lists
    - Test attendees with missing fields
    - Test special characters in search queries
    - Test filter predicate error handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement SearchService for search history management
  - [ ] 5.1 Implement recent search history methods
    - Write `getRecentSearches(eventId)` method
    - Write `saveRecentSearch(eventId, query)` method with bounded queue logic (max 10)
    - Write `deleteRecentSearch(eventId, searchId)` method
    - Write `clearRecentSearches(eventId)` method
    - Integrate with StorageService for persistence
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.8_

  - [ ]* 5.2 Write property test for recent search addition
    - **Property 5: Recent Search Addition**
    - **Validates: Requirements 1.1**

  - [ ]* 5.3 Write property test for bounded queue behavior
    - **Property 3: Recent Search History Bounded Queue**
    - **Validates: Requirements 1.2**

  - [ ]* 5.4 Write property test for recent search deletion
    - **Property 6: Recent Search Deletion**
    - **Validates: Requirements 1.5**

  - [ ]* 5.5 Write property test for clear all recent searches
    - **Property 7: Clear All Recent Searches**
    - **Validates: Requirements 1.6**

  - [ ]* 5.6 Write property test for recent search event isolation
    - **Property 24: Recent Search Event Isolation**
    - **Validates: Requirements 1.8, 7.1, 7.3**

  - [ ]* 5.7 Write unit tests for recent search edge cases
    - Test empty query handling
    - Test duplicate search handling
    - Test timestamp ordering
    - _Requirements: 1.1, 1.2_

- [ ] 6. Implement SearchService for saved search management
  - [ ] 6.1 Implement saved search methods
    - Write `getSavedSearches(eventId)` method
    - Write `saveSavedSearch(eventId, name, query, filterType)` method with limit enforcement (max 20)
    - Write `updateSavedSearchName(eventId, searchId, newName)` method
    - Write `deleteSavedSearch(eventId, searchId)` method
    - Write `exportSavedSearches(eventId)` method
    - Write `importSavedSearches(eventId, data)` method
    - Integrate with StorageService for persistence
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.7, 3.8, 3.9_

  - [ ]* 6.2 Write property test for saved search creation
    - **Property 19: Saved Search Creation**
    - **Validates: Requirements 3.1**

  - [ ]* 6.3 Write property test for saved search limit enforcement
    - **Property 4: Saved Search Limit Enforcement**
    - **Validates: Requirements 3.2**

  - [ ]* 6.4 Write property test for saved search name update
    - **Property 21: Saved Search Name Update Preserves Criteria**
    - **Validates: Requirements 3.4**

  - [ ]* 6.5 Write property test for saved search deletion
    - **Property 22: Saved Search Deletion**
    - **Validates: Requirements 3.5**

  - [ ]* 6.6 Write property test for export-import round-trip
    - **Property 23: Saved Search Export-Import Round-Trip**
    - **Validates: Requirements 3.8, 3.9**

  - [ ]* 6.7 Write property test for saved search event isolation
    - **Property 25: Saved Search Event Isolation**
    - **Validates: Requirements 3.7, 7.2, 7.4**

  - [ ]* 6.8 Write unit tests for saved search edge cases
    - Test duplicate names handling
    - Test empty name validation
    - Test invalid import data handling
    - _Requirements: 3.1, 3.2, 3.8, 3.9_

- [ ] 7. Implement SearchService performSearch method
  - [ ] 7.1 Implement main search orchestration
    - Write `performSearch(attendees, query, filterType)` method
    - Integrate FilterService.combineFilters()
    - Add debouncing logic (300ms delay)
    - Add memoization for filtered results
    - _Requirements: 2.9, 4.1, 4.3_

  - [ ]* 7.2 Write property test for offline search functionality
    - **Property 28: Offline Search Functionality**
    - **Validates: Requirements 6.1**

  - [ ]* 7.3 Write property test for offline filter functionality
    - **Property 29: Offline Filter Functionality**
    - **Validates: Requirements 6.2**

  - [ ]* 7.4 Write unit test for debounce timing
    - Test that rapid input waits 300ms before searching
    - _Requirements: 4.1_

  - [ ]* 7.5 Write unit test for performance with 1000 attendees
    - Test that filtering completes within 100ms
    - _Requirements: 4.2_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create SearchBar UI component
  - [x] 9.1 Implement SearchBar component
    - Create `components/search/SearchBar.tsx`
    - Add TextInput with search icon
    - Implement debounced onChange handler
    - Add clear button
    - Style according to app theme
    - _Requirements: 5.1_

  - [x] 9.2 Implement RecentSearchDropdown component
    - Create `components/search/RecentSearchDropdown.tsx`
    - Display recent searches list
    - Implement tap to apply search
    - Implement swipe to delete
    - Add "Clear All" button
    - Show/hide based on focus state
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 5.3_

  - [ ]* 9.3 Write property test for recent search display on focus
    - **Property 9: Recent Search Display on Focus**
    - **Validates: Requirements 1.3, 5.3**

  - [ ]* 9.4 Write property test for recent search application
    - **Property 8: Recent Search Application**
    - **Validates: Requirements 1.4**

  - [ ]* 9.5 Write unit tests for SearchBar interactions
    - Test focus/blur behavior
    - Test clear button functionality
    - Test keyboard handling
    - _Requirements: 5.1, 1.3_

- [x] 10. Create QuickFilterChips UI component
  - [x] 10.1 Implement QuickFilterChips component
    - Create `components/search/QuickFilterChips.tsx`
    - Render horizontally scrollable filter chips
    - Implement filter chip buttons (All, Checked In, Not Checked In, Added This Week, Missing Info)
    - Add active filter visual indicator
    - Add count badges to filter chips
    - Implement onFilterChange callback
    - Style according to app theme
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.10_

  - [ ]* 10.2 Write property test for filter application updates results
    - **Property 17: Filter Application Updates Results**
    - **Validates: Requirements 2.6**

  - [ ]* 10.3 Write property test for active filter visual indicator
    - **Property 18: Active Filter Visual Indicator**
    - **Validates: Requirements 2.7**

  - [ ]* 10.4 Write unit tests for QuickFilterChips interactions
    - Test filter chip tap handling
    - Test badge count display
    - Test horizontal scrolling
    - _Requirements: 2.6, 2.7, 2.8_

- [ ] 11. Create SavedSearchModal UI component
  - [ ] 11.1 Implement SavedSearchModal component
    - Create `components/search/SavedSearchModal.tsx`
    - Display list of saved searches
    - Implement tap to apply saved search
    - Implement edit name functionality
    - Implement delete functionality (swipe or long-press)
    - Add "Save Current Search" button
    - Add export/import buttons
    - Style according to app theme
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.8, 3.9, 5.7_

  - [ ]* 11.2 Write property test for saved search application
    - **Property 20: Saved Search Application**
    - **Validates: Requirements 3.3**

  - [ ]* 11.3 Write unit tests for SavedSearchModal interactions
    - Test save dialog
    - Test edit name dialog
    - Test delete confirmation
    - Test export/import functionality
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.8, 3.9_

- [ ] 12. Create EmptyState and LoadingState components
  - [ ] 12.1 Implement EmptyState component
    - Create `components/search/EmptyState.tsx`
    - Display message when no results found
    - Add illustration or icon
    - Style according to app theme
    - _Requirements: 5.4_

  - [ ] 12.2 Implement LoadingState component
    - Create `components/search/LoadingState.tsx`
    - Display loading spinner
    - Add loading message
    - Style according to app theme
    - _Requirements: 5.5_

  - [ ]* 12.3 Write property test for empty search results display
    - **Property 26: Empty Search Results Display**
    - **Validates: Requirements 5.4**

  - [ ]* 12.4 Write property test for loading state display
    - **Property 27: Loading State Display**
    - **Validates: Requirements 5.5**

  - [ ]* 12.5 Write unit tests for state components
    - Test EmptyState rendering
    - Test LoadingState rendering
    - _Requirements: 5.4, 5.5_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Integrate search components into attendee list screen
  - [x] 14.1 Update attendee list screen with search components
    - Import SearchBar, QuickFilterChips, SavedSearchModal components
    - Add SearchBar at top of screen
    - Add QuickFilterChips below SearchBar
    - Add SavedSearchModal trigger button
    - Wire up SearchService and FilterService
    - Implement search state management (useState or Context)
    - Connect filtered results to attendee list
    - Add EmptyState when no results
    - Add LoadingState during async operations
    - _Requirements: 1.1, 1.3, 1.4, 2.6, 2.9, 3.3, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 14.2 Implement memoization for filtered results
    - Use useMemo for filtered attendees
    - Use useCallback for search handlers
    - Optimize re-renders
    - _Requirements: 4.3_

  - [x] 14.3 Add smooth animations and transitions
    - Add fade-in animation for search results
    - Add slide animation for filter chips
    - Add smooth transitions for state changes
    - _Requirements: 5.6_

  - [ ]* 14.4 Write integration tests for complete search flow
    - Test search input → filter → display results
    - Test recent search → apply → display results
    - Test saved search → apply → display results
    - Test filter change → update results
    - Test empty results → show empty state
    - _Requirements: 1.1, 1.4, 2.6, 2.9, 3.3, 5.4_

- [ ] 15. Add event-scoped data loading
  - [ ] 15.1 Load search data when event screen mounts
    - Call SearchService.getRecentSearches(eventId) on mount
    - Call SearchService.getSavedSearches(eventId) on mount
    - Update state with loaded data
    - Handle loading errors gracefully
    - _Requirements: 1.8, 3.7, 7.3, 7.4_

  - [ ] 15.2 Clear search state when navigating away from event
    - Reset search query
    - Reset active filter to "All"
    - Clear component state
    - _Requirements: 7.3, 7.4_

  - [ ]* 15.3 Write unit tests for event-scoped loading
    - Test loading correct data for event
    - Test clearing state on navigation
    - Test error handling during load
    - _Requirements: 1.8, 3.7, 7.3, 7.4_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Manual testing and polish
  - Test complete user flows on device
  - Verify performance with large attendee lists (1000+ attendees)
  - Test offline functionality
  - Verify smooth animations
  - Test on iOS and Android
  - Fix any visual or UX issues
  - _Requirements: 4.2, 6.1, 6.2, 5.6_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (29 total)
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
- The implementation uses TypeScript with React Native
- fast-check library is used for property-based testing
- All search data is stored per-event in AsyncStorage
- Performance target: < 100ms filtering for 1000 attendees
