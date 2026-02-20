# Missing UI Connections - Features That Exist But Aren't Connected

## 1. ❌ CUSTOM FIELDS - NOT ACCESSIBLE FROM EVENT DETAIL SCREEN

**Status**: Feature fully implemented but NO button to access it

**What exists**:
- ✅ Custom fields service (`services/CustomFieldsService.ts`)
- ✅ Custom fields screens:
  - `app/event/custom-fields/[id].tsx` - Manage custom fields
  - `app/event/custom-fields/add/[id].tsx` - Add new field
  - `app/event/custom-fields/templates/[id].tsx` - Apply templates
- ✅ Field templates for different event types (Corporate, Conference, Restaurant/Club, School)
- ✅ Custom fields used in add-attendee screen

**What's missing**:
- ❌ NO button on event detail screen (`app/event/[id].tsx`) to access custom fields
- ❌ Users cannot configure custom fields for their events
- ❌ Templates exist but users can't apply them

**Fix needed**:
Add "Custom Fields" button to the action grid in `app/event/[id].tsx`

---

## 2. ❌ EVENT CATEGORIES - NOT INTEGRATED IN CREATE/EDIT EVENT

**Status**: Categories exist in templates but NOT in event creation flow

**What exists**:
- ✅ Event categories defined in `data/fieldTemplates.ts`:
  - Corporate Event
  - Conference  
  - Workshop
  - Restaurant/Club
  - School/University
- ✅ Each category has specific custom field templates
- ✅ CSV import templates for different event types

**What's missing**:
- ❌ NO event type/category field in Event model
- ❌ NO event type selector in create event screen
- ❌ NO event type selector in edit event screen
- ❌ NO database column for event_type
- ❌ Cannot filter events by category
- ❌ Cannot auto-apply custom field templates based on event type

**Fix needed**:
1. Add `event_type` column to database
2. Update Event model
3. Add category dropdown to create-event screen
4. Add category dropdown to edit event screen
5. Auto-suggest custom field templates based on selected category

---

## 3. ✅ IMPORT ATTENDEES - CONNECTED (via Attendees screen)

**Status**: Accessible from attendees list screen

**Access path**: Event Detail → Attendees → Import button

---

## 4. ✅ I18N/LANGUAGE SELECTOR - CONNECTED (via Account screen)

**Status**: Accessible from account/settings tab

**What exists**:
- ✅ i18n configuration (`i18n/config.ts`)
- ✅ Language files (en, es, fr)
- ✅ LanguageSelector component
- ✅ Integrated in Account screen

**Access path**: Account Tab → Language setting

---

## 5. ❌ SCAN QR BUTTON BROKEN ON EVENT DETAIL

**Status**: Button exists but navigates to wrong route

**Issue**: 
- Button says "Scan QR" but navigates to `/event/scan/${id}`
- Should navigate to `/event/scan-qr/${id}`
- There's a duplicate "Scan QR" button (one correct, one broken)

**Fix needed**:
Fix the navigation route in `app/event/[id].tsx` line ~460

---

## PRIORITY FIXES

### HIGH PRIORITY:
1. **Add Custom Fields button to Event Detail screen**
   - Most important missing connection
   - Feature is fully built but completely inaccessible

2. **Integrate Event Categories**
   - Add event_type to database and models
   - Add category selector to create/edit screens
   - Link categories to custom field templates

### MEDIUM PRIORITY:
3. **Fix duplicate/broken Scan QR button**
   - Simple navigation fix

---

## IMPLEMENTATION CHECKLIST

### Custom Fields Access:
- [ ] Add "Custom Fields" action button to event detail screen
- [ ] Use icon: `Sliders` or `ListChecks` from phosphor-react-native
- [ ] Navigate to: `/event/custom-fields/${id}`

### Event Categories Integration:
- [ ] Add `event_type TEXT` column to events table
- [ ] Update Event interface in `models/Event.ts`
- [ ] Add category dropdown to `app/create-event.tsx`
- [ ] Add category dropdown to `app/event/edit/[id].tsx`
- [ ] Update DatabaseService CRUD operations
- [ ] Show event category badge on event detail screen
- [ ] Optional: Auto-suggest templates when category is selected

### Bug Fixes:
- [ ] Fix Scan QR navigation route
- [ ] Remove duplicate Export button
- [ ] Remove duplicate Scan QR button
