# Installation Guide - QR Scanning & Data Export Features

## 📦 New Features Added

1. **QR Code Scanning** - Scan attendee QR codes for quick check-in
2. **Data Export** - Export attendee lists and check-in reports to CSV

---

## 🚀 Installation Steps

### 1. Install Required Dependencies

Run the following command in your project root:

```bash
npx expo install expo-camera expo-barcode-scanner expo-file-system expo-sharing
```

### 2. Rebuild the App

Since we added native modules (camera), you need to rebuild:

**For iOS:**
```bash
npx expo run:ios
```

**For Android:**
```bash
npx expo run:android
```

**Note:** `expo start` won't work for these new features until you rebuild with the commands above.

---

## 📱 Testing the Features

### QR Code Scanning

1. Open an event
2. Tap "Scan QR" button
3. Allow camera permissions when prompted
4. Point camera at an attendee QR code
5. The app will automatically check them in

**QR Code Format:**
The scanner expects QR codes in this format:
- `ventry://checkin/{eventId}/{attendeeId}`
- Or JSON: `{"eventId": "...", "attendeeId": "..."}`

### Data Export

1. Open an event
2. Tap "Export" button
3. Choose export type:
   - **Attendee List** - All attendees with details
   - **Check-in Report** - Summary and checked-in attendees
4. The CSV file will be saved and you can share it

---

## 🔧 Troubleshooting

### Camera Permission Issues

**iOS:**
- Go to Settings > Privacy > Camera
- Enable camera access for Ventry

**Android:**
- Go to Settings > Apps > Ventry > Permissions
- Enable Camera permission

### Export Not Working

- Make sure you have storage permissions
- Check if sharing is available on your device
- Try exporting a smaller dataset first

### QR Scanner Not Detecting Codes

- Ensure good lighting
- Hold the QR code steady
- Make sure the QR code is within the frame
- Try generating a new QR code from the app

---

## 📝 Files Added/Modified

### New Files Created:
- `services/ExportService.ts` - Export functionality
- `app/event/scan-qr/[id].tsx` - QR scanner screen
- `app/event/export/[id].tsx` - Export screen

### Modified Files:
- `package.json` - Added dependencies
- `app.json` - Added camera permissions
- `app/event/[id].tsx` - Added Export and Scan QR buttons

---

## 🎯 Usage Examples

### Exporting Attendee Data

```typescript
import { ExportService } from './services/ExportService';

const exportService = new ExportService();

// Export attendees
await exportService.exportAndShareEventAttendees(eventId, eventName);

// Export check-in report
await exportService.exportAndShareCheckInReport(eventId, eventName);

// Export all events
await exportService.exportAndShareAllEvents();
```

### QR Code Format for Testing

Generate QR codes with this format:
```
ventry://checkin/EVENT_ID/ATTENDEE_ID
```

Or use JSON:
```json
{
  "eventId": "your-event-id",
  "attendeeId": "your-attendee-id"
}
```

---

## ✅ Feature Checklist

- [x] QR code scanning with camera
- [x] Camera permission handling
- [x] Scan validation against event attendees
- [x] Duplicate check-in prevention
- [x] Success/error feedback
- [x] Continuous scanning mode
- [x] CSV export for attendees
- [x] CSV export for check-in reports
- [x] File sharing functionality
- [x] Export UI with statistics

---

## 🔜 Next Steps

1. Test on physical devices (iOS & Android)
2. Generate QR codes for attendees
3. Test export functionality
4. Gather user feedback
5. Implement PDF export (future enhancement)

---

## 📞 Support

If you encounter any issues:
1. Check the console logs for errors
2. Verify all dependencies are installed
3. Ensure you've rebuilt the app after adding native modules
4. Check camera and storage permissions

---

**Version:** 1.0.0  
**Last Updated:** January 22, 2026
