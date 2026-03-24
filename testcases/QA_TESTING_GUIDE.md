# Ventry Event Management App - QA Testing Guide

## 📋 Overview

This comprehensive QA testing guide covers all functionality in the Ventry event management application. The app is **84% complete** and production-ready for event organizers managing check-ins via QR codes or manual search.

**App Type**: Offline-first event check-in application  
**Target Users**: Event organizers, restaurants, clubs, corporate events  
**Key Features**: QR code check-ins, attendee management, real-time statistics, offline functionality

---

## 🎯 Testing Priorities

### ⚡ Critical Path (Must Test First)
1. **Event Creation & Management**
2. **Attendee Import & Management** 
3. **Check-In Process (Tap/Swipe/QR)**
4. **Statistics & Real-time Updates**
5. **Export Functionality**
6. **Backup & Restore**

### 🔄 Core Features (Test Second)
1. **Notifications System**
2. **Custom Fields**
3. **Search & Filtering**
4. **Settings & Preferences**
5. **Error Handling**

### 🎨 Polish & Edge Cases (Test Last)
1. **Edge Case Scenarios**
2. **Performance Testing**
3. **Accessibility**
4. **Internationalization**

---

## 📱 Main User Flows to Test

### Flow 1: Event Creation & Setup
**Path**: Home → Create Event → Select Category → Fill Details → Save

**Test Steps**:
1. Tap "+" button on home screen
2. Select event category (Restaurant/Club, Corporate, Conference, etc.)
3. Fill in event details:
   - Event name (required)
   - Date and time (required)
   - Location (optional)
   - Expected attendees (optional)
   - Category-specific fields
4. Verify form validation
5. Save event
6. Verify event appears in home list

**Expected Results**:
- ✅ Form shows progress (Section 1 of 3, X% Complete)
- ✅ Required fields marked with red asterisk
- ✅ Validation prevents saving incomplete forms
- ✅ Success toast appears on save
- ✅ Event appears in correct date group (Today/Upcoming/Past)

**Test Data**:
```
Event Name: "Tech Conference 2026"
Date: Tomorrow's date
Time: 2:00 PM
Location: "Convention Center"
Expected Attendees: 150
Category: Conference
```

### Flow 2: Attendee Import & Management
**Path**: Event Details → Attendees → Import/Add

**Test Steps**:
1. Open event from home screen
2. Tap "Attendees" button
3. Test import methods:
   - **CSV Import**: Upload sample CSV file
   - **Paste Data**: Copy/paste attendee list
   - **Manual Entry**: Add individual attendee
4. Verify attendee list display
5. Test search functionality
6. Test edit/delete attendee

**Expected Results**:
- ✅ CSV import maps columns correctly
- ✅ Duplicate detection works (email/phone/name)
- ✅ Search finds attendees by name/email/phone
- ✅ Attendee count updates in event details
- ✅ Edit/delete operations work correctly

**Test Data**:
```csv
Name,Email,Phone
John Doe,john@example.com,555-0123
Jane Smith,jane@example.com,555-0124
Bob Johnson,bob@example.com,555-0125
```

### Flow 3: Check-In Process
**Path**: Event Details → Check-In → Search/Scan → Check-In

**Test Steps**:
1. Open event and tap "Check-In"
2. Test search functionality:
   - Type attendee name
   - Verify real-time search results
3. Test check-in methods:
   - **Tap Check-In**: Tap attendee name → tap check-in button
   - **Swipe Check-In**: Swipe attendee card right
   - **QR Scan**: Tap scan button → scan QR code
4. Verify check-in status updates
5. Test undo check-in
6. Verify statistics update

**Expected Results**:
- ✅ Search responds in <100ms
- ✅ Check-in completes in <200ms
- ✅ Visual feedback shows success
- ✅ Counter updates immediately
- ✅ Statistics refresh in real-time
- ✅ Duplicate check-in prevented

### Flow 4: QR Code Management
**Path**: Event Details → QR Code → Display/Share/Scan

**Test Steps**:
1. **Event QR Code**:
   - Open event → tap "QR Code"
   - Verify QR code displays
   - Test share functionality
2. **Attendee QR Codes**:
   - Go to Attendees → tap attendee → "QR Code"
   - Verify individual QR code
3. **QR Scanning**:
   - Open Check-In → tap scan button
   - Test camera permissions
   - Scan valid QR code
   - Test invalid QR code

**Expected Results**:
- ✅ QR codes generate correctly
- ✅ Share dialog opens with QR image
- ✅ Camera permission requested properly
- ✅ Valid QR codes check-in attendee
- ✅ Invalid QR codes show error message

### Flow 5: Statistics & Analytics
**Path**: Event Details → Stats → View Charts/Data

**Test Steps**:
1. Open event with check-ins
2. Tap "Stats" button
3. Verify data displays:
   - Check-in rate percentage
   - Attendance timeline
   - Peak check-in insights
   - Check-in speed gauge
4. Test real-time updates:
   - Perform check-in in another screen
   - Return to stats
   - Verify data updated

**Expected Results**:
- ✅ Charts render correctly
- ✅ Percentages calculate accurately
- ✅ Timeline shows check-in distribution
- ✅ Real-time updates work
- ✅ No performance issues with large datasets

### Flow 6: Export & Sharing
**Path**: Event Details → Export → Select Format → Export → Share

**Test Steps**:
1. Open event with attendees
2. Tap "Export" button
3. Select export format (CSV/JSON)
4. Choose fields to include
5. Tap "Export"
6. Verify progress indicator
7. Test share functionality

**Expected Results**:
- ✅ Export formats work correctly
- ✅ Progress indicator shows during export
- ✅ File contains correct data
- ✅ Share dialog opens with file
- ✅ Large exports complete successfully

### Flow 7: Backup & Restore
**Path**: Settings → Backup → Create/Restore

**Test Steps**:
1. **Create Backup**:
   - Go to Backup tab
   - Set device name
   - Tap "Create Backup"
   - Verify backup file created
2. **Restore Backup**:
   - Tap "Restore from Backup"
   - Select backup file
   - Verify data restored correctly
   - Check for duplicates

**Expected Results**:
- ✅ Backup includes all events/attendees
- ✅ Backup file encrypted
- ✅ Restore preserves all data
- ✅ Duplicate detection works
- ✅ Data integrity maintained

---

## 🧪 Detailed Test Cases

### Event Management Tests

#### TC001: Create Basic Event
**Objective**: Verify basic event creation works correctly

**Preconditions**: App installed and opened

**Steps**:
1. Tap "+" button on home screen
2. Select "Corporate Event" category
3. Fill required fields:
   - Title: "Team Meeting"
   - Date: Tomorrow
   - Time: 10:00 AM
4. Tap save button

**Expected Result**: Event created successfully, appears in "Upcoming" section

**Test Data**: 
- Title: "Team Meeting"
- Date: [Tomorrow's date]
- Time: 10:00 AM
- Category: Corporate Event

---

#### TC002: Event Form Validation
**Objective**: Verify form validation prevents invalid data

**Steps**:
1. Start creating new event
2. Leave title field empty
3. Try to save
4. Fill title with 300+ characters
5. Try to save
6. Set date in the past
7. Try to save

**Expected Results**:
- ✅ Empty title shows error message
- ✅ Long title shows character limit error
- ✅ Past date shows warning (but allows save)
- ✅ Save button disabled until valid

---

#### TC003: Event Categories
**Objective**: Test all event categories and their specific fields

**Steps**:
1. Create event for each category:
   - Restaurant/Club
   - Corporate Event
   - Conference
   - Workshop
   - School/University
2. Verify category-specific fields appear
3. Fill and save each type

**Expected Results**:
- ✅ Each category shows appropriate fields
- ✅ Category data saves correctly
- ✅ Category displays in event details

---

### Attendee Management Tests

#### TC004: CSV Import
**Objective**: Test CSV file import functionality

**Test Data**:
```csv
Name,Email,Phone,VIP Status
John Doe,john@test.com,555-0123,Yes
Jane Smith,jane@test.com,555-0124,No
Bob Wilson,bob@test.com,555-0125,Yes
```

**Steps**:
1. Create event
2. Go to Attendees
3. Tap "Import" → "File Import"
4. Select CSV file
5. Map columns correctly
6. Import attendees

**Expected Results**:
- ✅ Column mapping interface appears
- ✅ All attendees imported correctly
- ✅ Custom fields (VIP Status) preserved
- ✅ Attendee count updates

---

#### TC005: Duplicate Detection
**Objective**: Verify duplicate attendee detection

**Steps**:
1. Import attendees with duplicates:
   ```csv
   Name,Email
   John Doe,john@test.com
   John Doe,john@test.com
   Jane Smith,jane@test.com
   ```
2. Verify duplicate detection
3. Choose merge/skip options

**Expected Results**:
- ✅ Duplicates detected by email
- ✅ User prompted for action
- ✅ Final list has no duplicates

---

#### TC006: Attendee Search
**Objective**: Test search functionality performance and accuracy

**Steps**:
1. Import 1000+ attendees
2. Test search by:
   - Full name: "John Doe"
   - Partial name: "John"
   - Email: "john@test.com"
   - Phone: "555-0123"
3. Measure response time

**Expected Results**:
- ✅ Search responds in <100ms
- ✅ Results accurate and relevant
- ✅ Fuzzy matching works ("Jon" finds "John")
- ✅ No performance issues

---

### Check-In Process Tests

#### TC007: Tap Check-In
**Objective**: Test basic tap check-in functionality

**Steps**:
1. Open event check-in screen
2. Search for attendee
3. Tap attendee name
4. Tap "Check In" button
5. Verify status change

**Expected Results**:
- ✅ Check-in completes in <200ms
- ✅ Visual feedback shows success
- ✅ Attendee status changes to "Checked In"
- ✅ Counter increments
- ✅ Timestamp recorded

---

#### TC008: Swipe Check-In
**Objective**: Test swipe gesture check-in

**Steps**:
1. Open check-in screen
2. Find attendee in list
3. Swipe attendee card to the right
4. Verify check-in completes

**Expected Results**:
- ✅ Swipe gesture recognized
- ✅ Visual animation plays
- ✅ Check-in completes automatically
- ✅ Card returns to position

---

#### TC009: QR Code Check-In
**Objective**: Test QR code scanning check-in

**Preconditions**: Device has camera access

**Steps**:
1. Generate attendee QR code
2. Open check-in screen
3. Tap scan button
4. Point camera at QR code
5. Verify check-in

**Expected Results**:
- ✅ Camera permission requested
- ✅ QR code detected quickly
- ✅ Attendee checked in automatically
- ✅ Success feedback shown

---

#### TC010: Duplicate Check-In Prevention
**Objective**: Verify duplicate check-ins are prevented

**Steps**:
1. Check-in attendee normally
2. Try to check-in same attendee again
3. Verify prevention message

**Expected Results**:
- ✅ Second check-in attempt blocked
- ✅ Warning message displayed
- ✅ Option to undo previous check-in

---

### Statistics Tests

#### TC011: Real-Time Statistics
**Objective**: Test statistics update in real-time

**Steps**:
1. Open event stats screen
2. Note current check-in rate
3. Switch to check-in screen
4. Check-in 5 attendees
5. Return to stats screen
6. Verify updates

**Expected Results**:
- ✅ Statistics update automatically
- ✅ Percentages recalculate correctly
- ✅ Charts refresh with new data
- ✅ No manual refresh needed

---

#### TC012: Statistics Accuracy
**Objective**: Verify statistical calculations are correct

**Test Data**:
- Total attendees: 100
- Checked in: 75
- Expected rate: 75%

**Steps**:
1. Create event with known data
2. Check statistics calculations
3. Verify against manual calculation

**Expected Results**:
- ✅ Check-in rate: 75%
- ✅ Remaining: 25 attendees
- ✅ Charts show correct proportions

---

### Export Tests

#### TC013: CSV Export
**Objective**: Test CSV export functionality

**Steps**:
1. Create event with attendees and check-ins
2. Go to Export screen
3. Select CSV format
4. Choose all fields
5. Export and verify file

**Expected Results**:
- ✅ CSV file generated correctly
- ✅ All attendee data included
- ✅ Check-in status included
- ✅ Custom fields included
- ✅ File can be opened in Excel

---

#### TC014: Large Export Performance
**Objective**: Test export with large datasets

**Steps**:
1. Create event with 5000+ attendees
2. Export to CSV
3. Monitor progress and completion time

**Expected Results**:
- ✅ Export completes in <30 seconds
- ✅ Progress indicator works
- ✅ No memory issues
- ✅ File size reasonable

---

### Backup & Restore Tests

#### TC015: Full Backup
**Objective**: Test complete database backup

**Steps**:
1. Create multiple events with attendees
2. Perform various check-ins
3. Create backup
4. Verify backup file size and content

**Expected Results**:
- ✅ Backup includes all events
- ✅ Backup includes all attendees
- ✅ Backup includes check-in history
- ✅ File encrypted properly

---

#### TC016: Backup Restore
**Objective**: Test restore from backup file

**Steps**:
1. Create backup (from TC015)
2. Clear app data or reinstall
3. Restore from backup file
4. Verify all data restored

**Expected Results**:
- ✅ All events restored
- ✅ All attendees restored
- ✅ Check-in history preserved
- ✅ Custom fields preserved
- ✅ No data corruption

---

### Notification Tests

#### TC017: Event Reminders
**Objective**: Test event reminder notifications

**Steps**:
1. Create event for tomorrow
2. Enable notifications in settings
3. Wait for reminder notifications:
   - 24 hours before
   - 1 hour before
   - At event start time

**Expected Results**:
- ✅ Notifications appear at correct times
- ✅ Notification content accurate
- ✅ Tapping notification opens event

---

#### TC018: Check-In Notifications
**Objective**: Test check-in milestone notifications

**Steps**:
1. Create event with 100 attendees
2. Check-in attendees to reach milestones:
   - First check-in
   - 50% checked in
   - 100% checked in

**Expected Results**:
- ✅ First check-in notification appears
- ✅ 50% milestone notification
- ✅ 100% completion notification
- ✅ Notifications include progress info

---

### Settings Tests

#### TC019: Theme Switching
**Objective**: Test light/dark theme switching

**Steps**:
1. Open Settings
2. Toggle dark mode switch
3. Verify theme changes immediately
4. Navigate through app
5. Restart app and verify persistence

**Expected Results**:
- ✅ Theme changes immediately (no restart)
- ✅ All screens use new theme
- ✅ Theme preference persists
- ✅ Colors consistent throughout

---

#### TC020: Language Selection
**Objective**: Test language switching

**Steps**:
1. Open Settings
2. Change language to Spanish
3. Verify UI text changes
4. Test date/time formatting
5. Switch back to English

**Expected Results**:
- ✅ UI text translates correctly
- ✅ Date formats change appropriately
- ✅ Numbers format correctly
- ✅ No missing translations

---

## 🚨 Error Scenarios to Test

### Data Validation Errors

#### TC021: Invalid Data Entry
**Test Cases**:
- Empty required fields
- Invalid email formats
- Invalid phone numbers
- Invalid date ranges
- Extremely long text inputs

**Expected**: Appropriate error messages, no crashes

### File Operation Errors

#### TC022: File Access Issues
**Test Cases**:
- Import corrupted CSV file
- Import file with wrong format
- Backup to full storage
- Restore corrupted backup file

**Expected**: Graceful error handling, user-friendly messages

### Network & Permission Errors

#### TC023: Permission Handling
**Test Cases**:
- Camera permission denied
- Storage permission denied
- Notification permission denied
- Permission revoked during use

**Expected**: Appropriate permission requests, fallback options

### Performance Edge Cases

#### TC024: Large Dataset Performance
**Test Cases**:
- 10,000+ attendees per event
- 1,000+ events in database
- Rapid check-in operations
- Continuous QR scanning

**Expected**: Responsive performance, no crashes

---

## 📊 Performance Benchmarks

### Response Time Requirements
- **App Launch**: < 2 seconds
- **Event List Load**: < 500ms (1000+ events)
- **Attendee Search**: < 100ms
- **Check-In Action**: < 200ms
- **QR Code Scan**: < 300ms
- **Statistics Refresh**: < 1 second
- **Export Generation**: < 5 seconds (1000+ attendees)

### Memory Usage
- **Typical Usage**: < 100MB
- **Large Dataset**: < 200MB
- **Background**: < 50MB

### Battery Usage
- **Active Use**: < 5% per hour
- **Background**: < 1% per hour

---

## 🔧 Testing Tools & Setup

### Required Test Devices
- **iOS**: iPhone 12+, iPad (latest)
- **Android**: Samsung Galaxy S21+, Google Pixel 6+
- **Various Screen Sizes**: Small (5"), Medium (6"), Large (6.7"+)

### Test Data Sets
1. **Small Dataset**: 10 events, 50 attendees each
2. **Medium Dataset**: 100 events, 500 attendees each  
3. **Large Dataset**: 1000 events, 5000 attendees each

### Sample CSV Files
```csv
# basic_attendees.csv
Name,Email,Phone
John Doe,john@example.com,555-0123
Jane Smith,jane@example.com,555-0124

# attendees_with_custom_fields.csv
Name,Email,Phone,VIP Status,Dietary Restrictions
John Doe,john@example.com,555-0123,Yes,Vegetarian
Jane Smith,jane@example.com,555-0124,No,None

# large_attendee_list.csv
[Generate 5000+ rows for performance testing]
```

---

## ✅ Test Completion Checklist

### Critical Features (Must Pass)
- [ ] Event creation and editing
- [ ] Attendee import (CSV, manual, paste)
- [ ] Check-in process (tap, swipe, QR)
- [ ] Real-time statistics
- [ ] Export functionality (CSV, JSON)
- [ ] Backup and restore
- [ ] Search and filtering
- [ ] QR code generation and scanning

### Core Features (Should Pass)
- [ ] Notifications system
- [ ] Custom fields management
- [ ] Theme switching
- [ ] Language selection
- [ ] Settings management
- [ ] Error handling
- [ ] Performance benchmarks

### Polish Features (Nice to Have)
- [ ] Accessibility features
- [ ] Advanced statistics
- [ ] Batch operations
- [ ] Advanced filtering
- [ ] Share functionality

---

## 🐛 Bug Reporting Template

### Bug Report Format
```markdown
**Bug ID**: BUG-001
**Title**: Brief description of the issue
**Severity**: Critical/High/Medium/Low
**Priority**: P1/P2/P3/P4

**Environment**:
- Device: iPhone 14 Pro
- OS Version: iOS 17.2
- App Version: 1.0.0

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Result**: What should happen
**Actual Result**: What actually happened
**Screenshots**: [Attach if applicable]

**Additional Notes**: Any other relevant information
```

### Severity Definitions
- **Critical**: App crashes, data loss, core functionality broken
- **High**: Major feature not working, significant user impact
- **Medium**: Minor feature issues, workarounds available
- **Low**: Cosmetic issues, minor inconveniences

---

## 📈 Success Criteria

### Functional Requirements
- ✅ All critical features working correctly
- ✅ No data loss scenarios
- ✅ All user flows complete successfully
- ✅ Error handling for all edge cases
- ✅ Performance meets benchmarks

### Quality Gates
- **Zero Critical Bugs**: No crashes or data loss
- **<5 High Priority Bugs**: Major features work correctly
- **Performance**: All benchmarks met
- **User Experience**: Smooth, responsive interactions
- **Data Integrity**: No corruption or loss

### Release Readiness
- [ ] All critical test cases pass
- [ ] Performance benchmarks met
- [ ] No critical or high severity bugs
- [ ] User acceptance testing complete
- [ ] Documentation updated

---

## 📞 Support & Escalation

### Test Team Contacts
- **QA Lead**: [Name] - Critical issues
- **Dev Team**: [Name] - Technical questions  
- **Product Owner**: [Name] - Requirements clarification

### Escalation Process
1. **P1 Issues**: Immediate escalation to dev team
2. **P2 Issues**: Report within 4 hours
3. **P3/P4 Issues**: Include in daily reports

---

*This QA testing guide ensures comprehensive coverage of all Ventry app functionality. Follow the test cases systematically and report any issues using the provided templates.*