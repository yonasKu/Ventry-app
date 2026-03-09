# Dynamic Form Components

This directory contains the dynamic form system for category-specific event creation.

## Architecture Overview

### Component Hierarchy
```
DynamicEventForm (Main container)
├── FormSection (Section wrapper)
│   ├── FormField (Field wrapper)
│   │   ├── TextInputField
│   │   ├── SelectField
│   │   ├── MultiSelectField
│   │   ├── CheckboxField
│   │   ├── DateTimeField
│   │   └── TextAreaField
│   └── FormProgress (Progress indicator)
└── CategorySelectionScreen (Category picker)
```

### Data Flow
1. **Category Selection**: User selects event category
2. **Form Configuration**: Load category-specific form config
3. **Form Rendering**: Render fields based on configuration
4. **Validation**: Real-time validation using config rules
5. **Submission**: Process and separate basic vs category data

### State Management
- Form data stored in component state
- Validation errors tracked per field
- Form progress calculated based on required fields
- Section navigation for multi-step forms

### Key Features
- **Dynamic Fields**: Fields change based on category
- **Conditional Logic**: Show/hide fields based on other values
- **Real-time Validation**: Validate as user types
- **Progress Tracking**: Show completion percentage
- **Mobile Optimized**: Touch-friendly interface
- **Accessibility**: Screen reader support

## Usage

```typescript
import { DynamicEventForm } from './components/forms/DynamicEventForm';
import { EventCategory } from './types/FormTypes';

// In your component
<DynamicEventForm
  category={EventCategory.CONFERENCE}
  onSubmit={handleFormSubmit}
  initialData={existingEventData}
/>
```

## Configuration

Form configurations are defined in `config/CategoryFormConfigs.ts`:
- Field types and validation rules
- Section organization
- Conditional display logic
- Help text and placeholders

## Validation

Validation is handled by `utils/formConfigUtils.ts`:
- Field-level validation
- Form-level validation
- Custom validation rules
- Error message management

## Styling

All components use the app's theme system:
- Colors from `context/ThemeContext`
- Consistent spacing and typography
- Dark/light mode support
- Platform-specific styling