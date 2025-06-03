# QR Code System Implementation Plan

## Current Status Analysis

### What's Already Implemented:
- **QR Code Generation**: The app already has a QR code generation screen (`app/event/qr/[id].tsx`) that creates QR codes for events using `react-native-qrcode-svg`.
- **Database Structure**: The database has support for attendee check-ins with `checked_in` and `check_in_time` fields.
- **Context API**: `EventContext` has a `checkInAttendee` method that calls `dbService.checkInAttendeeAsync(attendeeId, eventId)`.
- **Manual Check-in**: A manual check-in screen exists (`app/event/check-in/[id].tsx`) with search functionality.

### What Needs to be Implemented:
1. **QR Code Generation for Individual Attendees**
2. **QR Code Scanning Functionality**
3. **Validation Logic for Scanned QR Codes**
4. **Success/Error Feedback for Scanning**

## Implementation Plan

### 1. QR Code Generation for Individual Attendees

#### Tasks:
- Create a new screen at `app/event/attendee-qr/[id].tsx` to display QR codes for individual attendees
- Modify the QR code data structure to include:
  - Attendee ID
  - Event ID
  - Timestamp (for validation)
  - Attendee name (for display purposes)
- Add a "View QR Code" button in the attendee details screen
- Implement sharing functionality for attendee QR codes

#### Technical Approach:
```typescript
// QR code data structure
const qrData = {
  type: 'ventry-attendee',
  id: attendee.id,
  eventId: event.id,
  name: attendee.name,
  timestamp: new Date().toISOString()
};
```

### 2. QR Code Scanning Functionality

#### Tasks:
- Create a new screen at `app/event/scan/[id].tsx` for QR code scanning
- Implement camera access using `expo-barcode-scanner`
- Handle camera permissions
- Process scanned QR codes
- Add navigation to the scan screen from the event details page

#### Technical Approach:
- Use `BarCodeScanner` component from `expo-barcode-scanner`
- Implement permission handling with fallbacks
- Parse QR code data and validate format
- Connect to `checkInAttendee` method in `EventContext`

```typescript
// Basic structure for the scan screen
import { BarCodeScanner } from 'expo-barcode-scanner';

// Inside component:
const [hasPermission, setHasPermission] = useState<boolean | null>(null);
const [scanned, setScanned] = useState(false);

useEffect(() => {
  (async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  })();
}, []);

const handleBarCodeScanned = ({ type, data }) => {
  setScanned(true);
  try {
    const qrData = JSON.parse(data);
    // Validate and process QR data
    // Call checkInAttendee
  } catch (error) {
    // Handle parsing error
  }
};
```

### 3. Validation Logic for Scanned QR Codes

#### Tasks:
- Implement validation for QR code data structure
- Verify the event ID matches the current event
- Check if the attendee exists in the database
- Prevent duplicate check-ins (optional: allow with warning)
- Add timestamp validation (optional: expire QR codes after a certain time)

#### Technical Approach:
```typescript
// Validation logic
const validateQRCode = (qrData: any, eventId: string) => {
  // Check if it's a valid Ventry QR code
  if (!qrData.type || !['ventry-attendee', 'ventry-event'].includes(qrData.type)) {
    return { valid: false, message: 'Invalid QR code format' };
  }
  
  // Check if event ID matches
  if (qrData.eventId !== eventId) {
    return { valid: false, message: 'QR code is for a different event' };
  }
  
  // Check if attendee ID exists
  if (!qrData.id) {
    return { valid: false, message: 'Missing attendee information' };
  }
  
  return { valid: true };
};
```

### 4. Success/Error Feedback for Scanning

#### Tasks:
- Implement visual feedback for successful scans
- Show error messages for invalid QR codes
- Add haptic feedback (optional)
- Provide clear instructions for retry
- Show attendee information after successful scan

#### Technical Approach:
```typescript
// Feedback states
const [feedbackMessage, setFeedbackMessage] = useState('');
const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info' | null>(null);

// After scanning
if (result) {
  setFeedbackMessage(`${result.name} successfully checked in!`);
  setFeedbackType('success');
  // Optional: Haptic feedback
} else {
  setFeedbackMessage('Failed to check in attendee');
  setFeedbackType('error');
}
```

## Implementation Timeline

### Day 1: QR Code Generation for Attendees
- Create attendee QR code screen
- Modify QR data structure
- Add navigation to QR screen from attendee details

### Day 2: QR Code Scanning Setup
- Create scan screen with camera access
- Implement permission handling
- Basic QR code parsing

### Day 3: Validation and Check-in Logic
- Implement validation logic
- Connect to check-in functionality
- Test with various QR code formats

### Day 4: UI/UX and Feedback
- Implement success/error feedback
- Add visual indicators
- Polish the user experience
- Comprehensive testing

## Testing Plan

1. **Unit Tests**
   - Test QR code data generation
   - Test validation logic
   - Test check-in process

2. **Integration Tests**
   - Test camera permission flow
   - Test QR code scanning to database update
   - Test navigation between screens

3. **Manual Testing Scenarios**
   - Scan valid attendee QR code
   - Scan invalid/malformed QR code
   - Scan QR code from different event
   - Scan already checked-in attendee
   - Test with poor lighting conditions
   - Test with damaged/partially visible QR codes

## Dependencies

- `expo-barcode-scanner`: Already installed
- `react-native-qrcode-svg`: Already installed
- `expo-haptics` (optional): For haptic feedback

## Conclusion

This implementation plan provides a comprehensive approach to building the QR code system for the Ventry app. By following this plan, we'll create a robust system that allows for efficient attendee check-ins using QR codes, enhancing the overall event management experience.
