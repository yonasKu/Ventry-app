# DatabaseService Code Review

**Reviewer**: AI Assistant  
**Date**: February 23, 2026  
**Status**: ⚠️ Needs Changes

## Executive Summary

DatabaseService is the foundation of the application. Overall code quality is **GOOD** with proper error handling and transaction management. Found **3 Critical Issues** and **5 High Priority Issues** that should be addressed.

**Strengths**:
- ✅ Proper use of transactions for multi-step operations
- ✅ Good error handling with try-catch blocks
- ✅ Parameterized queries (no SQL injection)
- ✅ Proper counter management (attendees_count, checked_in_count)
- ✅ Database migration system in place
- ✅ Both sync and async APIs provided

**Weaknesses**:
- ❌ Global database instance (not testable)
- ❌ Missing input validation
- ❌ No connection pooling or cleanup
- ❌ Async wrappers use setTimeout (not true async)

---

## Critical Issues (Must Fix)

### 1. Global Database Instance
**Location**: Line 49  
**Severity**: 🔴 CRITICAL

```typescript
// ❌ PROBLEM
let db = openDatabaseSync('ventry.db');
```

**Issue**: Global database instance makes testing difficult and prevents multiple database connections.

**Impact**:
- Cannot create test databases
- Cannot close/reopen database
- Memory leaks if database isn't closed
- Unit tests must mock at module level

**Fix**:
```typescript
// ✅ SOLUTION
export class DatabaseService {
  private db: any;
  
  constructor(dbName: string = 'ventry.db') {
    this.db = openDatabaseSync(dbName);
    this.initDatabase();
  }
  
  closeSync(): void {
    if (this.db) {
      this.db.closeSync();
    }
  }
}

// Usage
const dbService = new DatabaseService(); // Production
const testDb = new DatabaseService(':memory:'); // Testing
```

### 2. Missing Input Validation
**Location**: Multiple methods  
**Severity**: 🔴 CRITICAL

```typescript
// ❌ PROBLEM - No validation
addEvent(eventData: Omit<Event, ...>): Event {
  // Directly uses eventData without validation
  const newEvent: Event = { ...eventData, ... };
}
```

**Issue**: No validation of required fields, data types, or lengths.

**Impact**:
- Invalid data can be inserted
- SQL errors from malformed data
- App crashes from unexpected values

**Fix**:
```typescript
// ✅ SOLUTION
addEvent(eventData: Omit<Event, ...>): Event {
  // Validate required fields
  if (!eventData.title || eventData.title.trim() === '') {
    throw new Error('Event title is required');
  }
  
  if (!eventData.date || !this.isValidDate(eventData.date)) {
    throw new Error('Valid event date is required');
  }
  
  if (!eventData.time || !this.isValidTime(eventData.time)) {
    throw new Error('Valid event time is required');
  }
  
  // Validate lengths
  if (eventData.title.length > 255) {
    throw new Error('Event title must be 255 characters or less');
  }
  
  // Continue with insert...
}

private isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

private isValidTime(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}
```

### 3. Cascade Delete Not Guaranteed
**Location**: Line 308 (deleteEvent)  
**Severity**: 🔴 CRITICAL

```typescript
// ❌ PROBLEM
deleteEvent(id: string): boolean {
  try {
    const result = db.runSync(
      'DELETE FROM events WHERE id = ?;',
      [id]
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}
```

**Issue**: Relies on `ON DELETE CASCADE` foreign key constraint, but doesn't verify it's working. Custom fields and other related data might not be deleted.

**Impact**:
- Orphaned attendee records
- Orphaned custom field values
- Database bloat
- Data integrity issues

**Fix**:
```typescript
// ✅ SOLUTION
deleteEvent(id: string): boolean {
  try {
    let success = false;
    
    db.withTransactionSync(() => {
      // Explicitly delete related data
      // 1. Delete custom field values for all attendees
      db.runSync(
        `DELETE FROM custom_field_values 
         WHERE attendee_id IN (
           SELECT id FROM attendees WHERE event_id = ?
         );`,
        [id]
      );
      
      // 2. Delete custom fields for this event
      db.runSync(
        'DELETE FROM custom_fields WHERE event_id = ?;',
        [id]
      );
      
      // 3. Delete attendees
      db.runSync(
        'DELETE FROM attendees WHERE event_id = ?;',
        [id]
      );
      
      // 4. Finally delete the event
      const result = db.runSync(
        'DELETE FROM events WHERE id = ?;',
        [id]
      );
      
      success = result.changes > 0;
    });
    
    return success;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}
```

---

## High Priority Issues

### 4. Async Wrappers Use setTimeout
**Location**: Lines 320-380  
**Severity**: 🟠 HIGH

```typescript
// ❌ PROBLEM
async addEventAsync(...): Promise<Event> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {  // This doesn't make it truly async!
      try {
        const result = this.addEvent(eventData);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, 0);
  });
}
```

**Issue**: Using `setTimeout(..., 0)` doesn't make operations truly asynchronous. It just defers execution to the next event loop tick.

**Impact**:
- Misleading API (looks async but blocks)
- No performance benefit
- Confusing for developers

**Fix**:
```typescript
// ✅ SOLUTION 1: Remove async wrappers (recommended)
// Just use sync methods directly - they're fast enough

// ✅ SOLUTION 2: Use Web Workers (complex)
// Only if you have very large datasets

// ✅ SOLUTION 3: Document clearly
/**
 * Async wrapper for addEvent.
 * Note: This uses setTimeout to defer execution but still blocks.
 * Use for consistency with async/await patterns, not for performance.
 */
async addEventAsync(...): Promise<Event> {
  // ... existing code
}
```

### 5. No Connection Cleanup
**Location**: Global scope  
**Severity**: 🟠 HIGH

**Issue**: Database connection is never closed, leading to potential resource leaks.

**Fix**:
```typescript
// ✅ SOLUTION
export class DatabaseService {
  // ... existing code
  
  /**
   * Close database connection
   * Call this when app is closing or during cleanup
   */
  closeSync(): void {
    try {
      if (this.db) {
        this.db.closeSync();
        console.log('Database closed successfully');
      }
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

// In app cleanup (e.g., App.tsx)
useEffect(() => {
  return () => {
    dbService.closeSync();
  };
}, []);
```

### 6. Migration Runs on Every Import
**Location**: Line 103 (migrateDatabase)  
**Severity**: 🟠 HIGH

**Issue**: Migration runs every time the module is imported, checking columns repeatedly.

**Impact**:
- Performance overhead
- Unnecessary database queries
- Logs spam

**Fix**:
```typescript
// ✅ SOLUTION
export class DatabaseService {
  private migrated: boolean = false;
  
  private migrateDatabase(): void {
    if (this.migrated) return; // Skip if already migrated
    
    try {
      // ... existing migration code
      this.migrated = true;
    } catch (error) {
      console.error('Error migrating database:', error);
    }
  }
}
```

### 7. checkInAttendee Has Confusing Parameters
**Location**: Line 495  
**Severity**: 🟠 HIGH

```typescript
// ❌ PROBLEM
checkInAttendee(attendeeId: string, eventIdFromQR: string): Attendee | null {
  // ...
  const effectiveEventId = eventIdFromQR || existingAttendee.event_id;
  // ...
}
```

**Issue**: The `eventIdFromQR` parameter is optional but not marked as such. Logic is confusing.

**Fix**:
```typescript
// ✅ SOLUTION
checkInAttendee(attendeeId: string, eventIdFromQR?: string): Attendee | null {
  // ...
  // If event ID provided, validate attendee belongs to that event
  if (eventIdFromQR && existingAttendee.event_id !== eventIdFromQR) {
    throw new Error(
      `Attendee ${attendeeId} is not registered for event ${eventIdFromQR}`
    );
  }
  // ...
}
```

### 8. No Indexes on Foreign Keys
**Location**: Line 143 (initDatabase)  
**Severity**: 🟠 HIGH

**Issue**: Missing index on `attendees.event_id` foreign key.

**Impact**:
- Slow queries when fetching attendees
- Poor performance with large datasets

**Fix**:
```typescript
// ✅ SOLUTION
export function initDatabase(): void {
  // ... existing code
  
  // Add index on foreign key
  db.runSync(
    'CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees (event_id);'
  );
  
  // Add index for check-in queries
  db.runSync(
    'CREATE INDEX IF NOT EXISTS idx_attendees_checked_in ON attendees (checked_in);'
  );
}
```

---

## Medium Priority Issues

### 9. Inconsistent Error Messages
**Location**: Multiple  
**Severity**: 🟡 MEDIUM

**Issue**: Some errors are logged, some are thrown, some return null.

**Fix**: Establish consistent error handling pattern:
```typescript
// ✅ SOLUTION
// For not found: return null
// For validation errors: throw Error with clear message
// For database errors: log and throw
```

### 10. No Batch Operations
**Location**: N/A  
**Severity**: 🟡 MEDIUM

**Issue**: No way to add multiple attendees efficiently.

**Fix**:
```typescript
// ✅ SOLUTION
addAttendeesBatch(eventId: string, attendees: Array<{name: string, email?: string, phone?: string}>): Attendee[] {
  const newAttendees: Attendee[] = [];
  const now = new Date().toISOString();
  
  try {
    db.withTransactionSync(() => {
      attendees.forEach(attendeeData => {
        const newId = nanoid();
        const newAttendee: Attendee = {
          id: newId,
          event_id: eventId,
          name: attendeeData.name,
          email: attendeeData.email || null,
          phone: attendeeData.phone || null,
          checked_in: false,
          created_at: now,
          updated_at: now,
        };
        
        db.runSync(
          'INSERT INTO attendees (id, event_id, name, email, phone, checked_in, check_in_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
          [newAttendee.id, newAttendee.event_id, newAttendee.name, newAttendee.email, newAttendee.phone, 0, null, newAttendee.created_at, newAttendee.updated_at]
        );
        
        newAttendees.push(newAttendee);
      });
      
      // Update count once
      db.runSync(
        'UPDATE events SET attendees_count = attendees_count + ?, updated_at = ? WHERE id = ?;',
        [attendees.length, now, eventId]
      );
    });
    
    return newAttendees;
  } catch (error) {
    console.error('Error adding attendees batch:', error);
    throw error;
  }
}
```

---

## Low Priority (Nice to Have)

### 11. Add Pagination
```typescript
getEvents(limit: number = 100, offset: number = 0): Event[] {
  return db.getAllSync<Event>(
    'SELECT * FROM events ORDER BY date DESC, time DESC LIMIT ? OFFSET ?;',
    [limit, offset]
  );
}
```

### 12. Add Search Functionality
```typescript
searchEvents(query: string): Event[] {
  return db.getAllSync<Event>(
    `SELECT * FROM events 
     WHERE title LIKE ? OR location LIKE ? OR notes LIKE ?
     ORDER BY date DESC;`,
    [`%${query}%`, `%${query}%`, `%${query}%`]
  );
}
```

### 13. Add Statistics Methods
```typescript
getEventStats(eventId: string): {
  totalAttendees: number;
  checkedIn: number;
  checkInRate: number;
} {
  const event = this.getEventById(eventId);
  if (!event) throw new Error('Event not found');
  
  return {
    totalAttendees: event.attendees_count || 0,
    checkedIn: event.checked_in_count || 0,
    checkInRate: event.attendees_count > 0 
      ? (event.checked_in_count / event.attendees_count) * 100 
      : 0,
  };
}
```

---

## Positive Findings

✅ **Excellent transaction usage** - All multi-step operations properly wrapped  
✅ **Good SQL practices** - Parameterized queries, no string concatenation  
✅ **Proper type safety** - Good use of TypeScript interfaces  
✅ **Counter management** - Attendee counts updated correctly  
✅ **Migration system** - Handles schema changes gracefully  
✅ **Error handling** - Try-catch blocks in all methods  
✅ **Boolean conversion** - Properly handles SQLite integer booleans  

---

## Recommendations

### Immediate Actions (This Week)
1. ✅ Fix global database instance → Make it a class property
2. ✅ Add input validation to addEvent and addAttendee
3. ✅ Fix cascade delete to be explicit
4. ✅ Add missing indexes

### Short Term (Next Sprint)
5. ✅ Document async wrapper limitations
6. ✅ Add database cleanup method
7. ✅ Fix migration to run once
8. ✅ Make eventIdFromQR optional parameter

### Long Term (Future)
9. ✅ Add batch operations
10. ✅ Add pagination
11. ✅ Add search functionality
12. ✅ Consider using an ORM (TypeORM, Prisma)

---

## Testing Recommendations

1. **Add integration tests** with real database
2. **Test cascade deletes** explicitly
3. **Test counter accuracy** under concurrent operations
4. **Test migration** with old database versions
5. **Test error scenarios** (invalid data, missing fields)

---

## Security Assessment

✅ **SQL Injection**: PROTECTED - All queries use parameterized statements  
✅ **Data Validation**: NEEDS WORK - Add input validation  
✅ **Error Exposure**: GOOD - Errors logged but not exposed to users  
⚠️ **Resource Leaks**: POTENTIAL - Add connection cleanup  

---

## Performance Assessment

✅ **Query Efficiency**: GOOD - Proper use of indexes  
⚠️ **Missing Indexes**: Add index on attendees.event_id  
✅ **Transaction Usage**: EXCELLENT - All multi-step ops wrapped  
⚠️ **Batch Operations**: MISSING - Add for bulk inserts  

---

## Conclusion

DatabaseService is **well-structured** with good practices, but needs **critical fixes** before production:

1. Make database instance non-global
2. Add input validation
3. Fix cascade deletes
4. Add missing indexes

After these fixes, the service will be **production-ready** with high confidence.

**Estimated Fix Time**: 4-6 hours
