import { Paths, File, Directory } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService, Event, Attendee } from './DatabaseService';
import { CustomFieldsService, CustomField, CustomFieldValue, FieldTemplate } from './CustomFieldsService';
import { format } from 'date-fns';

// Types
export interface BackupData {
  version: string;
  created_at: string;
  device_name: string;
  data: {
    events: Event[];
    attendees: Attendee[];
    custom_fields: CustomField[];
    custom_field_values: CustomFieldValue[];
    field_templates: FieldTemplate[];
  };
  metadata: {
    events_count: number;
    attendees_count: number;
    custom_fields_count: number;
    templates_count: number;
  };
}

export interface BackupRecord {
  id: string;
  filename: string;
  created_at: string;
  size: number;
  events_count: number;
  attendees_count: number;
}

export interface RestoreResult {
  success: boolean;
  imported: {
    events: number;
    attendees: number;
    custom_fields: number;
    templates: number;
  };
  errors: string[];
}

// Storage keys
const BACKUP_HISTORY_KEY = '@ventry:backup_history';
const DEVICE_NAME_KEY = '@ventry:device_name';

export class BackupService {
  private db: DatabaseService;
  private customFieldsService: CustomFieldsService;

  constructor() {
    this.db = new DatabaseService();
    this.customFieldsService = new CustomFieldsService();
  }

  // ==================== Backup ====================

  /**
   * Create a full database backup
   */
  async createBackup(): Promise<string> {
    try {
      // Gather all data
      const events = this.db.getEvents();
      const attendees: Attendee[] = [];
      
      // Get all attendees for all events
      for (const event of events) {
        const eventAttendees = this.db.getAttendees(event.id);
        attendees.push(...eventAttendees);
      }
      
      // Get custom fields data
      const customFields = this.customFieldsService.getFields();
      const customFieldValues: CustomFieldValue[] = [];
      
      // Get all custom field values
      for (const attendee of attendees) {
        const values = this.customFieldsService.getFieldValues(attendee.id);
        Object.entries(values).forEach(([fieldId, value]) => {
          customFieldValues.push({
            id: `${attendee.id}_${fieldId}`,
            attendee_id: attendee.id,
            field_id: fieldId,
            value,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      }
      
      // Get templates
      const templates = this.customFieldsService.getTemplates();
      
      // Get device name
      const deviceName = await this.getDeviceName();
      
      // Create backup data
      const backupData: BackupData = {
        version: '1.0',
        created_at: new Date().toISOString(),
        device_name: deviceName,
        data: {
          events,
          attendees,
          custom_fields: customFields,
          custom_field_values: customFieldValues,
          field_templates: templates,
        },
        metadata: {
          events_count: events.length,
          attendees_count: attendees.length,
          custom_fields_count: customFields.length,
          templates_count: templates.length,
        },
      };
      
      // Generate filename
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      const filename = `ventry_backup_${timestamp}.json`;
      const file = new File(Paths.document, filename);
      
      // Write backup file
      await file.write(JSON.stringify(backupData, null, 2));
      
      // Get file info
      const fileSize = file.size;
      
      // Record backup in history
      await this.recordBackup({
        id: timestamp,
        filename,
        created_at: new Date().toISOString(),
        size: fileSize,
        events_count: events.length,
        attendees_count: attendees.length,
      });
      
      return file.uri;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Export backup and share
   */
  async exportBackup(): Promise<void> {
    try {
      const fileUri = await this.createBackup();
      
      // Share the backup file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Backup',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw error;
    }
  }

  // ==================== Restore ====================

  /**
   * Select and restore from backup file
   */
  async selectAndRestore(): Promise<RestoreResult> {
    try {
      // Pick a backup file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        throw new Error('Backup selection cancelled');
      }
      
      const fileUri = result.assets[0].uri;
      
      // Restore from file
      return await this.restoreFromFile(fileUri);
    } catch (error) {
      console.error('Error selecting backup:', error);
      throw error;
    }
  }

  /**
   * Restore from backup file
   */
  async restoreFromFile(fileUri: string): Promise<RestoreResult> {
    try {
      // Read backup file
      const file = new File(fileUri);
      const content = await file.text();
      
      const backupData: BackupData = JSON.parse(content);
      
      // Validate backup format
      if (!backupData.version || !backupData.data) {
        throw new Error('Invalid backup file format');
      }
      
      const result: RestoreResult = {
        success: true,
        imported: {
          events: 0,
          attendees: 0,
          custom_fields: 0,
          templates: 0,
        },
        errors: [],
      };
      
      // Restore templates first
      for (const template of backupData.data.field_templates || []) {
        try {
          // Check if template already exists
          const existing = this.customFieldsService.getTemplates().find(t => t.name === template.name);
          if (!existing) {
            this.customFieldsService.createTemplate({
              name: template.name,
              description: template.description,
              fields: template.fields,
              is_default: template.is_default,
            });
            result.imported.templates++;
          }
        } catch (error) {
          result.errors.push(`Failed to restore template ${template.name}: ${error}`);
        }
      }
      
      // Restore custom fields
      for (const field of backupData.data.custom_fields || []) {
        try {
          // Check if field already exists
          const existing = this.customFieldsService.getField(field.id);
          if (!existing) {
            this.customFieldsService.createField({
              name: field.name,
              key: field.key,
              type: field.type,
              required: field.required,
              default_value: field.default_value,
              options: field.options,
              validation: field.validation,
              display_order: field.display_order,
              event_id: field.event_id,
              template_id: field.template_id,
            });
            result.imported.custom_fields++;
          }
        } catch (error) {
          result.errors.push(`Failed to restore custom field ${field.name}: ${error}`);
        }
      }
      
      // Restore events
      for (const event of backupData.data.events) {
        try {
          // Check if event already exists
          const existing = this.db.getEventById(event.id);
          if (!existing) {
            this.db.addEvent({
              title: event.title,
              date: event.date,
              time: event.time,
              location: event.location,
              notes: event.notes,
              expected_attendees: event.expected_attendees,
            });
            result.imported.events++;
          }
        } catch (error) {
          result.errors.push(`Failed to restore event ${event.title}: ${error}`);
        }
      }
      
      // Restore attendees
      for (const attendee of backupData.data.attendees) {
        try {
          // Check if event exists
          const event = this.db.getEventById(attendee.event_id);
          if (event) {
            // Check if attendee already exists
            const existingAttendees = this.db.getAttendees(attendee.event_id);
            const exists = existingAttendees.find(a => a.id === attendee.id);
            
            if (!exists) {
              this.db.addAttendee(attendee.event_id, {
                name: attendee.name,
                email: attendee.email || undefined,
                phone: attendee.phone || undefined,
              });
              result.imported.attendees++;
            }
          }
        } catch (error) {
          result.errors.push(`Failed to restore attendee ${attendee.name}: ${error}`);
        }
      }
      
      // Restore custom field values
      for (const fieldValue of backupData.data.custom_field_values || []) {
        try {
          this.customFieldsService.setFieldValue(
            fieldValue.attendee_id,
            fieldValue.field_id,
            fieldValue.value
          );
        } catch (error) {
          // Silently fail for field values (attendee or field might not exist)
        }
      }
      
      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw error;
    }
  }

  /**
   * Verify backup file integrity
   */
  async verifyBackup(fileUri: string): Promise<boolean> {
    try {
      const file = new File(fileUri);
      const content = await file.text();
      
      const backupData: BackupData = JSON.parse(content);
      
      // Check required fields
      if (!backupData.version || !backupData.data) {
        return false;
      }
      
      // Verify metadata matches data
      const eventsCount = backupData.data.events?.length || 0;
      const attendeesCount = backupData.data.attendees?.length || 0;
      
      if (backupData.metadata.events_count !== eventsCount ||
          backupData.metadata.attendees_count !== attendeesCount) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying backup:', error);
      return false;
    }
  }

  // ==================== Backup History ====================

  /**
   * Get backup history
   */
  async getBackupHistory(): Promise<BackupRecord[]> {
    try {
      const stored = await AsyncStorage.getItem(BACKUP_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting backup history:', error);
      return [];
    }
  }

  /**
   * Record a backup
   */
  async recordBackup(record: BackupRecord): Promise<void> {
    try {
      const history = await this.getBackupHistory();
      
      // Add to history (keep last 20 backups)
      history.unshift(record);
      const trimmed = history.slice(0, 20);
      
      await AsyncStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error recording backup:', error);
    }
  }

  /**
   * Clear backup history
   */
  async clearBackupHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BACKUP_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing backup history:', error);
    }
  }

  // ==================== Device Management ====================

  /**
   * Get device name
   */
  async getDeviceName(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem(DEVICE_NAME_KEY);
      return stored || 'My Device';
    } catch (error) {
      return 'My Device';
    }
  }

  /**
   * Set device name
   */
  async setDeviceName(name: string): Promise<void> {
    try {
      await AsyncStorage.setItem(DEVICE_NAME_KEY, name);
    } catch (error) {
      console.error('Error setting device name:', error);
    }
  }

  // ==================== Utilities ====================

  /**
   * Get backup file size in human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Delete old backup files
   */
  async cleanupOldBackups(daysToKeep: number = 30): Promise<number> {
    try {
      const directory = Paths.document;
      const files = directory.list();
      const backupFiles = files.filter(f => f.name.startsWith('ventry_backup_'));
      
      let deletedCount = 0;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      for (const file of backupFiles) {
        if (file instanceof File) {
          const modTime = file.modificationTime;
          if (modTime) {
            const fileDate = new Date(modTime);
            
            if (fileDate < cutoffDate) {
              await file.delete();
              deletedCount++;
            }
          }
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
      return 0;
    }
  }
}
