import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CaretLeft, Check } from 'phosphor-react-native';
import { useTheme } from '../context/ThemeContext';
import { useEvents } from '../context/EventContext';
import { CategorySelectionScreen } from '../components/CategorySelectionScreen';
import { DynamicEventForm } from '../components/forms/DynamicEventForm';
import { EventCategory, FormFieldValue } from '../types/FormTypes';
import { getFormConfig } from '../config/CategoryFormConfigs';
import { showToast } from '../utils/toast';

export default function CreateEventScreen() {
  const theme = useTheme();
  const { createEvent } = useEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [formData, setFormData] = useState<Record<string, FormFieldValue>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const handleCategorySelect = (category: EventCategory) => {
    setSelectedCategory(category);
    setFormData({});
  };

  const handleBackPress = () => {
    if (selectedCategory) {
      // Go back to category selection
      setSelectedCategory(null);
      setFormData({});
    } else {
      // Go back to previous screen
      router.back();
    }
  };

  const handleCreateEvent = async () => {
    if (!isFormValid) {
      showToast.warning('Please fill in all required fields');
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

      // Format date and time as strings for SQLite
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeString = time.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

      // Separate category-specific data from basic fields
      const basicFields = ['title', 'location', 'date', 'time', 'expected_attendees'];
      const categoryData: Record<string, FormFieldValue> = {};
      
      Object.keys(formData).forEach(key => {
        if (!basicFields.includes(key)) {
          categoryData[key] = formData[key];
        }
      });

      console.log('Creating event with category data:', categoryData);
      
      // Create the event in the database
      const newEvent = await createEvent({
        title,
        date: dateString,
        time: timeString,
        location: location || null,
        notes: null,
        expected_attendees: expected_attendees || null,
        category: selectedCategory || null,
        category_data: JSON.stringify(categoryData),
      });
      
      console.log('Event created successfully:', newEvent);
      
      // Show success toast
      showToast.success('Event created successfully!');
      
      // Navigate back after success
      router.back();
    } catch (error) {
      console.error('Error creating event:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      showToast.error('Unable to create event', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }} edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
            disabled={isSubmitting}
          >
            <CaretLeft size={24} color="white" weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: "white" }]}>
            {selectedCategory ? 'Create Event' : 'Select Category'}
          </Text>
          {selectedCategory && (
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                { 
                  backgroundColor: isFormValid && !isSubmitting ? 'white' : 'rgba(255,255,255,0.5)',
                  opacity: isFormValid && !isSubmitting ? 1 : 0.7,
                }
              ]} 
              onPress={handleCreateEvent}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Check size={20} color={theme.colors.primary} weight="bold" />
              )}
            </TouchableOpacity>
          )}
          {!selectedCategory && <View style={{ width: 40 }} />}
        </View>

        <View style={styles.content}>
          {!selectedCategory ? (
            <CategorySelectionScreen onSelectCategory={handleCategorySelect} />
          ) : (
            <View style={styles.formContainer}>
              <DynamicEventForm
                config={getFormConfig(selectedCategory)}
                initialData={formData}
                onDataChange={setFormData}
                onValidationChange={setIsFormValid}
              />
            </View>
          )}
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
  content: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
});
