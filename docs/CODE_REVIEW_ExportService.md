# ExportService Code Review

**Reviewer**: AI Assistant  
**Date**: February 23, 2026  
**Status**: ⚠️ Needs Changes

## Executive Summary

ExportService handles data export operations with multiple format support. Overall code quality is **GOOD** with flexible export options. Found **1 Critical Issue** and **5 High Priority Issues** that should be addressed.

**Strengths**:
- ✅ Multiple export formats (CSV, JSON, Excel, PDF)
- ✅ Field filtering support
- ✅ Batch export capability
- ✅ Statistics generation
- ✅ File sharing integration
- ✅ Good error messages

**Weaknesses**:
- ❌ Creates new DatabaseService instance (should use singleton)
- ❌ Encryption is fake (just adds prefix)
- ❌ Excel and PDF formats not implemented
- ❌ No progress tracking for large exports
- ❌ Task management not used

---

## Critical Issues (Must Fix)

### 1. Creates New DatabaseService Instance
**Location**: Lines 42-47  
**Severity**: 🔴 CRITICAL

```typescript
// ❌ PROBLEM
constructor() {
  this.dbService = new DatabaseService();
  this.csvService = CsvService;
  this.activeTasks = new Map();
}
```

**Issue**: Same as BackupService - creates new database instance instead of using singleton.

**Impact**:
- Multiple database connections
- Inconsistent state
- Memory leaks
- Test isolation issues

**Fix**:
```typescript
// ✅ SOLUTION
import { dbService } from './DatabaseService';

constructor(db: DatabaseService = dbService) {
  this.dbService = db;
  this.csvService = CsvService;
  this.activeTasks = new Map();
}
```

---

## High Priority Issues

### 2. Fake Encryption Implementation
**Location**: Lines 283-302  
**Severity**: 🟠 HIGH

```typescript
// ❌ PROBLEM
private async encryptFile(filePath: string, password: string): Promise<string> {
  try {
    const file = new File(filePath);
    const fileContent = await file.text();
    
    // This is NOT encryption!
    const encryptedContent = `ENCRYPTED:${password}\n${fileContent}`;
    
    const encryptedFile = new File(`${filePath}.encrypted`);
    await encryptedFile.write(encryptedContent);
    
    return encryptedFile.uri;
  } catch (error: any) {
    console.error('Error encrypting file:', error);
    throw new Error(`Failed to encrypt file: ${error.message || 'Unknown error'}`);
  }
}
```

**Issue**: 
- Just adds "ENCRYPTED:" prefix with password in plain text
- Password is visible in file
- Data is not encrypted at all
- Security theater

**Impact**:
- False sense of security
- Data breach risk
- Privacy violation
- Legal liability

**Fix**:
```typescript
// ✅ SOLUTION
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

private async encryptFile(filePath: string, password: string): Promise<string> {
  try {
    const file = new File(filePath);
    const fileContent = await file.text();
    
    // Use proper encryption
    const encrypted = CryptoJS.AES.encrypt(fileContent, password).toString();
    
    const encryptedFile = new File(`${filePath}.encrypted`);
    await encryptedFile.write(encrypted);
    
    return encryptedFile.uri;
  } catch (error: any) {
    console.error('Error encrypting file:', error);
    throw new Error(`Failed to encrypt file: ${error.message || 'Unknown error'}`);
  }
}

private async decryptFile(filePath: string, password: string): Promise<string> {
  try {
    const file = new File(filePath);
    const encryptedContent = await file.text();
    
    const decrypted = CryptoJS.AES.decrypt(encryptedContent, password);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!plaintext) {
      throw new Error('Invalid password or corrupted file');
    }
    
    return plaintext;
  } catch (error: any) {
    console.error('Error decrypting file:', error);
    throw new Error(`Failed to decrypt file: ${error.message || 'Unknown error'}`);
  }
}
```

### 3. Excel and PDF Formats Not Implemented
**Location**: Lines 115-125, 185-195  
**Severity**: 🟠 HIGH

```typescript
// ❌ PROBLEM
case ExportFormat.EXCEL:
  Alert.alert('Feature Coming Soon', 'Excel export will be available...');
  filePath = await this.csvService.exportAttendeesToCsv(...);
  break;
  
case ExportFormat.PDF:
  Alert.alert('Feature Coming Soon', 'PDF export will be available...');
  filePath = await this.csvService.exportAttendeesToCsv(...);
  break;
```

**Issue**: 
- Advertises formats that don't work
- Shows alert in service layer (should be UI concern)
- Falls back to CSV silently
- Confusing user experience

**Impact**:
- User confusion
- False advertising
- Poor UX
- Service layer doing UI work

**Fix**:
```typescript
// ✅ SOLUTION 1: Remove unsupported formats
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  // EXCEL = 'xlsx',  // Coming soon
  // PDF = 'pdf'      // Coming soon
}

// ✅ SOLUTION 2: Throw error for unsupported formats
case ExportFormat.EXCEL:
case ExportFormat.PDF:
  throw new Error(`${options.format.toUpperCase()} export is not yet supported. Please use CSV or JSON.`);

// ✅ SOLUTION 3: Implement the formats
case ExportFormat.EXCEL:
  filePath = await this.exportToExcel(filteredAttendees, event);
  break;
  
case ExportFormat.PDF:
  filePath = await this.exportToPdf(filteredAttendees, event);
  break;
```

### 4. Task Management Not Used
**Location**: Lines 38-40, 337-347  
**Severity**: 🟠 HIGH

```typescript
// ❌ PROBLEM
private activeTasks: Map<string, ExportTaskStatus>;

// Methods exist but are never called
getActiveTasks(): ExportTaskStatus[] {
  return Array.from(this.activeTasks.values());
}

getTaskStatus(taskId: string): ExportTaskStatus | undefined {
  return this.activeTasks.get(taskId);
}
```

**Issue**: 
- Task tracking infrastructure exists but is never used
- No tasks are created or updated
- Dead code
- Misleading API

**Impact**:
- Wasted code
- Confusing API
- No progress tracking
- Can't cancel exports

**Fix**:
```typescript
// ✅ SOLUTION: Implement task tracking
async exportAttendees(
  eventId: string,
  options: ExportOptions = { format: ExportFormat.CSV, includeCheckInStatus: true }
): Promise<string> {
  // Create task
  const taskId = nanoid();
  const task: ExportTaskStatus = {
    id: taskId,
    eventId,
    status: 'in_progress',
    progress: 0,
    startTime: new Date().toISOString(),
  };
  this.activeTasks.set(taskId, task);
  
  try {
    // Update progress
    task.progress = 25;
    
    const event = this.dbService.getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    
    task.progress = 50;
    
    const attendees = this.dbService.getAttendees(eventId);
    if (attendees.length === 0) {
      throw new Error('No attendees to export for this event');
    }
    
    task.progress = 75;
    
    // ... export logic
    
    task.progress = 100;
    task.status = 'completed';
    task.filePath = filePath;
    task.endTime = new Date().toISOString();
    
    return filePath;
  } catch (error: any) {
    task.status = 'failed';
    task.error = error.message;
    task.endTime = new Date().toISOString();
    throw error;
  } finally {
    // Clean up task after 5 minutes
    setTimeout(() => {
      this.activeTasks.delete(taskId);
    }, 5 * 60 * 1000);
  }
}
```

### 5. No Input Validation
**Location**: Lines 52-140  
**Severity**: 🟠 HIGH

```typescript
// ❌ PROBLEM
async exportAttendees(
  eventId: string,
  options: ExportOptions = { format: ExportFormat.CSV, includeCheckInStatus: true }
): Promise<string> {
  try {
    // No validation of eventId
    const event = this.dbService.getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    // ...
  }
}
```

**Issue**: 
- No validation of eventId format
- No validation of options
- No validation of includeFields array
- Can pass invalid data

**Impact**:
- SQL errors
- Crashes
- Poor error messages
- Security issues

**Fix**:
```typescript
// ✅ SOLUTION
async exportAttendees(
  eventId: string,
  options: ExportOptions = { format: ExportFormat.CSV, includeCheckInStatus: true }
): Promise<string> {
  // Validate eventId
  if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
    throw new Error('Valid event ID is required');
  }
  
  // Validate format
  const validFormats = Object.values(ExportFormat);
  if (!validFormats.includes(options.format)) {
    throw new Error(`Invalid export format: ${options.format}`);
  }
  
  // Validate includeFields
  if (options.includeFields) {
    if (!Array.isArray(options.includeFields)) {
      throw new Error('includeFields must be an array');
    }
    
    const validFields = ['name', 'email', 'phone', 'checked_in', 'check_in_time', 'created_at', 'updated_at'];
    const invalidFields = options.includeFields.filter(f => !validFields.includes(f));
    
    if (invalidFields.length > 0) {
      throw new Error(`Invalid fields: ${invalidFields.join(', ')}`);
    }
  }
  
  try {
    const event = this.dbService.getEventById(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }
    // ...
  }
}
```

### 6. Batch Export Creates Text File Instead of Proper Format
**Location**: Lines 207-260  
**Severity**: 🟠 HIGH

```typescript
// ❌ PROBLEM
async batchExportEvents(
  eventIds: string[],
  options: ExportOptions = { format: ExportFormat.CSV }
): Promise<string> {
  // Creates a text file regardless of format option
  let batchContent = `Ventry Batch Export\nDate: ${new Date().toLocaleString()}\n\n`;
  
  // ... builds text content
  
  await file.write(batchContent);
  return file.uri;
}
```

**Issue**: 
- Ignores format option
- Always creates text file
- Not machine-readable
- Can't import back

**Impact**:
- Misleading API
- Can't process exports programmatically
- Poor data portability
- Wasted format parameter

**Fix**:
```typescript
// ✅ SOLUTION
async batchExportEvents(
  eventIds: string[],
  options: ExportOptions = { format: ExportFormat.CSV }
): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Collect all data
    const allData: any[] = [];
    
    for (const eventId of eventIds) {
      const event = this.dbService.getEventById(eventId);
      if (!event) continue;
      
      const attendees = this.dbService.getAttendees(eventId);
      
      // Add event info to each attendee row
      attendees.forEach(attendee => {
        allData.push({
          event_title: event.title,
          event_date: event.date,
          event_time: event.time,
          event_location: event.location,
          attendee_name: attendee.name,
          attendee_email: attendee.email,
          attendee_phone: attendee.phone,
          checked_in: attendee.checked_in ? 'Yes' : 'No',
          check_in_time: attendee.check_in_time || '',
        });
      });
    }
    
    // Export based on format
    let filePath = '';
    switch (options.format) {
      case ExportFormat.JSON:
        const filename = `batch_export_${timestamp}.json`;
        const file = new File(Paths.document, filename);
        await file.write(JSON.stringify(allData, null, 2));
        filePath = file.uri;
        break;
        
      case ExportFormat.CSV:
        const csvContent = Papa.unparse(allData);
        const csvFilename = `batch_export_${timestamp}.csv`;
        const csvFile = new File(Paths.document, csvFilename);
        await csvFile.write(csvContent);
        filePath = csvFile.uri;
        break;
        
      default:
        throw new Error(`Unsupported format for batch export: ${options.format}`);
    }
    
    return filePath;
  } catch (error: any) {
    console.error('Error batch exporting events:', error);
    throw new Error(`Failed to batch export events: ${error.message || 'Unknown error'}`);
  }
}
```

---

## Medium Priority Issues

### 7. No Progress Callbacks for Large Exports
**Location**: All export methods  
**Severity**: 🟡 MEDIUM

**Issue**: No way to track progress for large exports (1000+ attendees).

**Fix**:
```typescript
// ✅ SOLUTION
export interface ExportOptions {
  format: ExportFormat;
  includeFields?: string[];
  includeCheckInStatus?: boolean;
  password?: string;
  templateId?: string;
  destination?: ExportDestination;
  onProgress?: (progress: number) => void;  // Add callback
}

async exportAttendees(
  eventId: string,
  options: ExportOptions = { format: ExportFormat.CSV, includeCheckInStatus: true }
): Promise<string> {
  // Report progress
  options.onProgress?.(0);
  
  const event = this.dbService.getEventById(eventId);
  options.onProgress?.(25);
  
  const attendees = this.dbService.getAttendees(eventId);
  options.onProgress?.(50);
  
  // ... export logic
  options.onProgress?.(75);
  
  // ... save file
  options.onProgress?.(100);
  
  return filePath;
}
```

### 8. Statistics Method Doesn't Use ReportingService
**Location**: Lines 315-335  
**Severity**: 🟡 MEDIUM

**Issue**: Duplicates logic that exists in ReportingService.

**Fix**:
```typescript
// ✅ SOLUTION
import { ReportingService } from './ReportingService';

getEventStatistics(eventId: string): Record<string, any> {
  // Use ReportingService instead of duplicating logic
  const reportingService = new ReportingService();
  return reportingService.getEventCheckInStats(eventId);
}
```

### 9. No File Size Limits
**Location**: All export methods  
**Severity**: 🟡 MEDIUM

**Issue**: Can create very large files that crash the app.

**Fix**:
```typescript
// ✅ SOLUTION
const MAX_EXPORT_SIZE = 10 * 1024 * 1024; // 10MB

async exportAttendees(...): Promise<string> {
  const attendees = this.dbService.getAttendees(eventId);
  
  // Estimate file size
  const estimatedSize = JSON.stringify(attendees).length;
  if (estimatedSize > MAX_EXPORT_SIZE) {
    throw new Error(`Export too large (${this.formatFileSize(estimatedSize)}). Please filter or split the export.`);
  }
  
  // ... continue with export
}

private formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
```

---

## Low Priority (Nice to Have)

### 10. Add Export Templates
```typescript
interface ExportTemplate {
  id: string;
  name: string;
  format: ExportFormat;
  includeFields: string[];
  includeCheckInStatus: boolean;
}

async saveExportTemplate(template: ExportTemplate): Promise<void> {
  // Save template for reuse
}

async exportWithTemplate(eventId: string, templateId: string): Promise<string> {
  const template = await this.getTemplate(templateId);
  return this.exportAttendees(eventId, template);
}
```

### 11. Add Export Scheduling
```typescript
async scheduleExport(
  eventId: string,
  schedule: 'daily' | 'weekly' | 'after_event',
  options: ExportOptions
): Promise<void> {
  // Schedule automatic exports
}
```

### 12. Add Export to Cloud
```typescript
async exportToCloud(
  eventId: string,
  provider: 'icloud' | 'gdrive' | 'dropbox',
  options: ExportOptions
): Promise<void> {
  // Export directly to cloud storage
}
```

---

## Positive Findings

✅ **Multiple format support** - CSV, JSON (Excel/PDF planned)  
✅ **Field filtering** - Can select specific fields  
✅ **Batch export** - Export multiple events  
✅ **Statistics generation** - Useful event stats  
✅ **File sharing** - Platform-specific sharing  
✅ **Good error messages** - Clear error descriptions  
✅ **Check-in status** - Optional inclusion  

---

## Recommendations

### Immediate Actions (This Week)
1. ✅ Fix database service instantiation → Use singleton
2. ✅ Fix encryption → Use proper crypto library
3. ✅ Remove or implement Excel/PDF → Don't advertise unsupported features
4. ✅ Add input validation → Validate all parameters

### Short Term (Next Sprint)
5. ✅ Implement task tracking → Use activeTasks map
6. ✅ Fix batch export format → Respect format option
7. ✅ Add progress callbacks → For large exports
8. ✅ Add file size limits → Prevent crashes

### Long Term (Future)
9. ✅ Add export templates → Reusable configurations
10. ✅ Add export scheduling → Automatic exports
11. ✅ Add cloud export → Direct to cloud storage
12. ✅ Implement Excel/PDF → Complete format support

---

## Testing Recommendations

1. **Test large exports** - 1000+ attendees
2. **Test field filtering** - Various field combinations
3. **Test encryption** - Verify data is actually encrypted
4. **Test batch export** - Multiple events
5. **Test error handling** - Invalid IDs, missing data
6. **Test file sharing** - iOS and Android

---

## Security Assessment

❌ **Encryption**: BROKEN - Not actually encrypting  
✅ **SQL Injection**: PROTECTED - Uses DatabaseService  
✅ **Error Handling**: GOOD - Errors logged but not exposed  
⚠️ **Input Validation**: MISSING - No parameter validation  

---

## Performance Assessment

✅ **Query Efficiency**: GOOD - Uses DatabaseService  
⚠️ **Memory Usage**: NEEDS WORK - No file size limits  
⚠️ **Progress Tracking**: MISSING - No feedback for large exports  
✅ **File Operations**: GOOD - Efficient file writing  

---

## Conclusion

ExportService is **well-structured** with good export functionality, but needs **critical fixes** before production:

1. Fix database service instantiation
2. Fix encryption (use real crypto)
3. Remove or implement Excel/PDF formats
4. Add input validation

After these fixes, the service will be **production-ready** with high confidence.

**Estimated Fix Time**: 4-6 hours
