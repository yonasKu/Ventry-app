# Ventry App - Codebase Structure

This document provides a comprehensive overview of the Ventry App codebase structure, explaining the purpose of each major file and directory.

## App Structure Overview

Ventry is an Expo React Native app using the file-based routing pattern from Expo Router. The app is designed for offline event management with attendee tracking and check-in functionality.

## Key Directories

### `/app` - Main Application Screens

This directory contains all the app screens, organized using Expo Router's file-based routing.

#### Tab Navigation (`/app/(tabs)`)

- **`_layout.tsx`**: Defines the tab navigation structure
- **`index.tsx`**: Home screen with event list
- **`events.tsx`**: Events management screen
- **`account.tsx`**: User account settings
- **`backup.tsx`**: Data backup/restore interface (UI only, functionality not implemented)

#### Event Management

- **`/app/create-event.tsx`**: Form to create a new event
- **`/app/event/[id].tsx`**: Main event details screen for a specific event
- **`/app/event/edit/[id].tsx`**: Form to edit existing event details

#### Attendee Management

- **`/app/event/attendees/[id].tsx`**: Lists all attendees for an event
- **`/app/event/add-attendee/[id].tsx`**: Form to add a single attendee
- **`/app/event/attendee-details/[id].tsx`**: Shows details for a specific attendee

#### Check-In System

- **`/app/event/check-in/[id].tsx`**: Main check-in screen showing attendee list with check-in status
- **`/app/event/scan/[id].tsx`**: Camera screen for scanning attendee QR codes
- **`/app/event/qr/[id].tsx`**: Displays a QR code for the event (for sharing)

#### Import System

- **`/app/event/import-attendees/[id].tsx`**: Allows importing attendees via CSV
- **`/app/event/import-attendees/components/`**: UI components for the import process
  - **`AttendeePreview.tsx`**: Shows preview of attendees to be imported
  - **`PasteTab.tsx`**: UI for pasting CSV data
  - **`ManualEntryTab.tsx`**: UI for manually entering attendees
  - **`TabSelector.tsx`**: Switch between paste and manual entry modes

### `/components` - Reusable UI Components

- **`AttendeeQRCode.tsx`**: Generates QR code for an attendee
- **`StyledText.tsx`**: Text component with styling
- **`Themed.tsx`**: Theme-aware components
- **`useColorScheme.ts`**: Hook for accessing the app's color scheme

### `/context` - React Context Providers

- **`EventContext.tsx`**: Manages events and attendees data, provides CRUD operations
- **`ThemeContext.tsx`**: Manages app theme (dark/light mode)

### `/services` - Business Logic

- **`DatabaseService.ts`**: Core SQLite database functionality
  - Tables: events, attendees
  - CRUD operations for both entities
  - Migration support
  
- **`CsvService.ts`**: Handles CSV import/export functionality
  - Parsing CSV data
  - Validation of required columns
  - Template generation

### `/models` - Data Models

- **`Event.ts`**: TypeScript interface for Event data structure
- Contains interfaces for Events and Attendees

### `/constants` - App Constants

- **`Colors.ts`**: Color definitions for the app

## Key Screens and Their Functions

### Home Screen (`/app/(tabs)/index.tsx`)
- Displays a list of upcoming events
- Shows event cards with basic info
- Provides navigation to event details
- Has a button to create new events

### Event Details (`/app/event/[id].tsx`)
- Shows comprehensive event information
- Displays date, time, location
- Shows attendee count and check-in stats
- Provides buttons for all event-related actions

### Check-In Screen (`/app/event/check-in/[id].tsx`)
- Lists all attendees with check-in status
- Allows checking in attendees by tapping
- Has search functionality for finding attendees
- Provides navigation to QR code scanning

### QR Scanner (`/app/event/scan/[id].tsx`)
- Uses device camera to scan QR codes
- Processes QR data to check in attendees
- Shows success/error messages after scanning
- Handles camera permissions

### Import Attendees (`/app/event/import-attendees/[id].tsx`)
- Provides CSV import functionality
- Supports pasting data or manual entry
- Validates attendee data
- Shows preview before final import

### Backup Screen (`/app/(tabs)/backup.tsx`)
- UI for backup and restore functionality
- Currently only shows UI placeholders
- Actual backup/restore functionality not implemented

## Data Flow

1. **User Interaction**: User interacts with UI components
2. **Context Actions**: Components call methods from EventContext
3. **Database Operations**: EventContext uses DatabaseService to perform CRUD operations
4. **State Update**: Results update React state via Context
5. **UI Refresh**: Components re-render with updated data

## Theme System

The app supports both light and dark themes:
- `ThemeContext.tsx` provides theme data and toggle functionality
- `Themed.tsx` components automatically adapt to theme changes
- Colors are defined in `constants/Colors.ts`

## Implementation Status

The app has implemented:
- ✅ Core database structure
- ✅ Event management
- ✅ Attendee management
- ✅ Check-in system
- ✅ QR code generation
- ✅ QR code scanning
- ✅ CSV import with validation

Partially implemented or UI-only:
- ⚠️ Backup/restore (UI only)
- ⚠️ Export functionality

Not implemented:
- ❌ Security features
- ❌ Advanced filtering
- ❌ Custom attendee fields

## Offline-First Architecture

The app is designed to work completely offline:
- All data is stored in SQLite
- No remote synchronization required
- Self-contained operation for use in areas with limited connectivity 