# Custom Form Builder - User-Created Forms

**Date**: March 9, 2026  
**Priority**: Future Enhancement  
**Complexity**: Medium-High

---

## 🎯 Goal

Allow users to create their own custom event categories and forms without needing to code.

---

## 💡 Concept

Users can:
1. Create a new event category (e.g., "Music Festival", "Charity Gala")
2. Add custom fields to their form
3. Save as template for reuse
4. Share templates with other users (optional)

---

## 🏗️ Architecture

### Data Storage

```typescript
// New table: custom_categories
{
  id: string;
  user_id: string; // Who created it
  name: string; // "Music Festival"
  description: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

// New table: custom_form_fields
{
  id: string;
  category_id: string;
  field_id: string; // "artist_lineup"
  field_type: 'text' | 'number' | 'select' | etc;
  label: string; // "Artist Lineup"
  placeholder: string;
  required: boolean;
  options: string; // JSON array for select/multiselect
  validation_rules: string; // JSON
  help_text: string;
  order: number; // Display order
}
```

---

## 🎨 User Interface

### 1. Category Management Screen

**Location**: Settings → Custom Event Categories

**Features**:
- List of user's custom categories
- "Create New Category" button
- Edit/Delete existing categories
- Preview form before saving

### 2. Form Builder Screen

**Step 1: Category Info**
- Category name
- Description
- Icon selection (from preset icons)
- Estimated completion time

**Step 2: Add Fields**
- Drag-and-drop field ordering
- Field type selector:
  - Text Input
  - Text Area
  - Number
  - Select (dropdown)
  - Multi-Select
  - Checkbox
  - Date
  - Time
- Field properties:
  - Label
  - Placeholder
  - Required toggle
  - Help text
  - Validation rules (optional)

**Step 3: Preview & Save**
- Live preview of form
- Test form with sample data
- Save as template

---

## 🔧 Implementation Plan

### Phase 1: Database & Backend (Week 1)

#### Day 1-2: Database Schema
- [ ] Create `custom_categories` table
- [ ] Create `custom_form_fields` table
- [ ] Add migration scripts
- [ ] Update DatabaseService with new methods:
  - `addCustomCategory()`
  - `getCustomCategories()`
  - `updateCustomCategory()`
  - `deleteCustomCategory()`
  - `addCustomField()`
  - `getCustomFields(categoryId)`
  - `updateCustomField()`
  - `deleteCustomField()`

#### Day 3-4: Form Configuration Generator
- [ ] Create `CustomFormConfigService.ts`
- [ ] Method to convert database fields to `CategoryFormConfig`
- [ ] Validation for custom forms
- [ ] Default field templates

#### Day 5: Integration
- [ ] Update `getFormConfig()` to check custom categories
- [ ] Update category selection screen to show custom categories
- [ ] Test custom form loading

### Phase 2: UI Components (Week 2)

#### Day 1-2: Category Management
- [ ] Create `CustomCategoriesScreen.tsx`
- [ ] List view with edit/delete
- [ ] Create category modal
- [ ] Icon picker component

#### Day 3-4: Form Builder
- [ ] Create `FormBuilderScreen.tsx`
- [ ] Field type selector
- [ ] Field properties editor
- [ ] Drag-and-drop reordering
- [ ] Live preview

#### Day 5: Polish
- [ ] Add animations
- [ ] Error handling
- [ ] Help tooltips
- [ ] User testing

### Phase 3: Advanced Features (Week 3)

#### Day 1-2: Templates
- [ ] Save form as template
- [ ] Template library
- [ ] Import/export templates
- [ ] Duplicate existing forms

#### Day 3-4: Sharing (Optional)
- [ ] Share template with QR code
- [ ] Import template from QR
- [ ] Community template gallery
- [ ] Rating system

#### Day 5: Testing & Documentation
- [ ] Unit tests
- [ ] Integration tests
- [ ] User guide
- [ ] Video tutorial

---

## 🎯 User Flow Example

### Creating "Music Festival" Category

1. **User opens Settings → Custom Event Categories**
2. **Taps "Create New Category"**
3. **Fills in basic info**:
   - Name: "Music Festival"
   - Description: "Multi-day music festivals and concerts"
   - Icon: 🎵 (music note)
   - Estimated time: "5-7 minutes"

4. **Adds custom fields**:
   - **Field 1**: Artist Lineup (Text Area, Required)
   - **Field 2**: Festival Days (Number, Required, Min: 1, Max: 7)
   - **Field 3**: Music Genres (Multi-Select, Optional)
     - Options: Rock, Pop, Jazz, Electronic, Hip-Hop, Country
   - **Field 4**: VIP Tickets Available (Checkbox, Optional)
   - **Field 5**: Camping Available (Checkbox, Optional)
   - **Field 6**: Age Restriction (Select, Required)
     - Options: All Ages, 18+, 21+

5. **Previews form** - sees exactly how it will look

6. **Saves** - now available in category selection!

7. **Creates event** - selects "Music Festival" category, fills custom form

---

## 🚀 Quick Start Templates

Pre-built templates users can start from:

1. **Blank Template** - Start from scratch
2. **Clone Existing** - Copy Conference/Wedding/etc and modify
3. **Import from File** - Load JSON template
4. **Community Templates**:
   - Music Festival
   - Charity Gala
   - Product Launch
   - Networking Event
   - Trade Show
   - Art Exhibition
   - Film Screening
   - Hackathon

---

## 💾 Data Format

### Custom Category JSON
```json
{
  "id": "custom_music_festival",
  "name": "Music Festival",
  "description": "Multi-day music festivals and concerts",
  "icon": "music-notes",
  "estimatedTime": "5-7 minutes",
  "fields": [
    {
      "id": "artist_lineup",
      "type": "textarea",
      "label": "Artist Lineup",
      "placeholder": "List headliners and performers...",
      "required": true,
      "helpText": "Include all performing artists",
      "order": 1
    },
    {
      "id": "festival_days",
      "type": "number",
      "label": "Festival Days",
      "placeholder": "e.g., 3",
      "required": true,
      "validation": [
        { "type": "min", "value": 1 },
        { "type": "max", "value": 7 }
      ],
      "order": 2
    },
    {
      "id": "music_genres",
      "type": "multiselect",
      "label": "Music Genres",
      "required": false,
      "options": ["Rock", "Pop", "Jazz", "Electronic", "Hip-Hop", "Country"],
      "order": 3
    }
  ]
}
```

---

## 🔒 Security & Validation

### Limits
- Max 20 custom categories per user
- Max 30 fields per form
- Field label max 100 characters
- Help text max 500 characters
- Options max 50 items

### Validation
- Prevent duplicate field IDs
- Validate field types
- Sanitize user input
- Check for SQL injection
- Validate JSON structure

---

## 📊 Benefits

### For Users
- ✅ Create forms for ANY event type
- ✅ No coding required
- ✅ Reusable templates
- ✅ Share with team
- ✅ Professional customization

### For Business
- ✅ Competitive advantage
- ✅ User retention
- ✅ Premium feature potential
- ✅ Community engagement
- ✅ Viral growth (template sharing)

---

## 🎓 Technical Considerations

### Performance
- Cache custom form configs
- Lazy load field options
- Optimize database queries
- Limit form complexity

### Backward Compatibility
- Keep built-in forms unchanged
- Custom forms stored separately
- Easy migration path
- Rollback capability

### User Experience
- Intuitive drag-and-drop
- Real-time preview
- Helpful tooltips
- Error prevention
- Undo/redo support

---

## 🚦 Implementation Priority

### Must Have (MVP)
- ✅ Create custom category
- ✅ Add basic field types (text, number, select)
- ✅ Save and use custom forms
- ✅ Edit/delete categories

### Should Have
- ✅ Advanced field types (multiselect, date, time)
- ✅ Field validation rules
- ✅ Drag-and-drop ordering
- ✅ Form preview
- ✅ Templates

### Nice to Have
- ⏸️ Template sharing
- ⏸️ Community gallery
- ⏸️ Import/export
- ⏸️ Conditional fields
- ⏸️ Field dependencies

---

## 📈 Success Metrics

- Number of custom categories created
- Custom forms usage rate
- Template sharing rate
- User satisfaction score
- Feature adoption rate

---

## 🎯 Next Steps

1. **Validate concept** with user interviews
2. **Design mockups** for UI/UX
3. **Create prototype** with basic functionality
4. **User testing** with beta users
5. **Iterate** based on feedback
6. **Launch** MVP version
7. **Add advanced features** based on usage

---

**Status**: 📋 Planning Phase  
**Estimated Time**: 3 weeks for MVP  
**Complexity**: Medium-High  
**Value**: High - Major differentiator
