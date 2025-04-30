import { StyleSheet, TouchableOpacity, ScrollView, Text, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { List, CalendarBlank, CaretRight, Plus } from 'phosphor-react-native';
import { useTheme } from '@/context/ThemeContext';

export default function EventsScreen() {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Sample event data - in a real app, this would come from local database
  const events = [
    { id: 1, title: 'Workshop: UI/UX Basics', date: 'Today', attendees: 45, checkedIn: 12 },
    { id: 2, title: 'Monthly Club Meeting', date: 'Apr 30', attendees: 28, checkedIn: 0 },
    { id: 3, title: 'VIP Dinner', date: 'May 5', attendees: 15, checkedIn: 0 },
    { id: 4, title: 'Tech Conference', date: 'May 15', attendees: 120, checkedIn: 0 },
    { id: 5, title: 'Team Building', date: 'May 22', attendees: 18, checkedIn: 0 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={[styles.viewToggle, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'list' && [styles.activeToggle, { backgroundColor: theme.colors.border }]]} 
          onPress={() => setViewMode('list')}
        >
          <List 
            size={16} 
            color={viewMode === 'list' ? theme.colors.primary : theme.colors.textSecondary} 
            weight={viewMode === 'list' ? 'bold' : 'regular'}
          />
          <Text style={[styles.toggleText, { color: viewMode === 'list' ? theme.colors.primary : theme.colors.textSecondary }]}>List</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'calendar' && [styles.activeToggle, { backgroundColor: theme.colors.border }]]} 
          onPress={() => setViewMode('calendar')}
        >
          <CalendarBlank 
            size={16} 
            color={viewMode === 'calendar' ? theme.colors.primary : theme.colors.textSecondary} 
            weight={viewMode === 'calendar' ? 'bold' : 'regular'}
          />
          <Text style={[styles.toggleText, { color: viewMode === 'calendar' ? theme.colors.primary : theme.colors.textSecondary }]}>Calendar</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'list' ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {events.map((event) => (
            <TouchableOpacity key={event.id} style={[styles.eventCard, theme.shadows.sm]}>
              <View style={styles.eventCardContent}>
                <View style={styles.eventHeader}>
                  <Text style={[styles.eventTitle, { color: theme.colors.textPrimary }]}>{event.title}</Text>
                  <CaretRight size={16} color={theme.colors.textTertiary} weight="regular" />
                </View>
                <Text style={[styles.eventDetails, { color: theme.colors.textSecondary }]}>
                  {event.date} • {event.attendees} attendees • {event.checkedIn} checked in
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.calendarView, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <Text style={[styles.calendarPlaceholder, { color: theme.colors.textPrimary }]}>Calendar view will be implemented here</Text>
          <Text style={[styles.calendarNote, { color: theme.colors.textSecondary }]}>Events will be displayed in a monthly calendar format</Text>
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
  viewToggle: {
    flexDirection: 'row',
    padding: 10,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeToggle: {
    // Background color is applied dynamically
  },
  toggleText: {
    marginLeft: 5,
    fontSize: 14,
    // Color is applied dynamically
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
  },
  eventCardContent: {
    padding: 15,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventDetails: {
    fontSize: 14,
  },
  calendarView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarPlaceholder: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  calendarNote: {
    fontSize: 14,
    textAlign: 'center',
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
});
