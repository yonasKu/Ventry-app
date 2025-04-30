import React, { createContext, useState, useEffect, useContext } from 'react';
import { nanoid } from 'nanoid/non-secure';
import { EventsDB, initDatabase, Event } from '../services/DatabaseService';
import { Alert } from 'react-native';

// Define the EventContext type
interface EventContextType {
  events: Event[];
  loading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
  getEventById: (id: string) => Promise<Event | null>;
  createEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'attendees_count' | 'checked_in_count'>) => Promise<Event>;
  updateEvent: (event: Event) => Promise<Event>;
  deleteEvent: (id: string) => Promise<boolean>;
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
    const initialize = async () => {
      try {
        console.log('Initializing database...');
        await initDatabase();
        console.log('Database initialized successfully');
        setInitialized(true);
      } catch (err) {
        console.error('Error initializing database:', err);
        setError('Failed to initialize database');
        setLoading(false);
        Alert.alert(
          'Database Error',
          'There was an error initializing the database. Some features may not work correctly.',
          [{ text: 'OK' }]
        );
      }
    };

    initialize();
  }, []);

  // Load events when the database is initialized
  useEffect(() => {
    if (initialized) {
      refreshEvents();
    }
  }, [initialized]);

  // Refresh events
  const refreshEvents = async () => {
    try {
      setLoading(true);
      console.log('Fetching events...');
      const fetchedEvents = await EventsDB.getEvents();
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

  // Get event by ID
  const getEventById = async (id: string) => {
    try {
      console.log(`Getting event with ID: ${id}`);
      const event = await EventsDB.getEventById(id);
      return event;
    } catch (err) {
      console.error('Error getting event by ID:', err);
      setError('Failed to get event');
      return null;
    }
  };

  // Create a new event
  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'attendees_count' | 'checked_in_count'>) => {
    try {
      const eventId = nanoid();
      console.log('Creating event with ID:', eventId);
      console.log('Event data:', eventData);
      
      const newEvent = await EventsDB.createEvent({
        id: eventId,
        ...eventData
      });
      
      console.log('Event created successfully:', newEvent);
      await refreshEvents();
      return newEvent;
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
      Alert.alert(
        'Error',
        'Failed to create event. Please try again.',
        [{ text: 'OK' }]
      );
      throw err;
    }
  };

  // Update an event
  const updateEvent = async (event: Event) => {
    try {
      console.log('Updating event:', event);
      const updatedEvent = await EventsDB.updateEvent(event);
      await refreshEvents();
      return updatedEvent;
    } catch (err) {
      console.error('Error updating event:', err);
      setError('Failed to update event');
      Alert.alert(
        'Error',
        'Failed to update event. Please try again.',
        [{ text: 'OK' }]
      );
      throw err;
    }
  };

  // Delete an event
  const deleteEvent = async (id: string) => {
    try {
      console.log(`Deleting event with ID: ${id}`);
      const result = await EventsDB.deleteEvent(id);
      await refreshEvents();
      return result;
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event');
      Alert.alert(
        'Error',
        'Failed to delete event. Please try again.',
        [{ text: 'OK' }]
      );
      throw err;
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
