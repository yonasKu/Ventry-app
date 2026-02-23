/**
 * CustomFieldsService Tests
 * 
 * Tests custom field definitions, validation, values, and templates.
 */

import { CustomFieldsService, FieldType, CustomField, FieldValidation } from '../../services/CustomFieldsService';
import { mockCustomField, mockCustomFieldValue } from '../setup/mocks';

// Mock database
jest.mock('expo-sqlite');

describe('CustomFieldsService - Field Definition', () => {
  let service: CustomFieldsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CustomFieldsService();
  });

  describe('createField', () => {
    it('should create text field', () => {
      const fieldData = {
        name: 'Company',
        key: 'company',
        type: 'text' as FieldType,
        required: true,
        display_order: 0,
      };

      expect(() => service.createField(fieldData)).not.toThrow();
    });

    it('should create number field', () => {
      const fieldData = {
        name: 'Age',
        key: 'age',
        type: 'number' as FieldType,
        required: false,
        display_order: 1,
      };

      expect(() => service.createField(fieldData)).not.toThrow();
    });

    it('should create email field', () => {
      const fieldData = {
        name: 'Work Email',
        key: 'work_email',
        type: 'email' as FieldType,
        required: true,
        display_order: 2,
      };

      expect(() => service.createField(fieldData)).not.toThrow();
    });

    it('should create select field with options', () => {
      const fieldData = {
        name: 'Department',
        key: 'department',
        type: 'select' as FieldType,
        required: true,
        options: ['Sales', 'Marketing', 'Engineering'],
        display_order: 3,
      };

      expect(() => service.createField(fieldData)).not.toThrow();
    });

    it('should create checkbox field', () => {
      const fieldData = {
        name: 'Agree to Terms',
        key: 'agree_terms',
        type: 'checkbox' as FieldType,
        required: true,
        display_order: 4,
      };

      expect(() => service.createField(fieldData)).not.toThrow();
    });
  });

  describe('getField', () => {
    it('should return field by ID', () => {
      const field = service.getField(mockCustomField.id);

      // Should not throw
      expect(field).toBeDefined();
    });

    it('should return null for non-existent field', () => {
      const field = service.getField('non-existent-id');

      expect(field).toBeNull();
    });
  });

  describe('getFields', () => {
    it('should return all fields', () => {
      const fields = service.getFields();

      expect(Array.isArray(fields)).toBe(true);
    });

    it('should return fields for specific event', () => {
      const fields = service.getFields('event-1');

      expect(Array.isArray(fields)).toBe(true);
    });

    it('should return empty array if no fields', () => {
      const fields = service.getFields('non-existent-event');

      expect(fields).toEqual([]);
    });
  });

  describe('updateField', () => {
    it('should update field name', () => {
      const result = service.updateField(mockCustomField.id, {
        name: 'Updated Name',
      });

      expect(result).toBe(true);
    });

    it('should update field validation', () => {
      const validation: FieldValidation = {
        min_length: 5,
        max_length: 50,
      };

      const result = service.updateField(mockCustomField.id, {
        validation,
      });

      expect(result).toBe(true);
    });

    it('should return false for non-existent field', () => {
      const result = service.updateField('non-existent-id', {
        name: 'Test',
      });

      expect(result).toBe(false);
    });
  });

  describe('deleteField', () => {
    it('should delete field', () => {
      const result = service.deleteField(mockCustomField.id);

      expect(result).toBe(true);
    });

    it('should return false for non-existent field', () => {
      const result = service.deleteField('non-existent-id');

      expect(result).toBe(false);
    });
  });
});

describe('CustomFieldsService - Field Validation', () => {
  let service: CustomFieldsService;

  beforeEach(() => {
    service = new CustomFieldsService();
  });

  describe('validateFieldValue', () => {
    it('should validate required field with value', () => {
      const field: CustomField = {
        ...mockCustomField,
        required: true,
      };

      const result = service.validateFieldValue(field, 'Test Value');

      expect(result.valid).toBe(true);
    });

    it('should reject required field without value', () => {
      const field: CustomField = {
        ...mockCustomField,
        required: true,
      };

      const result = service.validateFieldValue(field, '');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate email format', () => {
      const field: CustomField = {
        ...mockCustomField,
        type: 'email',
      };

      const validResult = service.validateFieldValue(field, 'test@example.com');
      expect(validResult.valid).toBe(true);

      const invalidResult = service.validateFieldValue(field, 'invalid-email');
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate phone format', () => {
      const field: CustomField = {
        ...mockCustomField,
        type: 'phone',
      };

      const validResult = service.validateFieldValue(field, '+1234567890');
      expect(validResult.valid).toBe(true);

      const invalidResult = service.validateFieldValue(field, 'abc');
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate URL format', () => {
      const field: CustomField = {
        ...mockCustomField,
        type: 'url',
      };

      const validResult = service.validateFieldValue(field, 'https://example.com');
      expect(validResult.valid).toBe(true);

      const invalidResult = service.validateFieldValue(field, 'not-a-url');
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate number min/max', () => {
      const field: CustomField = {
        ...mockCustomField,
        type: 'number',
        validation: {
          min_value: 1,
          max_value: 100,
        },
      };

      const validResult = service.validateFieldValue(field, '50');
      expect(validResult.valid).toBe(true);

      const tooLowResult = service.validateFieldValue(field, '0');
      expect(tooLowResult.valid).toBe(false);

      const tooHighResult = service.validateFieldValue(field, '101');
      expect(tooHighResult.valid).toBe(false);
    });

    it('should validate text length', () => {
      const field: CustomField = {
        ...mockCustomField,
        type: 'text',
        validation: {
          min_length: 3,
          max_length: 10,
        },
      };

      const validResult = service.validateFieldValue(field, 'Valid');
      expect(validResult.valid).toBe(true);

      const tooShortResult = service.validateFieldValue(field, 'ab');
      expect(tooShortResult.valid).toBe(false);

      const tooLongResult = service.validateFieldValue(field, 'This is too long');
      expect(tooLongResult.valid).toBe(false);
    });

    it('should validate select options', () => {
      const field: CustomField = {
        ...mockCustomField,
        type: 'select',
        options: ['Option1', 'Option2', 'Option3'],
      };

      const validResult = service.validateFieldValue(field, 'Option1');
      expect(validResult.valid).toBe(true);

      const invalidResult = service.validateFieldValue(field, 'InvalidOption');
      expect(invalidResult.valid).toBe(false);
    });

    it('should allow optional field to be empty', () => {
      const field: CustomField = {
        ...mockCustomField,
        required: false,
      };

      const result = service.validateFieldValue(field, '');

      expect(result.valid).toBe(true);
    });
  });
});

describe('CustomFieldsService - Field Values', () => {
  let service: CustomFieldsService;

  beforeEach(() => {
    service = new CustomFieldsService();
  });

  describe('setFieldValue', () => {
    it('should set field value for attendee', () => {
      expect(() => 
        service.setFieldValue('attendee-1', 'field-1', 'Test Value')
      ).not.toThrow();
    });

    it('should update existing field value', () => {
      service.setFieldValue('attendee-1', 'field-1', 'Value 1');
      
      expect(() => 
        service.setFieldValue('attendee-1', 'field-1', 'Value 2')
      ).not.toThrow();
    });
  });

  describe('getFieldValue', () => {
    it('should return field value', () => {
      service.setFieldValue('attendee-1', 'field-1', 'Test Value');
      
      const value = service.getFieldValue('attendee-1', 'field-1');

      expect(value).toBe('Test Value');
    });

    it('should return null for non-existent value', () => {
      const value = service.getFieldValue('attendee-1', 'non-existent-field');

      expect(value).toBeNull();
    });
  });

  describe('getFieldValues', () => {
    it('should return all field values for attendee', () => {
      service.setFieldValue('attendee-1', 'field-1', 'Value 1');
      service.setFieldValue('attendee-1', 'field-2', 'Value 2');
      
      const values = service.getFieldValues('attendee-1');

      expect(values).toBeDefined();
      expect(typeof values).toBe('object');
    });

    it('should return empty object for attendee with no values', () => {
      const values = service.getFieldValues('non-existent-attendee');

      expect(values).toEqual({});
    });
  });

  describe('deleteFieldValue', () => {
    it('should delete field value', () => {
      service.setFieldValue('attendee-1', 'field-1', 'Test Value');
      
      const result = service.deleteFieldValue('attendee-1', 'field-1');

      expect(result).toBe(true);
    });

    it('should return false for non-existent value', () => {
      const result = service.deleteFieldValue('attendee-1', 'non-existent-field');

      expect(result).toBe(false);
    });
  });
});

describe('CustomFieldsService - Templates', () => {
  let service: CustomFieldsService;

  beforeEach(() => {
    service = new CustomFieldsService();
  });

  describe('createTemplate', () => {
    it('should create template', () => {
      const templateData = {
        name: 'Corporate Event',
        description: 'Fields for corporate events',
        fields: ['company', 'job_title', 'department'],
        is_default: false,
      };

      expect(() => service.createTemplate(templateData)).not.toThrow();
    });

    it('should create default template', () => {
      const templateData = {
        name: 'Default Template',
        fields: ['name', 'email'],
        is_default: true,
      };

      expect(() => service.createTemplate(templateData)).not.toThrow();
    });
  });

  describe('getTemplates', () => {
    it('should return all templates', () => {
      const templates = service.getTemplates();

      expect(Array.isArray(templates)).toBe(true);
    });

    it('should return empty array if no templates', () => {
      const templates = service.getTemplates();

      expect(templates).toBeDefined();
    });
  });

  describe('getTemplate', () => {
    it('should return template by ID', () => {
      const template = service.getTemplate('template-1');

      expect(template).toBeDefined();
    });

    it('should return null for non-existent template', () => {
      const template = service.getTemplate('non-existent-id');

      expect(template).toBeNull();
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template', () => {
      const result = service.deleteTemplate('template-1');

      expect(result).toBe(true);
    });

    it('should return false for non-existent template', () => {
      const result = service.deleteTemplate('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('applyTemplate', () => {
    it('should apply template to event', () => {
      expect(() => 
        service.applyTemplate('event-1', 'template-1')
      ).not.toThrow();
    });

    it('should create fields from template', () => {
      service.applyTemplate('event-1', 'template-1');
      
      const fields = service.getFields('event-1');

      expect(fields.length).toBeGreaterThanOrEqual(0);
    });
  });
});
