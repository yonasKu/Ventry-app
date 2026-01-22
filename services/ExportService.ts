import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { DatabaseService, Event, Attendee } from './DatabaseService';
import { CustomFieldsService } from './CustomFieldsService';
import { format } from 'date-fns';

export class ExportService {
  private db: DatabaseService;
  private customFieldsService: CustomFieldsService;

  constructor() {
    this.db = new DatabaseService();
    this.customFieldsService = new CustomFieldsService();
  }

  /**
   * Export event data to CSV format
   */
  async exportEventToCSV(eventId: string): Promise<string> {
    try {
      const event = this.db.getEventById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const attendees = event.attendees || [];
      
      // Get custom fields for this event
      const customFields = this.customFieldsService.getFields(eventId);
      
      // Create CSV header with custom fields
      const baseHeaders = ['Name', 'Email', 'Phone', 'Checked In', 'Check-in Time'];
      const customHeaders = customFields.map(f => f.name);
      const header = [...baseHeaders, ...customHeaders].join(',') + '\n';
      
      // Create CSV rows with custom field values
      const rows = attendees.map(attendee => {
        const baseValues = [
          this.escapeCSV(attendee.name),
          this.escapeCSV(attendee.email || ''),
          this.escapeCSV(attendee.phone || ''),
          attendee.checked_in ? 'Yes' : 'No',
          attendee.check_in_time 
            ? format(new Date(attendee.check_in_time), 'yyyy-MM-dd HH:mm:ss')
            : '',
        ];
        
        // Get custom field values for this attendee
        const customValues = customFields.map(field => {
          const value = this.customFieldsService.getFieldValue(attendee.id, field.id);
          return this.escapeCSV(value || '');
        });
        
        return [...baseValues, ...customValues].join(',');
      }).join('\n');

      return header + rows;
    } catch (error) {
      console.error('Error exporting event to CSV:', error);
      throw error;
    }
  }

  /**
   * Export check-in report to CSV
   */
  async exportCheckInReport(eventId: string): Promise<string> {
    try {
      const event = this.db.getEventById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const attendees = event.attendees || [];
      const checkedInAttendees = attendees.filter(a => a.checked_in);
      
      // Create CSV header
      const header = 'Event Name,Total Attendees,Checked In,Check-in Rate,Date,Time\n';
      
      // Calculate statistics
      const totalAttendees = attendees.length;
      const checkedInCount = checkedInAttendees.length;
      const checkInRate = totalAttendees > 0 
        ? ((checkedInCount / totalAttendees) * 100).toFixed(2) + '%'
        : '0%';
      
      const eventDate = format(new Date(event.date), 'yyyy-MM-dd');
      const eventTime = event.time;
      
      // Create summary row
      const summaryRow = `${this.escapeCSV(event.title)},${totalAttendees},${checkedInCount},${checkInRate},${eventDate},${eventTime}\n\n`;
      
      // Create detailed check-in list
      const detailHeader = 'Name,Email,Phone,Check-in Time\n';
      const detailRows = checkedInAttendees.map(attendee => {
        const name = this.escapeCSV(attendee.name);
        const email = this.escapeCSV(attendee.email || '');
        const phone = this.escapeCSV(attendee.phone || '');
        const checkInTime = attendee.check_in_time 
          ? format(new Date(attendee.check_in_time), 'yyyy-MM-dd HH:mm:ss')
          : '';
        
        return `${name},${email},${phone},${checkInTime}`;
      }).join('\n');

      return header + summaryRow + detailHeader + detailRows;
    } catch (error) {
      console.error('Error exporting check-in report:', error);
      throw error;
    }
  }

  /**
   * Export all events to CSV
   */
  async exportAllEvents(): Promise<string> {
    try {
      const events = this.db.getEvents();
      
      // Create CSV header
      const header = 'Event Name,Date,Time,Location,Total Attendees,Checked In,Check-in Rate,Created At\n';
      
      // Create CSV rows
      const rows = events.map(event => {
        const name = this.escapeCSV(event.title);
        const date = format(new Date(event.date), 'yyyy-MM-dd');
        const time = event.time;
        const location = this.escapeCSV(event.location || '');
        const totalAttendees = event.attendees_count || 0;
        const checkedIn = event.checked_in_count || 0;
        const checkInRate = totalAttendees > 0 
          ? ((checkedIn / totalAttendees) * 100).toFixed(2) + '%'
          : '0%';
        const createdAt = format(new Date(event.created_at), 'yyyy-MM-dd HH:mm:ss');
        
        return `${name},${date},${time},${location},${totalAttendees},${checkedIn},${checkInRate},${createdAt}`;
      }).join('\n');

      return header + rows;
    } catch (error) {
      console.error('Error exporting all events:', error);
      throw error;
    }
  }

  /**
   * Save CSV content to file and share
   */
  async saveAndShareCSV(csvContent: string, filename: string): Promise<void> {
    try {
      // Create file path
      const fileUri = FileSystem.documentDirectory + filename;
      
      // Write CSV content to file
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share the file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export CSV',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error saving and sharing CSV:', error);
      throw error;
    }
  }

  /**
   * Export event attendees and share
   */
  async exportAndShareEventAttendees(eventId: string, eventName: string): Promise<void> {
    try {
      const csvContent = await this.exportEventToCSV(eventId);
      const filename = `${this.sanitizeFilename(eventName)}_attendees_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      await this.saveAndShareCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting and sharing event attendees:', error);
      throw error;
    }
  }

  /**
   * Export check-in report and share
   */
  async exportAndShareCheckInReport(eventId: string, eventName: string): Promise<void> {
    try {
      const csvContent = await this.exportCheckInReport(eventId);
      const filename = `${this.sanitizeFilename(eventName)}_checkin_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      await this.saveAndShareCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting and sharing check-in report:', error);
      throw error;
    }
  }

  /**
   * Export all events and share
   */
  async exportAndShareAllEvents(): Promise<void> {
    try {
      const csvContent = await this.exportAllEvents();
      const filename = `all_events_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      await this.saveAndShareCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting and sharing all events:', error);
      throw error;
    }
  }

  /**
   * Escape CSV special characters
   */
  private escapeCSV(value: string): string {
    if (!value) return '';
    
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    
    return value;
  }

  /**
   * Sanitize filename for file system
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }
}
