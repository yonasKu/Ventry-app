// Common mock data for tests
import { Event as ModelEvent, Attendee as ModelAttendee } from '../../models/Event';
import { Event, Attendee } from '../../services/DatabaseService';

export const mockEvent: Event = {
  id: 'test-event-1',
  title: 'Test Event',
  date: '2026-02-20',
  time: '10:00',
  location: 'Test Location',
  notes: 'Test notes',
  expected_attendees: '100',
  attendees_count: 0,
  checked_in_count: 0,
  created_at: new Date('2026-02-20T10:00:00Z').toISOString(),
  updated_at: new Date('2026-02-20T10:00:00Z').toISOString(),
};

export const mockEvent2: Event = {
  id: 'test-event-2',
  title: 'Another Event',
  date: '2026-03-15',
  time: '14:00',
  location: 'Another Location',
  notes: 'More notes',
  expected_attendees: '50',
  attendees_count: 0,
  checked_in_count: 0,
  created_at: new Date('2026-02-20T10:00:00Z').toISOString(),
  updated_at: new Date('2026-02-20T10:00:00Z').toISOString(),
};

export const mockAttendee: Attendee = {
  id: 'test-attendee-1',
  event_id: 'test-event-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  checked_in: false,
  check_in_time: null,
  created_at: new Date('2026-02-20T10:00:00Z').toISOString(),
  updated_at: new Date('2026-02-20T10:00:00Z').toISOString(),
};

export const mockAttendee2: Attendee = {
  id: 'test-attendee-2',
  event_id: 'test-event-1',
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+0987654321',
  checked_in: true,
  check_in_time: new Date('2026-02-20T11:00:00Z').toISOString(),
  created_at: new Date('2026-02-20T10:00:00Z').toISOString(),
  updated_at: new Date('2026-02-20T11:00:00Z').toISOString(),
};

export const mockCustomField = {
  id: 'test-field-1',
  eventId: 'test-event-1',
  name: 'Company',
  type: 'text',
  required: true,
  order: 0,
  validation: {},
};

export const mockCustomFieldValue = {
  id: 'test-value-1',
  attendeeId: 'test-attendee-1',
  fieldId: 'test-field-1',
  value: 'Acme Corp',
};

export const mockBackupData = {
  version: '1.0.0',
  timestamp: new Date('2026-02-20T10:00:00Z').toISOString(),
  deviceId: 'test-device-1',
  deviceName: 'Test Device',
  data: {
    events: [mockEvent],
    attendees: [mockAttendee],
    customFields: [mockCustomField],
    customFieldValues: [mockCustomFieldValue],
    fieldTemplates: [],
  },
  counts: {
    events: 1,
    attendees: 1,
    customFields: 1,
    fieldTemplates: 0,
  },
};

// Helper function to create multiple mock attendees
export const createMockAttendees = (count: number, eventId: string): Attendee[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `test-attendee-${i + 1}`,
    event_id: eventId,
    name: `Attendee ${i + 1}`,
    email: `attendee${i + 1}@example.com`,
    phone: `+123456789${i}`,
    checked_in: i % 2 === 0, // Every other attendee is checked in
    check_in_time: i % 2 === 0 ? new Date('2026-02-20T11:00:00Z').toISOString() : null,
    created_at: new Date('2026-02-20T10:00:00Z').toISOString(),
    updated_at: new Date('2026-02-20T10:00:00Z').toISOString(),
  }));
};

// Helper function to create multiple mock events
export const createMockEvents = (count: number): Event[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `test-event-${i + 1}`,
    name: `Event ${i + 1}`,
    date: `2026-02-${20 + i}`,
    time: '10:00',
    location: `Location ${i + 1}`,
    notes: `Notes ${i + 1}`,
    expectedAttendees: 100,
    attendeeCount: 0,
    checkedInCount: 0,
    category: 'Conference',
    createdAt: new Date('2026-02-20T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-02-20T10:00:00Z').toISOString(),
  }));
};
