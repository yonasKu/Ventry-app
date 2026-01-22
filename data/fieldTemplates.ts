import { CustomField, FieldTemplate } from '../services/CustomFieldsService';

/**
 * Built-in field templates for common event types
 */

export const BUILT_IN_TEMPLATES: Omit<FieldTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Corporate Event',
    description: 'Standard fields for corporate events and meetings',
    fields: [], // Will be populated with field IDs after creation
    is_default: false,
  },
  {
    name: 'Conference',
    description: 'Fields for conferences, seminars, and workshops',
    fields: [],
    is_default: false,
  },
  {
    name: 'Restaurant/Club',
    description: 'Fields for restaurant reservations and club events',
    fields: [],
    is_default: false,
  },
  {
    name: 'School/University',
    description: 'Fields for educational events and activities',
    fields: [],
    is_default: false,
  },
];

export const TEMPLATE_FIELDS: Record<string, Omit<CustomField, 'id' | 'created_at' | 'updated_at'>[]> = {
  'Corporate Event': [
    {
      name: 'Employee ID',
      key: 'employee_id',
      type: 'text',
      required: true,
      display_order: 0,
      validation: {
        min_length: 3,
        max_length: 20,
        pattern: '^[A-Z0-9]+$',
        custom_error: 'Employee ID must contain only uppercase letters and numbers',
      },
    },
    {
      name: 'Department',
      key: 'department',
      type: 'select',
      required: false,
      display_order: 1,
      options: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'IT', 'Legal', 'Other'],
    },
    {
      name: 'Job Title',
      key: 'job_title',
      type: 'text',
      required: false,
      display_order: 2,
      validation: {
        max_length: 100,
      },
    },
    {
      name: 'Badge Number',
      key: 'badge_number',
      type: 'number',
      required: false,
      display_order: 3,
      validation: {
        min_value: 1,
        max_value: 9999,
      },
    },
    {
      name: 'Parking Required',
      key: 'parking_required',
      type: 'checkbox',
      required: false,
      display_order: 4,
      default_value: 'false',
    },
  ],
  
  'Conference': [
    {
      name: 'Company Name',
      key: 'company_name',
      type: 'text',
      required: true,
      display_order: 0,
      validation: {
        min_length: 2,
        max_length: 100,
      },
    },
    {
      name: 'Job Title',
      key: 'job_title',
      type: 'text',
      required: false,
      display_order: 1,
      validation: {
        max_length: 100,
      },
    },
    {
      name: 'Dietary Restrictions',
      key: 'dietary_restrictions',
      type: 'multiselect',
      required: false,
      display_order: 2,
      options: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Dairy-Free', 'Nut Allergy'],
    },
    {
      name: 'T-Shirt Size',
      key: 'tshirt_size',
      type: 'select',
      required: false,
      display_order: 3,
      options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    },
    {
      name: 'Session Preferences',
      key: 'session_preferences',
      type: 'multiselect',
      required: false,
      display_order: 4,
      options: ['Technical', 'Business', 'Design', 'Marketing', 'Leadership', 'Networking'],
    },
    {
      name: 'LinkedIn Profile',
      key: 'linkedin_profile',
      type: 'url',
      required: false,
      display_order: 5,
      validation: {
        pattern: '^https?://(www\\.)?linkedin\\.com/.*',
        custom_error: 'Please enter a valid LinkedIn URL',
      },
    },
    {
      name: 'Special Requirements',
      key: 'special_requirements',
      type: 'textarea',
      required: false,
      display_order: 6,
      validation: {
        max_length: 500,
      },
    },
  ],
  
  'Restaurant/Club': [
    {
      name: 'Membership Number',
      key: 'membership_number',
      type: 'text',
      required: false,
      display_order: 0,
      validation: {
        pattern: '^[A-Z0-9-]+$',
        custom_error: 'Invalid membership number format',
      },
    },
    {
      name: 'VIP Status',
      key: 'vip_status',
      type: 'checkbox',
      required: false,
      display_order: 1,
      default_value: 'false',
    },
    {
      name: 'Preferred Table',
      key: 'preferred_table',
      type: 'select',
      required: false,
      display_order: 2,
      options: ['No Preference', 'Window', 'Booth', 'Bar', 'Patio', 'Private Room'],
    },
    {
      name: 'Special Requests',
      key: 'special_requests',
      type: 'textarea',
      required: false,
      display_order: 3,
      validation: {
        max_length: 300,
      },
    },
  ],
  
  'School/University': [
    {
      name: 'Student ID',
      key: 'student_id',
      type: 'text',
      required: true,
      display_order: 0,
      validation: {
        pattern: '^[A-Z0-9]+$',
        custom_error: 'Student ID must contain only uppercase letters and numbers',
      },
    },
    {
      name: 'Grade/Year',
      key: 'grade_year',
      type: 'select',
      required: false,
      display_order: 1,
      options: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Other'],
    },
    {
      name: 'Parent Name',
      key: 'parent_name',
      type: 'text',
      required: false,
      display_order: 2,
      validation: {
        min_length: 2,
        max_length: 100,
      },
    },
    {
      name: 'Parent Phone',
      key: 'parent_phone',
      type: 'phone',
      required: true,
      display_order: 3,
    },
    {
      name: 'Emergency Contact',
      key: 'emergency_contact',
      type: 'phone',
      required: true,
      display_order: 4,
    },
    {
      name: 'Medical Conditions',
      key: 'medical_conditions',
      type: 'textarea',
      required: false,
      display_order: 5,
      validation: {
        max_length: 500,
      },
    },
  ],
};

/**
 * Initialize built-in templates in the database
 */
export async function initializeBuiltInTemplates(customFieldsService: any): Promise<void> {
  try {
    // Check if templates already exist
    const existingTemplates = customFieldsService.getTemplates();
    
    for (const templateDef of BUILT_IN_TEMPLATES) {
      // Skip if template already exists
      if (existingTemplates.find((t: any) => t.name === templateDef.name)) {
        continue;
      }
      
      // Create fields for this template
      const fieldIds: string[] = [];
      const templateFields = TEMPLATE_FIELDS[templateDef.name] || [];
      
      for (const fieldDef of templateFields) {
        const field = customFieldsService.createField(fieldDef);
        fieldIds.push(field.id);
      }
      
      // Create template with field IDs
      customFieldsService.createTemplate({
        ...templateDef,
        fields: fieldIds,
      });
    }
    
    console.log('Built-in templates initialized successfully');
  } catch (error) {
    console.error('Error initializing built-in templates:', error);
  }
}
