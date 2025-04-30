import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, MagnifyingGlass, CheckCircle, UserCirclePlus, QrCode } from 'phosphor-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useEvents } from '@/context/EventContext';

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
  const { getEventById } = useEvents();
  
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEventAndAttendees();
  }, [id]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAttendees(attendees);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = attendees.filter(
        attendee => 
          attendee.name.toLowerCase().includes(query) || 
          (attendee.email && attendee.email.toLowerCase().includes(query)) ||
          (attendee.phone && attendee.phone.includes(query))
      );
      setFilteredAttendees(filtered);
    }
  }, [searchQuery, attendees]);

  const loadEventAndAttendees = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const eventData = await getEventById(id);
      setEvent(eventData);
      
      // For now, we'll use dummy data for attendees
      // In a real implementation, you would fetch attendees from the database
      const dummyAttendees: Attendee[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', checked_in: false },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', checked_in: true, check_in_time: new Date().toISOString() },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com', checked_in: false },
        { id: '4', name: 'Alice Brown', email: 'alice@example.com', checked_in: false },
        { id: '5', name: 'Charlie Davis', email: 'charlie@example.com', checked_in: true, check_in_time: new Date().toISOString() },
      ];
      
      setAttendees(dummyAttendees);
      setFilteredAttendees(dummyAttendees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event and attendees');
      console.error('Error loading event and attendees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = (attendeeId: string) => {
    // In a real implementation, you would update the database
    setAttendees(prevAttendees => 
      prevAttendees.map(attendee => 
        attendee.id === attendeeId 
          ? { ...attendee, checked_in: true, check_in_time: new Date().toISOString() } 
          : attendee
      )
    );
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
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Check-In</Text>
          <View style={styles.headerRight} />
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
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Check-In</Text>
          <View style={styles.headerRight} />
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
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Check-In</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.eventInfoContainer}>
        <Text style={[styles.eventName, { color: theme.colors.textPrimary }]}>{event.title}</Text>
        <Text style={[styles.eventStats, { color: theme.colors.textSecondary }]}>
          {attendees.filter(a => a.checked_in).length} / {attendees.length} checked in
        </Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
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
          <QrCode size={20} color={theme.colors.primary} weight="regular" style={styles.actionIcon} />
          <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Scan QR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={handleAddAttendee}
        >
          <UserCirclePlus size={20} color={theme.colors.primary} weight="regular" style={styles.actionIcon} />
          <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Add Attendee</Text>
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
              <View style={[styles.checkedInBadge, { backgroundColor: theme.colors.success + '20' }]}>
                <CheckCircle size={16} color={theme.colors.success} weight="fill" style={styles.checkedInIcon} />
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
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
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
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventStats: {
    fontSize: 14,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  attendeeList: {
    padding: 16,
  },
  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '500',
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
    fontWeight: '500',
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
