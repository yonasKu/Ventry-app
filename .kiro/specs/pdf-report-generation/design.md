# PDF Report Generation - Design Document

**Feature Name:** pdf-report-generation  
**Created:** February 5, 2026  
**Status:** Draft

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
├─────────────────────────────────────────────────────────────┤
│  Stats Screen          Event Details Screen                  │
│  - Export PDF Button   - Export PDF Button                   │
│  - Loading Indicator   - Share Dialog                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  PDFService                                                  │
│  - generateStatisticsReport()                                │
│  - generateEventReport()                                     │
│  - generateHTML()                                            │
│  - convertChartToImage()                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   ReportingService       │  │   ExportService          │
│   - getOverallStats()    │  │   - shareFile()          │
│   - generateReport()     │  │   - getEventStatistics() │
└──────────────────────────┘  └──────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Libraries                        │
├─────────────────────────────────────────────────────────────┤
│  expo-print            expo-sharing         expo-file-system │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Component Diagram

```
PDFService
├── HTML Template Generator
│   ├── Statistics Report Template
│   ├── Event Report Template
│   └── Common Components (Header, Footer, Styles)
├── Chart Renderer
│   ├── Chart to Base64 Converter
│   └── Victory Chart Wrapper
├── PDF Generator
│   ├── expo-print Integration
│   └── File System Manager
└── Share Handler
    └── expo-sharing Integration
```

---

## 2. Data Flow

### 2.1 Statistics Report Generation Flow

```
User clicks "Export PDF" on Stats Screen
    ↓
PDFService.generateStatisticsReport()
    ↓
Fetch data from ReportingService
    ↓
Generate HTML template with data
    ↓
Convert charts to base64 images (if needed)
    ↓
Inject images into HTML
    ↓
expo-print.printToFileAsync(html)
    ↓
Save PDF to file system
    ↓
Show share dialog
    ↓
User shares/saves PDF
```

### 2.2 Event Report Generation Flow

```
User clicks "Export PDF" on Event Details
    ↓
PDFService.generateEventReport(eventId)
    ↓
Fetch event data from DatabaseService
    ↓
Fetch attendees from DatabaseService
    ↓
Get statistics from ReportingService
    ↓
Generate HTML template
    ↓
expo-print.printToFileAsync(html)
    ↓
Save PDF to file system
    ↓
Show share dialog
```

---

## 3. Component Design

### 3.1 PDFService

**Location:** `services/PDFService.ts`

**Responsibilities:**
- Generate PDF documents from data
- Create HTML templates for PDF content
- Handle chart rendering
- Manage file operations
- Integrate with expo-print

**Key Methods:**

```typescript
class PDFService {
  // Generate statistics report PDF
  async generateStatisticsReport(
    timeFilter: 'week' | 'month' | 'year' | 'all',
    options?: PDFOptions
  ): Promise<string>

  // Generate event report PDF
  async generateEventReport(
    eventId: string,
    options?: PDFOptions
  ): Promise<string>

  // Generate HTML for statistics report
  private generateStatisticsHTML(
    data: ReportData,
    options?: PDFOptions
  ): string

  // Generate HTML for event report
  private generateEventHTML(
    event: Event,
    attendees: Attendee[],
    stats: CheckInStats,
    options?: PDFOptions
  ): string

  // Convert chart data to base64 image (if needed)
  private async chartToBase64(
    chartData: any,
    chartType: string
  ): Promise<string>

  // Share PDF file
  async sharePDF(filePath: string): Promise<void>

  // Clean up temporary files
  private async cleanup(filePath: string): Promise<void>
}
```

**Interfaces:**

```typescript
interface PDFOptions {
  includeCharts?: boolean;
  includeAttendeeDetails?: boolean;
  includeCustomFields?: boolean;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  title?: string;
  subtitle?: string;
}

interface PDFGenerationResult {
  success: boolean;
  filePath?: string;
  error?: string;
  fileSize?: number;
}
```

### 3.2 HTML Templates

**Statistics Report Template Structure:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ventry Statistics Report</title>
  <style>
    /* Embedded CSS for PDF styling */
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>Ventry Statistics Report</h1>
    <p>Generated: {date}</p>
    <p>Period: {timeFilter}</p>
  </div>

  <!-- Summary Section -->
  <div class="summary">
    <h2>Summary</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <h3>{totalEvents}</h3>
        <p>Total Events</p>
      </div>
      <!-- More stat cards -->
    </div>
  </div>

  <!-- Charts Section -->
  <div class="charts">
    <h2>Visual Analytics</h2>
    <img src="data:image/png;base64,{chartData}" />
  </div>

  <!-- Event Details Table -->
  <div class="events-table">
    <h2>Event Details</h2>
    <table>
      <!-- Event rows -->
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>Page {pageNumber} | Generated by Ventry</p>
  </div>
</body>
</html>
```

**Event Report Template Structure:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{eventTitle} - Event Report</title>
  <style>
    /* Embedded CSS */
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>{eventTitle}</h1>
    <p>Date: {eventDate} at {eventTime}</p>
    <p>Location: {eventLocation}</p>
  </div>

  <!-- Statistics Summary -->
  <div class="summary">
    <h2>Check-in Statistics</h2>
    <div class="stats-grid">
      <!-- Stat cards -->
    </div>
  </div>

  <!-- Attendee List -->
  <div class="attendees">
    <h2>Attendee List</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Check-in Time</th>
        </tr>
      </thead>
      <tbody>
        <!-- Attendee rows -->
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>Page {pageNumber} | Generated by Ventry</p>
  </div>
</body>
</html>
```

### 3.3 UI Components

**Export Button Component:**

```typescript
// components/ExportPDFButton.tsx
interface ExportPDFButtonProps {
  type: 'statistics' | 'event';
  eventId?: string;
  timeFilter?: 'week' | 'month' | 'year' | 'all';
  onSuccess?: (filePath: string) => void;
  onError?: (error: string) => void;
}

const ExportPDFButton: React.FC<ExportPDFButtonProps> = ({
  type,
  eventId,
  timeFilter,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      let filePath: string;
      if (type === 'statistics') {
        filePath = await PDFService.generateStatisticsReport(
          timeFilter || 'month'
        );
      } else {
        filePath = await PDFService.generateEventReport(eventId!);
      }
      
      await PDFService.sharePDF(filePath);
      onSuccess?.(filePath);
    } catch (error) {
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity onPress={handleExport} disabled={loading}>
      {loading ? <ActivityIndicator /> : <FileText />}
      <Text>Export PDF</Text>
    </TouchableOpacity>
  );
};
```

---

## 4. Styling and Layout

### 4.1 PDF Styles

```css
/* Base styles */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  line-height: 1.6;
  color: #333;
  margin: 0;
  padding: 20px;
}

/* Header */
.header {
  text-align: center;
  border-bottom: 2px solid #3B82F6;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 24px;
  color: #1F2937;
  margin: 0 0 10px 0;
}

/* Summary Section */
.summary {
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-top: 15px;
}

.stat-card {
  background: #F3F4F6;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat-card h3 {
  font-size: 28px;
  color: #3B82F6;
  margin: 0 0 5px 0;
}

.stat-card p {
  font-size: 11px;
  color: #6B7280;
  margin: 0;
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

thead {
  background: #F3F4F6;
}

th {
  padding: 10px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  color: #374151;
  border-bottom: 2px solid #E5E7EB;
}

td {
  padding: 8px 10px;
  border-bottom: 1px solid #E5E7EB;
  font-size: 11px;
}

tr:hover {
  background: #F9FAFB;
}

/* Charts */
.charts {
  margin: 30px 0;
  page-break-inside: avoid;
}

.charts img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 15px auto;
}

/* Footer */
.footer {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  text-align: center;
  font-size: 10px;
  color: #9CA3AF;
  border-top: 1px solid #E5E7EB;
  padding-top: 10px;
}

/* Page breaks */
.page-break {
  page-break-after: always;
}

/* Print-specific */
@media print {
  body {
    margin: 0;
  }
  
  .no-print {
    display: none;
  }
}
```

### 4.2 Responsive Layout

- Use CSS Grid for stat cards (responsive to page width)
- Tables should have proper column widths
- Charts should scale to fit page width
- Page breaks should be logical (don't split tables/charts)

---

## 5. Error Handling

### 5.1 Error Scenarios

1. **PDF Generation Failure**
   - Cause: expo-print error, insufficient memory
   - Handling: Show error alert, log error, cleanup temp files
   - User Message: "Failed to generate PDF. Please try again."

2. **Chart Rendering Failure**
   - Cause: Chart data issues, rendering timeout
   - Handling: Skip chart, include text-based statistics instead
   - User Message: "PDF generated without charts due to rendering issues."

3. **File System Error**
   - Cause: Insufficient storage, permission issues
   - Handling: Show error alert with storage info
   - User Message: "Insufficient storage space. Please free up space and try again."

4. **Share Dialog Cancelled**
   - Cause: User cancels share dialog
   - Handling: Keep PDF file, show success message
   - User Message: "PDF saved successfully."

### 5.2 Error Handling Pattern

```typescript
try {
  setLoading(true);
  const filePath = await PDFService.generateStatisticsReport(timeFilter);
  await PDFService.sharePDF(filePath);
  Alert.alert('Success', 'PDF exported successfully!');
} catch (error) {
  console.error('PDF generation error:', error);
  
  if (error.message.includes('storage')) {
    Alert.alert(
      'Storage Error',
      'Insufficient storage space. Please free up space and try again.'
    );
  } else if (error.message.includes('permission')) {
    Alert.alert(
      'Permission Error',
      'Unable to save PDF. Please check app permissions.'
    );
  } else {
    Alert.alert(
      'Export Failed',
      'Failed to generate PDF. Please try again.'
    );
  }
} finally {
  setLoading(false);
}
```

---

## 6. Performance Considerations

### 6.1 Optimization Strategies

1. **Lazy Chart Rendering**
   - Only render charts when needed
   - Use memoization for chart data
   - Cache rendered chart images

2. **Progressive PDF Generation**
   - Show progress indicator
   - Generate sections incrementally
   - Stream data to PDF

3. **Memory Management**
   - Clean up temporary files immediately
   - Limit chart resolution
   - Use compression for images

4. **Background Processing**
   - Generate PDF in background (if possible)
   - Don't block UI during generation
   - Show cancellable progress dialog

### 6.2 Performance Targets

- PDF generation time: < 5 seconds for typical reports
- Memory usage: < 150MB during generation
- File size: < 5MB for typical reports
- UI responsiveness: No freezing during generation

---

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
describe('PDFService', () => {
  describe('generateStatisticsReport', () => {
    it('should generate PDF with valid data', async () => {
      const filePath = await PDFService.generateStatisticsReport('month');
      expect(filePath).toBeDefined();
      expect(filePath).toContain('.pdf');
    });

    it('should handle empty data gracefully', async () => {
      // Mock empty data
      const filePath = await PDFService.generateStatisticsReport('week');
      expect(filePath).toBeDefined();
    });

    it('should throw error for invalid time filter', async () => {
      await expect(
        PDFService.generateStatisticsReport('invalid' as any)
      ).rejects.toThrow();
    });
  });

  describe('generateEventReport', () => {
    it('should generate PDF for valid event', async () => {
      const filePath = await PDFService.generateEventReport('event-123');
      expect(filePath).toBeDefined();
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        PDFService.generateEventReport('invalid-id')
      ).rejects.toThrow('Event not found');
    });
  });
});
```

### 7.2 Integration Tests

- Test PDF generation with real data
- Test share functionality on both platforms
- Test file system operations
- Test error scenarios

### 7.3 Manual Testing Checklist

- [ ] Generate statistics PDF on iOS
- [ ] Generate statistics PDF on Android
- [ ] Generate event PDF on iOS
- [ ] Generate event PDF on Android
- [ ] Share PDF via email
- [ ] Share PDF via messaging apps
- [ ] Save PDF to Files app
- [ ] Open PDF in PDF reader
- [ ] Print PDF
- [ ] Test with large datasets (1000+ attendees)
- [ ] Test with empty data
- [ ] Test with no charts
- [ ] Test error scenarios

---

## 8. Security Considerations

### 8.1 Data Privacy

- PDFs may contain sensitive attendee information
- Warn users before sharing PDFs with personal data
- Provide option to exclude personal information
- Clean up temporary files after sharing

### 8.2 File Permissions

- Request necessary file system permissions
- Handle permission denials gracefully
- Store PDFs in app-specific directory
- Clean up old PDF files periodically

---

## 9. Accessibility

### 9.1 PDF Accessibility

- Use semantic HTML in templates
- Include alt text for charts (as text fallback)
- Ensure proper heading hierarchy
- Use sufficient color contrast
- Include table headers

### 9.2 UI Accessibility

- Export button should have accessible label
- Loading state should be announced to screen readers
- Error messages should be accessible
- Success feedback should be clear

---

## 10. Platform-Specific Considerations

### 10.1 iOS

- Use iOS-specific share sheet
- Handle iOS file system permissions
- Test with iOS PDF readers
- Ensure compatibility with AirDrop

### 10.2 Android

- Use Android share intent
- Handle Android file system permissions
- Test with Android PDF readers
- Ensure compatibility with Google Drive

---

## 11. Dependencies

### 11.1 New Dependencies

```json
{
  "expo-print": "~14.0.0"
}
```

### 11.2 Existing Dependencies

- expo-file-system (already installed)
- expo-sharing (already installed)
- ReportingService (existing)
- ExportService (existing)
- Victory-native (existing)

---

## 12. Implementation Phases

### Phase 1: Core PDF Generation (Week 1)
- Install expo-print
- Create PDFService
- Implement basic HTML templates
- Generate simple statistics PDF

### Phase 2: Chart Integration (Week 1-2)
- Implement chart rendering
- Convert charts to images
- Integrate charts into PDF
- Test chart quality

### Phase 3: Event Reports (Week 2)
- Implement event report generation
- Add attendee list formatting
- Include custom fields
- Test with various event types

### Phase 4: UI Integration (Week 2)
- Add export buttons to screens
- Implement loading states
- Add error handling
- Implement share functionality

### Phase 5: Polish & Testing (Week 3)
- Optimize performance
- Improve styling
- Comprehensive testing
- Bug fixes

---

## 13. Success Criteria

This design will be considered successful when:

1. ✅ PDFs are generated successfully on both platforms
2. ✅ Charts are clearly visible in PDFs
3. ✅ Layout is professional and consistent
4. ✅ Generation completes within 5 seconds
5. ✅ Share functionality works reliably
6. ✅ Error handling is robust
7. ✅ Memory usage is acceptable
8. ✅ Code is maintainable and well-documented

---

**End of Design Document**
