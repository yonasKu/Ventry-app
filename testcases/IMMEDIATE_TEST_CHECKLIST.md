# Ventry App - Immediate Test Execution Checklist

## 🚀 Quick Start Testing (30 minutes)

### Pre-Test Setup
- [ ] Install app on test device
- [ ] Grant all permissions (camera, notifications, storage)
- [ ] Prepare test data files (CSV with attendees)

### Critical Path Testing (Must Pass)

#### ✅ Test 1: Basic Event Creation (5 min)
```
Steps:
1. Open app → Tap "+" → Select "Corporate Event"
2. Fill: Title="Test Event", Date=Tomorrow, Time=2:00 PM
3. Tap save button

Expected: Event appears in "Upcoming" section
Status: [ ] PASS [ ] FAIL
Notes: ________________
```

#### ✅ Test 2: Attendee Import (5 min)
```
Test Data:
Name,Email,Phone
John Doe,john@test.com,555-0123
Jane Smith,jane@test.com,555-0124

Steps:
1. Open event → Attendees → Import → Paste Data
2. Paste above CSV data → Import
3. Verify 2 attendees added

Expected: Both attendees visible in list
Status: [ ] PASS [ ] FAIL
Notes: ________________
```

#### ✅ Test 3: Check-In Process (5 min)
```
Steps:
1. Open event → Check-In
2. Search "John" → Tap "John Doe"
3. Tap "Check In" button
4. Verify status changes

Expected: John shows as "Checked In", counter = 1/2
Status: [ ] PASS [ ] FAIL
Notes: ________________
```

#### ✅ Test 4: QR Code Generation (3 min)
```
Steps:
1. Open event → QR Code
2. Verify QR code displays
3. Tap share button

Expected: QR code visible, share dialog opens
Status: [ ] PASS [ ] FAIL
Notes: ________________
```

#### ✅ Test 5: Statistics Display (3 min)
```
Steps:
1. Open event → Stats
2. Verify check-in rate shows 50% (1 of 2)
3. Check timeline chart displays

Expected: Accurate statistics, charts render
Status: [ ] PASS [ ] FAIL
Notes: ________________
```

#### ✅ Test 6: Export Functionality (5 min)
```
Steps:
1. Open event → Export
2. Select CSV format → Export
3. Verify file sharing works

Expected: CSV file generated and shareable
Status: [ ] PASS [ ] FAIL
Notes: ________________
```

#### ✅ Test 7: Backup Creation (4 min)
```
Steps:
1. Go to Backup tab
2. Set device name "Test Device"
3. Tap "Create Backup"
4. Verify backup file created

Expected: Backup completes successfully
Status: [ ] PASS [ ] FAIL
Notes: ________________
```

---

## 🔍 Extended Testing (60 minutes)

### User Experience Testing

#### ✅ Test 8: Theme Switching
```
Steps:
1. Settings → Toggle Dark Mode
2. Navigate through app screens
3. Toggle back to Light Mode

Expected: Immediate theme changes, no restart needed
Status: [ ] PASS [ ] FAIL
```

#### ✅ Test 9: Search Performance
```
Steps:
1. Import 100+ attendees (use generator)
2. Test search by typing "John"
3. Measure response time

Expected: Results appear in <100ms
Status: [ ] PASS [ ] FAIL
```

#### ✅ Test 10: Swipe Check-In
```
Steps:
1. Open Check-In screen
2. Swipe attendee card to the right
3. Verify check-in completes

Expected: Smooth swipe animation, check-in works
Status: [ ] PASS [ ] FAIL
```

### Error Handling Testing

#### ✅ Test 11: Invalid Data Entry
```
Steps:
1. Create event with empty title
2. Try to save
3. Enter 300+ character title
4. Try to save

Expected: Validation errors shown, save prevented
Status: [ ] PASS [ ] FAIL
```

#### ✅ Test 12: Duplicate Check-In
```
Steps:
1. Check-in attendee normally
2. Try to check-in same attendee again
3. Verify prevention

Expected: Warning message, option to undo
Status: [ ] PASS [ ] FAIL
```

#### ✅ Test 13: Camera Permission
```
Steps:
1. Deny camera permission initially
2. Try to scan QR code
3. Grant permission when prompted

Expected: Graceful permission handling
Status: [ ] PASS [ ] FAIL
```

### Performance Testing

#### ✅ Test 14: Large Dataset
```
Steps:
1. Import 1000+ attendees
2. Test search responsiveness
3. Test check-in speed
4. Monitor memory usage

Expected: No performance degradation
Status: [ ] PASS [ ] FAIL
```

#### ✅ Test 15: Real-Time Updates
```
Steps:
1. Open Stats screen
2. Switch to Check-In, check-in 5 people
3. Return to Stats
4. Verify automatic updates

Expected: Statistics update without manual refresh
Status: [ ] PASS [ ] FAIL
```

---

## 🚨 Critical Bug Scenarios

### Data Integrity Tests

#### ✅ Test 16: Backup Restore
```
Steps:
1. Create events and attendees
2. Create backup
3. Clear app data
4. Restore from backup
5. Verify all data intact

Expected: Complete data restoration
Status: [ ] PASS [ ] FAIL
```

#### ✅ Test 17: Export Data Accuracy
```
Steps:
1. Create event with known data
2. Export to CSV
3. Manually verify data accuracy
4. Check custom fields included

Expected: All data accurate in export
Status: [ ] PASS [ ] FAIL
```

### Edge Cases

#### ✅ Test 18: Network Offline
```
Steps:
1. Turn off WiFi and cellular
2. Use app normally (create, check-in, etc.)
3. Turn network back on
4. Verify data persists

Expected: Full offline functionality
Status: [ ] PASS [ ] FAIL
```

#### ✅ Test 19: App Backgrounding
```
Steps:
1. Start check-in process
2. Background app (home button)
3. Return to app after 5 minutes
4. Complete check-in

Expected: State preserved, no data loss
Status: [ ] PASS [ ] FAIL
```

#### ✅ Test 20: Memory Pressure
```
Steps:
1. Open multiple events
2. Navigate rapidly between screens
3. Import large datasets
4. Monitor for crashes

Expected: Stable performance, no crashes
Status: [ ] PASS [ ] FAIL
```

---

## 📊 Test Results Summary

### Critical Issues Found
```
Issue #1: ________________________________
Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
Description: ____________________________
Steps to Reproduce: _____________________

Issue #2: ________________________________
Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
Description: ____________________________
Steps to Reproduce: _____________________
```

### Performance Results
```
App Launch Time: _______ seconds (Target: <2s)
Search Response: _______ ms (Target: <100ms)
Check-In Speed: _______ ms (Target: <200ms)
Memory Usage: _______ MB (Target: <100MB)
```

### Overall Assessment
```
[ ] READY FOR RELEASE - All critical tests pass
[ ] NEEDS FIXES - Critical issues found
[ ] NEEDS MORE TESTING - Incomplete coverage

Confidence Level: [ ] High [ ] Medium [ ] Low

Tester: _________________ Date: _________
```

---

## 🎯 Focus Areas Based on Code Analysis

### High Risk Areas (Test Thoroughly)
1. **FilterSheet Apply Button** - Recently fixed UI issue
2. **Theme Toggle** - Recently implemented immediate switching
3. **Statistics Calculation** - Complex real-time calculations
4. **Database Operations** - Critical for data integrity
5. **QR Code Scanning** - Camera and permission handling

### Recently Modified Features
1. **Toast Notifications** - New sonner-native implementation
2. **Bottom Sheets** - New @gorhom/bottom-sheet library
3. **State Management** - New Zustand store integration
4. **Share Functionality** - Recently added sharing features
5. **Rich Notifications** - New @notifee implementation

### Known Issues to Verify Fixed
1. **FilterSheet button visibility** - Should be always visible at bottom
2. **Theme changes** - Should work immediately without restart
3. **Statistics filtering** - Should use filtered data, not all events
4. **Notification permissions** - Should handle gracefully

---

## 📱 Device-Specific Testing

### iOS Testing
- [ ] iPhone 12+ (iOS 16+)
- [ ] iPad (latest)
- [ ] Camera permission flow
- [ ] Share sheet functionality
- [ ] Background app refresh

### Android Testing  
- [ ] Samsung Galaxy S21+
- [ ] Google Pixel 6+
- [ ] Camera permission flow
- [ ] File sharing
- [ ] Background services

---

## 🔄 Regression Testing

After any bug fixes, re-run these core tests:
- [ ] Event creation and management
- [ ] Attendee import and check-in
- [ ] QR code functionality
- [ ] Statistics accuracy
- [ ] Export and backup
- [ ] Theme and settings

---

*Complete this checklist systematically. Mark each test as PASS/FAIL and document any issues found. Focus on critical path first, then expand to edge cases.*