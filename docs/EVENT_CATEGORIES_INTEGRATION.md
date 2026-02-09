# Event Categories Integration

## Overview
Event categories have been successfully integrated into the create and edit event forms. These categories match the field templates defined in `data/fieldTemplates.ts` and allow users to classify their events for better organization and automatic field template application.

## Available Categories
The following event categories are now available:
1. **Corporate Event** - Standard fields for corporate events and meetings
2. **Conference** - Fields for conferences, seminars, and workshops
3. **Workshop** - Educational and training events
4. **Restaurant/Club** - Fields for restaurant reservations and club events
5. **School/University** - Fields for educational events and activities

## Implementation Details

### Database Changes
- Added `category` field to the `Event` interface in `services/DatabaseService.ts`
- Added database migration to add `category` column to the `events` table
- Updated `addEvent()` method to include category in INSERT statement
- Updated `updateEvent()` method (already supports dynamic fields, so category works automatically)

### UI Changes

#### Create Event Screen (`app/create-event.tsx`)
- Added category picker dropdown after the event name field
- Users can select a category or leave it as "None" (optional field)
- Category is saved when creating the event
- Visual feedback shows selected category with primary color and bold text

#### Edit Event Screen (`app/event/edit/[id].tsx`)
- Added category picker dropdown after the event name field
- Loads existing category when editing an event
- Users can change or remove the category
- Category is updated when saving the event

### User Experience
- **Optional Field**: Category selection is optional - users can create events without selecting a category
- **Visual Feedback**: Selected category is highlighted in the picker with primary color and bold text
- **Easy Selection**: Tap to open dropdown, tap category to select, automatically closes after selection
- **Clear Option**: "None" option at the top of the picker to remove category selection

## Future Enhancements
The category field can be used for:
1. **Auto-applying Field Templates**: When a category is selected, automatically apply the corresponding field template to attendees
2. **Filtering Events**: Filter events by category on the home screen
3. **Statistics by Category**: Show analytics grouped by event category
4. **Category-specific Defaults**: Pre-fill certain fields based on category selection
5. **Category Icons**: Add visual icons for each category type

## Usage Example

### Creating an Event with Category
```typescript
const newEvent = await createEvent({
  title: 'Annual Tech Conference',
  date: '2024-03-15',
  time: '09:00:00',
  location: 'Convention Center',
  notes: 'Keynote speakers and workshops',
  expected_attendees: 500,
  category: 'Conference' // New category field
});
```

### Updating Event Category
```typescript
await updateEvent(eventId, {
  category: 'Corporate Event' // Change category
});
```

## Technical Notes
- Category is stored as a nullable string in the database
- The category picker uses a simple dropdown UI that matches the app's design system
- Categories are defined as a constant array that can be easily modified
- The implementation is backward compatible - existing events without categories will show "None"
