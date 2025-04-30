import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Calendar, CaretLeft, Check, Clock } from 'phosphor-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { useEvents } from '../context/EventContext';

export default function CreateEventScreen() {
  const theme = useTheme();
  const { createEvent } = useEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [eventNotes, setEventNotes] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState('');

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

  const handleCreateEvent = async () => {
    if (!eventName.trim()) {
      Alert.alert('Error', 'Event name is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format date and time as strings for SQLite
      const dateString = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeString = eventTime.toISOString().split('T')[1].substring(0, 8); // HH:MM:SS
      
      console.log('Creating event with date:', dateString, 'and time:', timeString);
      
      // Create the event in the database
      const newEvent = await createEvent({
        title: eventName,
        date: dateString,
        time: timeString,
        location: eventLocation || null,
        notes: eventNotes || null,
        expected_attendees: expectedAttendees ? parseInt(expectedAttendees) : null
      });
      
      console.log('Event created successfully:', newEvent);
      
      Alert.alert(
        'Success',
        'Event created successfully',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate back to the events screen
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            disabled={isSubmitting}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Create New Event</Text>
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              { 
                backgroundColor: eventName && !isSubmitting ? theme.colors.primary : theme.colors.border,
                opacity: eventName && !isSubmitting ? 1 : 0.5,
              }
            ]} 
            onPress={handleCreateEvent}
            disabled={!eventName || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Check size={20} color="white" weight="bold" />
            )}
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
              editable={!isSubmitting}
            />
          </View>

          <View style={[styles.inputGroup, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Date</Text>
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              editable={!isSubmitting}
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
              editable={!isSubmitting}
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
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
