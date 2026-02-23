# Action Plan - Critical Fixes Before Production

**Date**: February 23, 2026  
**Priority**: HIGH  
**Estimated Time**: 14-20 hours (2-3 days)

## Overview

Based on code reviews of 3 critical services, we found **6 critical issues** that must be fixed before production deployment. This document provides a step-by-step action plan.

---

## Critical Issues to Fix

### 1. DatabaseService: Global Database Instance
**File**: `services/DatabaseService.ts`  
**Time**: 2-3 hours  
**Priority**: 🔴 CRITICAL

**Current Code** (Line 49):
```typescript
let db = openDatabaseSync('ventry.db');
```

**Fix**:
```typescript
// Convert to class-based singleton
export class DatabaseService {
  private static instance: DatabaseService;
  private db: any;
  
  private constructor(dbName: string = 'ventry.db') {
    this.db = openDatabaseSync(dbName);
    this.initDatabase();
    this.migrateDatabase();
  }
  
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  public closeSync(): void {
    if (this.db) {
      this.db.closeSync();
    }
  }
  
  // ... rest of methods (remove 'export function' and make them class methods)
}

// Export singleton instance
export const dbService = DatabaseService.getInstance();
```

**Testing**:
```bash
npm test DatabaseService
```

---

### 2. DatabaseService: Missing Input Validation
**File**: `services/DatabaseService.ts`  
**Time**: 2-3 hours  
**Priority**: 🔴 CRITICAL

**Add validation methods**:
```typescript
private validateEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): void {
  if (!eventData.title || eventData.title.trim() === '') {
    throw new Error('Event title is required');
  }
  
  if (eventData.title.length > 255) {
    throw new Error('Event title must be 255 characters or less');
  }
  
  if (!eventData.date || !this.isValidDate(eventData.date)) {
    throw new Error('Valid event date is required (YYYY-MM-DD)');
  }
  
  if (!eventData.time || !this.isValidTime(eventData.time)) {
    throw new Error('Valid event time is required (HH:MM)');
  }
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

private validateAttendee(attendeeData: { name: string; email?: string; phone?: string }): void {
  if (!attendeeData.name || attendeeData.name.trim() === '') {
    throw new Error('Attendee name is required');
  }
  
  if (attendeeData.name.length > 255) {
    throw new Error('Attendee name must be 255 characters or less');
  }
  
  if (attendeeData.email && !this.isValidEmail(attendeeData.email)) {
    throw new Error('Invalid email format');
  }
  
  if (attendeeData.phone && !this.isValidPhone(attendeeData.phone)) {
    throw new Error('Invalid phone format');
  }
}

private isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

private isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}
```

**Update addEvent**:
```typescript
addEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'attendees_count' | 'checked_in_count'>): Event {
  // Validate input
  this.validateEvent(eventData);
  
  // ... rest of existing code
}
```

**Update addAttendee**:
```typescript
addAttendee(eventId: string, attendeeData: { name: string; email?: string; phone?: string }): Attendee {
  // Validate input
  this.validateAttendee(attendeeData);
  
  // ... rest of existing code
}
```

**Testing**:
```bash
npm test DatabaseService
```

---

### 3. DatabaseService: Cascade Delete Not Guaranteed
**File**: `services/DatabaseService.ts`  
**Time**: 1-2 hours  
**Priority**: 🔴 CRITICAL

**Update deleteEvent** (Line 308):
```typescript
deleteEvent(id: string): boolean {
  try {
    let success = false;
    
    this.db.withTransactionSync(() => {
      // 1. Delete custom field values for all attendees
      this.db.runSync(
        `DELETE FROM custom_field_values 
         WHERE attendee_id IN (
           SELECT id FROM attendees WHERE event_id = ?
         );`,
        [id]
      );
      
      // 2. Delete custom fields for this event
      this.db.runSync(
        'DELETE FROM custom_fields WHERE event_id = ?;',
        [id]
      );
      
      // 3. Delete attendees
      this.db.runSync(
        'DELETE FROM attendees WHERE event_id = ?;',
        [id]
      );
      
      // 4. Finally delete the event
      const result = this.db.runSync(
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

**Add missing indexes** (in initDatabase):
```typescript
// Add indexes for better performance
this.db.runSync(
  'CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees (event_id);'
);

this.db.runSync(
  'CREATE INDEX IF NOT EXISTS idx_attendees_checked_in ON attendees (checked_in);'
);

this.db.runSync(
  'CREATE INDEX IF NOT EXISTS idx_custom_fields_event_id ON custom_fields (event_id);'
);

this.db.runSync(
  'CREATE INDEX IF NOT EXISTS idx_custom_field_values_attendee_id ON custom_field_values (attendee_id);'
);
```

**Testing**:
```bash
npm test DatabaseService
```

---

### 4. BackupService: Service Instantiation
**File**: `services/BackupService.ts`  
**Time**: 1 hour  
**Priority**: 🔴 CRITICAL

**Update constructor** (Lines 60-63):
```typescript
import { dbService } from './DatabaseService';
import { customFieldsService } from './CustomFieldsService';

export class BackupService {
  private db: DatabaseService;
  private customFieldsService: CustomFieldsService;

  constructor(
    db: DatabaseService = dbService,
    customFieldsService: CustomFieldsService = customFieldsService
  ) {
    this.db = db;
    this.customFieldsService = customFieldsService;
  }
  
  // ... rest of code
}

// Export singleton instance
export const backupService = new BackupService();
```

**Testing**:
```bash
npm test BackupService
```

---

### 5. BackupService: Transaction Support During Restore
**File**: `services/BackupService.ts`  
**Time**: 2-3 hours  
**Priority**: 🔴 CRITICAL

**Update restoreFromFile** (Lines 207-290):
```typescript
async restoreFromFile(fileUri: string): Promise<RestoreResult> {
  try {
    // Read and validate backup file
    const file = new File(fileUri);
    const content = await file.text();
    const backupData: BackupData = JSON.parse(content);
    
    if (!backupData.version || !backupData.data) {
      throw new Error('Invalid backup file format');
    }
    
    const result: RestoreResult = {
      success: true,
      imported: {
        events: 0,
        attendees: 0,
        custom_fields: 0,
        templates: 0,
      },
      errors: [],
    };
    
    // Wrap entire restore in transaction
    this.db.withTransactionSync(() => {
      // Restore templates first
      for (const template of backupData.data.field_templates || []) {
        try {
          const existing = this.customFieldsService.getTemplates()
            .find(t => t.name === template.name);
          if (!existing) {
            this.customFieldsService.createTemplate({
              name: template.name,
              description: template.description,
              fields: template.fields,
              is_default: template.is_default,
            });
            result.imported.templates++;
          }
        } catch (error) {
          const errorMsg = `Failed to restore template ${template.name}: ${error}`;
          result.errors.push(errorMsg);
          throw new Error(errorMsg); // Rollback transaction
        }
      }
      
      // Restore custom fields
      for (const field of backupData.data.custom_fields || []) {
        try {
          const existing = this.customFieldsService.getField(field.id);
          if (!existing) {
            this.customFieldsService.createField({
              name: field.name,
              key: field.key,
              type: field.type,
              required: field.required,
              default_value: field.default_value,
              options: field.options,
              validation: field.validation,
              display_order: field.display_order,
              event_id: field.event_id,
              template_id: field.template_id,
            });
            result.imported.custom_fields++;
          }
        } catch (error) {
          const errorMsg = `Failed to restore custom field ${field.name}: ${error}`;
          result.errors.push(errorMsg);
          throw new Error(errorMsg); // Rollback transaction
        }
      }
      
      // Restore events
      for (const event of backupData.data.events) {
        try {
          const existing = this.db.getEventById(event.id);
          if (!existing) {
            this.db.addEvent({
              title: event.title,
              date: event.date,
              time: event.time,
              location: event.location,
              notes: event.notes,
              expected_attendees: event.expected_attendees,
            });
            result.imported.events++;
          }
        } catch (error) {
          const errorMsg = `Failed to restore event ${event.title}: ${error}`;
          result.errors.push(errorMsg);
          throw new Error(errorMsg); // Rollback transaction
        }
      }
      
      // Restore attendees
      for (const attendee of backupData.data.attendees) {
        try {
          const event = this.db.getEventById(attendee.event_id);
          if (event) {
            const existingAttendees = this.db.getAttendees(attendee.event_id);
            const exists = existingAttendees.find(a => a.id === attendee.id);
            
            if (!exists) {
              this.db.addAttendee(attendee.event_id, {
                name: attendee.name,
                email: attendee.email || undefined,
                phone: attendee.phone || undefined,
              });
              result.imported.attendees++;
            }
          }
        } catch (error) {
          const errorMsg = `Failed to restore attendee ${attendee.name}: ${error}`;
          result.errors.push(errorMsg);
          throw new Error(errorMsg); // Rollback transaction
        }
      }
      
      // Restore custom field values
      for (const fieldValue of backupData.data.custom_field_values || []) {
        try {
          this.customFieldsService.setFieldValue(
            fieldValue.attendee_id,
            fieldValue.field_id,
            fieldValue.value
          );
        } catch (error) {
          // Silently fail for field values (attendee or field might not exist)
          console.warn(`Failed to restore field value: ${error}`);
        }
      }
    });
    
    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    throw error;
  }
}
```

**Testing**:
```bash
npm test BackupService
```

---

### 6. ExportService: Service Instantiation
**File**: `services/ExportService.ts`  
**Time**: 1 hour  
**Priority**: 🔴 CRITICAL

**Update constructor** (Lines 42-47):
```typescript
import { dbService } from './DatabaseService';

export class ExportService {
  private dbService: DatabaseService;
  private csvService: typeof CsvService;
  private activeTasks: Map<string, ExportTaskStatus>;
  
  constructor(db: DatabaseService = dbService) {
    this.dbService = db;
    this.csvService = CsvService;
    this.activeTasks = new Map();
  }
  
  // ... rest of code
}

// Export singleton instance
export const exportService = new ExportService();
```

**Update default export** (Line 349):
```typescript
export default exportService;
```

**Testing**:
```bash
npm test ExportService
```

---

## Testing Plan

### 1. Run Unit Tests
```bash
# Test all services
npm test

# Test specific services
npm test DatabaseService
npm test BackupService
npm test ExportService
```

### 2. Manual Testing Checklist

**DatabaseService**:
- [ ] Create event with valid data
- [ ] Try to create event with invalid data (should fail with clear error)
- [ ] Add attendee with valid data
- [ ] Try to add attendee with invalid data (should fail)
- [ ] Delete event (verify attendees and custom fields are deleted)
- [ ] Check database file size (should not grow indefinitely)

**BackupService**:
- [ ] Create backup
- [ ] Restore from backup
- [ ] Try to restore corrupted backup (should rollback)
- [ ] Verify all data restored correctly
- [ ] Check for duplicate data after restore

**ExportService**:
- [ ] Export attendees to CSV
- [ ] Export attendees to JSON
- [ ] Export event
- [ ] Batch export multiple events
- [ ] Verify exported files are correct

### 3. Integration Testing
```bash
# Create test scenario
1. Create 3 events
2. Add 10 attendees to each
3. Check in 5 attendees per event
4. Create backup
5. Delete all data
6. Restore from backup
7. Verify all data is correct
8. Export all events
9. Verify exports are correct
```

---

## Deployment Checklist

- [ ] All 6 critical issues fixed
- [ ] All unit tests passing (438/452 or better)
- [ ] Manual testing completed
- [ ] Integration testing completed
- [ ] Code reviewed by team member
- [ ] Documentation updated
- [ ] Backup created before deployment
- [ ] Rollback plan prepared

---

## Timeline

### Day 1 (6-8 hours)
- [ ] Fix DatabaseService global instance (2-3 hours)
- [ ] Add input validation to DatabaseService (2-3 hours)
- [ ] Fix cascade deletes and add indexes (1-2 hours)

### Day 2 (4-6 hours)
- [ ] Fix BackupService instantiation (1 hour)
- [ ] Add transaction support to restore (2-3 hours)
- [ ] Fix ExportService instantiation (1 hour)

### Day 3 (4-6 hours)
- [ ] Run all unit tests
- [ ] Manual testing
- [ ] Integration testing
- [ ] Fix any issues found
- [ ] Deploy to production

**Total: 14-20 hours (2-3 days)**

---

## Success Criteria

- ✅ All 6 critical issues fixed
- ✅ Unit tests passing (>95%)
- ✅ Manual testing passed
- ✅ No data corruption
- ✅ No memory leaks
- ✅ Clear error messages
- ✅ Production deployment successful

---

## Rollback Plan

If issues are found in production:

1. **Immediate**: Revert to previous version
2. **Backup**: Restore user data from backup
3. **Investigate**: Review logs and error reports
4. **Fix**: Address issues in development
5. **Test**: Comprehensive testing before redeployment
6. **Deploy**: Redeploy with fixes

---

## Questions?

### "Can I skip any of these fixes?"
**No.** All 6 are critical and must be fixed before production.

### "Can I fix them in a different order?"
**Yes**, but recommended order is:
1. DatabaseService (foundation)
2. BackupService (data integrity)
3. ExportService (data export)

### "What if tests fail after fixes?"
**Expected.** Some tests might need updates to work with new singleton pattern. Update mocks accordingly.

### "Should I fix high priority issues too?"
**Not immediately.** Fix critical issues first, deploy, then address high priority issues in next sprint.

---

**Last Updated**: February 23, 2026  
**Next Review**: After critical fixes are deployed
