// Form field types and configurations for category-specific event forms

export type FormFieldType = 
  | 'text' 
  | 'number' 
  | 'select' 
  | 'multiselect' 
  | 'textarea' 
  | 'date' 
  | 'time' 
  | 'checkbox'
  | 'email'
  | 'phone';

// Form field value can be any of these types
export type FormFieldValue = string | number | boolean | Date | string[] | null | undefined;

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'custom';
  value?: any;
  message: string;
}

export interface ConditionalRule {
  field: string; // Field ID to check
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan';
  value: any; // Value to compare against
}

export interface FormFieldConfig {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select/multiselect fields
  validation?: ValidationRule[];
  conditional?: ConditionalRule; // Show/hide field based on other fields
  helpText?: string; // Additional help text for the field
  defaultValue?: any;
  section?: string; // Which section this field belongs to
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  conditional?: ConditionalRule; // Show/hide entire section
}

export interface CategoryFormConfig {
  category: string;
  displayName: string;
  description: string;
  icon?: string; // Icon name for category selection
  sections: FormSection[];
  estimatedTime?: string; // "3-5 minutes"
  specialFields?: string[]; // Preview of what's included
}

export interface FormData {
  [fieldId: string]: any;
}

export interface FormErrors {
  [fieldId: string]: string;
}

export interface EventFormData {
  // Basic event fields (common to all categories)
  title: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
  expected_attendees?: number;
  category: string;
  
  // Category-specific data
  [key: string]: any;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormErrors;
  warnings?: FormErrors;
}

// Category-specific form data interfaces
export interface ConferenceFormData extends EventFormData {
  keynote_speakers?: string;
  session_topics?: string[];
  networking_events?: boolean;
  exhibition_space?: boolean;
  registration_tiers?: string[];
  dietary_options?: string[];
  accessibility_features?: string[];
}

export interface RestaurantFormData extends EventFormData {
  party_size?: number;
  occasion_type?: string;
  seating_preference?: string;
  menu_type?: string;
  dietary_restrictions?: string[];
  bar_package?: string;
  special_requests?: string;
}

export interface WeddingFormData extends EventFormData {
  bride_name?: string;
  groom_name?: string;
  ceremony_time?: string;
  reception_time?: string;
  guest_count?: number;
  plus_one_policy?: string;
  meal_style?: string;
  dietary_accommodations?: string[];
  music_preferences?: string;
  special_traditions?: string;
}

export interface WorkshopFormData extends EventFormData {
  skill_level?: string;
  prerequisites?: string;
  materials_provided?: string[];
  certification_available?: boolean;
  workshop_duration?: string;
  max_participants?: number;
  equipment_needed?: string[];
}

export interface SportsFormData extends EventFormData {
  sport_type?: string;
  tournament_format?: string;
  age_divisions?: string[];
  skill_divisions?: string[];
  team_size?: number;
  registration_fee?: number;
  equipment_requirements?: string[];
  medical_requirements?: boolean;
  liability_waiver?: boolean;
}

// Form state management
export interface FormState {
  data: FormData;
  errors: FormErrors;
  touched: { [fieldId: string]: boolean };
  isSubmitting: boolean;
  currentSection: number;
  isValid: boolean;
}

export type FormAction = 
  | { type: 'SET_FIELD_VALUE'; fieldId: string; value: any }
  | { type: 'SET_FIELD_ERROR'; fieldId: string; error: string }
  | { type: 'CLEAR_FIELD_ERROR'; fieldId: string }
  | { type: 'SET_FIELD_TOUCHED'; fieldId: string }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_CURRENT_SECTION'; section: number }
  | { type: 'VALIDATE_FORM' }
  | { type: 'RESET_FORM'; initialData?: FormData };

// Event categories enum
export enum EventCategory {
  CONFERENCE = 'Conference',
  RESTAURANT = 'Restaurant/Club',
  WEDDING = 'Wedding',
  WORKSHOP = 'Workshop',
  SPORTS = 'Sports Tournament',
  CORPORATE = 'Corporate Event',
  GENERAL = 'General Event'
}

// Category information for selection screen
export interface CategoryInfo {
  id: EventCategory;
  name: string;
  description: string;
  icon: string;
  specialFields: string[];
  estimatedTime: string;
  examples: string[];
}