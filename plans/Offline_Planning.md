# Ventry — Offline Event Check-In App Implementation Plan

## 1. Vision & Goals

Deliver an ultra-simple, efficient mobile application for organizers of small-to-medium events, clubs, and restaurants to manage attendee/member lists and perform fast digital check-ins via list search or QR code scanning, with **complete offline functionality** that works without internet connectivity.

---

## 2. Target Users & Scenarios

### 2.1 Small Event Organizers (e.g., Workshops, Classes)
- **Needs:** Manage attendee lists, replace paper sign-ins, track attendance, handle walk-ins.
- **Data:** Name, Email (optional).
- **Check-in:** Fast Name Search (primary), QR scan (bonus).
- **Offline Capability:** Complete functionality without internet.

### 2.2 Club Managers (e.g., Social Clubs)
- **Needs:** Verify membership, track attendance, manage member tiers.
- **Data:** Name, Membership ID, Status (Active/Expired), Expiry Date (optional).
- **Check-in:** QR Scan (primary), Name/ID Search.
- **Offline Capability:** Full membership verification locally.

### 2.3 Restaurant Managers (Loyalty/Events)
- **Needs:** Check-in for events, identify loyalty/VIP members, track visits/points.
- **Data:** Name, Phone/Email, Status (VIP/Loyalty), Points/Visits (optional).
- **Check-in:** Name/Phone Search or QR Scan.
- **Offline Capability:** Local tracking of loyalty points/visits.

---

## 3. Core App Modules (Offline-First)

- **Local Account Management:** Local user profiles stored on device.
- **Event/Activity Management:** Create, edit, archive events or ongoing activities locally.
- **Attendee/Member Management:** Import, view, manage lists; manual add - all stored locally.
- **Live Check-In Screen:** Main interface for check-in with no internet dependency.
- **Local Reporting:** Basic check-in counts, export attendance to local storage.
- **Data Backup:** Export/import app data to/from local files.

---

## 4. Data Import Strategy

### 4.1 Primary: CSV File Import from Device Storage
- **Location:** Within each Event/Activity screen.
- **Process:** User selects CSV file from device storage; app validates required columns and reports errors.
- **Templates:**
  - *General Event:* FirstName, LastName, Email (optional)
  - *Club:* FirstName, LastName, MembershipID, Status, ExpiryDate (optional)
  - *Restaurant:* FirstName, LastName, Email/Phone, Status/Tag, Points (optional)

### 4.2 Secondary: Manual Entry
- **Location:** Attendee list and Live Check-In screen.
- **Fields:** Context-driven (minimum: Name; plus Status/ID if needed).

### 4.3 Data Export
- **Purpose:** Allow backing up data to CSV files on device storage.
- **Format:** Standardized CSV export for events, attendees, and check-in logs.

---

## 5. Check-In Process (Fully Offline)

### 5.1 Access
- User opens app, selects event/activity from local storage, loads attendee list, opens check-in screen.

### 5.2 Method 1: Digital List Search & Tap
- **Search:** Instant filtering by Name/ID/Phone using local database.
- **Select:** Tap attendee, confirm, mark as checked-in with timestamp and visual feedback.
- **Duplicate:** Warn if already checked in based on local records.

### 5.3 Method 2: QR Code Scanning
- **Initiate:** Tap "Scan QR Code" button.
- **Process:** Scan attendee QR, validate against local event list and status.
- **Feedback:**
  - *Success:* Green, attendee info, check-in recorded locally.
  - *Duplicate:* Yellow/orange, already checked-in warning.
  - *Invalid:* Red, not found/expired/invalid message.

### 5.4 Context-Aware Display
- Show relevant info (e.g., Name, Status, Points) based on event type.

### 5.5 Walk-in Handling
- Prominent "+ Add Attendee" for manual entry and immediate check-in to local database.

---

## 6. Data Management (Local-First)

- **Entities:** User, Event/Activity, Person (flexible fields), Check-In Log.
- **Storage:** All data stored in local SQLite database on device.
- **Backup:** Export/import functionality for data backup and transfer.

---

## 7. Technology & Architecture

### Mobile App
- **Framework:** React Native with Expo for cross-platform development
  - Reliable offline capabilities
  - Single codebase for iOS and Android
  - Streamlined development with Expo managed workflow
  - Free, well-supported development tools

### Local Database
- **SQLite with Expo:** Robust local database for all app data
  - expo-sqlite for complete offline data persistence
  - Supports complex queries and reporting
  - Transaction support for data integrity

### State Management
- **React Context API:** For global app state and UI state management
  - Lightweight and built-in
  - Ideal for managing current event, filters, and UI state
  - Minimal boilerplate and easy to maintain

### File Handling
- **Expo File System** for CSV import/export
  - expo-document-picker for file selection
  - expo-sharing for exporting data
  - expo-file-system for file operations

### QR Code Implementation
- **Client-side generation** using React Native libraries
  - react-native-qrcode-svg for generation
  - Local storage of generated QR codes
- **Expo Camera** for scanning
  - expo-barcode-scanner for QR reading
  - Fully offline scanning capability

---

## 8. Phased Implementation

### Phase 1 (MVP)
- Core user interface and navigation
- Local SQLite database setup
- Event creation and management
- Basic attendee list management
- CSV import from device storage
- Simple check-in functionality

### Phase 2
- QR code generation and scanning
- Enhanced reporting with data visualization
- CSV export functionality
- Data backup and restore
- Walk-in attendee handling

### Phase 3
- UI/UX refinements
- Performance optimizations
- Advanced filtering and search
- Custom fields for different event types
- Multiple device support via file transfer

---

## 9. Data Backup & Transfer

### Local Backup
- **Export to Files:** Complete database export to JSON/CSV files using expo-file-system
- **Scheduled Backups:** Option for automatic local backups with expo-background-fetch
- **Selective Export:** Export specific events or time periods

### Transfer Between Devices
- **File Sharing:** Export/import via expo-sharing
- **QR Code Transfer:** Small data transfers via QR codes (for configuration)
- **Direct Device Transfer:** Future enhancement using React Native modules

---

## 10. Technical Implementation Details

### React Native & Expo Setup
- **Expo SDK:** Latest stable version
- **Managed Workflow:** For simplified development and deployment
- **Expo Config Plugins:** For native functionality without ejecting
- **Expo EAS Build:** For creating production builds

### Database Schema
- Implement using expo-sqlite with the same entity structure
- Add sync flags and metadata for future online functionality
- Create proper indexes for query performance

### React Native Architecture
- **Component Structure:** Functional components with hooks
- **Navigation:** React Navigation with stack and tab navigators
- **State Management:** React Context API for global and UI state
- **Styling:** React Native StyleSheet with a consistent, professional theme

### Performance Considerations
- FlatList with optimizations for large attendee lists
- Pagination and windowing for efficient list rendering
- Background tasks for imports/exports using expo-task-manager
- Memoization for expensive calculations

### Security
- Local database encryption with expo-secure-store for sensitive data
- App-level authentication (optional PIN/pattern) with expo-local-authentication
- Secure export files with password protection option

---

## 11. User Experience Enhancements

### React Native UI Components
- Custom components built with React Native Paper or NativeBase
- Consistent theming across the application
- Responsive layouts for different device sizes

### Offline Indicators
- Clear UI indicators showing offline mode
- Status indicators for data backup state
- Toast notifications for important actions

### Data Management
- Tools to manage database size
- Cleanup utilities for old events
- Storage usage statistics using expo-file-system

### Error Handling
- Global error boundary components
- Robust error recovery mechanisms
- Data validation on import with clear error messages
- Corruption detection and recovery options

---

---

## 12. Package Dependencies

### Core Dependencies
- `react-native` and `expo`: Base framework
- `expo-sqlite`: Local database for persistent, structured offline data
- `@react-navigation/native` and related packages: App navigation
- `react`: Core library for building UI
- `expo-file-system` and `expo-document-picker`: File operations (import/export CSV, backups)
- `expo-barcode-scanner` and `react-native-qrcode-svg`: QR code scanning and generation
- `react-native-paper` or `native-base`: UI components and theming
- `expo-sharing`: Export functionality
- `csv-parse` and `csv-stringify`: CSV processing
- `expo-local-authentication`: Security features (PIN, biometrics)

### Development Dependencies
- `jest` and `react-test-renderer`: Testing
- `eslint` and `prettier`: Code quality
- `typescript`: Type safety
- `expo-dev-client`: Enhanced development experience

---

## 13. Summary

This offline implementation plan transforms the Simple Check-In Helper into a completely self-contained React Native application built with Expo. By leveraging Expo's powerful modules, React Native's cross-platform capabilities, and efficient local data management, the app provides all core functionality while running entirely on the user's device. This approach is particularly well-suited for environments with limited or unreliable internet access, such as in Ethiopia and similar markets.
