// Common mock data for tests
import { Event, Attendee } from '../../models/Event';

export const mockEvent: Event = {
  id: 'test-event-1',
  name: 'Test Event',
  date: '2026-02-20',
  time: '10:00',
  location: 'Test Location',
  notes: 'Test notes',
  expectedAttendees: 100,
  attendeeCount: 0,
  checkedInCount: 0,
  category: 'Conference',
  createdAt: new Date('2026-02-20T10:00:00Z').toISOString(),
  updatedAt: new Date('2026-02-20T10:00:00Z').toISOString(),
};

export const mockEvent2: Event = {
  id: 'test-event-2',
  name: 'Another Event',
  date: '2026-03-15',
  time: '14:00',
  location: 'Another Location',
  notes: 'More notes',
  expectedAttendees: 50,
  attendeeCount: 0,
  checkedInCount: 0,
  category: 'Workshop',
  createdAt: new Date('2026-02-20T10:00:00Z').toISOString(),
  updatedAt: new Date('2026-02-20T10:00:00Z').toISOString(),
};

export const mockAttendee: Attendee = {
  id: 'test-attendee-1',
  eventId: 'test-event-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  checkedIn: false,
  checkInTime: null,
  createdAt: new Date('2026-02-20T10:00:00Z').toISOString(),
  updatedAt: new Date('2026-02-20T10:00:00Z').toISOString(),
};

export const mockAttendee2: Attendee = {
  id: 'test-attendee-2',
  eventId: 'test-event-1',
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+0987654321',
  checkedIn: true,
  checkInTime: new Date('2026-02-20T11:00:00Z').toISOString(),
  createdAt: new Date('2026-02-20T10:00:00Z').toISOString(),
  updatedAt: new Date('2026-02-20T11:00:00Z').toISOString(),
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
    eventId,
    name: `Attendee ${i + 1}`,
    email: `attendee${i + 1}@example.com`,
    phone: `+123456789${i}`,
    checkedIn: i % 2 === 0, // Every other attendee is checked in
    checkInTime: i % 2 === 0 ? new Date('2026-02-20T11:00:00Z').toISOString() : null,
    createdAt: new Date('2026-02-20T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-02-20T10:00:00Z').toISOString(),
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
