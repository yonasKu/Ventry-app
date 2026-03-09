# Category-Specific Event Forms Implementation Plan

**Date**: March 9, 2026  
**Priority**: Critical - Professional UX Issue  
**Timeline**: 1-2 weeks  
**Impact**: Market Differentiation & User Experience

---

## Problem Statement

**Current Issue**: Generic "one-size-fits-all" event creation form  
**User Feedback**: *"This is unprofessional - different event types need different fields"*  
**Industry Standard**: Category-specific forms with tailored fields  
**Business Impact**: Looks amateur compared to professional event management tools

---

## Research Findings

### Industry Standards Analysis

**Professional Event Management Apps Use**:
- **Conference Forms**: Session preferences, dietary needs, accessibility, networking
- **Wedding Forms**: RSVP, meal choices, song requests, accommodation, plus-ones
- **Restaurant Forms**: Party size, dietary restrictions, special occasions, seating preferences
- **Workshop Forms**: Prerequisites, skill level, certification needs, materials
- **Sports Forms**: Team info, skill divisions, medical info, liability waivers
- **Fundraising Forms**: Donation amounts, volunteer signup, sponsorship levels

**Key Insight**: *"Conference sign-ups need different fields than webinar registrations"* - Industry Expert

---

## Current vs Professional Comparison

### ❌ Current Form (Generic)
```
Event Name: [text]
Category: [dropdown] 
Location: [text]
Date: [picker]
Time: [picker]
Expected Attendees: [number]
Notes: [textarea]
```

### ✅ Professional Forms (Category-Specific)

**Conference Form**:
```
Event Name, Category, Location, Date, Time
+ Session Topics, Keynote Speakers, Networking Events
+ Dietary Requirements, Accessibility Needs
+ Registration Tiers, Early Bird Pricing
+ Sponsor Information, Exhibition Space
```

**Restaurant/Club Form**:
```
Event Name, Category, Location, Date, Time
+ Party Size, Occasion Type, Special Requests
+ Dietary Restrictions, Allergies
+ Seating Preferences, Private Room
+ Menu Preferences, Bar Package
+ Contact for Coordination
```

**Wedding Form**:
```
Event Name, Category, Location, Date, Time
+ Bride/Groom Names, Wedding Party Size
+ Ceremony + Reception Times
+ Guest Count, Plus-One Policy
+ Meal Preferences, Dietary Restrictions
+ Music Preferences, Special Requests
+ Accommodation Info, Transportation
```

---

## Implementation Plan

### Phase 1: Form Architecture (Week 1 - 20 hours)

#### 1.1 Create Dynamic Form System (8 hours)
**Files to Create**:
- `components/forms/DynamicEventForm.tsx` - Main form component
- `components/forms/FormField.tsx` - Reusable field component
- `components/forms/CategoryFormConfig.ts` - Form configurations
- `types/FormTypes.ts` - TypeScript definitions

**Architecture**:
```typescript
interface FormFieldConfig {
  id: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'date' | 'time' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select/multiselect
  validation?: ValidationRule[];
  conditional?: ConditionalRule; // Show/hide based on other fields
}

interface CategoryFormConfig {
  category: string;
  fields: FormFieldConfig[];
  sections: FormSection[];
}
```

#### 1.2 Update Database Schema (4 hours)
**Files to Modify**:
- `services/DatabaseService.ts` - Add category-specific fields
- `models/Event.ts` - Update Event interface

**New Schema**:
```sql
-- Add category-specific JSON field
ALTER TABLE events ADD COLUMN category_data TEXT; -- JSON string

-- Examples of stored data:
-- Conference: {"sessions": ["AI", "Blockchain"], "dietary": ["Vegetarian"], "accessibility": true}
-- Restaurant: {"party_size": 8, "occasion": "Birthday", "dietary": ["Gluten-free"]}
-- Wedding: {"bride": "Jane", "groom": "John", "ceremony_time": "14:00", "reception_time": "18:00"}
```

#### 1.3 Form Configurations (8 hours)
**Create category-specific configurations**:

```typescript
// Conference Form Config
export const CONFERENCE_FORM: CategoryFormConfig = {
  category: 'Conference',
  sections: [
    {
      title: 'Basic Information',
      fields: [
        { id: 'title', type: 'text', label: 'Conference Name', required: true },
        { id: 'location', type: 'text', label: 'Venue', required: true },
        { id: 'date', type: 'date', label: 'Date', required: true },
        { id: 'time', type: 'time', label: 'Start Time', required: true },
      ]
    },
    {
      title: 'Conference Details',
      fields: [
        { id: 'keynote_speakers', type: 'textarea', label: 'Keynote Speakers' },
        { id: 'session_topics', type: 'multiselect', label: 'Session Topics', 
          options: ['Technology', 'Business', 'Marketing', 'AI/ML', 'Blockchain', 'Sustainability'] },
        { id: 'networking_events', type: 'checkbox', label: 'Include Networking Events' },
        { id: 'exhibition_space', type: 'checkbox', label: 'Exhibition Space Available' },
      ]
    },
    {
      title: 'Attendee Requirements',
      fields: [
        { id: 'registration_tiers', type: 'multiselect', label: 'Registration Tiers',
          options: ['Early Bird', 'Regular', 'Student', 'VIP', 'Speaker'] },
        { id: 'dietary_options', type: 'multiselect', label: 'Dietary Options',
          options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher'] },
        { id: 'accessibility_features', type: 'multiselect', label: 'Accessibility Features',
          options: ['Wheelchair Access', 'Sign Language', 'Audio Loop', 'Large Print'] },
      ]
    }
  ]
};

// Restaurant/Club Form Config
export const RESTAURANT_FORM: CategoryFormConfig = {
  category: 'Restaurant/Club',
  sections: [
    {
      title: 'Event Information',
      fields: [
        { id: 'title', type: 'text', label: 'Event Name', required: true },
        { id: 'location', type: 'text', label: 'Restaurant/Venue', required: true },
        { id: 'date', type: 'date', label: 'Date', required: true },
        { id: 'time', type: 'time', label: 'Reservation Time', required: true },
      ]
    },
    {
      title: 'Party Details',
      fields: [
        { id: 'party_size', type: 'number', label: 'Party Size', required: true },
        { id: 'occasion_type', type: 'select', label: 'Occasion',
          options: ['Birthday', 'Anniversary', 'Business Dinner', 'Date Night', 'Celebration', 'Other'] },
        { id: 'seating_preference', type: 'select', label: 'Seating Preference',
          options: ['No Preference', 'Booth', 'Table', 'Bar Seating', 'Private Room', 'Outdoor'] },
        { id: 'special_requests', type: 'textarea', label: 'Special Requests' },
      ]
    },
    {
      title: 'Dining Preferences',
      fields: [
        { id: 'menu_type', type: 'select', label: 'Menu Preference',
          options: ['À la carte', 'Prix Fixe', 'Tasting Menu', 'Buffet'] },
        { id: 'dietary_restrictions', type: 'multiselect', label: 'Dietary Restrictions',
          options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut Allergy', 'Shellfish Allergy'] },
        { id: 'bar_package', type: 'select', label: 'Bar Package',
          options: ['None', 'Wine Only', 'Beer & Wine', 'Full Bar', 'Premium Bar'] },
      ]
    }
  ]
};

// Wedding Form Config  
export const WEDDING_FORM: CategoryFormConfig = {
  category: 'Wedding',
  sections: [
    {
      title: 'Wedding Information',
      fields: [
        { id: 'title', type: 'text', label: 'Wedding Title', required: true },
        { id: 'bride_name', type: 'text', label: "Bride's Name", required: true },
        { id: 'groom_name', type: 'text', label: "Groom's Name", required: true },
        { id: 'wedding_date', type: 'date', label: 'Wedding Date', required: true },
        { id: 'location', type: 'text', label: 'Venue', required: true },
      ]
    },
    {
      title: 'Ceremony & Reception',
      fields: [
        { id: 'ceremony_time', type: 'time', label: 'Ceremony Time', required: true },
        { id: 'reception_time', type: 'time', label: 'Reception Time' },
        { id: 'guest_count', type: 'number', label: 'Expected Guest Count', required: true },
        { id: 'plus_one_policy', type: 'select', label: 'Plus-One Policy',
          options: ['No Plus-Ones', 'Married Couples Only', 'Long-term Partners', 'All Guests'] },
      ]
    },
    {
      title: 'Reception Details',
      fields: [
        { id: 'meal_style', type: 'select', label: 'Meal Style',
          options: ['Plated Dinner', 'Buffet', 'Family Style', 'Cocktail Reception'] },
        { id: 'dietary_accommodations', type: 'multiselect', label: 'Dietary Accommodations',
          options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Kosher', 'Halal', 'Children\'s Menu'] },
        { id: 'music_preferences', type: 'textarea', label: 'Music Preferences/Requests' },
        { id: 'special_traditions', type: 'textarea', label: 'Special Traditions/Customs' },
      ]
    }
  ]
};
```

### Phase 2: UI Implementation (Week 2 - 16 hours)

#### 2.1 Dynamic Form Component (8 hours)
**Create `components/forms/DynamicEventForm.tsx`**:

```typescript
interface DynamicEventFormProps {
  category: string;
  onSubmit: (data: EventFormData) => void;
  initialData?: Partial<EventFormData>;
}

export const DynamicEventForm: React.FC<DynamicEventFormProps> = ({
  category,
  onSubmit,
  initialData
}) => {
  const config = getFormConfig(category);
  const [formData, setFormData] = useState(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const renderField = (field: FormFieldConfig) => {
    switch (field.type) {
      case 'text':
        return <TextInput {...field} value={formData[field.id]} onChange={handleChange} />;
      case 'select':
        return <SelectField {...field} value={formData[field.id]} onChange={handleChange} />;
      case 'multiselect':
        return <MultiSelectField {...field} value={formData[field.id]} onChange={handleChange} />;
      // ... other field types
    }
  };

  return (
    <ScrollView>
      {config.sections.map(section => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.fields.map(field => (
            <View key={field.id} style={styles.fieldContainer}>
              {renderField(field)}
              {errors[field.id] && (
                <Text style={styles.errorText}>{errors[field.id]}</Text>
              )}
            </View>
          ))}
        </View>
      ))}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Create Event</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
```

#### 2.2 Form Field Components (4 hours)
**Create reusable field components**:
- `TextInputField.tsx`
- `SelectField.tsx` 
- `MultiSelectField.tsx`
- `CheckboxField.tsx`
- `DateTimeField.tsx`

#### 2.3 Update Create Event Screen (4 hours)
**Modify `app/create-event.tsx`**:

```typescript
export default function CreateEventScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategorySelection, setShowCategorySelection] = useState(true);

  if (showCategorySelection) {
    return <CategorySelectionScreen onSelect={handleCategorySelect} />;
  }

  return (
    <DynamicEventForm 
      category={selectedCategory!}
      onSubmit={handleFormSubmit}
    />
  );
}
```

### Phase 3: Data Management (Week 2 - 8 hours)

#### 3.1 Update Database Service (4 hours)
**Modify `services/DatabaseService.ts`**:

```typescript
interface Event {
  // ... existing fields
  category_data: string; // JSON string of category-specific data
}

async addEventAsync(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
  // Separate basic fields from category-specific data
  const { category_data, ...basicFields } = eventData;
  
  const result = this.db.runSync(
    `INSERT INTO events (title, date, time, location, notes, category, category_data, expected_attendees, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [basicFields.title, basicFields.date, basicFields.time, basicFields.location, 
     basicFields.notes, basicFields.category, JSON.stringify(category_data), basicFields.expected_attendees]
  );
  
  return this.getEventByIdAsync(result.lastInsertRowId.toString());
}
```

#### 3.2 Form Data Processing (4 hours)
**Create `utils/formDataProcessor.ts`**:

```typescript
export const processFormData = (category: string, formData: any) => {
  const config = getFormConfig(category);
  const basicFields = extractBasicFields(formData);
  const categoryData = extractCategoryData(formData, config);
  
  return {
    ...basicFields,
    category,
    category_data: categoryData
  };
};

export const extractBasicFields = (formData: any) => ({
  title: formData.title,
  date: formData.date,
  time: formData.time,
  location: formData.location,
  notes: formData.notes,
  expected_attendees: formData.expected_attendees
});

export const extractCategoryData = (formData: any, config: CategoryFormConfig) => {
  const categoryData: any = {};
  
  config.sections.forEach(section => {
    section.fields.forEach(field => {
      if (!['title', 'date', 'time', 'location', 'notes', 'expected_attendees'].includes(field.id)) {
        if (formData[field.id] !== undefined) {
          categoryData[field.id] = formData[field.id];
        }
      }
    });
  });
  
  return categoryData;
};
```

---

## Category-Specific Form Specifications

### 1. Conference Form
**Additional Fields**:
- Keynote Speakers (textarea)
- Session Topics (multiselect)
- Registration Tiers (multiselect)
- Networking Events (checkbox)
- Dietary Options (multiselect)
- Accessibility Features (multiselect)
- Exhibition Space (checkbox)

### 2. Restaurant/Club Form  
**Additional Fields**:
- Party Size (number, required)
- Occasion Type (select)
- Seating Preference (select)
- Menu Type (select)
- Dietary Restrictions (multiselect)
- Bar Package (select)
- Special Requests (textarea)

### 3. Wedding Form
**Additional Fields**:
- Bride's Name (text, required)
- Groom's Name (text, required)
- Ceremony Time (time, required)
- Reception Time (time)
- Guest Count (number, required)
- Plus-One Policy (select)
- Meal Style (select)
- Dietary Accommodations (multiselect)
- Music Preferences (textarea)
- Special Traditions (textarea)

### 4. Workshop Form
**Additional Fields**:
- Skill Level Required (select)
- Prerequisites (textarea)
- Materials Provided (multiselect)
- Certification Available (checkbox)
- Workshop Duration (select)
- Maximum Participants (number)
- Equipment Needed (multiselect)

### 5. Sports Tournament Form
**Additional Fields**:
- Sport Type (select, required)
- Tournament Format (select)
- Age Divisions (multiselect)
- Skill Divisions (multiselect)
- Team Size (number)
- Registration Fee (number)
- Equipment Requirements (multiselect)
- Medical Requirements (checkbox)
- Liability Waiver (checkbox, required)

---

## UI/UX Improvements

### Category Selection Screen
```typescript
const CategorySelectionScreen = ({ onSelect }) => (
  <ScrollView style={styles.container}>
    <Text style={styles.title}>What type of event are you creating?</Text>
    
    {CATEGORIES.map(category => (
      <TouchableOpacity 
        key={category.id}
        style={styles.categoryCard}
        onPress={() => onSelect(category.id)}
      >
        <View style={styles.categoryIcon}>
          {category.icon}
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
          <Text style={styles.categoryFields}>
            Includes: {category.specialFields.join(', ')}
          </Text>
        </View>
      </TouchableOpacity>
    ))}
  </ScrollView>
);
```

### Form Progress Indicator
```typescript
const FormProgress = ({ currentSection, totalSections }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBar}>
      <View 
        style={[styles.progressFill, { width: `${(currentSection / totalSections) * 100}%` }]} 
      />
    </View>
    <Text style={styles.progressText}>
      Step {currentSection} of {totalSections}
    </Text>
  </View>
);
```

---

## Testing Strategy

### Unit Tests
- [ ] Form field validation
- [ ] Data processing functions
- [ ] Category configuration loading
- [ ] Database schema updates

### Integration Tests  
- [ ] End-to-end form submission
- [ ] Category-specific data storage
- [ ] Form field conditional logic
- [ ] Data retrieval and display

### User Acceptance Tests
- [ ] Conference organizer workflow
- [ ] Restaurant manager workflow  
- [ ] Wedding planner workflow
- [ ] Form completion time < 3 minutes
- [ ] Error handling and validation

---

## Success Metrics

### User Experience
- **Form Completion Rate**: >90% (vs current ~70%)
- **Time to Complete**: <3 minutes average
- **User Satisfaction**: >4.5/5 stars
- **Error Rate**: <5% validation errors

### Business Impact
- **Professional Appearance**: Match industry standards
- **Market Differentiation**: Unique selling point
- **User Retention**: Reduce churn from poor UX
- **Premium Pricing**: Justify higher pricing tier

### Technical Metrics
- **Performance**: Form loads in <2 seconds
- **Compatibility**: Works on all devices
- **Accessibility**: WCAG 2.1 AA compliance
- **Maintainability**: Easy to add new categories

---

## Implementation Timeline

### Week 1: Architecture & Backend
- **Day 1-2**: Database schema updates
- **Day 3-4**: Form configuration system
- **Day 5**: Dynamic form architecture

### Week 2: UI & Integration
- **Day 1-3**: Form components development
- **Day 4**: Category selection screen
- **Day 5**: Integration and testing

### Week 3: Polish & Launch
- **Day 1-2**: UI polish and animations
- **Day 3**: Testing and bug fixes
- **Day 4**: Documentation and training
- **Day 5**: Production deployment

---

## Risk Mitigation

### Technical Risks
- **Complex Form Logic**: Start with simple categories, add complexity gradually
- **Performance Issues**: Lazy load form configurations, optimize rendering
- **Data Migration**: Ensure backward compatibility with existing events

### User Experience Risks
- **Form Complexity**: Use progressive disclosure, clear section breaks
- **Mobile Usability**: Test extensively on mobile devices
- **User Confusion**: Provide clear category descriptions and examples

### Business Risks
- **Development Time**: Use existing UI components where possible
- **User Adoption**: Provide migration path from generic forms
- **Maintenance Overhead**: Design for easy addition of new categories

---

## Future Enhancements

### Phase 2 Features
- **Conditional Fields**: Show/hide fields based on other selections
- **Field Dependencies**: Auto-populate related fields
- **Form Templates**: Save and reuse custom form configurations
- **Multi-language**: Translate category-specific fields

### Phase 3 Features
- **Custom Categories**: Allow users to create custom event types
- **Form Analytics**: Track which fields are most/least used
- **Integration APIs**: Connect with external event platforms
- **AI Suggestions**: Suggest fields based on event description

---

## Conclusion

This implementation will transform Ventry from a generic event app to a professional, category-specific event management platform. The investment of 2-3 weeks will result in:

✅ **Professional appearance** matching industry leaders  
✅ **Better user experience** with relevant fields only  
✅ **Market differentiation** vs generic competitors  
✅ **Higher user satisfaction** and retention  
✅ **Premium positioning** in the market

**Recommendation**: Prioritize this as the next major feature - it's essential for professional credibility and market success.

---

**Plan Created**: March 9, 2026  
**Plan Owner**: Development Team  
**Stakeholders**: Product, UX, Sales  
**Review Date**: Weekly during implementation