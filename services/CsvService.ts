import Papa from 'papaparse';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Event, Attendee } from './DatabaseService';

// Define CSV column templates for different event types
export const CSV_TEMPLATES = {
  STANDARD: ['name', 'email', 'phone'],
  CONFERENCE: ['name', 'email', 'phone', 'company', 'job_title'],
  WORKSHOP: ['name', 'email', 'phone', 'skill_level'],
  NETWORKING: ['name', 'email', 'phone', 'interests'],
};

// Define validation rules for CSV columns
export const VALIDATION_RULES = {
  name: {
    required: true,
    validate: (value: string) => !!value.trim(),
    errorMessage: 'Name is required',
  },
  email: {
    required: false,
    validate: (value: string) => {
      if (!value) return true; // Optional field
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    errorMessage: 'Invalid email format',
  },
  phone: {
    required: false,
    validate: (value: string) => {
      if (!value) return true; // Optional field
      // Simple phone validation - can be enhanced
      return value.trim().length >= 6;
    },
    errorMessage: 'Phone number should be at least 6 digits',
  },
  company: {
    required: false,
    validate: (value: string) => true,
    errorMessage: '',
  },
  job_title: {
    required: false,
    validate: (value: string) => true,
    errorMessage: '',
  },
  skill_level: {
    required: false,
    validate: (value: string) => {
      if (!value) return true;
      const validLevels = ['beginner', 'intermediate', 'advanced'];
      return validLevels.includes(value.toLowerCase());
    },
    errorMessage: 'Skill level must be beginner, intermediate, or advanced',
  },
  interests: {
    required: false,
    validate: (value: string) => true,
    errorMessage: '',
  },
};

export interface ImportAttendee {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  skill_level?: string;
  interests?: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface CsvParseResult {
  attendees: ImportAttendee[];
  errors: {
    message: string;
    row?: number;
    type?: string;
  }[];
  missingRequiredColumns: string[];
}

export class CsvService {
  /**
   * Parse CSV text into attendee objects with validation
   */
  parseAttendeesFromCsv(csvText: string, templateType: keyof typeof CSV_TEMPLATES = 'STANDARD'): CsvParseResult {
    if (!csvText.trim()) {
      return { attendees: [], errors: [], missingRequiredColumns: [] };
    }

    const requiredColumns = CSV_TEMPLATES[templateType].filter(
      col => VALIDATION_RULES[col as keyof typeof VALIDATION_RULES]?.required
    );
    
    const result: CsvParseResult = {
      attendees: [],
      errors: [],
      missingRequiredColumns: [],
    };

    try {
      // Parse CSV with Papa Parse
      const parseResult = Papa.parse(csvText.trim(), { 
        header: true, 
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim()
      });

      // Check for parsing errors
      if (parseResult.errors && parseResult.errors.length > 0) {
        result.errors = parseResult.errors.map(err => ({
          message: err.message,
          row: err.row,
          type: 'parse_error'
        }));
      }

      // Check for required columns
      if (parseResult.meta && parseResult.meta.fields) {
        const headers = parseResult.meta.fields.map(h => h.toLowerCase().trim());
        
        for (const requiredCol of requiredColumns) {
          if (!headers.includes(requiredCol.toLowerCase())) {
            result.missingRequiredColumns.push(requiredCol);
          }
        }
      }

      // Process and validate each row
      if (parseResult.data && Array.isArray(parseResult.data)) {
        result.attendees = parseResult.data.map((row: any, index: number) => {
          const attendee: ImportAttendee = {
            name: (row.name || '').trim(),
            email: (row.email || '').trim(),
            phone: (row.phone || '').trim(),
            isValid: true,
            errorMessage: undefined
          };

          // Add additional fields based on template
          if (templateType === 'CONFERENCE') {
            attendee.company = (row.company || '').trim();
            attendee.job_title = (row.job_title || '').trim();
          } else if (templateType === 'WORKSHOP') {
            attendee.skill_level = (row.skill_level || '').trim();
          } else if (templateType === 'NETWORKING') {
            attendee.interests = (row.interests || '').trim();
          }

          // Validate each field
          for (const field of Object.keys(attendee)) {
            if (field === 'isValid' || field === 'errorMessage' || field === 'id') continue;
            
            const rule = VALIDATION_RULES[field as keyof typeof VALIDATION_RULES];
            if (rule) {
              const value = attendee[field as keyof ImportAttendee] as string || '';
              if (!rule.validate(value)) {
                attendee.isValid = false;
                attendee.errorMessage = rule.errorMessage;
                
                result.errors.push({
                  message: `Row ${index + 2}: ${rule.errorMessage} for field "${field}"`,
                  row: index + 2,
                  type: 'validation_error'
                });
                
                break; // Stop at first validation error for this attendee
              }
            }
          }

          return attendee;
        });
      }

      return result;
    } catch (error: any) {
      console.error('CSV parsing exception:', error);
      return {
        attendees: [],
        errors: [{ message: `Failed to parse CSV: ${error.message || 'Unknown error'}` }],
        missingRequiredColumns: []
      };
    }
  }

  /**
   * Generate CSV template for a specific event type
   */
  generateCsvTemplate(templateType: keyof typeof CSV_TEMPLATES = 'STANDARD'): string {
    const columns = CSV_TEMPLATES[templateType];
    const headerRow = columns.join(',');
    const exampleRow = columns.map(col => {
      switch (col) {
        case 'name': return 'John Doe';
        case 'email': return 'john@example.com';
        case 'phone': return '123-456-7890';
        case 'company': return 'Acme Inc.';
        case 'job_title': return 'Software Developer';
        case 'skill_level': return 'intermediate';
        case 'interests': return 'networking, technology';
        default: return '';
      }
    }).join(',');

    return `${headerRow}\n${exampleRow}`;
  }

  /**
   * Export attendees to CSV file
   */
  async exportAttendeesToCsv(
    attendees: Attendee[],
    event: Event,
    includeCheckInStatus: boolean = true
  ): Promise<string> {
    try {
      // Prepare data for CSV
      const csvData = attendees.map(attendee => {
        const row: Record<string, any> = {
          name: attendee.name,
          email: attendee.email || '',
          phone: attendee.phone || '',
        };

        if (includeCheckInStatus) {
          row.checked_in = attendee.checked_in ? 'Yes' : 'No';
          row.check_in_time = attendee.check_in_time || '';
        }

        return row;
      });

      // Convert to CSV
      const csv = Papa.unparse(csvData);
      
      // Create filename
      const sanitizedEventName = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${sanitizedEventName}_attendees_${timestamp}.csv`;
      
      // Save to file
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(filePath, csv, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      return filePath;
    } catch (error: any) {
      console.error('Error exporting attendees to CSV:', error);
      throw new Error(`Failed to export attendees: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Export event details to CSV
   */
  async exportEventToCsv(event: Event): Promise<string> {
    try {
      // Prepare event data
      const eventData = [{
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location || '',
        notes: event.notes || '',
        expected_attendees: event.expected_attendees || '',
        attendees_count: event.attendees_count || 0,
        checked_in_count: event.checked_in_count || 0,
        created_at: event.created_at,
        updated_at: event.updated_at
      }];

      // Convert to CSV
      const csv = Papa.unparse(eventData);
      
      // Create filename
      const sanitizedEventName = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${sanitizedEventName}_details_${timestamp}.csv`;
      
      // Save to file
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(filePath, csv, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      return filePath;
    } catch (error: any) {
      console.error('Error exporting event to CSV:', error);
      throw new Error(`Failed to export event: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Share CSV file
   */
  async shareCsvFile(filePath: string, title: string = 'Share CSV'): Promise<void> {
    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'text/csv',
            dialogTitle: title,
            UTI: 'public.comma-separated-values-text'
          });
        } else {
          throw new Error('Sharing is not available on this device');
        }
      } else {
        // Web platform
        const fileContent = await FileSystem.readAsStringAsync(filePath);
        const blob = new Blob([fileContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        // Create a link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('/').pop() || 'export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      console.error('Error sharing CSV file:', error);
      throw new Error(`Failed to share CSV file: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Import CSV file from device
   */
  async importCsvFile(): Promise<string> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        throw new Error('Document picking was cancelled');
      }
      
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      return content;
    } catch (error: any) {
      console.error('Error importing CSV file:', error);
      throw new Error(`Failed to import CSV file: ${error.message || 'Unknown error'}`);
    }
  }
}

export default new CsvService();
