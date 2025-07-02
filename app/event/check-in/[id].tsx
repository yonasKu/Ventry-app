import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, FlatList, RefreshControl, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, MagnifyingGlass, CheckCircle, UserCirclePlus, QrCode, Users } from 'phosphor-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';
import * as _ from 'lodash';
import SlideToCheckIn from '../../../components/SlideToCheckIn';
import { Attendee } from '../../../models/Attendee';

export default function CheckInScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const { getEventById, checkInAttendee } = useEvents();
  
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to load event data when id changes
  useEffect(() => {
    if (id) {
      console.log("Loading event data for ID:", id);
      loadEventAndAttendees();
    } else {
      console.error("No event ID provided");
      setError("No event ID provided");
    }
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

  const loadEventAndAttendees = async (showLoading = true) => {
    if (!id) return;
    
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      // Fetch event with attendees
      const eventData = await getEventById(id);
      
      if (eventData) {
        setEvent(eventData);
        
        if (eventData.attendees) {
          // Sort attendees alphabetically by name and map to local Attendee type
          const sortedAttendees = _.sortBy(eventData.attendees, [(a) => a.name.toLowerCase()])
            .map(a => ({
              id: a.id,
              event_id: a.event_id,
              name: a.name,
              email: a.email || null,
              phone: a.phone || null,
              checked_in: a.checked_in,
              check_in_time: a.check_in_time || null,
              created_at: a.created_at,
              updated_at: a.updated_at
            }));
            
          setAttendees(sortedAttendees);
          setFilteredAttendees(sortedAttendees);
        } else {
          setAttendees([]);
          setFilteredAttendees([]);
        }
      } else {
        setError('Event not found');
      }
    } catch (err) {
      console.error('Error loading event data:', err);
      setError('Failed to load event data');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadEventAndAttendees(false);
  };

  const handleToggleCheckIn = async (attendeeId: string) => {
    try {
      const attendee = attendees.find((a) => a.id === attendeeId);
      if (!attendee) return;

      await checkInAttendee(attendeeId, id);
      // Optimistically update UI
      const newCheckedInStatus = !attendee.checked_in;
      setAttendees((prevAttendees) =>
        prevAttendees.map((a) =>
          a.id === attendeeId
            ? {
                ...a,
                checked_in: newCheckedInStatus,
                check_in_time: newCheckedInStatus
                  ? new Date().toISOString()
                  : null,
              }
            : a
        )
      );
    } catch (error) {
      console.error('Error toggling check-in status:', error);
      Alert.alert('Error', 'Failed to update check-in status');
      loadEventAndAttendees(false); // Re-fetch to correct optimistic update
    }
  };

  const handleAddAttendee = () => {
    // Navigate to add attendee screen
    router.push(`/event/add-attendee/${id}`);
  };

  const handleScanQR = () => {
    // Navigate to QR scanner screen
    router.push(`/event/scan/${id}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }


  if (error || !event) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error || 'Event not found'}</Text>
        <TouchableOpacity style={[styles.retryButton, {backgroundColor: theme.colors.primary}]} onPress={() => loadEventAndAttendees()}>
          <Text style={{color: 'white', fontWeight: 'bold'}}>Retry</Text>
        </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: "white" }]}>Check-In</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.contentContainer}>
        {/* Event Card */}
        <View style={[styles.eventInfoCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <View style={styles.eventInfoHeader}>
            <Text style={[styles.eventName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{event.title}</Text>
            <View style={[styles.eventStatsBadge, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Users size={16} color={theme.colors.primary} weight="bold" />
              <Text style={[styles.eventStats, { color: theme.colors.primary }]}>
                {attendees.filter(a => a.checked_in).length} / {attendees.length}
              </Text>
            </View>
          </View>
          <Text style={[styles.eventDate, { color: theme.colors.textSecondary }]}>
            {event.date ? new Date(event.date).toLocaleDateString() : ''}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <MagnifyingGlass size={22} color={theme.colors.textSecondary} weight="regular" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search attendees..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleScanQR}
          >
            <QrCode size={22} color="white" weight="bold" style={styles.actionButtonIcon} />
            <Text style={[styles.actionButtonText, { color: "white" }]}>Scan QR</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.backgroundPrimary, borderColor: theme.colors.border, borderWidth: 1 }]}
            onPress={handleAddAttendee}
          >
            <UserCirclePlus size={22} color={theme.colors.primary} weight="bold" style={styles.actionButtonIcon} />
            <Text style={[styles.actionButtonText, { color: theme.colors.textPrimary }]}>Add Attendee</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredAttendees}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={({ item }) => (
          <SlideToCheckIn
            attendee={item}
            onCheckIn={() => handleToggleCheckIn(item.id)}
            onUncheckIn={() => handleToggleCheckIn(item.id)}
          />
        )}
        contentContainerStyle={styles.attendeeList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {searchQuery ? 'No attendees match your search' : 'No attendees found for this event'}
            </Text>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  eventInfoCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventName: {
    fontSize: 22,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  eventStatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  eventStats: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  eventDate: {
    fontSize: 14,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonIcon: {
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  attendeeList: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#888',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8
  }
});
