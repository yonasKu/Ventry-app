import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, MagnifyingGlass, CheckCircle, UserCirclePlus, QrCode, Users } from 'phosphor-react-native';
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

export default function CheckInScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById, checkInAttendee } = useEvents();
  
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      // Use the attendees from the event data
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

  const handleCheckIn = async (attendeeId: string) => {
    try {
      // Update the database
      const success = await checkInAttendee(attendeeId);
      
      if (success) {
        // Update the local state
        setAttendees(prevAttendees => 
          prevAttendees.map(attendee => 
            attendee.id === attendeeId 
              ? { ...attendee, checked_in: true, check_in_time: new Date().toISOString() } 
              : attendee
          )
        );
      }
    } catch (error) {
      console.error('Error checking in attendee:', error);
      Alert.alert('Error', 'Failed to check in attendee');
    }
  };

  const handleAddAttendee = () => {
    // Navigate to add attendee screen
    router.push(`/event/add-attendee/${id}`);
  };

  const handleScanQR = () => {
    // Navigate to QR scanner screen
    router.push(`/event/scan-qr/${id}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.backgroundPrimary} />
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary }}>Check-In</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.backgroundPrimary} />
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary }}>Check-In</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
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

      <View style={styles.eventInfoContainer}>
        <View style={[styles.eventInfoCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <View style={styles.eventInfoHeader}>
            <Text style={[styles.eventName, { color: theme.colors.textPrimary }]}>{event.title}</Text>
            <View style={[styles.eventStatsBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Users size={14} color={theme.colors.primary} weight="bold" />
              <Text style={[styles.eventStats, { color: theme.colors.primary }]}>
                {attendees.filter(a => a.checked_in).length} / {attendees.length}
              </Text>
            </View>
          </View>
          <Text style={[styles.eventDate, { color: theme.colors.textSecondary }]}>
            {event.date ? new Date(event.date).toLocaleDateString() : ''}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <MagnifyingGlass size={20} color={theme.colors.textSecondary} weight="regular" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search attendees..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={handleScanQR}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
            <QrCode size={24} color={theme.colors.primary} weight="bold" />
          </View>
          <Text style={[styles.actionButtonText, { color: theme.colors.textPrimary }]}>Scan QR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={handleAddAttendee}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
            <UserCirclePlus size={24} color={theme.colors.primary} weight="bold" />
          </View>
          <Text style={[styles.actionButtonText, { color: theme.colors.textPrimary }]}>Add Attendee</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAttendees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.attendeeCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
            <View style={styles.attendeeInfo}>
              <Text style={[styles.attendeeName, { color: theme.colors.textPrimary }]}>{item.name}</Text>
              {item.email && (
                <Text style={[styles.attendeeEmail, { color: theme.colors.textSecondary }]}>{item.email}</Text>
              )}
            </View>
            {item.checked_in ? (
              <View style={[styles.checkedInBadge, { backgroundColor: theme.colors.success + '15' }]}>
                <CheckCircle size={16} color={theme.colors.success} weight="bold" style={styles.checkedInIcon} />
                <Text style={[styles.checkedInText, { color: theme.colors.success }]}>Checked In</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.checkInButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleCheckIn(item.id)}
              >
                <Text style={styles.checkInButtonText}>Check In</Text>
              </TouchableOpacity>
            )}
          </View>
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventInfoContainer: {
    padding: 16,
  },
  eventInfoCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  eventStatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  eventStats: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  eventDate: {
    fontSize: 14,
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  attendeeList: {
    padding: 16,
  },
  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  checkedInIcon: {
    marginRight: 4,
  },
  checkedInText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkInButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  checkInButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
