import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, UserCirclePlus, Envelope, Phone } from 'phosphor-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';
import { CustomFieldsService, CustomField, FieldType } from '../../../services/CustomFieldsService';

export default function AddAttendeeScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addAttendee } = useEvents();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadCustomFields();
  }, [id]);

  const loadCustomFields = async () => {
    try {
      const service = new CustomFieldsService();
      const fields = service.getFields(id);
      setCustomFields(fields);
      
      // Initialize custom field values with defaults
      const initialValues: Record<string, string> = {};
      fields.forEach(field => {
        if (field.default_value) {
          initialValues[field.id] = field.default_value;
        }
      });
      setCustomFieldValues(initialValues);
    } catch (error) {
      console.error('Error loading custom fields:', error);
    }
  };

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
    
    // Validate custom fields
    const service = new CustomFieldsService();
    customFields.forEach(field => {
      const value = customFieldValues[field.id] || '';
      const result = service.validateFieldValue(field, value);
      if (!result.valid) {
        validationErrors[`custom_${field.id}`] = result.error || 'Invalid value';
      }
    });
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Add the attendee to the database with all required fields
      const newAttendee = await addAttendee(id as string, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim()
      });
      
      // Save custom field values
      Object.entries(customFieldValues).forEach(([fieldId, value]) => {
        if (value) {
          service.setFieldValue(newAttendee.id, fieldId, value);
        }
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
              setCustomFieldValues({});
              setErrors({});
              loadCustomFields(); // Reload to get defaults
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

  const renderCustomField = (field: CustomField) => {
    const value = customFieldValues[field.id] || '';
    const error = errors[`custom_${field.id}`];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
              {field.name} {field.required && '*'}
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  borderColor: error ? theme.colors.error : theme.colors.border
                }
              ]}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              placeholderTextColor={theme.colors.textSecondary}
              value={value}
              onChangeText={(text) => setCustomFieldValues({ ...customFieldValues, [field.id]: text })}
              keyboardType={field.type === 'email' ? 'email-address' : field.type === 'phone' ? 'phone-pad' : field.type === 'url' ? 'url' : 'default'}
              autoCapitalize={field.type === 'email' || field.type === 'url' ? 'none' : 'sentences'}
            />
            {error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            )}
          </View>
        );

      case 'textarea':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
              {field.name} {field.required && '*'}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  borderColor: error ? theme.colors.error : theme.colors.border
                }
              ]}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              placeholderTextColor={theme.colors.textSecondary}
              value={value}
              onChangeText={(text) => setCustomFieldValues({ ...customFieldValues, [field.id]: text })}
              multiline
              numberOfLines={4}
            />
            {error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            )}
          </View>
        );

      case 'number':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
              {field.name} {field.required && '*'}
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  borderColor: error ? theme.colors.error : theme.colors.border
                }
              ]}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              placeholderTextColor={theme.colors.textSecondary}
              value={value}
              onChangeText={(text) => setCustomFieldValues({ ...customFieldValues, [field.id]: text })}
              keyboardType="numeric"
            />
            {error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            )}
          </View>
        );

      case 'checkbox':
        return (
          <View key={field.id} style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setCustomFieldValues({ ...customFieldValues, [field.id]: value === 'true' ? 'false' : 'true' })}
            >
              <View style={[
                styles.checkboxBox,
                { borderColor: theme.colors.border },
                value === 'true' && { backgroundColor: theme.colors.primary }
              ]}>
                {value === 'true' && (
                  <Text style={styles.checkboxCheck}>✓</Text>
                )}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.colors.textPrimary }]}>
                {field.name} {field.required && '*'}
              </Text>
            </TouchableOpacity>
            {error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            )}
          </View>
        );

      default:
        return null;
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
            
            {/* Basic Information Section */}
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Basic Information</Text>
            
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
                />
                {errors.phone && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.phone}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Custom Fields Section */}
            {customFields.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginTop: 24 }]}>
                  Additional Information
                </Text>
                {customFields.map(renderCustomField)}
              </>
            )}
            
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
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
