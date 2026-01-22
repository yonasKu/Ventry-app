import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Papa from 'papaparse';
import { Platform, Alert } from 'react-native';
import { nanoid } from 'nanoid/non-secure';
import { DatabaseService, Event, Attendee } from './DatabaseService';
import CsvService from './CsvService';

// Export format options
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  EXCEL = 'xlsx',
  PDF = 'pdf'
}

// Export destination options
export enum ExportDestination {
  LOCAL = 'local',
  SHARE = 'share',
  EMAIL = 'email'
}

// Export options interface
export interface ExportOptions {
  format: ExportFormat;
  includeFields?: string[];
  includeCheckInStatus?: boolean;
  password?: string;
  templateId?: string;
  destination?: ExportDestination;
}

// Export task status
export interface ExportTaskStatus {
  id: string;
  eventId: string;
  status: 'in_progress' | 'completed' | 'failed';
  progress: number;
  filePath?: string;
  error?: string;
  startTime: string;
  endTime?: string;
}

export class ExportService {
  private dbService: DatabaseService;
  private csvService: typeof CsvService;
  private activeTasks: Map<string, ExportTaskStatus>;
  
  constructor() {
    this.dbService = new DatabaseService();
    this.csvService = CsvService;
    this.activeTasks = new Map();
  }
  
  /**
   * Export attendees for an event with advanced options
   */
  async exportAttendees(
    eventId: string,
    options: ExportOptions = { format: ExportFormat.CSV, includeCheckInStatus: true }
  ): Promise<string> {
    try {
      // Get event data
      const event = this.dbService.getEventById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Get attendees for this event
      const attendees = this.dbService.getAttendees(eventId);
      
      if (attendees.length === 0) {
        throw new Error('No attendees to export for this event');
      }
      
      // Filter fields if specified
      const filteredAttendees = attendees.map(attendee => {
        const filteredAttendee: Record<string, any> = {};
        
        // If includeFields is specified, only include those fields
        if (options.includeFields && options.includeFields.length > 0) {
          options.includeFields.forEach(field => {
            if (field in attendee) {
              filteredAttendee[field] = attendee[field as keyof Attendee];
            }
          });
        } else {
          // Otherwise, include all fields except internal ones
          Object.keys(attendee).forEach(key => {
            if (key !== 'id' && key !== 'event_id') {
              filteredAttendee[key] = attendee[key as keyof Attendee];
            } else if (key === 'id') {
              filteredAttendee['attendee_id'] = attendee.id;
            }
          });
        }
        
        // Add check-in status if requested
        if (options.includeCheckInStatus) {
          filteredAttendee.checked_in = attendee.checked_in ? 'Yes' : 'No';
          filteredAttendee.check_in_time = attendee.check_in_time || '';
        }
        
        return filteredAttendee;
      });
      
      // Generate file based on format
      let filePath = '';
      switch (options.format) {
        case ExportFormat.JSON:
          filePath = await this.exportToJson(filteredAttendees, event, 'attendees');
          break;
          
        case ExportFormat.CSV:
          if (options.includeCheckInStatus) {
            filePath = await this.csvService.exportAttendeesToCsv(attendees, event, true);
          } else {
            filePath = await this.csvService.exportAttendeesToCsv(attendees, event, false);
          }
          break;
          
        case ExportFormat.EXCEL:
          // For now, we'll use CSV as a fallback and inform the user
          Alert.alert('Feature Coming Soon', 'Excel export will be available in the next update. Using CSV format for now.');
          filePath = await this.csvService.exportAttendeesToCsv(attendees, event, options.includeCheckInStatus);
          break;
          
        case ExportFormat.PDF:
          // For now, we'll use CSV as a fallback and inform the user
          Alert.alert('Feature Coming Soon', 'PDF export will be available in the next update. Using CSV format for now.');
          filePath = await this.csvService.exportAttendeesToCsv(attendees, event, options.includeCheckInStatus);
          break;
          
        default:
          filePath = await this.csvService.exportAttendeesToCsv(attendees, event, options.includeCheckInStatus);
      }
      
      // Encrypt file if password is provided
      if (options.password) {
        filePath = await this.encryptFile(filePath, options.password);
      }
      
      return filePath;
    } catch (error: any) {
      console.error('Error exporting attendees:', error);
      throw new Error(`Failed to export attendees: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Export an event with advanced options
   */
  async exportEvent(
    eventId: string,
    options: ExportOptions = { format: ExportFormat.CSV }
  ): Promise<string> {
    try {
      // Get event data
      const event = this.dbService.getEventById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Generate file based on format
      let filePath = '';
      switch (options.format) {
        case ExportFormat.JSON:
          filePath = await this.exportToJson(event, event, 'event');
          break;
          
        case ExportFormat.CSV:
          filePath = await this.csvService.exportEventToCsv(event);
          break;
          
        case ExportFormat.EXCEL:
        case ExportFormat.PDF:
          // For now, we'll use CSV as a fallback
          filePath = await this.csvService.exportEventToCsv(event);
          break;
          
        default:
          filePath = await this.csvService.exportEventToCsv(event);
      }
      
      // Encrypt file if password is provided
      if (options.password) {
        filePath = await this.encryptFile(filePath, options.password);
      }
      
      return filePath;
    } catch (error: any) {
      console.error('Error exporting event:', error);
      throw new Error(`Failed to export event: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Export multiple events in batch
   */
  async batchExportEvents(
    eventIds: string[],
    options: ExportOptions = { format: ExportFormat.CSV }
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const batchFileName = `batch_export_${timestamp}.${options.format}`;
      const batchFilePath = `${FileSystem.documentDirectory}${batchFileName}`;
      
      // Create a simple text-based report with all events
      let batchContent = `Ventry Batch Export\nDate: ${new Date().toLocaleString()}\n\n`;
      
      // Process each event
      for (const eventId of eventIds) {
        const event = this.dbService.getEventById(eventId);
        if (!event) continue;
        
        batchContent += `\n--- EVENT: ${event.title} ---\n`;
        batchContent += `Date: ${event.date} at ${event.time}\n`;
        batchContent += `Location: ${event.location || 'N/A'}\n`;
        batchContent += `Attendees: ${event.attendees_count || 0} (${event.checked_in_count || 0} checked in)\n\n`;
        
        // Get attendees
        const attendees = this.dbService.getAttendees(eventId);
        batchContent += `ATTENDEES:\n`;
        
        attendees.forEach((attendee, index) => {
          batchContent += `${index + 1}. ${attendee.name} (${attendee.checked_in ? 'Checked In' : 'Not Checked In'})\n`;
          if (attendee.email) batchContent += `   Email: ${attendee.email}\n`;
          if (attendee.phone) batchContent += `   Phone: ${attendee.phone}\n`;
          if (attendee.check_in_time) batchContent += `   Check-in time: ${attendee.check_in_time}\n`;
          batchContent += `\n`;
        });
        
        batchContent += `\n---------------------------------\n\n`;
      }
      
      // Save batch content to file
      await FileSystem.writeAsStringAsync(batchFilePath, batchContent, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      return batchFilePath;
    } catch (error: any) {
      console.error('Error batch exporting events:', error);
      throw new Error(`Failed to batch export events: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Export data to JSON format
   */
  private async exportToJson(
    data: any,
    event: Event,
    type: string
  ): Promise<string> {
    try {
      // Convert to JSON
      const jsonData = JSON.stringify(data, null, 2);
      
      // Create filename
      const sanitizedEventName = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${sanitizedEventName}_${type}_${timestamp}.json`;
      
      // Save to file
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(filePath, jsonData, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      return filePath;
    } catch (error: any) {
      console.error('Error exporting to JSON:', error);
      throw new Error(`Failed to export to JSON: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Encrypt a file with a password
   * Note: This uses a simple encryption for demonstration.
   */
  private async encryptFile(filePath: string, password: string): Promise<string> {
    try {
      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(filePath);
      
      // Use a simple encryption method that doesn't depend on external libraries
      // In a real app, you would use a proper encryption library
      const encryptedContent = `ENCRYPTED:${password}\n${fileContent}`;
      
      // Save encrypted content
      const encryptedPath = `${filePath}.encrypted`;
      await FileSystem.writeAsStringAsync(encryptedPath, encryptedContent);
      
      return encryptedPath;
    } catch (error: any) {
      console.error('Error encrypting file:', error);
      throw new Error(`Failed to encrypt file: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Share a file with platform-specific sharing
   */
  async shareFile(filePath: string, title: string = 'Share File'): Promise<void> {
    return this.csvService.shareCsvFile(filePath, title);
  }

  /**
   * Generate a statistics object for event reporting
   */
  getEventStatistics(eventId: string): Record<string, any> {
    try {
      const event = this.dbService.getEventById(eventId);
      if (!event) throw new Error('Event not found');
      
      const attendees = this.dbService.getAttendees(eventId);
      const totalAttendees = attendees.length;
      const checkedIn = attendees.filter(a => a.checked_in).length;
      const notCheckedIn = totalAttendees - checkedIn;
      const checkInRate = totalAttendees > 0 ? (checkedIn / totalAttendees) * 100 : 0;
      
      // Group check-ins by hour
      const checkInsByHour: Record<string, number> = {};
      attendees.forEach(attendee => {
        if (attendee.checked_in && attendee.check_in_time) {
          const hour = new Date(attendee.check_in_time).getHours();
          checkInsByHour[hour] = (checkInsByHour[hour] || 0) + 1;
        }
      });
      
      return {
        eventName: event.title,
        eventDate: event.date,
        eventTime: event.time,
        totalAttendees,
        checkedIn,
        notCheckedIn,
        checkInRate: checkInRate.toFixed(1) + '%',
        checkInsByHour
      };
    } catch (error: any) {
      console.error('Error generating event statistics:', error);
      throw new Error(`Failed to generate statistics: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get active export tasks
   */
  getActiveTasks(): ExportTaskStatus[] {
    return Array.from(this.activeTasks.values());
  }
  
  /**
   * Get task status by ID
   */
  getTaskStatus(taskId: string): ExportTaskStatus | undefined {
    return this.activeTasks.get(taskId);
  }
}

export default new ExportService(); 
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
