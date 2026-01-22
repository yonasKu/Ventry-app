# Ventry Feature Enhancement Plan

This document outlines the implementation plan for three key enhancements to the Ventry app:
1. Attendee Categories
2. Attendance History
3. SlideToCheckIn Component Enhancements

## 1. Attendee Categories

### Overview
Add the ability to categorize attendees into different groups (VIP, Staff, General, etc.) to improve organization, filtering, and check-in experiences.

### Database Changes
```sql
-- Add category field to attendees table
ALTER TABLE attendees ADD COLUMN category TEXT DEFAULT 'general';

-- Create categories table for custom categories
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (event_id) REFERENCES events (id)
);
```

### Model Updates
```typescript
// Update Attendee model in models/Attendee.ts
export type Attendee = {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  checked_in: boolean;
  check_in_time: string | null;
  category: string; // New field
  created_at: string;
  updated_at: string;
};

// Add new Category model in models/Category.ts
export type Category = {
  id: string;
  event_id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};
```

### UI Implementation
1. **Category Management Screen**:
   - Path: `/app/event/categories/[id].tsx`
   - CRUD operations for categories
   - Color picker for visual identification
   
2. **Attendee Form Updates**:
   - Add category dropdown to add/edit attendee forms
   - Show category options from the event's defined categories

3. **Check-in List Enhancement**:
   - Add category indicator (color dot/badge)
   - Add category filter options
   - Group attendees by category option

### Service Layer Updates
Add the following methods to DatabaseService:
```typescript
// Category CRUD operations
createCategory(eventId: string, data: CategoryInput): Category;
getCategories(eventId: string): Category[];
updateCategory(categoryId: string, data: Partial<CategoryInput>): boolean;
deleteCategory(categoryId: string): boolean;

// Attendee categorization
setAttendeeCategory(attendeeId: string, categoryId: string): boolean;
getAttendeesByCategory(eventId: string, categoryId: string): Attendee[];
```

### Timeline
1. Database schema update - 1 day
2. Model and service layer implementation - 2 days
3. UI components for category management - 2 days
4. UI updates for existing screens - 2 days
5. Testing and refinement - 1 day

**Total: 8 days**

## 2. Attendance History

### Overview
Track attendees across multiple events to identify returning attendees and build attendance history.

### Database Changes
```sql
-- Create attendee_profiles table for persistent attendee data
CREATE TABLE attendee_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  total_events INTEGER DEFAULT 0,
  last_seen TEXT,
  first_seen TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Add profile_id reference to attendees table
ALTER TABLE attendees ADD COLUMN profile_id TEXT REFERENCES attendee_profiles(id);

-- Create attendance_history table
CREATE TABLE attendance_history (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  check_in_time TEXT,
  notes TEXT,
  created_at TEXT,
  FOREIGN KEY (profile_id) REFERENCES attendee_profiles (id),
  FOREIGN KEY (event_id) REFERENCES events (id)
);
```

### Model Updates
```typescript
// New AttendeeProfile model in models/AttendeeProfile.ts
export type AttendeeProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  total_events: number;
  last_seen: string | null;
  first_seen: string | null;
  created_at: string;
  updated_at: string;
};

// New AttendanceHistory model in models/AttendanceHistory.ts
export type AttendanceHistory = {
  id: string;
  profile_id: string;
  event_id: string;
  check_in_time: string | null;
  notes: string | null;
  created_at: string;
};

// Update Attendee model
export type Attendee = {
  // Existing fields...
  profile_id: string | null; // Reference to attendee profile
};
```

### UI Implementation
1. **Attendee History Screen**:
   - Path: `/app/attendee-profile/[id].tsx`
   - Shows all events an attendee has participated in
   - Display stats (total events, first/last seen)
   
2. **Event Attendee List Updates**:
   - Add indicator for returning attendees
   - Add filter for "first-time" vs "returning" attendees
   
3. **Check-in Screen Updates**:
   - Show "returning attendee" badge
   - Display previous attendance count

### Service Layer Updates
Add to DatabaseService:
```typescript
// Profile management
createAttendeeProfile(data: AttendeeProfileInput): AttendeeProfile;
getAttendeeProfile(profileId: string): AttendeeProfile;
linkAttendeeToProfile(attendeeId: string, profileId: string): boolean;

// History tracking
recordAttendanceHistory(profileId: string, eventId: string): AttendanceHistory;
getAttendanceHistory(profileId: string): AttendanceHistory[];
getEventsByAttendeeProfile(profileId: string): Event[];

// Analytics
getAttendeeAttendanceStats(profileId: string): AttendanceStats;
getReturningAttendeeCount(eventId: string): number;
```

### Timeline
1. Database schema update - 1 day
2. Model and service layer implementation - 3 days
3. UI for attendance history - 2 days
4. Update existing screens with history indicators - 2 days
5. Testing and refinement - 2 days

**Total: 10 days**

## 3. SlideToCheckIn Component Enhancements

### Overview
Enhance the SlideToCheckIn component with haptic feedback, animations, and improved UX.

### Dependencies
Add the following packages:
```
react-native-haptic-feedback
lottie-react-native (for more advanced animations)
```

### Component Enhancements

#### Haptic Feedback
```typescript
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Configure options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false
};

// Trigger at appropriate times
const triggerCheckInHaptic = () => {
  ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
};

const triggerErrorHaptic = () => {
  ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
};
```

#### Animation Improvements
1. **Smoother Slide Animation**:
   - Add spring physics to the return animation
   - Use interpolation for better motion

2. **Success Animation**:
   - Add a brief scale animation when successfully checked in
   - Use a success color flash effect

3. **Visual Cues**:
   - Add directional arrow indicators
   - Progress indicator that fills as you slide

### UI/UX Improvements
```typescript
// Enhanced component features
const SlideToCheckIn = ({ attendee, onCheckIn, onUncheckIn }: SlideToCheckInProps) => {
  // Existing code...
  
  // New shared values
  const slideProgress = useSharedValue(0);
  const backgroundColor = useDerivedValue(() => {
    // Interpolate background color based on slide direction
    // Green tint for right slide, red tint for left slide
  });
  
  // Enhanced animations with feedback
  const handleSuccessfulCheckIn = () => {
    // Visual feedback
    scaleAnimation.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withTiming(1, { duration: 200 })
    );
    
    // Haptic feedback
    triggerCheckInHaptic();
    
    // Callback
    runOnJS(onCheckIn)(attendee.id);
  };
  
  // New features like custom success/error animations
  // ...
}
```

#### Accessibility Improvements
- Add proper accessibility labels
- Support for reduced motion preferences
- Alternative check-in method for accessibility users

### Timeline
1. Library integration and testing - 1 day
2. Haptic feedback implementation - 1 day
3. Animation enhancements - 2 days
4. UI/UX improvements - 2 days
5. Accessibility features - 1 day
6. Testing and refinement - 1 day

**Total: 8 days**

## Implementation Strategy

### Phase 1: Foundation (Week 1)
- Update database schema for all features
- Create/update models
- Implement core service methods

### Phase 2: UI Implementation (Week 2-3)
- Build category management screens
- Create attendee history views
- Enhance SlideToCheckIn component

### Phase 3: Integration & Testing (Week 4)
- Connect all components
- Comprehensive testing
- Performance optimization
- Documentation update

## Estimated Total Time
- Attendee Categories: 8 days
- Attendance History: 10 days
- SlideToCheckIn Enhancements: 8 days

**Total: ~26 development days (5-6 weeks with overlap)** 