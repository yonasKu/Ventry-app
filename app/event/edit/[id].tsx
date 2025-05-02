import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, Check, Calendar, Clock, MapPin, Users, NotePencil } from 'phosphor-react-native';
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
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.backgroundPrimary} />
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary }}>Edit Event</Text>
          <View style={{ width: 40 }} />
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
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.backgroundPrimary} />
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary }}>Edit Event</Text>
          <View style={{ width: 40 }} />
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
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color="white" weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: "white" }]}>Edit Event</Text>
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              { 
                backgroundColor: eventName && !isSubmitting ? 'white' : 'rgba(255,255,255,0.5)',
                opacity: eventName && !isSubmitting ? 1 : 0.7,
              }
            ]} 
            onPress={handleUpdateEvent}
            disabled={!eventName || isSubmitting}
          >
            <Check size={20} color={theme.colors.primary} weight="bold" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <View style={[styles.inputGroup, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Event Name *</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary }]}
                placeholder="Enter event name"
                placeholderTextColor={theme.colors.textTertiary}
                value={eventName}
                onChangeText={setEventName}
                editable={!isSubmitting}
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
              <View style={styles.labelRow}>
                <Calendar size={16} color={theme.colors.textSecondary} weight="regular" />
                <Text style={[styles.label, { color: theme.colors.textSecondary, marginLeft: 6 }]}>Date</Text>
              </View>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
                disabled={isSubmitting}
              >
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
              <View style={styles.labelRow}>
                <Clock size={16} color={theme.colors.textSecondary} weight="regular" />
                <Text style={[styles.label, { color: theme.colors.textSecondary, marginLeft: 6 }]}>Time</Text>
              </View>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
                disabled={isSubmitting}
              >
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
              <View style={styles.labelRow}>
                <Users size={16} color={theme.colors.textSecondary} weight="regular" />
                <Text style={[styles.label, { color: theme.colors.textSecondary, marginLeft: 6 }]}>Expected Attendees</Text>
              </View>
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary }]}
                placeholder="Enter expected number of attendees"
                placeholderTextColor={theme.colors.textTertiary}
                value={expectedAttendees}
                onChangeText={setExpectedAttendees}
                keyboardType="number-pad"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <NotePencil size={16} color={theme.colors.textSecondary} weight="regular" />
                <Text style={[styles.label, { color: theme.colors.textSecondary, marginLeft: 6 }]}>Notes</Text>
              </View>
              <TextInput
                style={[styles.textArea, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="Enter notes about the event"
                placeholderTextColor={theme.colors.textTertiary}
                value={eventNotes}
                onChangeText={setEventNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>
          </View>
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
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    padding: 16,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
  },
  dateTimeButton: {
    paddingVertical: 8,
  },
  dateTimeText: {
    fontSize: 16,
  },
  textArea: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 100,
  },
});
