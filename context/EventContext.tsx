import React, { createContext, useState, useEffect, useContext } from 'react';
import { DatabaseService, Event, Attendee } from '../services/DatabaseService';
import NotificationService from '../services/NotificationService';

// Get the DatabaseService singleton instance
console.log('Getting DatabaseService instance in EventContext');
const dbService = DatabaseService.getInstance();
console.log('DatabaseService instance retrieved successfully');

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
  getAttendeeById: (attendeeId: string) => Promise<Attendee | null>;
  addAttendee: (eventId: string, attendeeData: { name: string, email?: string, phone?: string }) => Promise<Attendee>;
  checkInAttendee: (attendeeId: string, eventId: string) => Promise<Attendee | null>;
  toggleAttendeeCheckIn: (attendeeId: string, eventId: string) => Promise<Attendee | null>;
  deleteAttendee: (attendeeId: string) => Promise<boolean>;
}

// Create the context
const EventContext = createContext<EventContextType | undefined>(undefined);

// Create a provider component
export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('Rendering EventProvider component');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Initialize the database and load events
  useEffect(() => {
    console.log('EventContext useEffect running - setting initialized');
    // Initialize notification service (without requesting permissions yet)
    NotificationService.initialize().catch(err => 
      console.error('Error initializing notifications:', err)
    );
    setInitialized(true);
    console.log('EventContext initialized set to true');
  }, []);

  useEffect(() => {
    if (initialized) {
      console.log('EventContext initialized, calling refreshEvents');
      refreshEvents().catch(err => console.error('Error in refreshEvents:', err));
    }
  }, [initialized]);

  // Refresh events - async for better UI response with larger datasets
  const refreshEvents = async () => {
    console.log('refreshEvents called');
    try {
      console.log('Setting loading to true');
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
      
      // Request notification permissions and schedule notifications
      try {
        const hasPermission = await NotificationService.requestPermissions();
        if (hasPermission) {
          await NotificationService.scheduleEventReminders(newEvent);
          console.log('Notifications scheduled for event:', newEvent.id);
        } else {
          console.log('Notification permissions not granted, skipping scheduling');
        }
      } catch (notifError) {
        console.error('Error scheduling notifications:', notifError);
        // Don't fail event creation if notifications fail
      }
      
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
        
        // Cancel old notifications and reschedule if date/time changed
        if (eventData.date || eventData.time) {
          try {
            await NotificationService.cancelEventNotifications(id);
            const updatedEvent = await dbService.getEventByIdAsync(id);
            if (updatedEvent) {
              await NotificationService.scheduleEventReminders(updatedEvent);
              console.log('Notifications rescheduled for updated event:', id);
            }
          } catch (notifError) {
            console.error('Error rescheduling notifications:', notifError);
          }
        }
        
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
      
      // Cancel all notifications for this event
      try {
        await NotificationService.cancelEventNotifications(id);
        console.log('Notifications canceled for deleted event:', id);
      } catch (notifError) {
        console.error('Error canceling notifications:', notifError);
      }
      
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
  const checkInAttendee = async (attendeeId: string, eventId: string): Promise<Attendee | null> => {
    try {
      console.log(`Checking in attendee ID: ${attendeeId} for event ID: ${eventId}`);
      
      // Get event and attendees before check-in
      const event = await dbService.getEventByIdAsync(eventId);
      const attendees = await dbService.getAttendeesAsync(eventId);
      const attendee = attendees.find(a => a.id === attendeeId);
      
      if (!event || !attendee) {
        return null;
      }
      
      // Check if this is the first check-in
      const isFirstCheckIn = attendees.every((a: Attendee) => !a.checked_in);
      
      // Perform the check-in
      const result = await dbService.checkInAttendeeAsync(attendeeId, eventId);
      
      if (result && result.checked_in) {
        // Send first check-in notification
        if (isFirstCheckIn) {
          try {
            await NotificationService.sendFirstCheckInNotification(
              attendee.name,
              event.title,
              eventId
            );
          } catch (notifError) {
            console.error('Error sending first check-in notification:', notifError);
          }
        }
        
        // Calculate check-in rate and send milestone notifications
        const updatedAttendees = await dbService.getAttendeesAsync(eventId);
        const checkedInCount = updatedAttendees.filter((a: Attendee) => a.checked_in).length;
        const totalCount = updatedAttendees.length;
        const checkInRate = (checkedInCount / totalCount) * 100;
        
        // 50% milestone
        if (checkInRate >= 50 && checkInRate < 50 + (100 / totalCount)) {
          try {
            await NotificationService.sendMilestoneNotification(
              50,
              checkedInCount,
              totalCount,
              event.title,
              eventId
            );
          } catch (notifError) {
            console.error('Error sending 50% milestone notification:', notifError);
          }
        }
        
        // 100% milestone
        if (checkInRate === 100) {
          try {
            await NotificationService.sendMilestoneNotification(
              100,
              checkedInCount,
              totalCount,
              event.title,
              eventId
            );
          } catch (notifError) {
            console.error('Error sending 100% milestone notification:', notifError);
          }
        }
      }
      
      return result;
    } catch (err) {
      console.error('Error checking in attendee:', err);
      setError('Failed to check in attendee');
      return null;
    }
  };

  // Toggle attendee check-in state from the app UI
  const toggleAttendeeCheckIn = async (attendeeId: string, eventId: string): Promise<Attendee | null> => {
    try {
      console.log(`Toggling attendee ID: ${attendeeId} for event ID: ${eventId}`);

      const result = await dbService.toggleAttendeeCheckInAsync(attendeeId, eventId);
      if (result) {
        await refreshEvents();
      }

      return result;
    } catch (err) {
      console.error('Error toggling attendee check-in:', err);
      setError('Failed to update attendee check-in');
      return null;
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

  // Get a single attendee by ID - async
  const getAttendeeById = async (attendeeId: string): Promise<Attendee | null> => {
    try {
      console.log(`Getting attendee with ID: ${attendeeId}`);
      return await dbService.getAttendeeByIdAsync(attendeeId);
    } catch (err) {
      console.error('Error getting attendee:', err);
      setError('Failed to get attendee');
      return null;
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
        getAttendeeById,
        addAttendee,
        checkInAttendee,
        toggleAttendeeCheckIn,
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
