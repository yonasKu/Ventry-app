import { nanoid } from 'nanoid/non-secure';
import { openDatabaseSync } from 'expo-sqlite';

// Types
export type FieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'url';

export interface FieldValidation {
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  custom_error?: string;
}

export interface CustomField {
  id: string;
  name: string;
  key: string;
  type: FieldType;
  required: boolean;
  default_value?: string;
  options?: string[];
  validation?: FieldValidation;
  display_order: number;
  event_id?: string;
  template_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  id: string;
  attendee_id: string;
  field_id: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface FieldTemplate {
  id: string;
  name: string;
  description?: string;
  fields: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface FieldWithValue extends CustomField {
  value?: string;
}

// Open database
const db = openDatabaseSync('ventry.db');

// Initialize custom fields tables
export function initCustomFieldsTables(): void {
  try {
    // Custom fields table
    db.runSync(`
      CREATE TABLE IF NOT EXISTS custom_fields (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        key TEXT NOT NULL,
        type TEXT NOT NULL,
        required INTEGER DEFAULT 0,
        default_value TEXT,
        options TEXT,
        validation TEXT,
        display_order INTEGER DEFAULT 0,
        event_id TEXT,
        template_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      );
    `);
    
    // Custom field values table
    db.runSync(`
      CREATE TABLE IF NOT EXISTS custom_field_values (
        id TEXT PRIMARY KEY NOT NULL,
        attendee_id TEXT NOT NULL,
        field_id TEXT NOT NULL,
        value TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (attendee_id) REFERENCES attendees(id) ON DELETE CASCADE,
        FOREIGN KEY (field_id) REFERENCES custom_fields(id) ON DELETE CASCADE,
        UNIQUE(attendee_id, field_id)
      );
    `);
    
    // Field templates table
    db.runSync(`
      CREATE TABLE IF NOT EXISTS field_templates (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        fields TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    
    // Create indexes
    db.runSync('CREATE INDEX IF NOT EXISTS idx_custom_fields_event ON custom_fields(event_id);');
    db.runSync('CREATE INDEX IF NOT EXISTS idx_custom_fields_template ON custom_fields(template_id);');
    db.runSync('CREATE INDEX IF NOT EXISTS idx_custom_fields_key ON custom_fields(key);');
    db.runSync('CREATE INDEX IF NOT EXISTS idx_custom_field_values_attendee ON custom_field_values(attendee_id);');
    db.runSync('CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON custom_field_values(field_id);');
    
    console.log('Custom fields tables initialized successfully');
  } catch (error) {
    console.error('Error initializing custom fields tables:', error);
    throw error;
  }
}

export class CustomFieldsService {
  constructor() {
    // Ensure tables are initialized
    initCustomFieldsTables();
  }

  // ==================== Field Management ====================

  /**
   * Create a new custom field
   */
  createField(field: Omit<CustomField, 'id' | 'created_at' | 'updated_at'>): CustomField {
    const now = new Date().toISOString();
    const newField: CustomField = {
      ...field,
      id: nanoid(),
      created_at: now,
      updated_at: now,
    };
    
    try {
      db.runSync(
        `INSERT INTO custom_fields (
          id, name, key, type, required, default_value, options, validation,
          display_order, event_id, template_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newField.id,
          newField.name,
          newField.key,
          newField.type,
          newField.required ? 1 : 0,
          newField.default_value || null,
          newField.options ? JSON.stringify(newField.options) : null,
          newField.validation ? JSON.stringify(newField.validation) : null,
          newField.display_order,
          newField.event_id || null,
          newField.template_id || null,
          newField.created_at,
          newField.updated_at,
        ]
      );
      
      return newField;
    } catch (error) {
      console.error('Error creating custom field:', error);
      throw error;
    }
  }

  /**
   * Get a custom field by ID
   */
  getField(fieldId: string): CustomField | null {
    try {
      const result = db.getFirstSync<any>(
        'SELECT * FROM custom_fields WHERE id = ?;',
        [fieldId]
      );
      
      if (!result) return null;
      
      return this.parseFieldFromDb(result);
    } catch (error) {
      console.error('Error getting custom field:', error);
      throw error;
    }
  }

  /**
   * Get all custom fields for an event (or global fields if no eventId)
   */
  getFields(eventId?: string): CustomField[] {
    try {
      let results;
      
      if (eventId) {
        // Get event-specific and global fields
        results = db.getAllSync<any>(
          'SELECT * FROM custom_fields WHERE event_id = ? OR event_id IS NULL ORDER BY display_order;',
          [eventId]
        );
      } else {
        // Get only global fields
        results = db.getAllSync<any>(
          'SELECT * FROM custom_fields WHERE event_id IS NULL ORDER BY display_order;'
        );
      }
      
      return results.map(r => this.parseFieldFromDb(r));
    } catch (error) {
      console.error('Error getting custom fields:', error);
      throw error;
    }
  }

  /**
   * Update a custom field
   */
  updateField(fieldId: string, updates: Partial<CustomField>): boolean {
    const now = new Date().toISOString();
    
    try {
      const fields = Object.keys(updates).filter(key => 
        key !== 'id' && key !== 'created_at' && key !== 'updated_at'
      );
      
      if (fields.length === 0) return true;
      
      let setClause = '';
      const values: any[] = [];
      
      fields.forEach(key => {
        const value = updates[key as keyof CustomField];
        
        if (key === 'options' || key === 'validation') {
          values.push(value ? JSON.stringify(value) : null);
        } else if (key === 'required') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value === undefined ? null : value);
        }
        
        setClause += `${key} = ?, `;
      });
      
      setClause = setClause.slice(0, -2);
      values.push(now, fieldId);
      
      const result = db.runSync(
        `UPDATE custom_fields SET ${setClause}, updated_at = ? WHERE id = ?;`,
        values
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating custom field:', error);
      throw error;
    }
  }

  /**
   * Delete a custom field
   */
  deleteField(fieldId: string): boolean {
    try {
      const result = db.runSync(
        'DELETE FROM custom_fields WHERE id = ?;',
        [fieldId]
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting custom field:', error);
      throw error;
    }
  }

  /**
   * Reorder custom fields
   */
  reorderFields(fieldIds: string[]): void {
    try {
      db.withTransactionSync(() => {
        fieldIds.forEach((fieldId, index) => {
          db.runSync(
            'UPDATE custom_fields SET display_order = ? WHERE id = ?;',
            [index, fieldId]
          );
        });
      });
    } catch (error) {
      console.error('Error reordering fields:', error);
      throw error;
    }
  }

  // ==================== Field Values ====================

  /**
   * Set a field value for an attendee
   */
  setFieldValue(attendeeId: string, fieldId: string, value: string): void {
    const now = new Date().toISOString();
    
    try {
      // Check if value already exists
      const existing = db.getFirstSync<any>(
        'SELECT id FROM custom_field_values WHERE attendee_id = ? AND field_id = ?;',
        [attendeeId, fieldId]
      );
      
      if (existing) {
        // Update existing value
        db.runSync(
          'UPDATE custom_field_values SET value = ?, updated_at = ? WHERE attendee_id = ? AND field_id = ?;',
          [value, now, attendeeId, fieldId]
        );
      } else {
        // Insert new value
        db.runSync(
          'INSERT INTO custom_field_values (id, attendee_id, field_id, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
          [nanoid(), attendeeId, fieldId, value, now, now]
        );
      }
    } catch (error) {
      console.error('Error setting field value:', error);
      throw error;
    }
  }

  /**
   * Get a field value for an attendee
   */
  getFieldValue(attendeeId: string, fieldId: string): string | null {
    try {
      const result = db.getFirstSync<{ value: string }>(
        'SELECT value FROM custom_field_values WHERE attendee_id = ? AND field_id = ?;',
        [attendeeId, fieldId]
      );
      
      return result ? result.value : null;
    } catch (error) {
      console.error('Error getting field value:', error);
      throw error;
    }
  }

  /**
   * Get all field values for an attendee
   */
  getFieldValues(attendeeId: string): Record<string, string> {
    try {
      const results = db.getAllSync<{ field_id: string; value: string }>(
        'SELECT field_id, value FROM custom_field_values WHERE attendee_id = ?;',
        [attendeeId]
      );
      
      const values: Record<string, string> = {};
      results.forEach(r => {
        values[r.field_id] = r.value;
      });
      
      return values;
    } catch (error) {
      console.error('Error getting field values:', error);
      throw error;
    }
  }

  /**
   * Delete a field value
   */
  deleteFieldValue(attendeeId: string, fieldId: string): boolean {
    try {
      const result = db.runSync(
        'DELETE FROM custom_field_values WHERE attendee_id = ? AND field_id = ?;',
        [attendeeId, fieldId]
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting field value:', error);
      throw error;
    }
  }

  // ==================== Validation ====================

  /**
   * Validate a field value
   */
  validateFieldValue(field: CustomField, value: string): ValidationResult {
    // Check required
    if (field.required && (!value || value.trim() === '')) {
      return { valid: false, error: `${field.name} is required` };
    }
    
    // If empty and not required, it's valid
    if (!value || value.trim() === '') {
      return { valid: true };
    }
    
    // Type-specific validation
    switch (field.type) {
      case 'text':
      case 'textarea':
        return this.validateText(value, field.validation);
      
      case 'number':
        return this.validateNumber(value, field.validation);
      
      case 'email':
        return this.validateEmail(value);
      
      case 'phone':
        return this.validatePhone(value);
      
      case 'date':
      case 'datetime':
        return this.validateDate(value);
      
      case 'time':
        return this.validateTime(value);
      
      case 'url':
        return this.validateUrl(value);
      
      case 'select':
        return this.validateSelect(value, field.options);
      
      case 'multiselect':
        return this.validateMultiselect(value, field.options);
      
      case 'checkbox':
        return this.validateCheckbox(value);
      
      default:
        return { valid: true };
    }
  }

  /**
   * Validate all fields for an attendee
   */
  validateAllFields(attendeeId: string, values: Record<string, string>): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Get all fields for this attendee's event
    // (This would need the event_id, which we'd need to pass in)
    // For now, we'll validate the provided values
    
    Object.entries(values).forEach(([fieldId, value]) => {
      const field = this.getField(fieldId);
      if (field) {
        const result = this.validateFieldValue(field, value);
        if (!result.valid) {
          results.push(result);
        }
      }
    });
    
    return results;
  }

  // ==================== Templates ====================

  /**
   * Create a field template
   */
  createTemplate(template: Omit<FieldTemplate, 'id' | 'created_at' | 'updated_at'>): FieldTemplate {
    const now = new Date().toISOString();
    const newTemplate: FieldTemplate = {
      ...template,
      id: nanoid(),
      created_at: now,
      updated_at: now,
    };
    
    try {
      db.runSync(
        'INSERT INTO field_templates (id, name, description, fields, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [
          newTemplate.id,
          newTemplate.name,
          newTemplate.description || null,
          JSON.stringify(newTemplate.fields),
          newTemplate.is_default ? 1 : 0,
          newTemplate.created_at,
          newTemplate.updated_at,
        ]
      );
      
      return newTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Get a template by ID
   */
  getTemplate(templateId: string): FieldTemplate | null {
    try {
      const result = db.getFirstSync<any>(
        'SELECT * FROM field_templates WHERE id = ?;',
        [templateId]
      );
      
      if (!result) return null;
      
      return {
        ...result,
        fields: JSON.parse(result.fields),
        is_default: result.is_default === 1,
      };
    } catch (error) {
      console.error('Error getting template:', error);
      throw error;
    }
  }

  /**
   * Get all templates
   */
  getTemplates(): FieldTemplate[] {
    try {
      const results = db.getAllSync<any>(
        'SELECT * FROM field_templates ORDER BY name;'
      );
      
      return results.map(r => ({
        ...r,
        fields: JSON.parse(r.fields),
        is_default: r.is_default === 1,
      }));
    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Apply a template to an event
   */
  applyTemplate(templateId: string, eventId: string): CustomField[] {
    try {
      const template = this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      const createdFields: CustomField[] = [];
      
      // Get the field definitions from the template
      template.fields.forEach((fieldId, index) => {
        const field = this.getField(fieldId);
        if (field) {
          // Create a copy of the field for this event
          const newField = this.createField({
            ...field,
            event_id: eventId,
            template_id: templateId,
            display_order: index,
          });
          createdFields.push(newField);
        }
      });
      
      return createdFields;
    } catch (error) {
      console.error('Error applying template:', error);
      throw error;
    }
  }

  /**
   * Delete a template
   */
  deleteTemplate(templateId: string): boolean {
    try {
      const result = db.runSync(
        'DELETE FROM field_templates WHERE id = ?;',
        [templateId]
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  // ==================== Private Helpers ====================

  private parseFieldFromDb(row: any): CustomField {
    return {
      ...row,
      required: row.required === 1,
      options: row.options ? JSON.parse(row.options) : undefined,
      validation: row.validation ? JSON.parse(row.validation) : undefined,
    };
  }

  private validateText(value: string, validation?: FieldValidation): ValidationResult {
    if (validation?.min_length && value.length < validation.min_length) {
      return { valid: false, error: `Minimum length is ${validation.min_length}` };
    }
    if (validation?.max_length && value.length > validation.max_length) {
      return { valid: false, error: `Maximum length is ${validation.max_length}` };
    }
    if (validation?.pattern && !new RegExp(validation.pattern).test(value)) {
      return { valid: false, error: validation.custom_error || 'Invalid format' };
    }
    return { valid: true };
  }

  private validateNumber(value: string, validation?: FieldValidation): ValidationResult {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { valid: false, error: 'Must be a valid number' };
    }
    if (validation?.min_value !== undefined && num < validation.min_value) {
      return { valid: false, error: `Minimum value is ${validation.min_value}` };
    }
    if (validation?.max_value !== undefined && num > validation.max_value) {
      return { valid: false, error: `Maximum value is ${validation.max_value}` };
    }
    return { valid: true };
  }

  private validateEmail(value: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, error: 'Invalid email address' };
    }
    return { valid: true };
  }

  private validatePhone(value: string): ValidationResult {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return { valid: false, error: 'Phone number must have at least 10 digits' };
    }
    return { valid: true };
  }

  private validateDate(value: string): ValidationResult {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date' };
    }
    return { valid: true };
  }

  private validateTime(value: string): ValidationResult {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(value)) {
      return { valid: false, error: 'Invalid time format (HH:MM)' };
    }
    return { valid: true };
  }

  private validateUrl(value: string): ValidationResult {
    try {
      new URL(value);
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL' };
    }
  }

  private validateSelect(value: string, options?: string[]): ValidationResult {
    if (options && !options.includes(value)) {
      return { valid: false, error: 'Invalid selection' };
    }
    return { valid: true };
  }

  private validateMultiselect(value: string, options?: string[]): ValidationResult {
    try {
      const values = JSON.parse(value);
      if (!Array.isArray(values)) {
        return { valid: false, error: 'Invalid format' };
      }
      if (options) {
        const invalidValues = values.filter(v => !options.includes(v));
        if (invalidValues.length > 0) {
          return { valid: false, error: `Invalid selections: ${invalidValues.join(', ')}` };
        }
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid format' };
    }
  }

  private validateCheckbox(value: string): ValidationResult {
    if (value !== 'true' && value !== 'false') {
      return { valid: false, error: 'Invalid value' };
    }
    return { valid: true };
  }
}
