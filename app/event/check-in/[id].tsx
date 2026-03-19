import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, FlatList, RefreshControl, ActivityIndicator, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeft, MagnifyingGlass, UserCirclePlus, QrCode, Users } from 'phosphor-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';
import * as _ from 'lodash';
import SlideToCheckIn from '../../../components/SlideToCheckIn';
import FAB from '../../../components/FAB';
import { Attendee } from '../../../models/Attendee';
import { showToast } from '../../../utils/toast';

export default function CheckInScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const { getEventById, checkInAttendee } = useEvents();
  
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'checked' | 'notChecked'>('all');
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
    let filtered = attendees;
    
    // Apply filter by check-in status
    if (filter === 'checked') {
      filtered = filtered.filter(a => a.checked_in);
    } else if (filter === 'notChecked') {
      filtered = filtered.filter(a => !a.checked_in);
    }
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      // Normalize the search query (remove accents, lowercase)
      const normalizedQuery = _.deburr(_.toLower(searchQuery.trim()));
      
      // Use Lodash filter with custom predicate for better search
      filtered = _.filter(filtered, (attendee: Attendee) => {
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
    }
    
    setFilteredAttendees(filtered);
  }, [searchQuery, attendees, filter]);

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
      
      // Show success toast
      showToast.success(
        newCheckedInStatus ? 'Checked in successfully!' : 'Check-in removed'
      );
    } catch (error) {
      console.error('Error toggling check-in status:', error);
      showToast.error('Failed to update check-in status');
      loadEventAndAttendees(false); // Re-fetch to correct optimistic update
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

  // Calculate stats based on current filter
  const getFilteredStats = () => {
    const total = filteredAttendees.length;
    const checkedIn = filteredAttendees.filter(a => a.checked_in).length;
    return { total, checkedIn };
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
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <CaretLeft size={24} color="white" weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: "white" }]}>Check-In</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddAttendee}
        >
          <UserCirclePlus size={24} color="white" weight="bold" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* Event Card with Stats */}
        <View style={[styles.eventInfoCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <View style={styles.eventInfoHeader}>
            <Text style={[styles.eventName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{event.title}</Text>
            <View style={[styles.eventStatsBadge, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Users size={16} color={theme.colors.primary} weight="bold" />
              <Text style={[styles.eventStats, { color: theme.colors.primary }]}>
                {getFilteredStats().checkedIn} / {getFilteredStats().total}
              </Text>
            </View>
          </View>
          <Text style={[styles.eventDate, { color: theme.colors.textSecondary }]}>
            {event.date ? new Date(event.date).toLocaleDateString() : ''}
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={[styles.filterTabsContainer, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              filter === 'all' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterTabText, 
              { color: filter === 'all' ? 'white' : theme.colors.textSecondary }
            ]}>
              All ({attendees.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              filter === 'checked' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setFilter('checked')}
          >
            <Text style={[
              styles.filterTabText, 
              { color: filter === 'checked' ? 'white' : theme.colors.textSecondary }
            ]}>
              Checked In ({attendees.filter(a => a.checked_in).length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              filter === 'notChecked' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setFilter('notChecked')}
          >
            <Text style={[
              styles.filterTabText, 
              { color: filter === 'notChecked' ? 'white' : theme.colors.textSecondary }
            ]}>
              Not Checked ({attendees.filter(a => !a.checked_in).length})
            </Text>
          </TouchableOpacity>
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
      </View>

      <FlatList
        data={filteredAttendees}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
              {searchQuery 
                ? 'No attendees match your search' 
                : filter === 'checked'
                  ? 'No checked-in attendees'
                  : filter === 'notChecked'
                    ? 'No unchecked attendees'
                    : 'No attendees found for this event'}
            </Text>
          </View>
        }
      />
      
      {/* Floating Action Button for Scan QR */}
      <FAB
        icon={<QrCode size={28} color="white" weight="bold" />}
        onPress={handleScanQR}
        position="bottom-right"
        size="large"
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
  addButton: {
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
  filterTabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
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
