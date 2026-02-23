/**
 * DatabaseService Integration Tests
 * 
 * Tests DatabaseService with real SQLite database (in-memory).
 */

import { DatabaseService } from '../../../services/DatabaseService';
import { TestDatabaseHelper } from '../setup/testDatabase';

describe('DatabaseService Integration', () => {
  let db: DatabaseService;

  beforeEach(() => {
    db = TestDatabaseHelper.createTestDatabase();
  });

  afterEach(() => {
    TestDatabaseHelper.cleanupDatabase(db);
  });

  describe('Event Operations', () => {
    test('should create and retrieve event', () => {
      const eventId = db.addEvent({
        title: 'Test Event',
        date: '2026-03-01',
        time: '14:00',
        location: 'Test Location',
        notes: 'Test notes',
        expected_attendees: '100',
      });

      const event = db.getEventById(eventId);
      
      expect(event).toBeDefined();
      expect(event?.title).toBe('Test Event');
      expect(event?.date).toBe('2026-03-01');
      expect(event?.time).toBe('14:00');
      expect(event?.location).toBe('Test Location');
    });

    test('should update event', () => {
      const eventId = db.addEvent({
        title: 'Original Title',
        date: '2026-03-01',
        time: '14:00',
        location: 'Original Location',
      });

      db.updateEvent(eventId, {
        title: 'Updated Title',
        location: 'Updated Location',
      });

      const event = db.getEventById(eventId);
      expect(event?.title).toBe('Updated Title');
      expect(event?.location).toBe('Updated Location');
      expect(event?.date).toBe('2026-03-01'); // Unchanged
    });

    test('should delete event', () => {
      const eventId = db.addEvent({
        title: 'To Delete',
        date: '2026-03-01',
        time: '14:00',
      });

      db.deleteEvent(eventId);

      const event = db.getEventById(eventId);
      expect(event).toBeNull();
    });

    test('should get all events', () => {
      db.addEvent({ title: 'Event 1', date: '2026-03-01', time: '14:00' });
      db.addEvent({ title: 'Event 2', date: '2026-03-02', time: '15:00' });
      db.addEvent({ title: 'Event 3', date: '2026-03-03', time: '16:00' });

      const events = db.getEvents();
      expect(events.length).toBe(3);
    });
  });

  describe('Attendee Operations', () => {
    let eventId: string;

    beforeEach(() => {
      eventId = db.addEvent({
        title: 'Test Event',
        date: '2026-03-01',
        time: '14:00',
      });
    });

    test('should add attendee to event', () => {
      const attendeeId = db.addAttendee(eventId, {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      });

      const attendees = db.getAttendees(eventId);
      expect(attendees.length).toBe(1);
      expect(attendees[0].name).toBe('John Doe');
      expect(attendees[0].email).toBe('john@example.com');
    });

    test('should update attendee count when adding', () => {
      db.addAttendee(eventId, { name: 'Attendee 1' });
      db.addAttendee(eventId, { name: 'Attendee 2' });

      const event = db.getEventById(eventId);
      expect(event?.attendees_count).toBe(2);
    });

    test('should check in attendee', () => {
      const attendeeId = db.addAttendee(eventId, {
        name: 'John Doe',
        email: 'john@example.com',
      });

      db.checkInAttendee(attendeeId);

      const attendees = db.getAttendees(eventId);
      expect(attendees[0].checked_in).toBe(true);
      expect(attendees[0].check_in_time).toBeDefined();
    });

    test('should update checked in count', () => {
      const attendeeId1 = db.addAttendee(eventId, { name: 'Attendee 1' });
      const attendeeId2 = db.addAttendee(eventId, { name: 'Attendee 2' });

      db.checkInAttendee(attendeeId1);

      const event = db.getEventById(eventId);
      expect(event?.checked_in_count).toBe(1);

      db.checkInAttendee(attendeeId2);

      const updatedEvent = db.getEventById(eventId);
      expect(updatedEvent?.checked_in_count).toBe(2);
    });

    test('should delete attendee', () => {
      const attendeeId = db.addAttendee(eventId, { name: 'To Delete' });

      db.deleteAttendee(attendeeId);

      const attendees = db.getAttendees(eventId);
      expect(attendees.length).toBe(0);
    });

    test('should update attendee count when deleting', () => {
      const attendeeId1 = db.addAttendee(eventId, { name: 'Attendee 1' });
      const attendeeId2 = db.addAttendee(eventId, { name: 'Attendee 2' });

      expect(db.getEventById(eventId)?.attendees_count).toBe(2);

      db.deleteAttendee(attendeeId1);

      expect(db.getEventById(eventId)?.attendees_count).toBe(1);
    });
  });

  describe('Data Integrity', () => {
    test('should cascade delete attendees when event is deleted', () => {
      const eventId = db.addEvent({
        title: 'Event to Delete',
        date: '2026-03-01',
        time: '14:00',
      });

      db.addAttendee(eventId, { name: 'Attendee 1' });
      db.addAttendee(eventId, { name: 'Attendee 2' });

      expect(db.getAttendees(eventId).length).toBe(2);

      db.deleteEvent(eventId);

      expect(db.getAttendees(eventId).length).toBe(0);
    });

    test('should maintain accurate counters', () => {
      const eventId = db.addEvent({
        title: 'Counter Test',
        date: '2026-03-01',
        time: '14:00',
      });

      // Add 5 attendees
      const attendeeIds = [];
      for (let i = 0; i < 5; i++) {
        attendeeIds.push(db.addAttendee(eventId, { name: `Attendee ${i}` }));
      }

      expect(db.getEventById(eventId)?.attendees_count).toBe(5);

      // Check in 3 attendees
      db.checkInAttendee(attendeeIds[0]);
      db.checkInAttendee(attendeeIds[1]);
      db.checkInAttendee(attendeeIds[2]);

      expect(db.getEventById(eventId)?.checked_in_count).toBe(3);

      // Delete 1 checked-in attendee
      db.deleteAttendee(attendeeIds[0]);

      const event = db.getEventById(eventId);
      expect(event?.attendees_count).toBe(4);
      expect(event?.checked_in_count).toBe(2);
    });
  });

  describe('Performance', () => {
    test('should handle 100 events efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        db.addEvent({
          title: `Event ${i}`,
          date: '2026-03-01',
          time: '14:00',
        });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should take less than 1 second
    });

    test('should handle 1000 attendees efficiently', () => {
      const eventId = db.addEvent({
        title: 'Large Event',
        date: '2026-03-01',
        time: '14:00',
      });

      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        db.addAttendee(eventId, {
          name: `Attendee ${i}`,
          email: `attendee${i}@test.com`,
        });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(3000); // Should take less than 3 seconds

      const attendees = db.getAttendees(eventId);
      expect(attendees.length).toBe(1000);
    });
  });
});
