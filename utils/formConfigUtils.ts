import { 
  CategoryFormConfig, 
  EventCategory, 
  FormData, 
  FormErrors, 
  FormValidationResult,
  ValidationRule,
  ConditionalRule,
  EventFormData
} from '../types/FormTypes';
import { getFormConfig } from '../config/CategoryFormConfigs';

/**
 * Get form configuration for a specific category
 */
export const getFormConfigForCategory = (category: string): CategoryFormConfig => {
  const eventCategory = category as EventCategory;
  return getFormConfig(eventCategory);
};

/**
 * Validate a single field value against its validation rules
 */
export const validateField = (
  value: any, 
  rules: ValidationRule[] = []
): string | null => {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return rule.message;
        }
        break;
        
      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          return rule.message;
        }
        break;
        
      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          return rule.message;
        }
        break;
        
      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          return rule.message;
        }
        break;
        
      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          return rule.message;
        }
        break;
        
      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
          return rule.message;
        }
        break;
        
      case 'custom':
        // Custom validation would be implemented here
        // For now, we'll skip custom validation
        break;
    }
  }
  
  return null; // No validation errors
};

/**
 * Check if a conditional rule is met
 */
export const evaluateConditionalRule = (
  rule: ConditionalRule,
  formData: FormData
): boolean => {
  const fieldValue = formData[rule.field];
  
  switch (rule.operator) {
    case 'equals':
      return fieldValue === rule.value;
    case 'notEquals':
      return fieldValue !== rule.value;
    case 'contains':
      return Array.isArray(fieldValue) && fieldValue.includes(rule.value);
    case 'notContains':
      return !Array.isArray(fieldValue) || !fieldValue.includes(rule.value);
    case 'greaterThan':
      return typeof fieldValue === 'number' && fieldValue > rule.value;
    case 'lessThan':
      return typeof fieldValue === 'number' && fieldValue < rule.value;
    default:
      return true;
  }
};

/**
 * Validate entire form data against configuration
 */
export const validateFormData = (
  formData: FormData,
  config: CategoryFormConfig
): FormValidationResult => {
  const errors: FormErrors = {};
  let isValid = true;
  
  // Validate each section and field
  for (const section of config.sections) {
    // Check if section should be shown
    if (section.conditional && !evaluateConditionalRule(section.conditional, formData)) {
      continue; // Skip this section
    }
    
    for (const field of section.fields) {
      // Check if field should be shown
      if (field.conditional && !evaluateConditionalRule(field.conditional, formData)) {
        continue; // Skip this field
      }
      
      const fieldValue = formData[field.id];
      const fieldError = validateField(fieldValue, field.validation);
      
      if (fieldError) {
        errors[field.id] = fieldError;
        isValid = false;
      }
    }
  }
  
  return {
    isValid,
    errors
  };
};

/**
 * Process form data and separate basic fields from category-specific data
 */
export const processFormData = (
  formData: FormData,
  config: CategoryFormConfig
): { basicFields: any; categoryData: any } => {
  const basicFieldIds = ['title', 'date', 'time', 'location', 'notes', 'expected_attendees'];
  const basicFields: any = {};
  const categoryData: any = {};
  
  // Extract basic fields
  for (const fieldId of basicFieldIds) {
    if (formData[fieldId] !== undefined) {
      basicFields[fieldId] = formData[fieldId];
    }
  }
  
  // Extract category-specific fields
  for (const section of config.sections) {
    for (const field of section.fields) {
      if (!basicFieldIds.includes(field.id) && formData[field.id] !== undefined) {
        categoryData[field.id] = formData[field.id];
      }
    }
  }
  
  return {
    basicFields: {
      ...basicFields,
      category: config.category
    },
    categoryData
  };
};

/**
 * Merge basic event data with category-specific data for form initialization
 */
export const mergeEventDataForForm = (
  event: any,
  categoryData: any = {}
): FormData => {
  const formData: FormData = {
    title: event.title || '',
    date: event.date || '',
    time: event.time || '',
    location: event.location || '',
    notes: event.notes || '',
    expected_attendees: event.expected_attendees || '',
    category: event.category || '',
    ...categoryData
  };
  
  return formData;
};

/**
 * Get default values for a form configuration
 */
export const getDefaultFormData = (config: CategoryFormConfig): FormData => {
  const defaultData: FormData = {
    category: config.category
  };
  
  // Set default values for fields that have them
  for (const section of config.sections) {
    for (const field of section.fields) {
      if (field.defaultValue !== undefined) {
        defaultData[field.id] = field.defaultValue;
      } else {
        // Set appropriate empty values based on field type
        switch (field.type) {
          case 'text':
          case 'textarea':
          case 'email':
          case 'phone':
            defaultData[field.id] = '';
            break;
          case 'number':
            defaultData[field.id] = '';
            break;
          case 'select':
            defaultData[field.id] = '';
            break;
          case 'multiselect':
            defaultData[field.id] = [];
            break;
          case 'checkbox':
            defaultData[field.id] = false;
            break;
          case 'date':
          case 'time':
            defaultData[field.id] = '';
            break;
          default:
            defaultData[field.id] = '';
        }
      }
    }
  }
  
  return defaultData;
};

/**
 * Get visible fields based on current form data and conditional rules
 */
export const getVisibleFields = (
  config: CategoryFormConfig,
  formData: FormData
) => {
  const visibleFields: string[] = [];
  
  for (const section of config.sections) {
    // Check if section should be shown
    if (section.conditional && !evaluateConditionalRule(section.conditional, formData)) {
      continue;
    }
    
    for (const field of section.fields) {
      // Check if field should be shown
      if (field.conditional && !evaluateConditionalRule(field.conditional, formData)) {
        continue;
      }
      
      visibleFields.push(field.id);
    }
  }
  
  return visibleFields;
};

/**
 * Get visible sections based on current form data and conditional rules
 */
export const getVisibleSections = (
  config: CategoryFormConfig,
  formData: FormData
) => {
  return config.sections.filter(section => {
    if (section.conditional) {
      return evaluateConditionalRule(section.conditional, formData);
    }
    return true;
  });
};

/**
 * Calculate form completion percentage
 */
export const calculateFormCompletion = (
  formData: FormData,
  config: CategoryFormConfig
): number => {
  const visibleFields = getVisibleFields(config, formData);
  const requiredFields = [];
  
  // Get required visible fields
  for (const section of config.sections) {
    for (const field of section.fields) {
      if (field.required && visibleFields.includes(field.id)) {
        requiredFields.push(field.id);
      }
    }
  }
  
  if (requiredFields.length === 0) {
    return 100;
  }
  
  // Count completed required fields
  const completedFields = requiredFields.filter(fieldId => {
    const value = formData[fieldId];
    if (typeof value === 'string') {
      return value.trim() !== '';
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && value !== '';
  });
  
  return Math.round((completedFields.length / requiredFields.length) * 100);
};

/**
 * Format form data for display
 */
export const formatFormDataForDisplay = (
  formData: FormData,
  config: CategoryFormConfig
): { [sectionId: string]: { [fieldId: string]: { label: string; value: string } } } => {
  const formatted: any = {};
  
  for (const section of config.sections) {
    formatted[section.id] = {};
    
    for (const field of section.fields) {
      const value = formData[field.id];
      let displayValue = '';
      
      if (value !== undefined && value !== null && value !== '') {
        switch (field.type) {
          case 'multiselect':
            displayValue = Array.isArray(value) ? value.join(', ') : '';
            break;
          case 'checkbox':
            displayValue = value ? 'Yes' : 'No';
            break;
          case 'select':
          case 'text':
          case 'textarea':
          case 'email':
          case 'phone':
          case 'date':
          case 'time':
            displayValue = String(value);
            break;
          case 'number':
            displayValue = String(value);
            break;
          default:
            displayValue = String(value);
        }
      }
      
      if (displayValue) {
        formatted[section.id][field.id] = {
          label: field.label,
          value: displayValue
        };
      }
    }
  }
  
  return formatted;
};

/**
 * Export utilities for external use
 */
export const FormConfigUtils = {
  getFormConfigForCategory,
  validateField,
  evaluateConditionalRule,
  validateFormData,
  processFormData,
  mergeEventDataForForm,
  getDefaultFormData,
  getVisibleFields,
  getVisibleSections,
  calculateFormCompletion,
  formatFormDataForDisplay
};