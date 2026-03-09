import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaretLeft, Check } from 'phosphor-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';
import { DynamicEventForm } from '../../../components/forms/DynamicEventForm';
import { EventCategory, FormFieldValue } from '../../../types/FormTypes';
import { getFormConfig } from '../../../config/CategoryFormConfigs';
import { parseCategoryData } from '../../../utils/formDataProcessor';

export default function EditEventScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById, updateEvent } = useEvents();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventCategory, setEventCategory] = useState<EventCategory | null>(null);
  const [formData, setFormData] = useState<Record<string, FormFieldValue>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const eventData = await getEventById(id);
      if (eventData) {
        // Set category
        setEventCategory(eventData.category as EventCategory);
        
        // Parse dates
        const date = new Date(eventData.date);
        const [hours, minutes] = eventData.time.split(':').map(Number);
        const time = new Date();
        time.setHours(hours, minutes, 0);
        
        // Build form data with basic fields
        const initialFormData: Record<string, FormFieldValue> = {
          title: eventData.title,
          location: eventData.location || '',
          date: date,
          time: time,
          expected_attendees: eventData.expected_attendees || undefined,
        };
        
        // Add category-specific data if exists
        if (eventData.category_data) {
          const categoryData = parseCategoryData(eventData.category_data);
          Object.assign(initialFormData, categoryData);
        }
        
        setFormData(initialFormData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
      console.error('Error loading event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!isFormValid) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Extract basic fields
      const title = formData.title as string;
      const location = formData.location as string;
      const date = formData.date as Date;
      const time = formData.time as Date;
      const expected_attendees = formData.expected_attendees as number;

      // Format date and time
      const dateString = date.toISOString().split('T')[0];
      const timeString = time.toTimeString().split(' ')[0].substring(0, 5);

      // Separate category-specific data
      const basicFields = ['title', 'location', 'date', 'time', 'expected_attendees'];
      const categoryData: Record<string, FormFieldValue> = {};
      
      Object.keys(formData).forEach(key => {
        if (!basicFields.includes(key)) {
          categoryData[key] = formData[key];
        }
      });

      console.log('Updating event with category data:', categoryData);
      
      // Update the event
      const success = await updateEvent(id, {
        title,
        date: dateString,
        time: timeString,
        location: location || null,
        expected_attendees: expected_attendees || null,
        category: eventCategory || null,
        category_data: JSON.stringify(categoryData),
      });
      
      if (success) {
        Alert.alert(
          'Success',
          'Event updated successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert('Unable to Update Event', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }} edges={['top']}>
        <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <CaretLeft size={24} color="white" weight="regular" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: 'white' }]}>Edit Event</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }} edges={['top']}>
        <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <CaretLeft size={24} color="white" weight="regular" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: 'white' }]}>Edit Event</Text>
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
      </SafeAreaView>
    );
  }

  if (!eventCategory) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }} edges={['top']}>
        <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <CaretLeft size={24} color="white" weight="regular" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: 'white' }]}>Edit Event</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
              This event was created without a category and cannot be edited with the new form system.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }} edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <CaretLeft size={24} color="white" weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: "white" }]}>Edit Event</Text>
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              { 
                backgroundColor: isFormValid && !isSubmitting ? 'white' : 'rgba(255,255,255,0.5)',
                opacity: isFormValid && !isSubmitting ? 1 : 0.7,
              }
            ]} 
            onPress={handleUpdateEvent}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Check size={20} color={theme.colors.primary} weight="bold" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <DynamicEventForm
            config={getFormConfig(eventCategory)}
            initialData={formData}
            onDataChange={setFormData}
            onValidationChange={setIsFormValid}
          />
        </View>
      </View>
    </SafeAreaView>
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
});
