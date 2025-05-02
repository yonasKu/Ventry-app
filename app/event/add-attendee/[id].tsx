import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, UserCirclePlus, Envelope, Phone } from 'phosphor-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';

export default function AddAttendeeScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addAttendee } = useEvents();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleAddAttendee = async () => {
    // Validate input
    const validationErrors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      validationErrors.name = 'Name is required';
    }
    
    // Email is optional, but if provided, it should be valid
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      validationErrors.email = 'Please enter a valid email address';
    }
    
    // Phone is optional, no validation needed
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Add the attendee to the database with all required fields
      await addAttendee(id as string, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim()
      });
      
      // Show success message
      Alert.alert(
        'Success',
        'Attendee added successfully',
        [
          { 
            text: 'Add Another', 
            onPress: () => {
              // Reset form for adding another attendee
              setName('');
              setEmail('');
              setPhone('');
              setErrors({});
            }
          },
          { 
            text: 'Done', 
            onPress: () => {
              // Navigate back to attendees list
              router.back();
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error adding attendee:', err);
      setErrors({ general: err instanceof Error ? err.message : 'Failed to add attendee' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <CaretLeft size={24} color="white" weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: 'white' }]}>Add Attendee</Text>
        <View style={styles.headerRight} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <View style={styles.iconContainer}>
              <UserCirclePlus size={64} color={theme.colors.primary} weight="light" />
            </View>
            
            {/* Name Field */}
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Attendee Name *</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  borderColor: errors.name ? theme.colors.error : theme.colors.border
                }
              ]}
              placeholder="Enter attendee name"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus={true}
              returnKeyType="next"
            />
            {errors.name && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.name}
              </Text>
            )}
            
            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldIconContainer}>
                <Envelope size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.fieldInputContainer}>
                <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Email (Optional)</Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.textPrimary,
                      borderColor: errors.email ? theme.colors.error : theme.colors.border
                    }
                  ]}
                  placeholder="Enter email address"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                {errors.email && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.email}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Phone Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldIconContainer}>
                <Phone size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.fieldInputContainer}>
                <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Phone (Optional)</Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.textPrimary,
                      borderColor: errors.phone ? theme.colors.error : theme.colors.border
                    }
                  ]}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleAddAttendee}
                />
                {errors.phone && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.phone}
                  </Text>
                )}
              </View>
            </View>
            
            {errors.general && (
              <Text style={[styles.errorText, { color: theme.colors.error, textAlign: 'center', marginTop: 8 }]}>
                {errors.general}
              </Text>
            )}
            
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: theme.colors.primary },
                isSubmitting && { opacity: 0.7 }
              ]}
              onPress={handleAddAttendee}
              disabled={isSubmitting}
            >
              <Text style={styles.addButtonText}>
                {isSubmitting ? 'Adding...' : 'Add Attendee'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    height: 60,
    width: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  fieldContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    marginTop: 8,
  },
  fieldIconContainer: {
    width: 40,
    alignItems: 'center',
    paddingTop: 30,
  },
  fieldInputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    color: 'red',
  },
  addButton: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
