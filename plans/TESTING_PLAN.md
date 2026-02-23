# Ventry - Comprehensive Testing Plan

**Created:** February 20, 2026  
**Status:** In Progress  
**Target Coverage:** 70%+ for critical services

---

## 🎯 Testing Strategy Overview

This document outlines a systematic approach to testing the Ventry application, prioritizing critical business logic and data integrity.

### Testing Pyramid
```
        /\
       /  \      E2E Tests (10%)
      /____\     - Critical user flows
     /      \    
    /        \   Integration Tests (20%)
   /__________\  - Service interactions
  /            \ 
 /              \ Unit Tests (70%)
/________________\ - Services, utilities, components
```

---

## 📦 Required Testing Packages

### Core Testing Framework
```bash
# Already installed
- jest (^29.2.1)
- jest-expo (~54.0.17)
- react-test-renderer (18.3.1)
```

### Additional Packages to Install
```bash
# Testing utilities
npm install --save-dev @testing-library/react-native
npm install --save-dev @testing-library/jest-native
npm install --save-dev @testing-library/react-hooks

# Mocking utilities
npm install --save-dev jest-mock-extended

# Code quality
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev eslint-plugin-react eslint-plugin-react-native
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

---

## 📁 Test File Structure

```
__tests__/
├── services/
│   ├── DatabaseService.test.ts          ⬅️ PRIORITY 1
│   ├── BackupService.test.ts            ⬅️ PRIORITY 2
│   ├── CustomFieldsService.test.ts      ⬅️ PRIORITY 3
│   ├── SearchService.test.ts            ⬅️ PRIORITY 4
│   ├── FilterService.test.ts            ⬅️ PRIORITY 5
│   ├── ExportService.test.ts            ⬅️ PRIORITY 6
│   ├── ReportingService.test.ts         ⬅️ PRIORITY 7
│   ├── PDFService.test.ts               ⬅️ PRIORITY 8
│   ├── QRValidationService.test.ts      ⬅️ PRIORITY 9
│   ├── SyncService.test.ts              ⬅️ PRIORITY 10
│   └── CsvService.test.ts
├── utils/
│   ├── dateTimeUtils.test.ts            ⬅️ PRIORITY 11
│   ├── errorUtils.test.ts               ⬅️ PRIORITY 12
│   └── colorUtils.test.ts
├── hooks/
│   └── useStatistics.test.ts
├── components/
│   ├── AttendeeQRCode.test.tsx
│   ├── SlideToCheckIn.test.tsx
│   ├── SearchBar.test.tsx
│   └── ExportPDFButton.test.tsx
├── integration/
│   ├── event-creation-flow.test.tsx
│   ├── attendee-checkin-flow.test.tsx
│   ├── backup-restore-flow.test.tsx
│   └── search-filter-flow.test.tsx
└── setup/
    ├── jest.setup.js
    └── mocks.ts
```

---

## 🔴 PRIORITY 1: DatabaseService Tests

**File:** `__tests__/services/DatabaseService.test.ts`  
**Estimated Time:** 3-4 hours  
**Coverage Target:** 85%+

### Test Categories

#### 1.1 Database Initialization
- [ ] Should initialize database successfully
- [ ] Should create all required tables
- [ ] Should handle initialization errors
- [ ] Should run migrations on first launch

#### 1.2 Event CRUD Operations
- [ ] Should create event with valid data
- [ ] Should reject event with missing required fields
- [ ] Should get event by ID
- [ ] Should return null for non-existent event
- [ ] Should update event successfully
- [ ] Should delete event and cascade delete attendees
- [ ] Should get all events
- [ ] Should get events by date range

#### 1.3 Attendee CRUD Operations
- [ ] Should add attendee to event
- [ ] Should validate required attendee fields
- [ ] Should get attendees by event ID
- [ ] Should update attendee information
- [ ] Should delete attendee
- [ ] Should update attendee counts on event

#### 1.4 Check-In Operations
- [ ] Should check in attendee successfully
- [ ] Should record check-in timestamp
- [ ] Should prevent duplicate check-ins
- [ ] Should undo check-in
- [ ] Should update check-in counts

#### 1.5 Custom Fields
- [ ] Should save custom field definitions
- [ ] Should save custom field values
- [ ] Should retrieve custom fields for event
- [ ] Should retrieve custom field values for attendee
- [ ] Should delete custom fields with event

#### 1.6 Data Integrity
- [ ] Should maintain referential integrity
- [ ] Should handle concurrent operations
- [ ] Should rollback on transaction errors
- [ ] Should validate foreign keys

**Status:** ⬜ Not Started

---

## 🟠 PRIORITY 2: BackupService Tests

**File:** `__tests__/services/BackupService.test.ts`  
**Estimated Time:** 2-3 hours  
**Coverage Target:** 80%+

### Test Categories

#### 2.1 Backup Creation
- [ ] Should create full database backup
- [ ] Should include all events in backup
- [ ] Should include all attendees in backup
- [ ] Should include custom fields in backup
- [ ] Should include field templates in backup
- [ ] Should generate valid JSON format
- [ ] Should include metadata (version, timestamp, device)

#### 2.2 Backup Validation
- [ ] Should validate backup file structure
- [ ] Should detect corrupted backup files
- [ ] Should validate backup version compatibility
- [ ] Should handle missing required fields

#### 2.3 Restore Operations
- [ ] Should restore full backup successfully
- [ ] Should restore events correctly
- [ ] Should restore attendees with correct event links
- [ ] Should restore custom fields
- [ ] Should handle partial restore
- [ ] Should detect and report conflicts

#### 2.4 Backup History
- [ ] Should track backup history
- [ ] Should limit history to 20 entries
- [ ] Should cleanup old backups (30+ days)
- [ ] Should update history on new backup

#### 2.5 Error Handling
- [ ] Should handle file system errors
- [ ] Should handle invalid JSON
- [ ] Should handle database errors during restore
- [ ] Should provide meaningful error messages

**Status:** ⬜ Not Started

---

## 🟡 PRIORITY 3: CustomFieldsService Tests

**File:** `__tests__/services/CustomFieldsService.test.ts`  
**Estimated Time:** 2-3 hours  
**Coverage Target:** 80%+

### Test Categories

#### 3.1 Field Definition
- [ ] Should create custom field with all types
- [ ] Should validate field configuration
- [ ] Should update field definition
- [ ] Should delete field definition
- [ ] Should get fields by event ID

#### 3.2 Field Validation
- [ ] Should validate required fields
- [ ] Should validate email format
- [ ] Should validate phone format
- [ ] Should validate URL format
- [ ] Should validate number min/max
- [ ] Should validate text length
- [ ] Should validate date format
- [ ] Should validate select options

#### 3.3 Field Values
- [ ] Should save field values for attendee
- [ ] Should retrieve field values
- [ ] Should update field values
- [ ] Should handle missing optional fields
- [ ] Should validate values against field type

#### 3.4 Templates
- [ ] Should create field template
- [ ] Should apply template to event
- [ ] Should list all templates
- [ ] Should delete template
- [ ] Should validate built-in templates

**Status:** ⬜ Not Started

---

## 🟢 PRIORITY 4: SearchService Tests

**File:** `__tests__/services/SearchService.test.ts`  
**Estimated Time:** 1-2 hours  
**Coverage Target:** 75%+

### Test Categories

#### 4.1 Search History
- [ ] Should save search query
- [ ] Should retrieve recent searches
- [ ] Should limit to 10 recent searches
- [ ] Should delete individual search
- [ ] Should clear all searches
- [ ] Should scope searches by event

#### 4.2 Saved Searches
- [ ] Should save search with name
- [ ] Should retrieve saved searches
- [ ] Should delete saved search
- [ ] Should update saved search

#### 4.3 Storage
- [ ] Should persist to AsyncStorage
- [ ] Should load from AsyncStorage
- [ ] Should handle storage errors
- [ ] Should handle corrupted data

**Status:** ⬜ Not Started

---

## 🔵 PRIORITY 5: FilterService Tests

**File:** `__tests__/services/FilterService.test.ts`  
**Estimated Time:** 1-2 hours  
**Coverage Target:** 75%+

### Test Categories

#### 5.1 Filter Types
- [ ] Should filter checked-in attendees
- [ ] Should filter not-checked-in attendees
- [ ] Should filter by date range
- [ ] Should filter by missing info
- [ ] Should filter by custom field values

#### 5.2 Filter Combinations
- [ ] Should apply multiple filters
- [ ] Should combine filters with AND logic
- [ ] Should handle empty filter results
- [ ] Should maintain filter state

#### 5.3 Filter Counts
- [ ] Should count filtered results
- [ ] Should update counts on data change
- [ ] Should handle zero results

**Status:** ⬜ Not Started

---

## 🟣 PRIORITY 6: ExportService Tests

**File:** `__tests__/services/ExportService.test.ts`  
**Estimated Time:** 2 hours  
**Coverage Target:** 75%+

### Test Categories

#### 6.1 CSV Export
- [ ] Should export events to CSV
- [ ] Should export attendees to CSV
- [ ] Should include custom fields in export
- [ ] Should escape special characters
- [ ] Should format dates correctly
- [ ] Should handle empty data

#### 6.2 File Operations
- [ ] Should create file successfully
- [ ] Should generate unique filenames
- [ ] Should handle file system errors
- [ ] Should share file via native dialog

#### 6.3 Data Formatting
- [ ] Should format boolean values
- [ ] Should format null values
- [ ] Should format arrays
- [ ] Should handle special characters in CSV

**Status:** ⬜ Not Started

---

## 🟤 PRIORITY 7: ReportingService Tests

**File:** `__tests__/services/ReportingService.test.ts`  
**Estimated Time:** 2-3 hours  
**Coverage Target:** 70%+

### Test Categories

#### 7.1 Statistics Calculations
- [ ] Should calculate total events
- [ ] Should calculate total attendees
- [ ] Should calculate check-in rate
- [ ] Should calculate average attendees per event
- [ ] Should handle zero events
- [ ] Should handle zero attendees

#### 7.2 Trend Analysis
- [ ] Should calculate attendance trends
- [ ] Should calculate check-in rate trends
- [ ] Should group by time periods
- [ ] Should handle missing data points

#### 7.3 Event Distribution
- [ ] Should categorize upcoming events
- [ ] Should categorize today's events
- [ ] Should categorize past events
- [ ] Should calculate percentages

#### 7.4 Performance Metrics
- [ ] Should identify top performing events
- [ ] Should identify low performing events
- [ ] Should calculate event completion rates

**Status:** ⬜ Not Started

---

## ⚪ PRIORITY 8: PDFService Tests

**File:** `__tests__/services/PDFService.test.ts`  
**Estimated Time:** 2 hours  
**Coverage Target:** 70%+

### Test Categories

#### 8.1 HTML Generation
- [ ] Should generate statistics report HTML
- [ ] Should generate event report HTML
- [ ] Should include CSS styling
- [ ] Should format data correctly
- [ ] Should handle missing data

#### 8.2 PDF Creation
- [ ] Should create PDF from HTML
- [ ] Should apply page size options
- [ ] Should apply orientation options
- [ ] Should handle generation errors

#### 8.3 File Sharing
- [ ] Should share PDF file
- [ ] Should generate unique filenames
- [ ] Should handle sharing errors

**Status:** ⬜ Not Started

---

## ⚫ PRIORITY 9: QRValidationService Tests

**File:** `__tests__/services/QRValidationService.test.ts`  
**Estimated Time:** 1 hour  
**Coverage Target:** 80%+

### Test Categories

#### 9.1 QR Code Validation
- [ ] Should validate correct QR format
- [ ] Should reject invalid QR format
- [ ] Should extract attendee ID
- [ ] Should extract event ID
- [ ] Should validate against event

#### 9.2 Check-In Validation
- [ ] Should allow valid check-in
- [ ] Should prevent duplicate check-in
- [ ] Should validate attendee exists
- [ ] Should validate event match

**Status:** ⬜ Not Started

---

## 🔶 PRIORITY 10: SyncService Tests

**File:** `__tests__/services/SyncService.test.ts`  
**Estimated Time:** 2-3 hours  
**Coverage Target:** 70%+

### Test Categories

#### 10.1 Device Identity
- [ ] Should generate device ID
- [ ] Should persist device ID
- [ ] Should retrieve device ID

#### 10.2 Export Operations
- [ ] Should export to .ventry format
- [ ] Should include all data
- [ ] Should include metadata

#### 10.3 Import Operations
- [ ] Should import .ventry file
- [ ] Should detect conflicts
- [ ] Should apply merge strategy
- [ ] Should track sync history

#### 10.4 Conflict Resolution
- [ ] Should use last-write-wins strategy
- [ ] Should preserve newer data
- [ ] Should log conflicts

**Status:** ⬜ Not Started

---

## 🔷 PRIORITY 11: dateTimeUtils Tests

**File:** `__tests__/utils/dateTimeUtils.test.ts`  
**Estimated Time:** 1-2 hours  
**Coverage Target:** 85%+

### Test Categories

#### 11.1 Formatting Functions
- [ ] Should format date correctly
- [ ] Should format time correctly
- [ ] Should format datetime correctly
- [ ] Should handle invalid dates
- [ ] Should handle null/undefined

#### 11.2 Parsing Functions
- [ ] Should parse ISO strings
- [ ] Should parse date strings
- [ ] Should handle invalid input
- [ ] Should return null for invalid dates

#### 11.3 Validation Functions
- [ ] Should validate date format
- [ ] Should validate time format
- [ ] Should validate datetime format
- [ ] Should reject invalid formats

#### 11.4 Relative Time
- [ ] Should calculate relative time
- [ ] Should handle past dates
- [ ] Should handle future dates
- [ ] Should handle edge cases

**Status:** ⬜ Not Started

---

## 🔸 PRIORITY 12: errorUtils Tests

**File:** `__tests__/utils/errorUtils.test.ts`  
**Estimated Time:** 1 hour  
**Coverage Target:** 80%+

### Test Categories

#### 12.1 Error Formatting
- [ ] Should format database errors
- [ ] Should format network errors
- [ ] Should format validation errors
- [ ] Should format unknown errors

#### 12.2 Error Messages
- [ ] Should provide user-friendly messages
- [ ] Should include error codes
- [ ] Should handle error objects
- [ ] Should handle string errors

**Status:** ⬜ Not Started

---

## 🧪 Integration Tests

### Event Creation Flow
**File:** `__tests__/integration/event-creation-flow.test.tsx`

- [ ] Should create event and add attendees
- [ ] Should create event with custom fields
- [ ] Should import attendees from CSV
- [ ] Should validate complete flow

### Check-In Flow
**File:** `__tests__/integration/attendee-checkin-flow.test.tsx`

- [ ] Should check in via manual selection
- [ ] Should check in via QR scan
- [ ] Should prevent duplicate check-ins
- [ ] Should update statistics

### Backup/Restore Flow
**File:** `__tests__/integration/backup-restore-flow.test.tsx`

- [ ] Should backup and restore successfully
- [ ] Should maintain data integrity
- [ ] Should handle conflicts

---

## 📊 Test Coverage Goals

| Category | Target Coverage | Priority |
|----------|----------------|----------|
| Services | 75-85% | High |
| Utils | 80-90% | High |
| Hooks | 70-80% | Medium |
| Components | 60-70% | Medium |
| Integration | 50-60% | Medium |
| **Overall** | **70%+** | - |

---

## 🛠️ Configuration Files Needed

### 1. jest.config.js
```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.js'],
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
  ],
};
```

### 2. __tests__/setup/jest.setup.js
```javascript
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://mock/',
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
```

### 3. __tests__/setup/mocks.ts
```typescript
// Common mock data for tests
export const mockEvent = {
  id: 'test-event-1',
  name: 'Test Event',
  date: '2026-02-20',
  time: '10:00',
  location: 'Test Location',
  notes: 'Test notes',
  expectedAttendees: 100,
  attendeeCount: 0,
  checkedInCount: 0,
  category: 'Conference',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockAttendee = {
  id: 'test-attendee-1',
  eventId: 'test-event-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  checkedIn: false,
  checkInTime: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockCustomField = {
  id: 'test-field-1',
  eventId: 'test-event-1',
  name: 'Company',
  type: 'text',
  required: true,
  order: 0,
};
```

---

## 📝 Updated package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:services": "jest __tests__/services",
    "test:utils": "jest __tests__/utils",
    "test:integration": "jest __tests__/integration",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 📅 Testing Timeline

### Week 1: Setup & Critical Services
- [ ] Day 1: Install packages, setup configuration
- [ ] Day 2-3: DatabaseService tests (Priority 1)
- [ ] Day 4-5: BackupService tests (Priority 2)

### Week 2: Core Services
- [ ] Day 1-2: CustomFieldsService tests (Priority 3)
- [ ] Day 3: SearchService tests (Priority 4)
- [ ] Day 4: FilterService tests (Priority 5)
- [ ] Day 5: ExportService tests (Priority 6)

### Week 3: Remaining Services & Utils
- [ ] Day 1-2: ReportingService tests (Priority 7)
- [ ] Day 3: PDFService tests (Priority 8)
- [ ] Day 4: QRValidationService & SyncService tests (Priority 9-10)
- [ ] Day 5: Utils tests (Priority 11-12)

### Week 4: Integration & Polish
- [ ] Day 1-2: Integration tests
- [ ] Day 3: Component tests
- [ ] Day 4: Fix failing tests, improve coverage
- [ ] Day 5: Documentation, review, cleanup

---

## ✅ Progress Tracking

### Overall Progress: 0/12 Priorities Complete

- [ ] Priority 1: DatabaseService (0%)
- [ ] Priority 2: BackupService (0%)
- [ ] Priority 3: CustomFieldsService (0%)
- [ ] Priority 4: SearchService (0%)
- [ ] Priority 5: FilterService (0%)
- [ ] Priority 6: ExportService (0%)
- [ ] Priority 7: ReportingService (0%)
- [ ] Priority 8: PDFService (0%)
- [ ] Priority 9: QRValidationService (0%)
- [ ] Priority 10: SyncService (0%)
- [ ] Priority 11: dateTimeUtils (0%)
- [ ] Priority 12: errorUtils (0%)

**Current Coverage:** 0%  
**Target Coverage:** 70%+

---

## 🎯 Next Steps

1. **Install testing packages** (30 minutes)
2. **Create configuration files** (30 minutes)
3. **Start with Priority 1: DatabaseService** (3-4 hours)
4. **Work through priorities sequentially**
5. **Run coverage reports after each priority**
6. **Adjust strategy based on results**

---

## 📚 Testing Best Practices

### Do's ✅
- Write tests before fixing bugs
- Test edge cases and error conditions
- Use descriptive test names
- Keep tests isolated and independent
- Mock external dependencies
- Test one thing per test
- Use setup/teardown appropriately

### Don'ts ❌
- Don't test implementation details
- Don't write tests that depend on each other
- Don't mock everything
- Don't ignore failing tests
- Don't skip error cases
- Don't test third-party libraries

---

**Ready to start testing!** 🚀

Let's begin with Priority 1: DatabaseService tests.
