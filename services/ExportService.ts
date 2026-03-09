import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Papa from 'papaparse';
import { Platform, Alert } from 'react-native';
import { nanoid } from 'nanoid/non-secure';
import CryptoJS from 'crypto-js';
import { dbService, Event, Attendee } from './DatabaseService';
import CsvService from './CsvService';

// Export format options
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  // EXCEL = 'xlsx',  // Not implemented yet
  // PDF = 'pdf'      // Not implemented yet
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
  onProgress?: (progress: number, message: string) => void; // Progress callback
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
  private dbService = dbService;
  private csvService: typeof CsvService;
  private activeTasks: Map<string, ExportTaskStatus>;
  
  constructor() {
    this.csvService = CsvService;
    this.activeTasks = new Map();
  }
  
  /**
   * Validate export parameters
   */
  private validateExportParams(eventId: string, options: ExportOptions): void {
    // Validate eventId
    if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
      throw new Error('Valid event ID is required');
    }
    
    // Validate format
    const validFormats = Object.values(ExportFormat);
    if (!validFormats.includes(options.format)) {
      throw new Error(`Invalid export format: ${options.format}`);
    }
    
    // Validate includeFields
    if (options.includeFields) {
      if (!Array.isArray(options.includeFields)) {
        throw new Error('includeFields must be an array');
      }
      
      const validFields = ['name', 'email', 'phone', 'checked_in', 'check_in_time', 'created_at', 'updated_at'];
      const invalidFields = options.includeFields.filter(f => !validFields.includes(f));
      
      if (invalidFields.length > 0) {
        throw new Error(`Invalid fields: ${invalidFields.join(', ')}`);
      }
    }
  }
  
  /**
   * Export attendees for an event with advanced options
   */
  async exportAttendees(
    eventId: string,
    options: ExportOptions = { format: ExportFormat.CSV, includeCheckInStatus: true }
  ): Promise<string> {
    try {
      // Validate input
      this.validateExportParams(eventId, options);
      
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
      // Validate format
      if (options.format !== ExportFormat.CSV && options.format !== ExportFormat.JSON) {
        throw new Error('Batch export only supports CSV and JSON formats');
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Handle different formats
      if (options.format === ExportFormat.JSON) {
        return await this.batchExportAsJson(eventIds, timestamp, options.onProgress);
      } else {
        return await this.batchExportAsCsv(eventIds, timestamp, options.onProgress);
      }
    } catch (error: any) {
      console.error('Error batch exporting events:', error);
      throw new Error(`Failed to batch export events: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Batch export as CSV format
   */
  private async batchExportAsCsv(eventIds: string[], timestamp: string, onProgress?: (progress: number, message: string) => void): Promise<string> {
    const batchFileName = `batch_export_${timestamp}.csv`;
    const file = new File(Paths.document, batchFileName);
    
    onProgress?.(10, 'Starting batch export...');
    
    // Collect all attendees from all events
    const allAttendees: any[] = [];
    const totalEvents = eventIds.length;
    
    for (let i = 0; i < eventIds.length; i++) {
      const eventId = eventIds[i];
      const progress = 10 + Math.floor((i / totalEvents) * 60);
      onProgress?.(progress, `Processing event ${i + 1} of ${totalEvents}...`);
      
      const event = this.dbService.getEventById(eventId);
      if (!event) continue;
      
      const attendees = this.dbService.getAttendees(eventId);
      
      attendees.forEach(attendee => {
        allAttendees.push({
          'Event Title': event.title,
          'Event Date': event.date,
          'Event Time': event.time,
          'Event Location': event.location || '',
          'Attendee Name': attendee.name,
          'Email': attendee.email || '',
          'Phone': attendee.phone || '',
          'Checked In': attendee.checked_in ? 'Yes' : 'No',
          'Check-in Time': attendee.check_in_time || '',
        });
      });
    }
    
    onProgress?.(80, 'Generating CSV file...');
    
    // Convert to CSV
    const csv = Papa.unparse(allAttendees);
    await file.write(csv);
    
    onProgress?.(100, 'Batch export complete!');
    
    return file.uri;
  }

  /**
   * Batch export as JSON format
   */
  private async batchExportAsJson(eventIds: string[], timestamp: string, onProgress?: (progress: number, message: string) => void): Promise<string> {
    const batchFileName = `batch_export_${timestamp}.json`;
    const file = new File(Paths.document, batchFileName);
    
    onProgress?.(10, 'Starting batch export...');
    
    const batchData: any[] = [];
    const totalEvents = eventIds.length;
    
    for (let i = 0; i < eventIds.length; i++) {
      const eventId = eventIds[i];
      const progress = 10 + Math.floor((i / totalEvents) * 60);
      onProgress?.(progress, `Processing event ${i + 1} of ${totalEvents}...`);
      
      const event = this.dbService.getEventById(eventId);
      if (!event) continue;
      
      const attendees = this.dbService.getAttendees(eventId);
      
      batchData.push({
        event: {
          id: event.id,
          title: event.title,
          date: event.date,
          time: event.time,
          location: event.location,
          notes: event.notes,
          attendees_count: event.attendees_count,
          checked_in_count: event.checked_in_count,
        },
        attendees: attendees.map(a => ({
          id: a.id,
          name: a.name,
          email: a.email,
          phone: a.phone,
          checked_in: a.checked_in,
          check_in_time: a.check_in_time,
        })),
      });
    }
    
    onProgress?.(80, 'Generating JSON file...');
    
    const jsonData = JSON.stringify({
      exported_at: new Date().toISOString(),
      events_count: batchData.length,
      events: batchData,
    }, null, 2);
    
    await file.write(jsonData);
    
    onProgress?.(100, 'Batch export complete!');
    
    return file.uri;
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
      const file = new File(Paths.document, filename);
      await file.write(jsonData);
      
      return file.uri;
    } catch (error: any) {
      console.error('Error exporting to JSON:', error);
      throw new Error(`Failed to export to JSON: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Encrypt a file with a password using AES encryption
   */
  private async encryptFile(filePath: string, password: string): Promise<string> {
    try {
      // Read file content
      const file = new File(filePath);
      const fileContent = await file.text();
      
      // Use proper AES encryption
      const encrypted = CryptoJS.AES.encrypt(fileContent, password).toString();
      
      // Save encrypted content
      const encryptedFile = new File(`${filePath}.encrypted`);
      await encryptedFile.write(encrypted);
      
      return encryptedFile.uri;
    } catch (error: any) {
      console.error('Error encrypting file:', error);
      throw new Error(`Failed to encrypt file: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Decrypt a file with a password using AES decryption
   */
  private async decryptFile(filePath: string, password: string): Promise<string> {
    try {
      const file = new File(filePath);
      const encryptedContent = await file.text();
      
      const decrypted = CryptoJS.AES.decrypt(encryptedContent, password);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!plaintext) {
        throw new Error('Invalid password or corrupted file');
      }
      
      return plaintext;
    } catch (error: any) {
      console.error('Error decrypting file:', error);
      throw new Error(`Failed to decrypt file: ${error.message || 'Unknown error'}`);
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
