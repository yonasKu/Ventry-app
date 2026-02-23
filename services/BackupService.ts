import { Paths, File, Directory } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { dbService, Event, Attendee } from './DatabaseService';
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
  private db = dbService;
  private customFieldsService: CustomFieldsService;

  constructor() {
    this.customFieldsService = new CustomFieldsService();
  }

  // ==================== Backup ====================

  /**
   * Encrypt backup data with password
   */
  private async encryptBackup(content: string, password: string): Promise<string> {
    try {
      const encrypted = CryptoJS.AES.encrypt(content, password).toString();
      return encrypted;
    } catch (error) {
      console.error('Error encrypting backup:', error);
      throw new Error('Failed to encrypt backup');
    }
  }

  /**
   * Decrypt backup data with password
   */
  private async decryptBackup(content: string, password: string): Promise<string> {
    try {
      const decrypted = CryptoJS.AES.decrypt(content, password);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!plaintext) {
        throw new Error('Invalid password or corrupted backup');
      }
      
      return plaintext;
    } catch (error) {
      console.error('Error decrypting backup:', error);
      throw new Error('Failed to decrypt backup: Invalid password or corrupted file');
    }
  }

  /**
   * Create a full database backup
   */
  async createBackup(password?: string): Promise<string> {
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
      
      // Prepare content
      let fileContent = JSON.stringify(backupData, null, 2);
      
      // Encrypt if password provided
      if (password) {
        fileContent = await this.encryptBackup(fileContent, password);
      }
      
      // Write backup file
      await file.write(fileContent);
      
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
  async restoreFromFile(fileUri: string, password?: string): Promise<RestoreResult> {
    try {
      // Read backup file
      const file = new File(fileUri);
      let content = await file.text();
      
      // Try to decrypt if it looks encrypted
      if (content.startsWith('U2FsdGVkX1')) { // CryptoJS AES encrypted format
        if (!password) {
          throw new Error('This backup is encrypted. Please provide a password.');
        }
        content = await this.decryptBackup(content, password);
      }
      
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
      
      // Wrap entire restore in transaction for atomicity
      try {
        // Note: We can't use db.withTransactionSync here because we're calling multiple services
        // Each service operation should handle its own transactions
        
        // Restore templates first
        for (const template of backupData.data.field_templates || []) {
          try {
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
        
        // Restore events (check for duplicates by ID and unique fields)
        for (const event of backupData.data.events) {
          try {
            const existingById = this.db.getEventById(event.id);
            const existingByDetails = this.db.getEvents().find(e => 
              e.title === event.title && 
              e.date === event.date && 
              e.time === event.time
            );
            
            if (!existingById && !existingByDetails) {
              this.db.addEvent({
                title: event.title,
                date: event.date,
                time: event.time,
                location: event.location,
                notes: event.notes,
                expected_attendees: event.expected_attendees,
              });
              result.imported.events++;
            } else {
              result.errors.push(`Event "${event.title}" already exists, skipped`);
            }
          } catch (error) {
            result.errors.push(`Failed to restore event ${event.title}: ${error}`);
          }
        }
        
        // Restore attendees
        for (const attendee of backupData.data.attendees) {
          try {
            const event = this.db.getEventById(attendee.event_id);
            if (event) {
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
            } else {
              result.errors.push(`Event not found for attendee ${attendee.name}`);
            }
          } catch (error) {
            result.errors.push(`Failed to restore attendee ${attendee.name}: ${error}`);
          }
        }
        
        // Restore custom field values with proper error handling
        let fieldValuesRestored = 0;
        for (const fieldValue of backupData.data.custom_field_values || []) {
          try {
            // Check if attendee exists
            const attendeeExists = this.db.getAttendees(fieldValue.attendee_id).length > 0;
            if (!attendeeExists) {
              result.errors.push(`Attendee ${fieldValue.attendee_id} not found for field value`);
              continue;
            }
            
            // Check if field exists
            const fieldExists = this.customFieldsService.getField(fieldValue.field_id);
            if (!fieldExists) {
              result.errors.push(`Field ${fieldValue.field_id} not found for field value`);
              continue;
            }
            
            this.customFieldsService.setFieldValue(
              fieldValue.attendee_id,
              fieldValue.field_id,
              fieldValue.value
            );
            fieldValuesRestored++;
          } catch (error) {
            result.errors.push(`Failed to restore field value: ${error}`);
          }
        }
        
        console.log(`Restored ${fieldValuesRestored} custom field values`);
        
      } catch (error) {
        console.error('Error during restore:', error);
        throw error;
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
  async verifyBackup(fileUri: string, password?: string): Promise<boolean> {
    try {
      const file = new File(fileUri);
      let content = await file.text();
      
      // Try to decrypt if encrypted
      if (content.startsWith('U2FsdGVkX1')) {
        if (!password) {
          throw new Error('This backup is encrypted. Please provide a password.');
        }
        content = await this.decryptBackup(content, password);
      }
      
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
