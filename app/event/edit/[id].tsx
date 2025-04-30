import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, Check, Calendar, Clock } from 'phosphor-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';

export default function EditEventScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById, updateEvent } = useEvents();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [eventName, setEventName] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [eventNotes, setEventNotes] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState('');

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const eventData = await getEventById(id);
      if (eventData) {
        // Set form values from event data
        setEventName(eventData.title);
        setEventLocation(eventData.location || '');
        setEventNotes(eventData.notes || '');
        setExpectedAttendees(eventData.expected_attendees ? String(eventData.expected_attendees) : '');
        
        // Parse date and time
        if (eventData.date) {
          const date = new Date(eventData.date);
          setEventDate(date);
        }
        
        if (eventData.time) {
          const [hours, minutes, seconds] = eventData.time.split(':').map(Number);
          const time = new Date();
          time.setHours(hours, minutes, seconds);
          setEventTime(time);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
      console.error('Error loading event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setEventTime(selectedTime);
    }
  };

  const handleUpdateEvent = async () => {
    if (!eventName.trim()) {
      Alert.alert('Error', 'Event name is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format date and time as ISO strings for SQLite
      const dateString = eventDate.toISOString().split('T')[0];
      const timeString = eventTime.toISOString().split('T')[1].substring(0, 8);
      
      // Update the event in the database
      await updateEvent({
        id,
        title: eventName,
        date: dateString,
        time: timeString,
        location: eventLocation,
        notes: eventNotes,
        expected_attendees: expectedAttendees ? parseInt(expectedAttendees) : undefined
      });
      
      // Navigate back to the event details screen
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update event. Please try again.');
      console.error('Error updating event:', error);
    } finally {
      setIsSubmitting(false);
    }
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
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Edit Event</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Edit Event</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadEvent}
          >
            <Text style={[styles.retryButtonText, { color: 'white' }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Edit Event</Text>
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              { 
                backgroundColor: eventName && !isSubmitting ? theme.colors.primary : theme.colors.border,
                opacity: eventName && !isSubmitting ? 1 : 0.5,
              }
            ]} 
            onPress={handleUpdateEvent}
            disabled={!eventName || isSubmitting}
          >
            <Check size={20} color="white" weight="bold" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer}>
          <View style={[styles.inputGroup, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Event Name *</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Enter event name"
              placeholderTextColor={theme.colors.textTertiary}
              value={eventName}
              onChangeText={setEventName}
            />
          </View>

          <View style={[styles.inputGroup, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Location</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Enter location"
              placeholderTextColor={theme.colors.textTertiary}
              value={eventLocation}
              onChangeText={setEventLocation}
            />
          </View>

          <View style={[styles.inputGroup, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Date</Text>
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={theme.colors.primary} weight="regular" style={styles.dateTimeIcon} />
              <Text style={[styles.dateTimeText, { color: theme.colors.textPrimary }]}>
                {formatDate(eventDate)}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={eventDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
              />
            )}
          </View>

          <View style={[styles.inputGroup, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Time</Text>
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Clock size={20} color={theme.colors.primary} weight="regular" style={styles.dateTimeIcon} />
              <Text style={[styles.dateTimeText, { color: theme.colors.textPrimary }]}>
                {formatTime(eventTime)}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={eventTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
              />
            )}
          </View>

          <View style={[styles.inputGroup, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Expected Attendees</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Enter number of expected attendees"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="number-pad"
              value={expectedAttendees}
              onChangeText={setExpectedAttendees}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Notes</Text>
            <TextInput
              style={[styles.textArea, { color: theme.colors.textPrimary, backgroundColor: theme.colors.backgroundPrimary }]}
              placeholder="Enter any additional notes"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={eventNotes}
              onChangeText={setEventNotes}
            />
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateTimeIcon: {
    marginRight: 10,
  },
  dateTimeText: {
    fontSize: 16,
  },
  textArea: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
  },
  spacer: {
    height: 40,
  },
});
