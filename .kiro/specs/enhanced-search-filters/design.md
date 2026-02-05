# Design Document: Enhanced Search and Filters

## Overview

The Enhanced Search and Filters feature extends the Ventry app's attendee search capabilities with three main components:

1. **Recent Search History**: Automatically saves the last 10 searches per event, allowing quick re-application
2. **Quick Filter Buttons**: Provides one-tap filtering for common scenarios (checked-in status, recently added, missing info)
3. **Saved Searches**: Enables users to save and name frequently used search+filter combinations

The design emphasizes performance (sub-100ms filtering for 1000 attendees), offline-first operation, and per-event data isolation. All search data persists in AsyncStorage with event-scoped keys.

## Architecture

### Component Structure

```
SearchBar (UI Component)
├── SearchInput (text input with debounce)
├── RecentSearchDropdown (displays recent searches)
└── SavedSearchButton (opens saved search modal)

QuickFilterChips (UI Component)
├── FilterChip[] (All, Checked In, Not Checked In, etc.)
└── FilterBadge (shows count for active filter)

AttendeeList (UI Component)
├── FilteredResults (memoized filtered attendees)
└── EmptyState / LoadingState

SearchService (Business Logic)
├── performSearch(query, filters)
├── getRecentSearches(eventId)
├── saveRecentSearch(eventId, query)
├── deleteRecentSearch(eventId, searchId)
├── clearRecentSearches(eventId)
├── getSavedSearches(eventId)
├── saveSavedSearch(eventId, name, query, filters)
├── updateSavedSearchName(eventId, searchId, newName)
├── deleteSavedSearch(eventId, searchId)
├── exportSavedSearches(eventId)
└── importSavedSearches(eventId, data)

FilterService (Business Logic)
├── applyFilter(attendees, filterType)
├── combineFilters(attendees, query, filterType)
└── getFilterCount(attendees, filterType)

StorageService (Persistence)
├── saveRecentSearches(eventId, searches)
├── loadRecentSearches(eventId)
├── saveSavedSearches(eventId, searches)
└── loadSavedSearches(eventId)
```

### Data Flow

1. **Search Input**: User types → debounce (300ms) → SearchService.performSearch() → FilterService.combineFilters() → update UI
2. **Quick Filter**: User taps filter chip → FilterService.applyFilter() → update UI + badge count
3. **Recent Search**: User taps recent search → apply query → SearchService.saveRecentSearch() → update UI
4. **Saved Search**: User saves search → SavedSearchManager stores query+filters → persist to AsyncStorage

### State Management

The feature uses React Context or local component state (depending on existing app architecture) to manage:

- `currentSearchQuery: string` - Active search text
- `activeFilter: FilterType` - Currently selected quick filter
- `recentSearches: RecentSearch[]` - Recent search history for current event
- `savedSearches: SavedSearch[]` - Saved searches for current event
- `filteredAttendees: Attendee[]` - Memoized filtered results
- `isLoading: boolean` - Loading state for async operations

## Components and Interfaces

### Data Models

```typescript
interface RecentSearch {
  id: string;              // UUID
  query: string;           // Search text
  timestamp: number;       // Unix timestamp
  eventId: string;         // Event this search belongs to
}

interface SavedSearch {
  id: string;              // UUID
  name: string;            // User-provided name
  query: string;           // Search text
  filterType: FilterType;  // Active filter when saved
  eventId: string;         // Event this search belongs to
  createdAt: number;       // Unix timestamp
  updatedAt: number;       // Unix timestamp
}

type FilterType = 
  | 'all' 
  | 'checked-in' 
  | 'not-checked-in' 
  | 'added-this-week' 
  | 'missing-info';

interface FilterConfig {
  type: FilterType;
  label: string;
  predicate: (attendee: Attendee) => boolean;
}

interface SearchState {
  query: string;
  activeFilter: FilterType;
  recentSearches: RecentSearch[];
  savedSearches: SavedSearch[];
  isLoading: boolean;
}
```

### SearchService Interface

```typescript
class SearchService {
  // Search operations
  performSearch(
    attendees: Attendee[], 
    query: string, 
    filterType: FilterType
  ): Attendee[];
  
  // Recent search history
  getRecentSearches(eventId: string): Promise<RecentSearch[]>;
  saveRecentSearch(eventId: string, query: string): Promise<void>;
  deleteRecentSearch(eventId: string, searchId: string): Promise<void>;
  clearRecentSearches(eventId: string): Promise<void>;
  
  // Saved searches
  getSavedSearches(eventId: string): Promise<SavedSearch[]>;
  saveSavedSearch(
    eventId: string, 
    name: string, 
    query: string, 
    filterType: FilterType
  ): Promise<SavedSearch>;
  updateSavedSearchName(
    eventId: string, 
    searchId: string, 
    newName: string
  ): Promise<void>;
  deleteSavedSearch(eventId: string, searchId: string): Promise<void>;
  exportSavedSearches(eventId: string): Promise<string>;
  importSavedSearches(eventId: string, data: string): Promise<void>;
}
```

### FilterService Interface

```typescript
class FilterService {
  // Filter operations
  applyFilter(attendees: Attendee[], filterType: FilterType): Attendee[];
  
  // Combined search + filter
  combineFilters(
    attendees: Attendee[], 
    query: string, 
    filterType: FilterType
  ): Attendee[];
  
  // Get count for filter badge
  getFilterCount(attendees: Attendee[], filterType: FilterType): number;
  
  // Get filter configuration
  getFilterConfig(filterType: FilterType): FilterConfig;
}
```

### StorageService Interface

```typescript
class StorageService {
  // Recent searches
  saveRecentSearches(eventId: string, searches: RecentSearch[]): Promise<void>;
  loadRecentSearches(eventId: string): Promise<RecentSearch[]>;
  
  // Saved searches
  saveSavedSearches(eventId: string, searches: SavedSearch[]): Promise<void>;
  loadSavedSearches(eventId: string): Promise<SavedSearch[]>;
  
  // Storage key generation
  private getRecentSearchesKey(eventId: string): string;
  private getSavedSearchesKey(eventId: string): string;
}
```

## Data Models

### Storage Schema

**AsyncStorage Keys:**
- Recent searches: `@ventry:recent_searches:{eventId}`
- Saved searches: `@ventry:saved_searches:{eventId}`

**Recent Searches Storage Format:**
```json
{
  "searches": [
    {
      "id": "uuid-1",
      "query": "john",
      "timestamp": 1704067200000,
      "eventId": "event-123"
    }
  ]
}
```

**Saved Searches Storage Format:**
```json
{
  "searches": [
    {
      "id": "uuid-1",
      "name": "VIP Not Checked In",
      "query": "vip",
      "filterType": "not-checked-in",
      "eventId": "event-123",
      "createdAt": 1704067200000,
      "updatedAt": 1704067200000
    }
  ]
}
```

### Filter Predicates

Each filter type maps to a predicate function:

```typescript
const FILTER_CONFIGS: Record<FilterType, FilterConfig> = {
  'all': {
    type: 'all',
    label: 'All',
    predicate: () => true
  },
  'checked-in': {
    type: 'checked-in',
    label: 'Checked In',
    predicate: (attendee) => attendee.checkedIn === true
  },
  'not-checked-in': {
    type: 'not-checked-in',
    label: 'Not Checked In',
    predicate: (attendee) => attendee.checkedIn !== true
  },
  'added-this-week': {
    type: 'added-this-week',
    label: 'Added This Week',
    predicate: (attendee) => {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return attendee.createdAt >= weekAgo;
    }
  },
  'missing-info': {
    type: 'missing-info',
    label: 'Missing Info',
    predicate: (attendee) => {
      // Check if any required custom fields are empty
      return attendee.customFields?.some(
        field => field.required && !field.value
      ) ?? false;
    }
  }
};
```

### Search Algorithm

The search algorithm combines text matching with filter predicates:

1. **Text Search**: Case-insensitive substring match on name, email, and custom field values
2. **Filter Application**: Apply active filter predicate
3. **Combination**: Attendee must match both text search AND filter predicate

```typescript
function combineFilters(
  attendees: Attendee[], 
  query: string, 
  filterType: FilterType
): Attendee[] {
  const normalizedQuery = query.toLowerCase().trim();
  const filterConfig = FILTER_CONFIGS[filterType];
  
  return attendees.filter(attendee => {
    // Apply filter predicate
    if (!filterConfig.predicate(attendee)) {
      return false;
    }
    
    // If no query, return all that pass filter
    if (!normalizedQuery) {
      return true;
    }
    
    // Text search on name, email, custom fields
    const searchableText = [
      attendee.name,
      attendee.email,
      ...(attendee.customFields?.map(f => f.value) ?? [])
    ].join(' ').toLowerCase();
    
    return searchableText.includes(normalizedQuery);
  });
}
```

## Performance Optimizations

### Debouncing

Search input is debounced to prevent excessive filtering:

```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    setSearchQuery(query);
  }, 300),
  []
);
```

### Memoization

Filtered results are memoized to avoid redundant computation:

```typescript
const filteredAttendees = useMemo(
  () => SearchService.performSearch(attendees, searchQuery, activeFilter),
  [attendees, searchQuery, activeFilter]
);
```

### Efficient Storage

- Recent searches limited to 10 per event (prevents unbounded growth)
- Saved searches limited to 20 per event (prevents storage bloat)
- Event-scoped keys prevent loading unnecessary data

### Memory Management

- Clear event listeners on component unmount
- Avoid storing large objects in state
- Use pagination for large attendee lists (if needed in future)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Search History Persistence Round-Trip

*For any* set of recent searches for an event, saving to storage and then loading from storage should produce an equivalent set of recent searches with the same queries, timestamps, and event IDs.

**Validates: Requirements 1.7, 6.3, 6.4**

### Property 2: Saved Search Persistence Round-Trip

*For any* set of saved searches for an event, saving to storage and then loading from storage should produce an equivalent set of saved searches with the same names, queries, filters, and event IDs.

**Validates: Requirements 3.6, 6.3, 6.5**

### Property 3: Recent Search History Bounded Queue

*For any* sequence of more than 10 searches for an event, the History_Manager should maintain only the 10 most recent searches, removing the oldest searches first.

**Validates: Requirements 1.2**

### Property 4: Saved Search Limit Enforcement

*For any* event with 20 saved searches, attempting to save an additional search should be rejected, and the saved search count should remain at 20.

**Validates: Requirements 3.2**

### Property 5: Recent Search Addition

*For any* search query performed by a user, that query should appear in the recent searches list for that event after the search is performed.

**Validates: Requirements 1.1**

### Property 6: Recent Search Deletion

*For any* recent search in the history, deleting that search should remove it from the recent searches list, and the search should not appear in subsequent retrievals.

**Validates: Requirements 1.5**

### Property 7: Clear All Recent Searches

*For any* event with recent searches, clearing all recent searches should result in an empty recent searches list for that event.

**Validates: Requirements 1.6**

### Property 8: Recent Search Application

*For any* recent search in the history, tapping that search should apply the search query to the attendee list, and the filtered results should match the query.

**Validates: Requirements 1.4**

### Property 9: Recent Search Display on Focus

*For any* event with recent searches, focusing the search bar should display the recent searches for that event in a dropdown.

**Validates: Requirements 1.3, 5.3**

### Property 10: All Filter Returns All Attendees

*For any* attendee list, applying the "All" filter should return the complete attendee list unchanged.

**Validates: Requirements 2.1**

### Property 11: Checked In Filter Correctness

*For any* attendee list, applying the "Checked In" filter should return only attendees where checkedIn === true, and all returned attendees should have checkedIn === true.

**Validates: Requirements 2.2**

### Property 12: Not Checked In Filter Correctness

*For any* attendee list, applying the "Not Checked In" filter should return only attendees where checkedIn !== true, and all returned attendees should have checkedIn !== true.

**Validates: Requirements 2.3**

### Property 13: Added This Week Filter Correctness

*For any* attendee list, applying the "Added This Week" filter should return only attendees with createdAt within the last 7 days, and all returned attendees should have createdAt >= (now - 7 days).

**Validates: Requirements 2.4**

### Property 14: Missing Info Filter Correctness

*For any* attendee list with custom fields, applying the "Missing Info" filter should return only attendees with at least one empty required custom field, and all returned attendees should have at least one empty required field.

**Validates: Requirements 2.5**

### Property 15: Filter Badge Count Accuracy

*For any* filter and attendee list, the count badge displayed for that filter should equal the number of attendees that match the filter predicate.

**Validates: Requirements 2.8**

### Property 16: Combined Search and Filter

*For any* search query and filter type, the filtered results should contain only attendees that match both the text search (name, email, or custom fields contain the query) AND the filter predicate.

**Validates: Requirements 2.9**

### Property 17: Filter Application Updates Results

*For any* filter, tapping that filter should immediately update the displayed attendees to show only those matching the filter predicate.

**Validates: Requirements 2.6**

### Property 18: Active Filter Visual Indicator

*For any* active filter, the UI should display a visual indicator on the corresponding filter button.

**Validates: Requirements 2.7**

### Property 19: Saved Search Creation

*For any* search query, filter type, and name, saving a search should create a saved search entry with all three values stored correctly.

**Validates: Requirements 3.1**

### Property 20: Saved Search Application

*For any* saved search, applying that search should set both the search query and the filter type to match the saved values.

**Validates: Requirements 3.3**

### Property 21: Saved Search Name Update Preserves Criteria

*For any* saved search, updating the name should change only the name field while preserving the query and filter type unchanged.

**Validates: Requirements 3.4**

### Property 22: Saved Search Deletion

*For any* saved search, deleting that search should remove it from the saved searches list, and the search should not appear in subsequent retrievals.

**Validates: Requirements 3.5**

### Property 23: Saved Search Export-Import Round-Trip

*For any* set of saved searches for an event, exporting and then importing should produce an equivalent set of saved searches with the same names, queries, and filters.

**Validates: Requirements 3.8, 3.9**

### Property 24: Recent Search Event Isolation

*For any* two different events, recent searches saved for one event should not appear in the recent searches list for the other event.

**Validates: Requirements 1.8, 7.1, 7.3**

### Property 25: Saved Search Event Isolation

*For any* two different events, saved searches created for one event should not appear in the saved searches list for the other event.

**Validates: Requirements 3.7, 7.2, 7.4**

### Property 26: Empty Search Results Display

*For any* search query that returns no matching attendees, the UI should display an empty state message.

**Validates: Requirements 5.4**

### Property 27: Loading State Display

*For any* asynchronous search operation, the UI should display a loading indicator while the operation is in progress.

**Validates: Requirements 5.5**

### Property 28: Offline Search Functionality

*For any* search query, the search operation should complete successfully without network connectivity, using only local data.

**Validates: Requirements 6.1**

### Property 29: Offline Filter Functionality

*For any* filter operation, the filter should apply successfully without network connectivity, using only local data.

**Validates: Requirements 6.2**

## Error Handling

### Storage Errors

**Scenario**: AsyncStorage operations fail due to capacity limits or permissions

**Handling**:
- Catch all AsyncStorage exceptions
- Log errors for debugging
- Display user-friendly error message: "Unable to save search history. Storage may be full."
- Gracefully degrade: continue operation without persistence
- Don't crash the app

**Implementation**:
```typescript
try {
  await AsyncStorage.setItem(key, value);
} catch (error) {
  console.error('Storage error:', error);
  // Show toast notification
  Toast.show({
    type: 'error',
    text1: 'Storage Error',
    text2: 'Unable to save search history'
  });
  // Continue without persistence
}
```

### Invalid Data Format

**Scenario**: Corrupted data loaded from AsyncStorage

**Handling**:
- Validate data structure on load
- If invalid, clear corrupted data and start fresh
- Log warning for debugging
- Don't crash the app

**Implementation**:
```typescript
try {
  const data = JSON.parse(storedData);
  if (!isValidRecentSearchArray(data)) {
    throw new Error('Invalid data format');
  }
  return data;
} catch (error) {
  console.warn('Invalid stored data, clearing:', error);
  await AsyncStorage.removeItem(key);
  return [];
}
```

### Filter Predicate Errors

**Scenario**: Filter predicate throws exception (e.g., accessing undefined property)

**Handling**:
- Wrap filter predicates in try-catch
- Log error with attendee data for debugging
- Exclude problematic attendee from results (fail-safe)
- Continue filtering remaining attendees

**Implementation**:
```typescript
return attendees.filter(attendee => {
  try {
    return filterConfig.predicate(attendee);
  } catch (error) {
    console.error('Filter predicate error:', error, attendee);
    return false; // Exclude from results
  }
});
```

### Search Query Edge Cases

**Scenario**: Empty strings, special characters, very long queries

**Handling**:
- Trim whitespace from queries
- Handle empty queries (return all attendees with active filter)
- Escape special regex characters if using regex
- Truncate extremely long queries (> 1000 chars)

### Event ID Missing

**Scenario**: Event ID not provided to search/storage operations

**Handling**:
- Validate event ID before operations
- Throw descriptive error if missing
- Don't allow operations without event context

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: enhanced-search-filters, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: enhanced-search-filters, Property 1: Search History Persistence Round-Trip
test('recent searches round-trip through storage', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(recentSearchArbitrary(), { maxLength: 10 }),
      fc.uuid(),
      async (searches, eventId) => {
        // Save to storage
        await StorageService.saveRecentSearches(eventId, searches);
        
        // Load from storage
        const loaded = await StorageService.loadRecentSearches(eventId);
        
        // Should be equivalent
        expect(loaded).toEqual(searches);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Focus

Unit tests should focus on:
- Specific examples that demonstrate correct behavior (e.g., "searching for 'john' returns John Doe")
- Edge cases (empty queries, special characters, boundary conditions)
- Error conditions (storage failures, invalid data, missing event IDs)
- Integration points between components (SearchService → FilterService → UI)

**Avoid writing too many unit tests** - property-based tests handle covering lots of inputs. Unit tests should be targeted and specific.

### Test Coverage Goals

- **Property tests**: All 29 correctness properties implemented as property-based tests
- **Unit tests**: 
  - 5-10 tests for SearchService (specific examples, error cases)
  - 5-10 tests for FilterService (edge cases, custom field handling)
  - 5-10 tests for StorageService (error handling, data validation)
  - 10-15 tests for UI components (user interactions, visual states)

### Testing Tools

- **Property-based testing**: `fast-check`
- **Unit testing**: Jest (existing in React Native projects)
- **Component testing**: React Native Testing Library
- **Storage mocking**: `@react-native-async-storage/async-storage/jest/async-storage-mock`

### Performance Testing

While not part of automated tests, manual performance validation should verify:
- Filtering 1000 attendees completes in < 100ms
- Debounce prevents excessive re-renders
- No memory leaks during extended use
- Smooth animations and transitions
