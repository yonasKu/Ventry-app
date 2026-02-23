/**
 * Event Flow Integration Tests
 * 
 * Tests complete event lifecycle with real database.
 */

import { DatabaseService } from '../../../services/DatabaseService';
import { TestDatabaseHelper } from '../setup/testDatabase';

describe('Event Flow Integration', () => {
  let db: DatabaseService;

  beforeEach(() => {
    db = TestDatabaseHelper.createTestDatabase();
  });

  afterEach(() => {
    TestDatabaseHelper.cleanupDatabase(db);
  });

  test('complete event lifecycle', () => {
    // 1. Create event
    const eventId = db.addEvent({
      title: 'Conference 2026',
      date: '2026-06-15',
      time: '09:00',
      location: 'Convention Center',
      notes: 'Annual tech conference',
      expected_attendees: '500',
    });

    expect(eventId).toBeDefined();

    // 2. Add attendees
    const attendeeIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const attendeeId = db.addAttendee(eventId, {
        name: `Attendee ${i}`,
        email: `attendee${i}@example.com`,
        phone: `+123456789${i}`,
      });
      attendeeIds.push(attendeeId);
    }

    expect(attendeeIds.length).toBe(10);

    // 3. Verify attendee count
    let event = db.getEventById(eventId);
    expect(event?.attendees_count).toBe(10);
    expect(event?.checked_in_count).toBe(0);

    // 4. Check in some attendees
    for (let i = 0; i < 5; i++) {
      db.checkInAttendee(attendeeIds[i]);
    }

    // 5. Verify check-in count
    event = db.getEventById(eventId);
    expect(event?.checked_in_count).toBe(5);

    // 6. Get attendees and verify status
    const attendees = db.getAttendees(eventId);
    const checkedIn = attendees.filter(a => a.checked_in);
    const notCheckedIn = attendees.filter(a => !a.checked_in);

    expect(checkedIn.length).toBe(5);
    expect(notCheckedIn.length).toBe(5);

    // 7. Update event details
    db.updateEvent(eventId, {
      title: 'Conference 2026 - Updated',
      location: 'New Convention Center',
    });

    event = db.getEventById(eventId);
    expect(event?.title).toBe('Conference 2026 - Updated');
    expect(event?.location).toBe('New Convention Center');

    // 8. Delete some attendees
    db.deleteAttendee(attendeeIds[0]); // Was checked in
    db.deleteAttendee(attendeeIds[9]); // Was not checked in

    event = db.getEventById(eventId);
    expect(event?.attendees_count).toBe(8);
    expect(event?.checked_in_count).toBe(4);

    // 9. Clean up - delete event
    db.deleteEvent(eventId);

    expect(db.getEventById(eventId)).toBeNull();
    expect(db.getAttendees(eventId).length).toBe(0);
  });

  test('multiple events with different states', () => {
    // Create past event
    const pastEventId = db.addEvent({
      title: 'Past Event',
      date: '2026-01-15',
      time: '10:00',
      location: 'Old Venue',
    });

    // Create today's event
    const todayEventId = db.addEvent({
      title: 'Today Event',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      location: 'Current Venue',
    });

    // Create future event
    const futureEventId = db.addEvent({
      title: 'Future Event',
      date: '2026-12-31',
      time: '18:00',
      location: 'Future Venue',
    });

    // Add attendees to each
    for (let i = 0; i < 5; i++) {
      db.addAttendee(pastEventId, { name: `Past Attendee ${i}` });
      db.addAttendee(todayEventId, { name: `Today Attendee ${i}` });
      db.addAttendee(futureEventId, { name: `Future Attendee ${i}` });
    }

    // Get all events
    const events = db.getEvents();
    expect(events.length).toBe(3);

    // Verify each event has correct attendee count
    events.forEach(event => {
      expect(event.attendees_count).toBe(5);
    });
  });

  test('event with no attendees', () => {
    const eventId = db.addEvent({
      title: 'Empty Event',
      date: '2026-03-01',
      time: '14:00',
    });

    const event = db.getEventById(eventId);
    expect(event?.attendees_count).toBe(0);
    expect(event?.checked_in_count).toBe(0);

    const attendees = db.getAttendees(eventId);
    expect(attendees.length).toBe(0);
  });

  test('bulk check-in operation', () => {
    const eventId = db.addEvent({
      title: 'Bulk Check-in Test',
      date: '2026-03-01',
      time: '14:00',
    });

    // Add 50 attendees
    const attendeeIds: string[] = [];
    for (let i = 0; i < 50; i++) {
      attendeeIds.push(db.addAttendee(eventId, { name: `Attendee ${i}` }));
    }

    // Check in all attendees
    const start = Date.now();
    attendeeIds.forEach(id => db.checkInAttendee(id));
    const duration = Date.now() - start;

    // Should be fast
    expect(duration).toBeLessThan(1000);

    // Verify all checked in
    const event = db.getEventById(eventId);
    expect(event?.checked_in_count).toBe(50);
  });
});
