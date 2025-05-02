import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, MagnifyingGlass, UserCirclePlus, DotsThreeVertical, Trash, PencilSimple, Users, Calendar, CheckCircle } from 'phosphor-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';
import * as _ from 'lodash';

type Attendee = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  checked_in: boolean;
  check_in_time?: string;
};

export default function ManageAttendeesScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById } = useEvents();
  
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttendee, setSelectedAttendee] = useState<string | null>(null);

  useEffect(() => {
    loadEventAndAttendees();
  }, [id]);

  // Use Lodash for filtering attendees with better performance and fuzzy matching
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAttendees(attendees);
    } else {
      // Normalize the search query (remove accents, lowercase)
      const normalizedQuery = _.deburr(_.toLower(searchQuery.trim()));
      
      // Use Lodash filter with custom predicate for better search
      const filtered = _.filter(attendees, (attendee: Attendee) => {
        // Check name (normalized for better matching)
        const nameMatch = _.includes(_.deburr(_.toLower(attendee.name)), normalizedQuery);
        
        // Check email if it exists
        const emailMatch = attendee.email ? 
          _.includes(_.toLower(attendee.email), normalizedQuery) : false;
        
        // Check phone if it exists (don't normalize phone numbers)
        const phoneMatch = attendee.phone ? 
          _.includes(attendee.phone, searchQuery.trim()) : false;
          
        return nameMatch || emailMatch || phoneMatch;
      });
      
      setFilteredAttendees(filtered);
    }
  }, [searchQuery, attendees]);

  const loadEventAndAttendees = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const eventData = await getEventById(id);
      setEvent(eventData);
      
      // Get attendees from the event data
      if (eventData && eventData.attendees) {
        setAttendees(eventData.attendees);
        setFilteredAttendees(eventData.attendees);
      } else {
        // If no attendees in event data, initialize with empty array
        setAttendees([]);
        setFilteredAttendees([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event and attendees');
      console.error('Error loading event and attendees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAttendee = () => {
    // Navigate to add attendee screen
    router.push(`/event/add-attendee/${id}`);
  };

  const handleEditAttendee = (attendeeId: string) => {
    // Navigate to edit attendee screen
    router.push(`/event/edit-attendee/${id}?attendeeId=${attendeeId}`);
  };

  const handleDeleteAttendee = (attendeeId: string) => {
    // Close the menu first to prevent UI issues
    setSelectedAttendee(null);
    
    // Then show the confirmation dialog
    Alert.alert(
      'Delete Attendee',
      'Are you sure you want to remove this attendee from the event?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real implementation, you would update the database
              // For now, we'll just update the local state
              setAttendees(prevAttendees => 
                prevAttendees.filter(attendee => attendee.id !== attendeeId)
              );
              
              // Also update the filtered attendees
              setFilteredAttendees(prevFiltered => 
                prevFiltered.filter(attendee => attendee.id !== attendeeId)
              );
              
              // Update the event object to reflect the change
              if (event) {
                const updatedEvent = {
                  ...event,
                  attendees: event.attendees.filter((attendee: Attendee) => attendee.id !== attendeeId)
                };
                setEvent(updatedEvent);
              }
            } catch (error) {
              console.error('Error deleting attendee:', error);
              Alert.alert('Error', 'Failed to delete attendee');
            }
          }
        }
      ]
    );
  };

  const handleImportAttendees = () => {
    // Navigate to import attendees screen
    router.push(`/event/import-attendees/${id}`);
  };

  // Handle check-in/out functionality
  const handleToggleCheckIn = async (attendeeId: string) => {
    try {
      // Find the attendee
      const attendee = attendees.find(a => a.id === attendeeId);
      if (!attendee) return;
      
      // Toggle the checked_in status
      const updatedAttendee = {
        ...attendee,
        checked_in: !attendee.checked_in,
        check_in_time: !attendee.checked_in ? new Date().toISOString() : undefined
      };
      
      // Update attendees array
      setAttendees(prevAttendees => 
        prevAttendees.map(a => a.id === attendeeId ? updatedAttendee : a)
      );
      
      // Update filtered attendees as well
      setFilteredAttendees(prevFiltered => 
        prevFiltered.map(a => a.id === attendeeId ? updatedAttendee : a)
      );
      
      // In a real implementation, you would update the database here
    } catch (error) {
      console.error('Error toggling check-in status:', error);
      Alert.alert('Error', 'Failed to update check-in status');
    }
  };
  
  // Toggle the attendee menu with proper positioning
  const toggleAttendeeMenu = (attendeeId: string) => {
    // Close any open menu first
    setSelectedAttendee(null);
    
    // Then open the new one after a brief delay to ensure clean UI
    setTimeout(() => {
      setSelectedAttendee(attendeeId);
    }, 50);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color="white" weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: 'white' }]}>Manage Attendees</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 16 }]}>Loading attendees...</Text>
        </View>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color="white" weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: 'white' }]}>Manage Attendees</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <View style={[styles.errorCard, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.md]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error || 'Event not found'}
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={loadEventAndAttendees}
            >
              <Text style={[styles.retryButtonText, { color: 'white' }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <CaretLeft size={24} color="white" weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: 'white' }]}>Manage Attendees</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Event Info Card */}
      <View style={[styles.eventInfoCard, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.md]}>
        <Text style={[styles.eventName, { color: theme.colors.textPrimary }]}>{event.title}</Text>
        <View style={styles.eventMetaContainer}>
          <View style={styles.eventMetaItem}>
            <Calendar size={16} color={theme.colors.textSecondary} weight="regular" style={styles.eventMetaIcon} />
            <Text style={[styles.eventMetaText, { color: theme.colors.textSecondary }]}>
              {event.date || 'No date set'}
            </Text>
          </View>
          <View style={styles.eventMetaItem}>
            <Users size={16} color={theme.colors.primary} weight="fill" style={styles.eventMetaIcon} />
            <View style={styles.attendeeCountContainer}>
              <Text style={[styles.attendeeCount, { color: theme.colors.primary }]}>
                {attendees.length}
              </Text>
              <Text style={[styles.eventMetaText, { color: theme.colors.textSecondary }]}>
                {attendees.length === 1 ? 'attendee' : 'attendees'} • {attendees.filter(a => a.checked_in).length} checked in
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
          <MagnifyingGlass size={20} color={theme.colors.textSecondary} weight="regular" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search by name, email, or phone"
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.primary + '10' }]}
          onPress={handleAddAttendee}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.primary }]}>
            <UserCirclePlus size={18} color="white" weight="fill" />
          </View>
          <Text style={[styles.actionButtonText, { color: theme.colors.textPrimary }]}>Add Attendee</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={handleImportAttendees}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.csvText, { color: theme.colors.primary }]}>CSV</Text>
          </View>
          <Text style={[styles.actionButtonText, { color: theme.colors.textPrimary }]}>Import</Text>
        </TouchableOpacity>
      </View>

      {/* Attendee List */}
      <FlatList
        data={filteredAttendees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.attendeeCard, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
            <View style={styles.attendeeInfo}>
              <Text style={[styles.attendeeName, { color: theme.colors.textPrimary }]}>{item.name}</Text>
              {item.email && (
                <Text style={[styles.attendeeEmail, { color: theme.colors.textSecondary }]}>{item.email}</Text>
              )}
              
              {/* Check-in status button */}
              <TouchableOpacity 
                style={[
                  styles.checkInButton, 
                  { 
                    backgroundColor: item.checked_in 
                      ? theme.colors.success + '20' 
                      : theme.colors.backgroundSecondary
                  }
                ]}
                onPress={() => handleToggleCheckIn(item.id)}
              >
                {item.checked_in ? (
                  <>
                    <CheckCircle size={14} color={theme.colors.success} weight="fill" style={{ marginRight: 6 }} />
                    <Text style={[styles.checkedInText, { color: theme.colors.success }]}>Checked In</Text>
                  </>
                ) : (
                  <Text style={[styles.checkedInText, { color: theme.colors.textSecondary }]}>Not Checked In</Text>
                )}
              </TouchableOpacity>
            </View>
            
            {/* Menu button */}
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => toggleAttendeeMenu(item.id)}
            >
              <DotsThreeVertical size={20} color={theme.colors.textSecondary} weight="regular" />
            </TouchableOpacity>
            
            {/* Dropdown menu - positioned absolutely */}
            {selectedAttendee === item.id && (
              <View 
                style={[
                  styles.menuPopupContainer,
                  { backgroundColor: 'rgba(0,0,0,0.5)' }
                ]}
              >
                <View style={[
                  styles.menuPopup, 
                  { backgroundColor: theme.colors.backgroundPrimary }, 
                  theme.shadows.md
                ]}>
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      setSelectedAttendee(null);
                      handleEditAttendee(item.id);
                    }}
                  >
                    <PencilSimple size={16} color={theme.colors.textPrimary} weight="regular" style={styles.menuItemIcon} />
                    <Text style={[styles.menuItemText, { color: theme.colors.textPrimary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => handleDeleteAttendee(item.id)}
                  >
                    <Trash size={16} color={theme.colors.error} weight="regular" style={styles.menuItemIcon} />
                    <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.attendeeList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyCard, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.md]}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {searchQuery ? 'No attendees match your search' : 'No attendees found for this event'}
              </Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddAttendee}
              >
                <UserCirclePlus size={18} color="white" weight="fill" style={{ marginRight: 8 }} />
                <Text style={styles.addButtonText}>Add Attendee</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    width: '90%',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventInfoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  eventName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventMetaContainer: {
    gap: 8,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventMetaIcon: {
    marginRight: 8,
  },
  eventMetaText: {
    fontSize: 14,
  },
  attendeeCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeCount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  csvText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  attendeeList: {
    padding: 16,
    paddingTop: 0,
  },
  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    position: 'relative',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  attendeeEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  checkedInText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  menuPopupContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuPopup: {
    borderRadius: 12,
    padding: 8,
    width: 150,
    marginTop: -20,
    alignSelf: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemIcon: {
    marginRight: 8,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
