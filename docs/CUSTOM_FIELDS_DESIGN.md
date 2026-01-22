# Custom Fields System Design

**Version:** 1.0  
**Last Updated:** January 22, 2026

---

## Overview

The Custom Fields system allows users to add event-specific or organization-specific fields to attendees beyond the default name, email, and phone fields.

---

## Use Cases

1. **Corporate Events**
   - Employee ID
   - Department
   - Job Title
   - Badge Number

2. **Conferences**
   - Company Name
   - Dietary Restrictions
   - T-Shirt Size
   - Session Preferences

3. **Restaurants/Clubs**
   - Membership Number
   - VIP Status
   - Preferred Table
   - Special Requests

4. **Schools/Universities**
   - Student ID
   - Grade/Year
   - Parent Contact
   - Emergency Contact

---

## Data Model

### Custom Field Definition

```typescript
interface CustomField {
  id: string;                    // Unique identifier
  name: string;                  // Field name (e.g., "Employee ID")
  key: string;                   // Field key (e.g., "employee_id")
  type: FieldType;               // Field data type
  required: boolean;             // Is field required?
  default_value?: string;        // Default value
  options?: string[];            // For select/multi-select types
  validation?: FieldValidation;  // Validation rules
  display_order: number;         // Display order in forms
  event_id?: string;             // Event-specific (null = global)
  template_id?: string;          // Template this field belongs to
  created_at: string;
  updated_at: string;
}

type FieldType = 
  | 'text'           // Single-line text
  | 'textarea'       // Multi-line text
  | 'number'         // Numeric value
  | 'email'          // Email address
  | 'phone'          // Phone number
  | 'date'           // Date picker
  | 'time'           // Time picker
  | 'datetime'       // Date and time
  | 'select'         // Dropdown (single choice)
  | 'multiselect'    // Multiple choice
  | 'checkbox'       // Boolean (yes/no)
  | 'url'            // Website URL
  | 'file';          // File upload (future)

interface FieldValidation {
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;              // Regex pattern
  custom_error?: string;         // Custom error message
}
```

### Custom Field Value

```typescript
interface CustomFieldValue {
  id: string;
  attendee_id: string;
  field_id: string;
  value: string;                 // Stored as string, parsed by type
  created_at: string;
  updated_at: string;
}
```

### Field Template

```typescript
interface FieldTemplate {
  id: string;
  name: string;                  // Template name (e.g., "Corporate Event")
  description?: string;
  fields: string[];              // Array of field IDs
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## Database Schema

### custom_fields Table

```sql
CREATE TABLE custom_fields (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  type TEXT NOT NULL,
  required INTEGER DEFAULT 0,
  default_value TEXT,
  options TEXT,                  -- JSON array for select options
  validation TEXT,               -- JSON object for validation rules
  display_order INTEGER DEFAULT 0,
  event_id TEXT,                 -- NULL for global fields
  template_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_custom_fields_event ON custom_fields(event_id);
CREATE INDEX idx_custom_fields_template ON custom_fields(template_id);
CREATE INDEX idx_custom_fields_key ON custom_fields(key);
```

### custom_field_values Table

```sql
CREATE TABLE custom_field_values (
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

CREATE INDEX idx_custom_field_values_attendee ON custom_field_values(attendee_id);
CREATE INDEX idx_custom_field_values_field ON custom_field_values(field_id);
```

### field_templates Table

```sql
CREATE TABLE field_templates (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  fields TEXT NOT NULL,          -- JSON array of field IDs
  is_default INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## API Design

### CustomFieldsService

```typescript
class CustomFieldsService {
  // Field Management
  async createField(field: Omit<CustomField, 'id' | 'created_at' | 'updated_at'>): Promise<CustomField>
  async getField(fieldId: string): Promise<CustomField | null>
  async getFields(eventId?: string): Promise<CustomField[]>
  async updateField(fieldId: string, updates: Partial<CustomField>): Promise<boolean>
  async deleteField(fieldId: string): Promise<boolean>
  async reorderFields(fieldIds: string[]): Promise<void>
  
  // Field Values
  async setFieldValue(attendeeId: string, fieldId: string, value: string): Promise<void>
  async getFieldValue(attendeeId: string, fieldId: string): Promise<string | null>
  async getFieldValues(attendeeId: string): Promise<Record<string, string>>
  async deleteFieldValue(attendeeId: string, fieldId: string): Promise<boolean>
  
  // Validation
  async validateFieldValue(field: CustomField, value: string): Promise<ValidationResult>
  async validateAllFields(attendeeId: string, values: Record<string, string>): Promise<ValidationResult[]>
  
  // Templates
  async createTemplate(template: Omit<FieldTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<FieldTemplate>
  async getTemplate(templateId: string): Promise<FieldTemplate | null>
  async getTemplates(): Promise<FieldTemplate[]>
  async applyTemplate(templateId: string, eventId: string): Promise<CustomField[]>
  async deleteTemplate(templateId: string): Promise<boolean>
  
  // Import/Export
  async exportFieldDefinitions(eventId?: string): Promise<string>
  async importFieldDefinitions(data: string, eventId?: string): Promise<CustomField[]>
}
```

### Types

```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface FieldWithValue extends CustomField {
  value?: string;
}
```

---

## UI Components

### 1. Custom Fields Management Screen

```
┌─────────────────────────────────┐
│  Custom Fields                  │
├─────────────────────────────────┤
│                                 │
│  Event: Team Meeting            │
│  ┌───────────────────────────┐ │
│  │ Apply Template ▼          │ │
│  └───────────────────────────┘ │
│                                 │
│  Fields (5)                     │
│  ┌───────────────────────────┐ │
│  │ ≡ Employee ID             │ │
│  │   Text • Required         │ │
│  │   [Edit] [Delete]         │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ ≡ Department              │ │
│  │   Select • Optional       │ │
│  │   [Edit] [Delete]         │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ ≡ Dietary Restrictions    │ │
│  │   Multi-select • Optional │ │
│  │   [Edit] [Delete]         │ │
│  └───────────────────────────┘ │
│                                 │
│  [+ Add Field]                  │
│  [Save Template]                │
│                                 │
└─────────────────────────────────┘
```

### 2. Add/Edit Field Screen

```
┌─────────────────────────────────┐
│  Add Custom Field               │
├─────────────────────────────────┤
│                                 │
│  Field Name *                   │
│  ┌───────────────────────────┐ │
│  │ Employee ID               │ │
│  └───────────────────────────┘ │
│                                 │
│  Field Type *                   │
│  ┌───────────────────────────┐ │
│  │ Text ▼                    │ │
│  └───────────────────────────┘ │
│                                 │
│  ☑ Required Field               │
│                                 │
│  Default Value                  │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  Validation                     │
│  ┌───────────────────────────┐ │
│  │ Min Length: 5             │ │
│  │ Max Length: 20            │ │
│  │ Pattern: [A-Z0-9]+        │ │
│  └───────────────────────────┘ │
│                                 │
│  [Cancel]  [Save Field]         │
│                                 │
└─────────────────────────────────┘
```

### 3. Attendee Form with Custom Fields

```
┌─────────────────────────────────┐
│  Add Attendee                   │
├─────────────────────────────────┤
│                                 │
│  Basic Information              │
│  ┌───────────────────────────┐ │
│  │ Name *                    │ │
│  │ John Doe                  │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ Email                     │ │
│  │ john@example.com          │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ Phone                     │ │
│  │ (555) 123-4567            │ │
│  └───────────────────────────┘ │
│                                 │
│  Additional Information         │
│  ┌───────────────────────────┐ │
│  │ Employee ID *             │ │
│  │ EMP12345                  │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ Department                │ │
│  │ Engineering ▼             │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ Dietary Restrictions      │ │
│  │ ☑ Vegetarian              │ │
│  │ ☐ Vegan                   │ │
│  │ ☐ Gluten-Free             │ │
│  └───────────────────────────┘ │
│                                 │
│  [Cancel]  [Add Attendee]       │
│                                 │
└─────────────────────────────────┘
```

### 4. Field Templates Screen

```
┌─────────────────────────────────┐
│  Field Templates                │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🏢 Corporate Event        │ │
│  │ 5 fields                  │ │
│  │ [Apply] [Edit] [Delete]   │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ 🎓 Conference             │ │
│  │ 7 fields                  │ │
│  │ [Apply] [Edit] [Delete]   │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ 🍽️ Restaurant             │ │
│  │ 4 fields                  │ │
│  │ [Apply] [Edit] [Delete]   │ │
│  └───────────────────────────┘ │
│                                 │
│  [+ Create Template]            │
│                                 │
└─────────────────────────────────┘
```

---

## Built-in Templates

### 1. Corporate Event Template

```typescript
{
  name: "Corporate Event",
  fields: [
    { name: "Employee ID", type: "text", required: true },
    { name: "Department", type: "select", options: ["Engineering", "Sales", "Marketing", "HR", "Finance"] },
    { name: "Job Title", type: "text" },
    { name: "Badge Number", type: "number" },
    { name: "Parking Required", type: "checkbox" }
  ]
}
```

### 2. Conference Template

```typescript
{
  name: "Conference",
  fields: [
    { name: "Company Name", type: "text", required: true },
    { name: "Job Title", type: "text" },
    { name: "Dietary Restrictions", type: "multiselect", options: ["Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher"] },
    { name: "T-Shirt Size", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"] },
    { name: "Session Preferences", type: "multiselect" },
    { name: "LinkedIn Profile", type: "url" },
    { name: "Special Requirements", type: "textarea" }
  ]
}
```

### 3. Restaurant/Club Template

```typescript
{
  name: "Restaurant/Club",
  fields: [
    { name: "Membership Number", type: "text" },
    { name: "VIP Status", type: "checkbox" },
    { name: "Preferred Table", type: "select", options: ["Window", "Booth", "Bar", "Patio"] },
    { name: "Special Requests", type: "textarea" }
  ]
}
```

### 4. School/University Template

```typescript
{
  name: "School/University",
  fields: [
    { name: "Student ID", type: "text", required: true },
    { name: "Grade/Year", type: "select", options: ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"] },
    { name: "Parent Name", type: "text" },
    { name: "Parent Phone", type: "phone", required: true },
    { name: "Emergency Contact", type: "phone", required: true },
    { name: "Medical Conditions", type: "textarea" }
  ]
}
```

---

## Import/Export Integration

### CSV Import with Custom Fields

```csv
Name,Email,Phone,Employee ID,Department,Job Title
John Doe,john@example.com,555-1234,EMP001,Engineering,Senior Developer
Jane Smith,jane@example.com,555-5678,EMP002,Marketing,Marketing Manager
```

**Import Process:**
1. Detect custom field columns
2. Match columns to existing custom fields (by name or key)
3. Create missing custom fields (optional)
4. Validate values against field types
5. Import attendees with custom field values

### CSV Export with Custom Fields

```csv
Name,Email,Phone,Checked In,Check-in Time,Employee ID,Department,Job Title
John Doe,john@example.com,555-1234,Yes,2026-01-22 10:30:00,EMP001,Engineering,Senior Developer
Jane Smith,jane@example.com,555-5678,No,,EMP002,Marketing,Marketing Manager
```

---

## Validation Rules

### Field Type Validation

```typescript
const FIELD_VALIDATORS: Record<FieldType, (value: string, field: CustomField) => ValidationResult> = {
  text: (value, field) => {
    if (field.validation?.min_length && value.length < field.validation.min_length) {
      return { valid: false, error: `Minimum length is ${field.validation.min_length}` };
    }
    if (field.validation?.max_length && value.length > field.validation.max_length) {
      return { valid: false, error: `Maximum length is ${field.validation.max_length}` };
    }
    if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) {
      return { valid: false, error: field.validation.custom_error || 'Invalid format' };
    }
    return { valid: true };
  },
  
  number: (value, field) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { valid: false, error: 'Must be a valid number' };
    }
    if (field.validation?.min_value !== undefined && num < field.validation.min_value) {
      return { valid: false, error: `Minimum value is ${field.validation.min_value}` };
    }
    if (field.validation?.max_value !== undefined && num > field.validation.max_value) {
      return { valid: false, error: `Maximum value is ${field.validation.max_value}` };
    }
    return { valid: true };
  },
  
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, error: 'Invalid email address' };
    }
    return { valid: true };
  },
  
  phone: (value) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return { valid: false, error: 'Phone number must have at least 10 digits' };
    }
    return { valid: true };
  },
  
  date: (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date' };
    }
    return { valid: true };
  },
  
  url: (value) => {
    try {
      new URL(value);
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL' };
    }
  },
  
  select: (value, field) => {
    if (field.options && !field.options.includes(value)) {
      return { valid: false, error: 'Invalid selection' };
    }
    return { valid: true };
  },
  
  multiselect: (value, field) => {
    const values = JSON.parse(value);
    if (!Array.isArray(values)) {
      return { valid: false, error: 'Invalid format' };
    }
    if (field.options) {
      const invalidValues = values.filter(v => !field.options!.includes(v));
      if (invalidValues.length > 0) {
        return { valid: false, error: `Invalid selections: ${invalidValues.join(', ')}` };
      }
    }
    return { valid: true };
  },
  
  checkbox: (value) => {
    if (value !== 'true' && value !== 'false') {
      return { valid: false, error: 'Invalid value' };
    }
    return { valid: true };
  },
  
  textarea: (value, field) => {
    // Same as text validation
    return FIELD_VALIDATORS.text(value, field);
  },
  
  time: (value) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(value)) {
      return { valid: false, error: 'Invalid time format (HH:MM)' };
    }
    return { valid: true };
  },
  
  datetime: (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date/time' };
    }
    return { valid: true };
  },
  
  file: () => {
    // File validation will be implemented when file upload is added
    return { valid: true };
  }
};
```

---

## Implementation Phases

### Phase 1: Core System (Week 1)
- Database schema
- CustomFieldsService implementation
- Basic CRUD operations
- Field validation

### Phase 2: UI Components (Week 2)
- Custom fields management screen
- Add/edit field forms
- Field type components
- Attendee form integration

### Phase 3: Templates (Week 3)
- Template management
- Built-in templates
- Template application
- Template import/export

### Phase 4: Import/Export (Week 4)
- CSV import with custom fields
- CSV export with custom fields
- Field mapping UI
- Data migration tools

---

## Performance Considerations

- **Query Optimization:** Index custom_field_values by attendee_id
- **Caching:** Cache field definitions per event
- **Lazy Loading:** Load field values only when needed
- **Batch Operations:** Bulk insert/update for imports

---

## Future Enhancements

1. **Conditional Fields**
   - Show/hide fields based on other field values
   - Dynamic field dependencies

2. **Calculated Fields**
   - Auto-calculate values from other fields
   - Formulas and expressions

3. **Field Groups**
   - Organize fields into sections
   - Collapsible field groups

4. **Advanced Validation**
   - Cross-field validation
   - Custom validation functions
   - Async validation (e.g., check uniqueness)

5. **Field History**
   - Track field value changes
   - Audit trail for custom fields

---

**End of Custom Fields Design**

