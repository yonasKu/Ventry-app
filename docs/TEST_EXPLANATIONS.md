# Test Suite Explanations

**Created:** February 20, 2026  
**Purpose:** Detailed explanations of what each test does and why it's important

---

## 📋 Table of Contents

1. [DatabaseService Tests](#databaseservice-tests)
2. [BackupService Tests](#backupservice-tests)
3. [CustomFieldsService Tests](#customfieldsservice-tests)
4. [SearchService Tests](#searchservice-tests)
5. [FilterService Tests](#filterservice-tests)
6. [Utils Tests](#utils-tests)

---

## 🗄️ DatabaseService Tests

**File:** `__tests__/services/DatabaseService.test.ts`  
**Purpose:** Test all database operations for events and attendees  
**Coverage Target:** 85%+

### Event Operations

#### `addEvent` Tests

1. **should create a new event with all required fields**
   - **What it does:** Creates an event with all fields (title, date, time, location, notes, etc.)
   - **Why it's important:** Ensures events are created correctly with all data
   - **What it checks:** 
     - Event has a unique ID
     - All fields are saved correctly
     - Initial counts are set to 0
     - Database INSERT is called with correct parameters

2. **should create event with optional fields as null**
   - **What it does:** Creates an event with only required fields
   - **Why it's important:** Ensures app works when users don't fill optional fields
   - **What it checks:**
     - Optional fields (location, notes, etc.) are set to null
     - Event is still created successfully

3. **should throw error if database insert fails**
   - **What it does:** Simulates a database error during insert
   - **Why it's important:** Ensures errors are properly handled and thrown
   - **What it checks:**
     - Error is thrown when database fails
     - Error message is preserved

#### `getEvents` Tests

1. **should return all events ordered by date and time**
   - **What it does:** Retrieves all events from database
   - **Why it's important:** Ensures event list displays correctly
   - **What it checks:**
     - All events are returned
     - Events are ordered by date DESC, time DESC
     - Correct SQL query is used

2. **should return empty array when no events exist**
   - **What it does:** Tests behavior when database is empty
   - **Why it's important:** Prevents crashes when no data exists
   - **What it checks:**
     - Returns empty array (not null or undefined)
     - No errors are thrown

3. **should throw error if database query fails**
   - **What it does:** Simulates database query failure
   - **Why it's important:** Ensures errors are handled properly
   - **What it checks:**
     - Error is thrown and propagated

#### `getEventById` Tests

1. **should return event with attendees when event exists**
   - **What it does:** Fetches a single event with its attendees
   - **Why it's important:** Event details screen needs this data
   - **What it checks:**
     - Event data is returned
     - Attendees are included
     - Attendee checked_in status is converted from integer to boolean

2. **should return null when event does not exist**
   - **What it does:** Tests fetching non-existent event
   - **Why it's important:** Prevents crashes when event is deleted
   - **What it checks:**
     - Returns null (not undefined or error)

3. **should return event without attendees if attendee fetch fails**
   - **What it does:** Tests graceful degradation when attendee fetch fails
   - **Why it's important:** Event details should still show even if attendees fail to load
   - **What it checks:**
     - Event is returned
     - Attendees field is undefined
     - No error is thrown

#### `updateEvent` Tests

1. **should update event fields successfully**
   - **What it does:** Updates one or more event fields
   - **Why it's important:** Users need to edit events
   - **What it checks:**
     - Fields are updated correctly
     - updated_at timestamp is set
     - Returns true on success

2. **should return true when no fields to update**
   - **What it does:** Tests update with empty data
   - **Why it's important:** Prevents unnecessary database calls
   - **What it checks:**
     - Returns true immediately
     - No database call is made

3. **should return false when event does not exist**
   - **What it does:** Tests updating non-existent event
   - **Why it's important:** Indicates update failure
   - **What it checks:**
     - Returns false when no rows affected

4. **should handle null values correctly**
   - **What it does:** Tests setting fields to null
   - **Why it's important:** Users should be able to clear optional fields
   - **What it checks:**
     - Null values are passed to database correctly

#### `deleteEvent` Tests

1. **should delete event successfully**
   - **What it does:** Deletes an event from database
   - **Why it's important:** Users need to remove events
   - **What it checks:**
     - Event is deleted
     - Returns true on success
     - Correct SQL is used

2. **should return false when event does not exist**
   - **What it does:** Tests deleting non-existent event
   - **Why it's important:** Indicates deletion failure
   - **What it checks:**
     - Returns false when no rows affected

3. **should cascade delete attendees**
   - **What it does:** Verifies attendees are deleted with event
   - **Why it's important:** Prevents orphaned attendee records
   - **What it checks:**
     - Database FOREIGN KEY constraint handles cascade

### Attendee Operations

#### `addAttendee` Tests

1. **should add attendee with all fields**
   - **What it does:** Creates attendee with name, email, phone
   - **Why it's important:** Ensures all attendee data is saved
   - **What it checks:**
     - Attendee has unique ID
     - All fields are saved
     - checked_in is false initially
     - event_id links to correct event

2. **should add attendee with only required fields**
   - **What it does:** Creates attendee with only name
   - **Why it's important:** Email and phone are optional
   - **What it checks:**
     - Name is saved
     - Email and phone are null

3. **should increment event attendee count**
   - **What it does:** Verifies event's attendee_count increases
   - **Why it's important:** Event statistics must be accurate
   - **What it checks:**
     - UPDATE query increments count
     - Event's updated_at is set

4. **should use transaction for atomic operation**
   - **What it does:** Verifies transaction is used
   - **Why it's important:** Ensures data consistency (both insert and count update succeed or both fail)
   - **What it checks:**
     - withTransactionSync is called

#### `getAttendees` Tests

1. **should return all attendees for an event**
   - **What it does:** Fetches all attendees for an event
   - **Why it's important:** Attendee list screen needs this
   - **What it checks:**
     - All attendees returned
     - checked_in converted from integer (0/1) to boolean (false/true)

2. **should return empty array when no attendees exist**
   - **What it does:** Tests event with no attendees
   - **Why it's important:** Prevents crashes on empty events
   - **What it checks:**
     - Returns empty array

3. **should order attendees by name (case-insensitive)**
   - **What it does:** Verifies alphabetical sorting
   - **Why it's important:** Makes attendee list easy to navigate
   - **What it checks:**
     - SQL uses COLLATE NOCASE

#### `getAttendeeById` Tests

1. **should return attendee when exists**
   - **What it does:** Fetches single attendee
   - **Why it's important:** Attendee details screen needs this
   - **What it checks:**
     - Attendee data returned
     - checked_in converted to boolean

2. **should return null when attendee does not exist**
   - **What it does:** Tests fetching non-existent attendee
   - **Why it's important:** Prevents crashes
   - **What it checks:**
     - Returns null

3. **should convert checked_in from integer to boolean**
   - **What it does:** Tests data type conversion
   - **Why it's important:** SQLite stores booleans as integers, but app uses booleans
   - **What it checks:**
     - 1 becomes true
     - 0 becomes false

#### `checkInAttendee` Tests

1. **should check in attendee successfully**
   - **What it does:** Marks attendee as checked in
   - **Why it's important:** Core functionality of the app
   - **What it checks:**
     - checked_in set to true
     - check_in_time recorded
     - Returns updated attendee

2. **should return existing attendee if already checked in**
   - **What it does:** Tests duplicate check-in attempt
   - **Why it's important:** Prevents duplicate check-ins
   - **What it checks:**
     - Returns existing data
     - No database update occurs

3. **should return null if attendee not found**
   - **What it does:** Tests checking in non-existent attendee
   - **Why it's important:** Handles invalid QR codes
   - **What it checks:**
     - Returns null

4. **should return null if attendee not registered for event**
   - **What it does:** Tests checking in attendee at wrong event
   - **Why it's important:** Prevents checking in at wrong event
   - **What it checks:**
     - Validates event_id matches
     - Returns null on mismatch

5. **should increment event checked_in_count**
   - **What it does:** Verifies event's checked_in_count increases
   - **Why it's important:** Event statistics must be accurate
   - **What it checks:**
     - UPDATE query increments count

6. **should use transaction for atomic operation**
   - **What it does:** Verifies transaction is used
   - **Why it's important:** Ensures both check-in and count update succeed together
   - **What it checks:**
     - withTransactionSync is called

#### `deleteAttendee` Tests

1. **should delete attendee successfully**
   - **What it does:** Removes attendee from database
   - **Why it's important:** Users need to remove attendees
   - **What it checks:**
     - Attendee deleted
     - Returns true

2. **should return false when attendee does not exist**
   - **What it does:** Tests deleting non-existent attendee
   - **Why it's important:** Indicates deletion failure
   - **What it checks:**
     - Returns false

3. **should decrement event attendee count**
   - **What it does:** Verifies event's attendee_count decreases
   - **Why it's important:** Keeps counts accurate
   - **What it checks:**
     - UPDATE query decrements count

4. **should decrement checked_in_count if attendee was checked in**
   - **What it does:** Decreases checked_in_count if attendee was checked in
   - **Why it's important:** Maintains accurate check-in statistics
   - **What it checks:**
     - Checks attendee's checked_in status
     - Decrements count if was checked in

5. **should use transaction for atomic operation**
   - **What it does:** Verifies transaction is used
   - **Why it's important:** Ensures delete and count updates happen together
   - **What it checks:**
     - withTransactionSync is called

### Async Methods Tests

1. **should call addEventAsync and return promise**
   - **What it does:** Tests async wrapper for addEvent
   - **Why it's important:** Ensures async API works
   - **What it checks:**
     - Returns promise
     - Promise resolves with event data

2. **should call getEventsAsync and return promise**
   - **What it does:** Tests async wrapper for getEvents
   - **Why it's important:** Ensures async API works
   - **What it checks:**
     - Returns promise
     - Promise resolves with events array

3. **should call checkInAttendeeAsync and return promise**
   - **What it does:** Tests async wrapper for checkInAttendee
   - **Why it's important:** Ensures async API works
   - **What it checks:**
     - Returns promise
     - Promise resolves with attendee data

### Data Integrity Tests

1. **should maintain referential integrity on event delete**
   - **What it does:** Verifies cascade delete works
   - **Why it's important:** Prevents orphaned attendee records
   - **What it checks:**
     - Database FOREIGN KEY constraint handles cascade

2. **should maintain accurate attendee counts**
   - **What it does:** Verifies counts are updated when adding attendees
   - **Why it's important:** Statistics must be accurate
   - **What it checks:**
     - Both insert and count update are called

3. **should maintain accurate check-in counts**
   - **What it does:** Verifies counts are updated when checking in
   - **Why it's important:** Statistics must be accurate
   - **What it checks:**
     - Both check-in update and count update are called

---

## 💾 BackupService Tests

**File:** `__tests__/services/BackupService.test.ts`  
**Purpose:** Test backup creation, validation, and restore operations  
**Coverage Target:** 80%+

### Backup Creation Tests

1. **should create full database backup**
   - **What it does:** Creates JSON backup of all data
   - **Why it's important:** Users need to backup their data
   - **What it checks:**
     - All events included
     - All attendees included
     - Custom fields included
     - Metadata included (version, timestamp, device)

2. **should include metadata in backup**
   - **What it does:** Adds version, timestamp, device info
   - **Why it's important:** Helps identify backup source and compatibility
   - **What it checks:**
     - Version number present
     - Timestamp present
     - Device ID and name present

3. **should generate valid JSON format**
   - **What it does:** Ensures backup is valid JSON
   - **Why it's important:** Backup must be parseable
   - **What it checks:**
     - JSON.parse succeeds
     - Structure is correct

### Backup Validation Tests

1. **should validate backup file structure**
   - **What it does:** Checks backup has required fields
   - **Why it's important:** Prevents restoring corrupted backups
   - **What it checks:**
     - version field exists
     - data field exists
     - counts field exists

2. **should detect corrupted backup files**
   - **What it does:** Tests invalid JSON
   - **Why it's important:** Prevents crashes during restore
   - **What it checks:**
     - Returns validation error
     - Doesn't attempt restore

3. **should validate backup version compatibility**
   - **What it does:** Checks version number
   - **Why it's important:** Prevents restoring incompatible backups
   - **What it checks:**
     - Version is compatible
     - Warning if version mismatch

### Restore Operations Tests

1. **should restore full backup successfully**
   - **What it does:** Restores all data from backup
   - **Why it's important:** Users need to restore their data
   - **What it checks:**
     - All events restored
     - All attendees restored
     - Custom fields restored
     - Relationships maintained

2. **should handle partial restore**
   - **What it does:** Restores only some data types
   - **Why it's important:** Allows selective restore
   - **What it checks:**
     - Only selected data restored
     - Other data unchanged

3. **should detect and report conflicts**
   - **What it does:** Identifies duplicate IDs
   - **Why it's important:** Prevents data corruption
   - **What it checks:**
     - Conflicts detected
     - User notified
     - Conflict resolution applied

### Backup History Tests

1. **should track backup history**
   - **What it does:** Records each backup
   - **Why it's important:** Users can see backup history
   - **What it checks:**
     - History entry created
     - Timestamp recorded
     - File size recorded

2. **should limit history to 20 entries**
   - **What it does:** Keeps only recent backups
   - **Why it's important:** Prevents unlimited storage use
   - **What it checks:**
     - Old entries removed
     - Only 20 most recent kept

3. **should cleanup old backups (30+ days)**
   - **What it does:** Deletes old backup files
   - **Why it's important:** Frees up storage space
   - **What it checks:**
     - Files older than 30 days deleted
     - Recent files kept

---

## 🔧 CustomFieldsService Tests

**File:** `__tests__/services/CustomFieldsService.test.ts`  
**Purpose:** Test custom field definitions, validation, and values  
**Coverage Target:** 80%+

### Field Definition Tests

1. **should create custom field with all types**
   - **What it does:** Creates fields of each type (text, number, email, etc.)
   - **Why it's important:** All field types must work
   - **What it checks:**
     - Field created for each type
     - Type stored correctly
     - Configuration saved

2. **should validate field configuration**
   - **What it does:** Checks field config is valid
   - **Why it's important:** Prevents invalid field definitions
   - **What it checks:**
     - Required fields present
     - Type is valid
     - Validation rules are valid

### Field Validation Tests

1. **should validate required fields**
   - **What it does:** Ensures required fields have values
   - **Why it's important:** Enforces data completeness
   - **What it checks:**
     - Error if required field empty
     - Success if required field has value

2. **should validate email format**
   - **What it does:** Checks email is valid format
   - **Why it's important:** Ensures valid email addresses
   - **What it checks:**
     - Valid emails pass
     - Invalid emails fail

3. **should validate phone format**
   - **What it does:** Checks phone number format
   - **Why it's important:** Ensures valid phone numbers
   - **What it checks:**
     - Valid phones pass
     - Invalid phones fail

4. **should validate number min/max**
   - **What it does:** Checks number is in range
   - **Why it's important:** Enforces business rules
   - **What it checks:**
     - Numbers in range pass
     - Numbers out of range fail

---

## 🔍 SearchService Tests

**File:** `__tests__/services/SearchService.test.ts`  
**Purpose:** Test search history and saved searches  
**Coverage Target:** 75%+

### Search History Tests

1. **should save search query**
   - **What it does:** Records search in history
   - **Why it's important:** Users can repeat searches
   - **What it checks:**
     - Query saved to AsyncStorage
     - Timestamp recorded

2. **should retrieve recent searches**
   - **What it does:** Gets last 10 searches
   - **Why it's important:** Shows recent search dropdown
   - **What it checks:**
     - Returns array of searches
     - Ordered by most recent

3. **should limit to 10 recent searches**
   - **What it does:** Keeps only 10 most recent
   - **Why it's important:** Prevents unlimited storage use
   - **What it checks:**
     - Old searches removed
     - Only 10 kept

---

## 🎯 FilterService Tests

**File:** `__tests__/services/FilterService.test.ts`  
**Purpose:** Test attendee filtering logic  
**Coverage Target:** 75%+

### Filter Types Tests

1. **should filter checked-in attendees**
   - **What it does:** Returns only checked-in attendees
   - **Why it's important:** Quick filter for checked-in status
   - **What it checks:**
     - Only checked-in attendees returned
     - Count is accurate

2. **should filter by date range**
   - **What it does:** Returns attendees added in date range
   - **Why it's important:** Find recently added attendees
   - **What it checks:**
     - Only attendees in range returned
     - Date comparison works

---

## 🛠️ Utils Tests

### dateTimeUtils Tests

**File:** `__tests__/utils/dateTimeUtils.test.ts`

1. **should format date correctly**
   - **What it does:** Formats date to readable string
   - **Why it's important:** Consistent date display
   - **What it checks:**
     - Format matches expected pattern
     - Handles different locales

2. **should handle invalid dates**
   - **What it does:** Tests with invalid date input
   - **Why it's important:** Prevents crashes
   - **What it checks:**
     - Returns null or error message
     - Doesn't throw exception

### errorUtils Tests

**File:** `__tests__/utils/errorUtils.test.ts`

1. **should format database errors**
   - **What it does:** Converts database errors to user-friendly messages
   - **Why it's important:** Users understand what went wrong
   - **What it checks:**
     - Error message is readable
     - Technical details hidden

---

## 🎯 Why These Tests Matter

### Data Integrity
- Ensures counts are always accurate
- Prevents orphaned records
- Maintains referential integrity

### User Experience
- Prevents crashes from edge cases
- Ensures features work as expected
- Validates user input properly

### Reliability
- Catches bugs before users do
- Ensures error handling works
- Validates business logic

### Maintainability
- Documents expected behavior
- Makes refactoring safer
- Catches regressions

---

## 📊 Test Coverage Goals

| Service | Tests | Coverage Target |
|---------|-------|----------------|
| DatabaseService | 40+ | 85% |
| BackupService | 15+ | 80% |
| CustomFieldsService | 20+ | 80% |
| SearchService | 10+ | 75% |
| FilterService | 10+ | 75% |
| Utils | 15+ | 85% |

---

**Total Tests:** 110+  
**Estimated Time:** 3-4 weeks  
**Priority:** High - Critical for production readiness
