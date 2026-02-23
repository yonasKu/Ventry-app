# BackupService Code Review

**Reviewer**: AI Assistant  
**Date**: February 23, 2026  
**Status**: ⚠️ Needs Changes

## Executive Summary

BackupService handles critical data backup and restore operations. Overall code quality is **GOOD** with comprehensive backup functionality. Found **2 Critical Issues** and **4 High Priority Issues** that should be addressed before production.

**Strengths**:
- ✅ Comprehensive backup data structure (events, attendees, custom fields, templates)
- ✅ Metadata validation during restore
- ✅ Backup history tracking
- ✅ Error collection during restore (doesn't fail completely)
- ✅ Device name management
- ✅ File size formatting utility

**Weaknesses**:
- ❌ Creates new DatabaseService instance (should use singleton)
- ❌ No transaction support during restore (partial restore possible)
- ❌ Duplicate detection is incomplete
- ❌ No backup file encryption (despite password parameter)

---

## Critical Issues (Must Fix)

### 1. Creates New DatabaseService Instance
**Location**: Lines 60-63  
**Severity**: 🔴 CRITICAL

```typescript
// ❌ PROBLEM
constructor() {
  this.db = new DatabaseService();
  this.customFieldsService = new CustomFieldsService();
}
```

**Issue**: Creates new database instances instead of using existing ones. This can lead to:
- Multiple database connections
- Inconsistent state between services
- Memory leaks
- Test isolation issues

**Impact**:
- Data inconsistency
- Resource leaks
- Difficult to test
- Potential race conditions

**Fix**:
```typescript
// ✅ SOLUTION 1: Accept services as parameters
constructor(
  db: DatabaseService = DatabaseService.getInstance(),
  customFieldsService: CustomFieldsService = CustomFieldsService.getInstance()
) {
  this.db = db;
  this.customFieldsService = customFieldsService;
}

// ✅ SOLUTION 2: Use singleton pattern
import { dbService } from './DatabaseService';
import { customFieldsService } from './CustomFieldsService';

constructor() {
  this.db = dbService;
  this.customFieldsService = customFieldsService;
}
```

### 2. No Transaction Support During Restore
**Location**: Lines 207-290 (restoreFromFile)  
**Severity**: 🔴 CRITICAL

```typescript
// ❌ PROBLEM
async restoreFromFile(fileUri: string): Promise<RestoreResult> {
  // Restores templates
  for (const template of backupData.data.field_templates || []) {
    // ...
  }
  
  // Restores custom fields
  for (const field of backupData.data.custom_fields || []) {
    // ...
  }
  
  // Restores events
  for (const event of backupData.data.events) {
    // ...
  }
  
  // Restores attendees
  for (const attendee of backupData.data.attendees) {
    // ...
  }
  
  // No transaction wrapping!
}
```

**Issue**: Restore operations are not wrapped in a transaction. If restore fails midway:
- Database is left in inconsistent state
- Some data restored, some not
- No way to rollback
- User has corrupted database

**Impact**:
- Data corruption
- Partial restore
- No rollback capability
- User loses data

**Fix**:
```typescript
// ✅ SOLUTION
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
          result.errors.push(`Failed to restore template ${template.name}: ${error}`);
          throw error; // Rollback transaction
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
          result.errors.push(`Failed to restore custom field ${field.name}: ${error}`);
          throw error; // Rollback transaction
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
          result.errors.push(`Failed to restore event ${event.title}: ${error}`);
          throw error; // Rollback transaction
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
          result.errors.push(`Failed to restore attendee ${attendee.name}: ${error}`);
          throw error; // Rollback transaction
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

---

## High Priority Issues

### 3. Incomplete Duplicate Detection
**Location**: Lines 207-290  
**Severity**: 🟠 HIGH

```typescript
// ❌ PROBLEM
// Check if event already exists
const existing = this.db.getEventById(event.id);
if (!existing) {
  this.db.addEvent({...});
}
```

**Issue**: Only checks by ID, but IDs might be different across devices. Should also check by title + date + time.

**Impact**:
- Duplicate events with different IDs
- Confusing user experience
- Database bloat

**Fix**:
```typescript
// ✅ SOLUTION
// Check if event already exists by ID or by unique combination
const existingById = this.db.getEventById(event.id);
const existingByDetails = this.db.getEvents().find(e => 
  e.title === event.title && 
  e.date === event.date && 
  e.time === event.time
);

if (!existingById && !existingByDetails) {
  this.db.addEvent({...});
  result.imported.events++;
} else {
  result.errors.push(`Event "${event.title}" already exists, skipped`);
}
```

### 4. No Backup File Encryption
**Location**: Lines 68-145 (createBackup)  
**Severity**: 🟠 HIGH

**Issue**: Backup files contain sensitive data (names, emails, phones) but are stored as plain JSON. No encryption despite password parameter in ExportOptions.

**Impact**:
- Privacy violation
- GDPR compliance issues
- Data breach risk

**Fix**:
```typescript
// ✅ SOLUTION
import * as Crypto from 'expo-crypto';

async createBackup(password?: string): Promise<string> {
  try {
    // ... existing backup creation code
    
    let fileContent = JSON.stringify(backupData, null, 2);
    
    // Encrypt if password provided
    if (password) {
      fileContent = await this.encryptBackup(fileContent, password);
    }
    
    // Write backup file
    await file.write(fileContent);
    
    // ... rest of code
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

private async encryptBackup(content: string, password: string): Promise<string> {
  // Use expo-crypto for encryption
  const key = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  
  // Simple encryption (use a proper library in production)
  const encrypted = Buffer.from(content).toString('base64');
  return `ENCRYPTED:${key.substring(0, 16)}\n${encrypted}`;
}

private async decryptBackup(content: string, password: string): Promise<string> {
  if (!content.startsWith('ENCRYPTED:')) {
    return content; // Not encrypted
  }
  
  const lines = content.split('\n');
  const storedKey = lines[0].replace('ENCRYPTED:', '');
  const encrypted = lines.slice(1).join('\n');
  
  const key = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  
  if (key.substring(0, 16) !== storedKey) {
    throw new Error('Invalid password');
  }
  
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}
```

### 5. Custom Field Values Not Properly Restored
**Location**: Lines 282-290  
**Severity**: 🟠 HIGH

```typescript
// ❌ PROBLEM
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
  }
}
```

**Issue**: 
- Silently fails without logging
- No way to know if field values were restored
- Doesn't check if attendee/field exists first

**Impact**:
- Lost custom field data
- No error reporting
- Incomplete restore

**Fix**:
```typescript
// ✅ SOLUTION
// Restore custom field values
let fieldValuesRestored = 0;
for (const fieldValue of backupData.data.custom_field_values || []) {
  try {
    // Check if attendee exists
    const attendeeExists = this.db.getAttendees(fieldValue.attendee_id).length > 0;
    if (!attendeeExists) {
      result.errors.push(`Attendee ${fieldValue.attendee_id} not found for field value`);
      continue;
    }
    
    // Check if field exists
    const fieldExists = this.customFieldsService.getField(fieldValue.field_id);
    if (!fieldExists) {
      result.errors.push(`Field ${fieldValue.field_id} not found for field value`);
      continue;
    }
    
    this.customFieldsService.setFieldValue(
      fieldValue.attendee_id,
      fieldValue.field_id,
      fieldValue.value
    );
    fieldValuesRestored++;
  } catch (error) {
    result.errors.push(`Failed to restore field value: ${error}`);
  }
}

console.log(`Restored ${fieldValuesRestored} custom field values`);
```

### 6. File Operations Not Properly Handled
**Location**: Lines 420-450 (cleanupOldBackups)  
**Severity**: 🟠 HIGH

```typescript
// ❌ PROBLEM
async cleanupOldBackups(daysToKeep: number = 30): Promise<number> {
  try {
    const directory = Paths.document;
    const files = directory.list();  // This might not work as expected
    const backupFiles = files.filter(f => f.name.startsWith('ventry_backup_'));
    
    // ...
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
    return 0;
  }
}
```

**Issue**: 
- `directory.list()` might not return File objects
- File operations might fail
- No proper error handling for individual file deletions

**Fix**:
```typescript
// ✅ SOLUTION
async cleanupOldBackups(daysToKeep: number = 30): Promise<number> {
  try {
    const directory = new Directory(Paths.document);
    const files = await directory.list();
    
    let deletedCount = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    for (const fileName of files) {
      if (fileName.startsWith('ventry_backup_') && fileName.endsWith('.json')) {
        try {
          const file = new File(Paths.document, fileName);
          const modTime = file.modificationTime;
          
          if (modTime) {
            const fileDate = new Date(modTime);
            
            if (fileDate < cutoffDate) {
              await file.delete();
              deletedCount++;
              console.log(`Deleted old backup: ${fileName}`);
            }
          }
        } catch (error) {
          console.error(`Failed to delete ${fileName}:`, error);
          // Continue with other files
        }
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
    return 0;
  }
}
```

---

## Medium Priority Issues

### 7. No Backup Compression
**Location**: Lines 68-145  
**Severity**: 🟡 MEDIUM

**Issue**: Backup files are stored as plain JSON, which can be large for events with many attendees.

**Fix**:
```typescript
// ✅ SOLUTION
import pako from 'pako';

async createBackup(): Promise<string> {
  // ... existing code to create backupData
  
  // Compress backup data
  const jsonString = JSON.stringify(backupData);
  const compressed = pako.gzip(jsonString);
  
  // Save compressed file
  const filename = `ventry_backup_${timestamp}.json.gz`;
  const file = new File(Paths.document, filename);
  await file.write(compressed);
  
  // ... rest of code
}
```

### 8. No Backup Verification After Creation
**Location**: Lines 68-145  
**Severity**: 🟡 MEDIUM

**Issue**: Backup is created but not verified. File might be corrupted.

**Fix**:
```typescript
// ✅ SOLUTION
async createBackup(): Promise<string> {
  // ... existing backup creation code
  
  // Verify backup after creation
  const isValid = await this.verifyBackup(file.uri);
  if (!isValid) {
    await file.delete();
    throw new Error('Backup verification failed');
  }
  
  return file.uri;
}
```

### 9. Backup History Not Cleaned Up
**Location**: Lines 368-380  
**Severity**: 🟡 MEDIUM

**Issue**: Backup history keeps last 20 records, but doesn't clean up old backup files.

**Fix**:
```typescript
// ✅ SOLUTION
async recordBackup(record: BackupRecord): Promise<void> {
  try {
    const history = await this.getBackupHistory();
    
    // Add to history (keep last 20 backups)
    history.unshift(record);
    const trimmed = history.slice(0, 20);
    
    // Delete files for removed records
    const removed = history.slice(20);
    for (const old of removed) {
      try {
        const file = new File(Paths.document, old.filename);
        await file.delete();
      } catch (error) {
        // File might already be deleted
      }
    }
    
    await AsyncStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error recording backup:', error);
  }
}
```

---

## Low Priority (Nice to Have)

### 10. Add Incremental Backup
```typescript
async createIncrementalBackup(lastBackupDate: string): Promise<string> {
  // Only backup data changed since last backup
  const events = this.db.getEvents().filter(e => e.updated_at > lastBackupDate);
  // ... etc
}
```

### 11. Add Backup Scheduling
```typescript
async scheduleAutoBackup(frequency: 'daily' | 'weekly' | 'monthly'): Promise<void> {
  // Schedule automatic backups
}
```

### 12. Add Cloud Backup Support
```typescript
async uploadToCloud(provider: 'icloud' | 'gdrive' | 'dropbox'): Promise<void> {
  // Upload backup to cloud storage
}
```

---

## Positive Findings

✅ **Comprehensive backup structure** - Includes all data types  
✅ **Error collection** - Doesn't fail completely on single error  
✅ **Metadata validation** - Verifies backup integrity  
✅ **Backup history** - Tracks all backups  
✅ **Device name** - Identifies backup source  
✅ **File size formatting** - User-friendly display  
✅ **Cleanup utility** - Removes old backups  

---

## Recommendations

### Immediate Actions (This Week)
1. ✅ Fix database service instantiation → Use singleton or dependency injection
2. ✅ Add transaction support to restore → Wrap entire restore in transaction
3. ✅ Improve duplicate detection → Check by ID and unique fields
4. ✅ Add backup encryption → Protect sensitive data

### Short Term (Next Sprint)
5. ✅ Fix custom field value restore → Add proper error handling
6. ✅ Fix file operations → Use proper Directory API
7. ✅ Add backup compression → Reduce file size
8. ✅ Add backup verification → Verify after creation

### Long Term (Future)
9. ✅ Add incremental backup → Only backup changes
10. ✅ Add backup scheduling → Automatic backups
11. ✅ Add cloud backup → iCloud, Google Drive, Dropbox

---

## Testing Recommendations

1. **Test restore with corrupted backup** - Verify transaction rollback
2. **Test restore with partial data** - Missing events, attendees
3. **Test duplicate detection** - Same event from different devices
4. **Test encryption/decryption** - Verify data integrity
5. **Test cleanup** - Verify old backups are deleted
6. **Test large backups** - 1000+ attendees

---

## Security Assessment

⚠️ **Data Encryption**: MISSING - Backup files contain sensitive data  
✅ **Error Handling**: GOOD - Errors logged but not exposed  
⚠️ **Transaction Safety**: MISSING - No rollback on failure  
✅ **Input Validation**: GOOD - Validates backup format  

---

## Performance Assessment

✅ **Backup Creation**: GOOD - Efficient data gathering  
⚠️ **Restore Performance**: NEEDS WORK - No batch operations  
⚠️ **File Size**: NEEDS WORK - No compression  
✅ **Memory Usage**: GOOD - Doesn't load all data at once  

---

## Conclusion

BackupService is **well-designed** with comprehensive backup functionality, but needs **critical fixes** before production:

1. Fix database service instantiation
2. Add transaction support to restore
3. Improve duplicate detection
4. Add backup encryption

After these fixes, the service will be **production-ready** with high confidence.

**Estimated Fix Time**: 6-8 hours
