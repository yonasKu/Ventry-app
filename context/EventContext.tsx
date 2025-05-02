import React, { createContext, useState, useEffect, useContext } from 'react';
import { nanoid } from 'nanoid/non-secure';
import { DatabaseService, Event, Attendee } from '../services/DatabaseService';
import { Alert } from 'react-native';

// Create an instance of the DatabaseService
const dbService = new DatabaseService();

// Define the EventContext type
interface EventContextType {
  events: Event[];
  loading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
  getEventById: (id: string) => Promise<(Event & { attendees?: Attendee[] }) | null>;
  createEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'attendees_count' | 'checked_in_count'>) => Promise<Event>;
  updateEvent: (id: string, eventData: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  getAttendees: (eventId: string) => Promise<Attendee[]>;
  addAttendee: (eventId: string, attendeeData: { name: string, email?: string, phone?: string }) => Promise<Attendee>;
  checkInAttendee: (attendeeId: string) => Promise<boolean>;
  deleteAttendee: (attendeeId: string) => Promise<boolean>;
}

// Create the context
const EventContext = createContext<EventContextType | undefined>(undefined);

// Create a provider component
export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Initialize the database and load events
  useEffect(() => {
    console.log('EventContext initialized');
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized) {
      refreshEvents();
    }
  }, [initialized]);

  // Refresh events - async for better UI response with larger datasets
  const refreshEvents = async () => {
    try {
      setLoading(true);
      console.log('Fetching events...');
      const fetchedEvents = await dbService.getEventsAsync();
      console.log('Fetched events:', fetchedEvents);
      setEvents(fetchedEvents || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
      // Use empty array instead of crashing
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Get event by ID - async
  const getEventById = async (id: string) => {
    try {
      console.log(`Getting event with ID: ${id}`);
      const event = await dbService.getEventByIdAsync(id);
      return event;
    } catch (err) {
      console.error('Error getting event by ID:', err);
      setError('Failed to get event');
      return null;
    }
  };

  // Create a new event - async
  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'attendees_count' | 'checked_in_count'>) => {
    try {
      console.log('Creating event with data:', eventData);
      
      // The addEventAsync method from DatabaseService now handles ID generation
      const newEvent = await dbService.addEventAsync(eventData);
      
      console.log('Event created successfully:', newEvent);
      setEvents(prev => [newEvent, ...prev]);
      return newEvent;
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
      throw err;
    }
  };

  // Update an event - async
  const updateEvent = async (id: string, eventData: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      console.log('Updating event:', id);
      const success = await dbService.updateEventAsync(id, eventData);
      
      if (success) {
        // If update was successful, refresh the events
        await refreshEvents();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating event:', err);
      setError('Failed to update event');
      throw err;
    }
  };

  // Delete an event - async
  const deleteEvent = async (id: string) => {
    try {
      console.log('Deleting event:', id);
      const success = await dbService.deleteEventAsync(id);
      
      if (success) {
        // Remove the event from the state
        setEvents(prev => prev.filter(e => e.id !== id));
      }
      return success;
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event');
      return false;
    }
  };

  // Get attendees for an event - async for large lists
  const getAttendees = async (eventId: string) => {
    try {
      console.log(`Getting attendees for event ID: ${eventId}`);
      return await dbService.getAttendeesAsync(eventId);
    } catch (err) {
      console.error('Error getting attendees:', err);
      setError('Failed to get attendees');
      return [];
    }
  };

  // Add attendee - async
  const addAttendee = async (eventId: string, attendeeData: { name: string, email?: string, phone?: string }) => {
    try {
      console.log(`Adding attendee to event ID: ${eventId}`);
      const newAttendee = await dbService.addAttendeeAsync(eventId, attendeeData);
      return newAttendee;
    } catch (err) {
      console.error('Error adding attendee:', err);
      setError('Failed to add attendee');
      throw err;
    }
  };

  // Check in attendee - async
  const checkInAttendee = async (attendeeId: string) => {
    try {
      console.log(`Checking in attendee ID: ${attendeeId}`);
      return await dbService.checkInAttendeeAsync(attendeeId);
    } catch (err) {
      console.error('Error checking in attendee:', err);
      setError('Failed to check in attendee');
      return false;
    }
  };

  // Delete attendee - async
  const deleteAttendee = async (attendeeId: string) => {
    try {
      console.log(`Deleting attendee ID: ${attendeeId}`);
      return await dbService.deleteAttendeeAsync(attendeeId);
    } catch (err) {
      console.error('Error deleting attendee:', err);
      setError('Failed to delete attendee');
      return false;
    }
  };

  return (
    <EventContext.Provider 
      value={{ 
        events, 
        loading, 
        error, 
        refreshEvents, 
        getEventById, 
        createEvent, 
        updateEvent, 
        deleteEvent,
        getAttendees,
        addAttendee,
        checkInAttendee,
        deleteAttendee
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

// Create a hook to use the event context
export const useEvents = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};
