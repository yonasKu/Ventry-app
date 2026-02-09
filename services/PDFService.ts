import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';
import { format } from 'date-fns';
import { DatabaseService, Event, Attendee } from './DatabaseService';
import ReportingService, { ReportData, CheckInStats } from './ReportingService';

// PDF Options Interface
export interface PDFOptions {
  includeCharts?: boolean;
  includeAttendeeDetails?: boolean;
  includeCustomFields?: boolean;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  title?: string;
  subtitle?: string;
}

// PDF Generation Result Interface
export interface PDFGenerationResult {
  success: boolean;
  filePath?: string;
  error?: string;
  fileSize?: number;
}

export class PDFService {
  private dbService: DatabaseService;
  private reportingService: typeof ReportingService;

  constructor() {
    this.dbService = new DatabaseService();
    this.reportingService = ReportingService;
  }

  /**
   * Generate statistics report PDF
   */
  async generateStatisticsReport(
    timeFilter: 'week' | 'month' | 'year' | 'all' = 'month',
    options: PDFOptions = {}
  ): Promise<string> {
    try {
      // Get report data based on time filter
      const days = this.getFilterDays(timeFilter);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const reportData = this.reportingService.generateReport(startDate, new Date());
      
      // Generate HTML
      const html = this.generateStatisticsHTML(reportData, timeFilter, options);
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Create a better filename
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      const filename = `ventry_statistics_${timeFilter}_${timestamp}.pdf`;
      const newFile = new File(Paths.document, filename);
      
      // Move file to new location with better name
      const tempFile = new File(uri);
      await tempFile.copy(newFile);
      await tempFile.delete();
      
      return newFile.uri;
    } catch (error: any) {
      console.error('Error generating statistics PDF:', error);
      throw new Error(`Failed to generate statistics PDF: ${error.message}`);
    }
  }

  /**
   * Generate event report PDF
   */
  async generateEventReport(
    eventId: string,
    options: PDFOptions = {}
  ): Promise<string> {
    try {
      // Get event data
      const event = this.dbService.getEventById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Get attendees
      const attendees = this.dbService.getAttendees(eventId);
      
      // Get statistics
      const stats = this.reportingService.getEventCheckInStats(eventId);
      if (!stats) {
        throw new Error('Failed to get event statistics');
      }

      // Generate HTML
      const html = this.generateEventHTML(event, attendees, stats, options);
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Create a better filename
      const sanitizedEventName = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      const filename = `${sanitizedEventName}_report_${timestamp}.pdf`;
      const newFile = new File(Paths.document, filename);
      
      // Move file to new location with better name
      const tempFile = new File(uri);
      await tempFile.copy(newFile);
      await tempFile.delete();
      
      return newFile.uri;
    } catch (error: any) {
      console.error('Error generating event PDF:', error);
      throw new Error(`Failed to generate event PDF: ${error.message}`);
    }
  }

  /**
   * Share PDF file
   */
  async sharePDF(filePath: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      await Sharing.shareAsync(filePath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share PDF Report'
      });
    } catch (error: any) {
      console.error('Error sharing PDF:', error);
      throw new Error(`Failed to share PDF: ${error.message}`);
    }
  }

  /**
   * Generate HTML for statistics report
   */
  private generateStatisticsHTML(
    data: ReportData,
    timeFilter: string,
    options: PDFOptions
  ): string {
    const styles = this.getStyles();
    const header = this.generateHeader('Ventry Statistics Report', `Period: ${this.getFilterLabel(timeFilter)}`);
    const footer = this.generateFooter();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ventry Statistics Report</title>
        <style>${styles}</style>
      </head>
      <body>
        ${header}
        
        <!-- Summary Section -->
        <div class="section">
          <h2>Summary</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <h3>${data.summary.totalEvents}</h3>
              <p>Total Events</p>
            </div>
            <div class="stat-card">
              <h3>${data.summary.totalAttendees}</h3>
              <p>Total Attendees</p>
            </div>
            <div class="stat-card">
              <h3>${data.summary.totalCheckedIn}</h3>
              <p>Checked In</p>
            </div>
            <div class="stat-card">
              <h3>${data.summary.checkInRate.toFixed(1)}%</h3>
              <p>Check-in Rate</p>
            </div>
          </div>
          
          <div class="stats-grid" style="margin-top: 15px;">
            <div class="stat-card">
              <h3>${data.summary.upcomingEvents}</h3>
              <p>Upcoming Events</p>
            </div>
            <div class="stat-card">
              <h3>${data.summary.todayEvents}</h3>
              <p>Today's Events</p>
            </div>
            <div class="stat-card">
              <h3>${data.summary.pastEvents}</h3>
              <p>Past Events</p>
            </div>
            <div class="stat-card">
              <h3>${data.summary.averageAttendance.toFixed(1)}</h3>
              <p>Avg Attendance</p>
            </div>
          </div>
        </div>

        <!-- Event Distribution -->
        <div class="section">
          <h2>Event Distribution</h2>
          <div class="distribution-list">
            ${data.distribution.map(dist => `
              <div class="distribution-item">
                <div class="distribution-label">
                  <span class="color-dot" style="background-color: ${dist.color};"></span>
                  <span>${dist.label}</span>
                </div>
                <div class="distribution-value">
                  <strong>${dist.value}</strong> events (${dist.percentage.toFixed(1)}%)
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Event Details Table -->
        ${data.events.length > 0 ? `
        <div class="section">
          <h2>Event Details</h2>
          <table>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Total Attendees</th>
                <th>Checked In</th>
                <th>Not Checked In</th>
                <th>Check-in Rate</th>
              </tr>
            </thead>
            <tbody>
              ${data.events.map(event => `
                <tr>
                  <td>${this.escapeHTML(event.eventTitle)}</td>
                  <td>${event.totalAttendees}</td>
                  <td>${event.checkedIn}</td>
                  <td>${event.notCheckedIn}</td>
                  <td>${event.checkInRate.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Attendance Trends -->
        ${data.trends.length > 0 ? `
        <div class="section page-break">
          <h2>Attendance Trends</h2>
          <p class="section-description">Daily attendance and check-in statistics over the selected period.</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Attendees</th>
                <th>Checked In</th>
                <th>Check-in Rate</th>
              </tr>
            </thead>
            <tbody>
              ${data.trends.filter(trend => trend.attendees > 0).map(trend => `
                <tr>
                  <td>${format(new Date(trend.date), 'MMM dd, yyyy')}</td>
                  <td>${trend.attendees}</td>
                  <td>${trend.checkedIn}</td>
                  <td>${trend.checkInRate.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${footer}
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for event report
   */
  private generateEventHTML(
    event: Event,
    attendees: Attendee[],
    stats: CheckInStats,
    options: PDFOptions
  ): string {
    const styles = this.getStyles();
    const header = this.generateHeader(
      event.title,
      `${format(new Date(event.date), 'MMMM dd, yyyy')} at ${event.time}`
    );
    const footer = this.generateFooter();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.escapeHTML(event.title)} - Event Report</title>
        <style>${styles}</style>
      </head>
      <body>
        ${header}
        
        <!-- Event Details -->
        <div class="section">
          <h2>Event Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>Date:</strong> ${format(new Date(event.date), 'MMMM dd, yyyy')}
            </div>
            <div class="info-item">
              <strong>Time:</strong> ${event.time}
            </div>
            ${event.location ? `
            <div class="info-item">
              <strong>Location:</strong> ${this.escapeHTML(event.location)}
            </div>
            ` : ''}
            ${event.notes ? `
            <div class="info-item" style="grid-column: 1 / -1;">
              <strong>Notes:</strong> ${this.escapeHTML(event.notes)}
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Statistics Summary -->
        <div class="section">
          <h2>Check-in Statistics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <h3>${stats.totalAttendees}</h3>
              <p>Total Attendees</p>
            </div>
            <div class="stat-card">
              <h3>${stats.checkedIn}</h3>
              <p>Checked In</p>
            </div>
            <div class="stat-card">
              <h3>${stats.notCheckedIn}</h3>
              <p>Not Checked In</p>
            </div>
            <div class="stat-card">
              <h3>${stats.checkInRate.toFixed(1)}%</h3>
              <p>Check-in Rate</p>
            </div>
          </div>
        </div>

        <!-- Attendee List -->
        ${options.includeAttendeeDetails !== false && attendees.length > 0 ? `
        <div class="section page-break">
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
              ${attendees.map((attendee, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${this.escapeHTML(attendee.name)}</td>
                  <td>${attendee.email ? this.escapeHTML(attendee.email) : '-'}</td>
                  <td>${attendee.phone ? this.escapeHTML(attendee.phone) : '-'}</td>
                  <td>
                    <span class="status-badge ${attendee.checked_in ? 'status-checked-in' : 'status-not-checked-in'}">
                      ${attendee.checked_in ? 'Checked In' : 'Not Checked In'}
                    </span>
                  </td>
                  <td>${attendee.check_in_time ? format(new Date(attendee.check_in_time), 'MMM dd, HH:mm') : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${footer}
      </body>
      </html>
    `;
  }

  /**
   * Generate header HTML
   */
  private generateHeader(title: string, subtitle: string): string {
    return `
      <div class="header">
        <div class="header-content">
          <h1>${this.escapeHTML(title)}</h1>
          <p class="subtitle">${this.escapeHTML(subtitle)}</p>
          <p class="generated-date">Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate footer HTML
   */
  private generateFooter(): string {
    return `
      <div class="footer">
        <p>Generated by Ventry | ${format(new Date(), 'MMMM dd, yyyy')}</p>
      </div>
    `;
  }

  /**
   * Get CSS styles for PDF
   */
  private getStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 12px;
        line-height: 1.6;
        color: #1F2937;
        padding: 30px;
        background: #ffffff;
      }

      .header {
        text-align: center;
        border-bottom: 3px solid #3B82F6;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }

      .header h1 {
        font-size: 28px;
        color: #1F2937;
        margin-bottom: 8px;
        font-weight: 700;
      }

      .subtitle {
        font-size: 14px;
        color: #6B7280;
        margin-bottom: 5px;
      }

      .generated-date {
        font-size: 11px;
        color: #9CA3AF;
      }

      .section {
        margin-bottom: 30px;
      }

      .section h2 {
        font-size: 18px;
        color: #1F2937;
        margin-bottom: 15px;
        font-weight: 600;
        border-bottom: 2px solid #E5E7EB;
        padding-bottom: 8px;
      }

      .section-description {
        font-size: 11px;
        color: #6B7280;
        margin-bottom: 15px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
      }

      .stat-card {
        background: #F9FAFB;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
      }

      .stat-card h3 {
        font-size: 32px;
        color: #3B82F6;
        margin-bottom: 5px;
        font-weight: 700;
      }

      .stat-card p {
        font-size: 11px;
        color: #6B7280;
        font-weight: 500;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .info-item {
        font-size: 12px;
        padding: 8px 0;
      }

      .info-item strong {
        color: #374151;
        margin-right: 8px;
      }

      .distribution-list {
        background: #F9FAFB;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 15px;
      }

      .distribution-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #E5E7EB;
      }

      .distribution-item:last-child {
        border-bottom: none;
      }

      .distribution-label {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
      }

      .distribution-value {
        font-size: 12px;
        color: #374151;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        font-size: 11px;
      }

      thead {
        background: #F3F4F6;
      }

      th {
        padding: 10px 8px;
        text-align: left;
        font-weight: 600;
        color: #374151;
        border-bottom: 2px solid #D1D5DB;
        font-size: 11px;
      }

      td {
        padding: 8px;
        border-bottom: 1px solid #E5E7EB;
        color: #1F2937;
      }

      tr:nth-child(even) {
        background: #F9FAFB;
      }

      .status-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
      }

      .status-checked-in {
        background: #D1FAE5;
        color: #065F46;
      }

      .status-not-checked-in {
        background: #FEE2E2;
        color: #991B1B;
      }

      .footer {
        margin-top: 40px;
        padding-top: 15px;
        border-top: 2px solid #E5E7EB;
        text-align: center;
        font-size: 10px;
        color: #9CA3AF;
      }

      .page-break {
        page-break-before: always;
      }

      @media print {
        body {
          padding: 20px;
        }
      }
    `;
  }

  /**
   * Helper: Get filter days
   */
  private getFilterDays(filter: string): number {
    switch (filter) {
      case 'week': return 7;
      case 'month': return 30;
      case 'year': return 365;
      case 'all': return 3650; // ~10 years
      default: return 30;
    }
  }

  /**
   * Helper: Get filter label
   */
  private getFilterLabel(filter: string): string {
    switch (filter) {
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      case 'year': return 'Last 365 Days';
      case 'all': return 'All Time';
      default: return 'Last 30 Days';
    }
  }

  /**
   * Helper: Escape HTML
   */
  private escapeHTML(text: string): string {
    const div = { textContent: text } as any;
    const escaped = div.textContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return escaped;
  }

  /**
   * Clean up temporary files
   */
  async cleanup(filePath: string): Promise<void> {
    try {
      const file = new File(filePath);
      if (file.exists) {
        await file.delete();
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
      // Don't throw - cleanup is not critical
    }
  }
}

export default new PDFService();
