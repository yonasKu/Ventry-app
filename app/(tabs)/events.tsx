import { StyleSheet, TouchableOpacity, ScrollView, Text, View, ActivityIndicator, RefreshControl, Dimensions, ImageBackground } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { List, CalendarBlank, CaretRight, Plus, UsersThree, MapPin, Clock } from 'phosphor-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useEvents } from '@/context/EventContext';
import { format, parseISO, isSameDay, isToday, isFuture, isPast, addDays } from 'date-fns';
import { Calendar, DateData } from 'react-native-calendars';

const { width } = Dimensions.get('window');

export default function EventsScreen() {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const { events, loading, error, refreshEvents } = useEvents();
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    console.log('EventsScreen mounted, events:', events);
  }, [events]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshEvents();
    } catch (err) {
      console.error('Error refreshing events:', err);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Group events by status (today, upcoming, past)
  const groupedEvents = useMemo(() => {
    const today: any[] = [];
    const upcoming: any[] = [];
    const past: any[] = [];
    
    events.forEach(event => {
      const eventDate = event.date.includes('T') ? parseISO(event.date) : new Date(event.date);
      if (isToday(eventDate)) {
        today.push(event);
      } else if (isFuture(eventDate)) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    });
    
    return { today, upcoming, past };
  }, [events]);

  const formatDate = (dateStr: string) => {
    try {
      // Handle both ISO date strings and date-only strings
      const date = dateStr.includes('T') ? parseISO(dateStr) : new Date(dateStr);
      return format(date, 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err, dateStr);
      return dateStr;
    }
  };

  const formatDateForCalendar = (dateStr: string) => {
    try {
      // Convert to YYYY-MM-DD format for calendar
      const date = dateStr.includes('T') ? parseISO(dateStr) : new Date(dateStr);
      return format(date, 'yyyy-MM-dd');
    } catch (err) {
      console.error('Error formatting date for calendar:', err, dateStr);
      return '';
    }
  };

  // Prepare marked dates for calendar
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};
    
    events.forEach(event => {
      const dateStr = formatDateForCalendar(event.date);
      if (dateStr) {
        // Mark the entire day instead of using dots
        marked[dateStr] = {
          selected: true,
          selectedColor: `${theme.colors.primary}40`, // Adding 40 for 25% opacity
          marked: true,
          dotColor: theme.colors.primary,
        };
      }
    });
    
    // If a date is selected, highlight it more prominently
    if (selectedDate) {
      marked[selectedDate.dateString] = {
        ...marked[selectedDate.dateString],
        selected: true,
        selectedColor: theme.colors.primary, // Full opacity for selected date
      };
    }
    
    return marked;
  }, [events, theme.colors.primary, selectedDate]);

  // Get events for a specific date
  const getEventsForDate = (date: DateData) => {
    return events.filter(event => {
      const eventDate = event.date.includes('T') ? parseISO(event.date) : new Date(event.date);
      return isSameDay(eventDate, new Date(date.dateString));
    });
  };

  const [selectedDate, setSelectedDate] = useState<DateData | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);

  const handleDayPress = (day: DateData) => {
    // If selecting the same date again, clear the selection
    if (selectedDate && selectedDate.dateString === day.dateString) {
      setSelectedDate(null);
      setSelectedDateEvents([]);
    } else {
      setSelectedDate(day);
      setSelectedDateEvents(getEventsForDate(day));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Events</Text>
        <View style={[styles.viewToggle, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <TouchableOpacity 
            style={[styles.toggleButton, viewMode === 'list' && [styles.activeToggle, { backgroundColor: theme.colors.primary }]]} 
            onPress={() => setViewMode('list')}
          >
            <List 
              size={18} 
              color={viewMode === 'list' ? 'white' : theme.colors.textSecondary} 
              weight={viewMode === 'list' ? 'bold' : 'regular'}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, viewMode === 'calendar' && [styles.activeToggle, { backgroundColor: theme.colors.primary }]]} 
            onPress={() => setViewMode('calendar')}
          >
            <CalendarBlank 
              size={18} 
              color={viewMode === 'calendar' ? 'white' : theme.colors.textSecondary} 
              weight={viewMode === 'calendar' ? 'bold' : 'regular'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
            Loading events...
          </Text>
        </View>
      ) : viewMode === 'list' ? (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {events.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No events found. Create your first event!
              </Text>
            </View>
          ) : (
            <>
              {/* Today's Events */}
              {groupedEvents.today.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.accent }]}>TODAY</Text>
                    <View style={[styles.sectionLine, { backgroundColor: theme.colors.accent }]} />
                  </View>
                  
                  {groupedEvents.today.map((event) => (
                    <TouchableOpacity 
                      key={event.id} 
                      style={[styles.todayEventCard, { backgroundColor: theme.colors.backgroundPrimary }]}
                      onPress={() => router.push(`/event/${event.id}`)}
                    >
                      <View style={[styles.todayEventBadge, { backgroundColor: theme.colors.accent }]}>
                        <Text style={styles.todayEventBadgeText}>TODAY</Text>
                      </View>
                      
                      <View style={styles.todayEventContent}>
                        <Text 
                          style={[styles.todayEventTitle, { color: theme.colors.textPrimary }]} 
                          numberOfLines={1}
                        >
                          {event.title}
                        </Text>
                        
                        <View style={styles.todayEventDetails}>
                          <View style={styles.todayEventRow}>
                            <View style={styles.todayEventItem}>
                              <Clock size={16} color={theme.colors.accent} weight="fill" />
                              <Text style={[styles.todayEventItemText, { color: theme.colors.textSecondary }]}>
                                {event.time}
                              </Text>
                            </View>
                            
                            <View style={styles.todayEventItem}>
                              <UsersThree size={16} color={theme.colors.accent} weight="fill" />
                              <Text style={[styles.todayEventItemText, { color: theme.colors.textSecondary }]}>
                                {event.attendees_count || 0} attendees
                              </Text>
                            </View>
                          </View>
                          
                          {event.location && (
                            <View style={styles.todayEventItem}>
                              <MapPin size={16} color={theme.colors.accent} weight="fill" />
                              <Text 
                                style={[styles.todayEventItemText, { color: theme.colors.textSecondary }]} 
                                numberOfLines={1}
                              >
                                {event.location}
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.checkinContainer}>
                          <View style={styles.checkinLabelContainer}>
                            <Text style={[styles.checkinLabel, { color: theme.colors.textSecondary }]}>Check-ins</Text>
                            <Text style={[styles.checkinCount, { color: theme.colors.textPrimary }]}>
                              {event.checked_in_count || 0}/{event.attendees_count || 0}
                            </Text>
                          </View>
                          <View style={[styles.checkinBarContainer, { backgroundColor: theme.colors.border }]}>
                            <View 
                              style={[
                                styles.checkinBarFill, 
                                { 
                                  backgroundColor: theme.colors.primary,
                                  width: `${event.attendees_count ? Math.min((event.checked_in_count / event.attendees_count) * 100, 100) : 0}%` 
                                }
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {/* Upcoming Events */}
              {groupedEvents.upcoming.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>UPCOMING</Text>
                    <View style={[styles.sectionLine, { backgroundColor: theme.colors.primary }]} />
                  </View>
                  
                  {groupedEvents.upcoming.map((event) => (
                    <TouchableOpacity 
                      key={event.id} 
                      style={[styles.upcomingEventCard, { backgroundColor: theme.colors.backgroundPrimary }]}
                      onPress={() => router.push(`/event/${event.id}`)}
                    >
                      <View style={[styles.upcomingEventDate, { backgroundColor: `${theme.colors.primary}20` }]}>
                        <Text style={[styles.upcomingEventDay, { color: theme.colors.primary }]}>
                          {format(new Date(event.date), 'd')}
                        </Text>
                        <Text style={[styles.upcomingEventMonth, { color: theme.colors.primary }]}>
                          {format(new Date(event.date), 'MMM')}
                        </Text>
                      </View>
                      
                      <View style={styles.upcomingEventDetails}>
                        <Text 
                          style={[styles.upcomingEventTitle, { color: theme.colors.textPrimary }]} 
                          numberOfLines={1}
                        >
                          {event.title}
                        </Text>
                        
                        <View style={styles.upcomingEventInfo}>
                          <View style={styles.upcomingEventInfoItem}>
                            <Clock size={14} color={theme.colors.textSecondary} weight="regular" />
                            <Text style={[styles.upcomingEventInfoText, { color: theme.colors.textSecondary }]}>
                              {event.time}
                            </Text>
                          </View>
                          
                          <View style={styles.upcomingEventInfoItem}>
                            <UsersThree size={14} color={theme.colors.textSecondary} weight="regular" />
                            <Text style={[styles.upcomingEventInfoText, { color: theme.colors.textSecondary }]}>
                              {event.attendees_count || 0}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <CaretRight size={16} color={theme.colors.textTertiary} weight="regular" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {/* Past Events */}
              {groupedEvents.past.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>PAST</Text>
                    <View style={[styles.sectionLine, { backgroundColor: theme.colors.textSecondary }]} />
                  </View>
                  
                  {groupedEvents.past.map((event) => (
                    <TouchableOpacity 
                      key={event.id} 
                      style={[styles.pastEventCard, { backgroundColor: theme.colors.backgroundPrimary }]}
                      onPress={() => router.push(`/event/${event.id}`)}
                    >
                      <View style={styles.pastEventContent}>
                        <Text 
                          style={[styles.pastEventTitle, { color: theme.colors.textSecondary }]} 
                          numberOfLines={1}
                        >
                          {event.title}
                        </Text>
                        
                        <View style={styles.pastEventInfo}>
                          <Text style={[styles.pastEventDate, { color: theme.colors.textTertiary }]}>
                            {formatDate(event.date)}
                          </Text>
                          
                          <View style={styles.pastEventStats}>
                            <Text style={[styles.pastEventStatsText, { color: theme.colors.textTertiary }]}>
                              {event.checked_in_count || 0}/{event.attendees_count || 0} checked in
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={[styles.pastEventIndicator, { backgroundColor: theme.colors.textTertiary }]} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      ) : (
        <View style={[styles.calendarView, { backgroundColor: theme.colors.backgroundPrimary }]}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
                Loading events...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.calendarScrollView}
              contentContainerStyle={styles.calendarScrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.primary}
                />
              }
            >
              <Calendar
                style={styles.calendar}
                theme={{
                  calendarBackground: theme.colors.backgroundPrimary,
                  textSectionTitleColor: theme.colors.textPrimary,
                  selectedDayBackgroundColor: theme.colors.primary,
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: theme.colors.primary,
                  dayTextColor: theme.colors.textPrimary,
                  textDisabledColor: theme.colors.textTertiary,
                  dotColor: theme.colors.primary,
                  selectedDotColor: '#ffffff',
                  arrowColor: theme.colors.primary,
                  monthTextColor: theme.colors.textPrimary,
                  indicatorColor: theme.colors.primary
                }}
                markingType={'custom'}
                markedDates={markedDates}
                onDayPress={handleDayPress}
              />
              
              {selectedDate && (
                <View style={styles.selectedDateContainer}>
                  <Text style={[styles.selectedDateTitle, { color: theme.colors.textPrimary }]}>
                    Events on {format(new Date(selectedDate.dateString), 'MMMM d, yyyy')}
                  </Text>
                  
                  {selectedDateEvents.length === 0 ? (
                    <Text style={[styles.noEventsText, { color: theme.colors.textSecondary }]}>
                      No events scheduled for this day
                    </Text>
                  ) : (
                    selectedDateEvents.map((event) => (
                      <TouchableOpacity 
                        key={event.id} 
                        style={[styles.calendarEventCard, theme.shadows.sm]}
                        onPress={() => router.push(`/event/${event.id}`)}
                      >
                        <View style={styles.eventCardContent}>
                          <View style={styles.eventHeader}>
                            <Text style={[styles.eventTitle, { color: theme.colors.textPrimary }]}>{event.title}</Text>
                            <CaretRight size={16} color={theme.colors.textTertiary} weight="regular" />
                          </View>
                          <Text style={[styles.eventDetails, { color: theme.colors.textSecondary }]}>
                            {event.time} • {event.attendees_count || 0} attendees • {event.checked_in_count || 0} checked in
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}

      <TouchableOpacity 
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/create-event')}
      >
        <View style={styles.createButtonContent}>
          <Plus size={16} color="white" weight="bold" />
          <Text style={styles.createButtonText}>CREATE NEW EVENT</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    height: 36,
    width: 80,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToggle: {
    // Background color is applied dynamically
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  // Section styling
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },
  // Today's event cards (professional design)
  todayEventCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  todayEventBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 8,
  },
  todayEventBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  todayEventContent: {
    padding: 16,
  },
  todayEventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  todayEventDetails: {
    marginBottom: 12,
  },
  todayEventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  todayEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  todayEventItemText: {
    marginLeft: 8,
    fontSize: 14,
  },
  checkinContainer: {
    marginTop: 8,
  },
  checkinLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkinLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkinCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkinBarContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  checkinBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Upcoming event cards
  upcomingEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  upcomingEventDate: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  upcomingEventDay: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  upcomingEventMonth: {
    fontSize: 12,
    fontWeight: '500',
  },
  upcomingEventDetails: {
    flex: 1,
  },
  upcomingEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  upcomingEventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingEventInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingEventInfoText: {
    fontSize: 13,
    marginLeft: 4,
  },
  // Past event cards
  pastEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
    opacity: 0.8,
  },
  pastEventContent: {
    flex: 1,
  },
  pastEventTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  pastEventInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pastEventDate: {
    fontSize: 12,
  },
  pastEventStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pastEventStatsText: {
    fontSize: 12,
  },
  pastEventIndicator: {
    width: 4,
    height: '70%',
    borderRadius: 2,
    marginLeft: 12,
  },
  // Calendar view
  calendarView: {
    flex: 1,
  },
  calendarScrollView: {
    flex: 1,
  },
  calendarScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  calendar: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  selectedDateContainer: {
    marginTop: 10,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  calendarEventCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
  },
  noEventsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  createButton: {
    borderRadius: 10,
    padding: 15,
    margin: 20,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  }
});
