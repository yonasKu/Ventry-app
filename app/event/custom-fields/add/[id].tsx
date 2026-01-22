import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StatusBar, Switch } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, Plus, X } from 'phosphor-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { CustomFieldsService, FieldType } from '../../../../services/CustomFieldsService';

const FIELD_TYPES: { value: FieldType; label: string; description: string }[] = [
  { value: 'text', label: 'Text', description: 'Single line text input' },
  { value: 'textarea', label: 'Long Text', description: 'Multi-line text input' },
  { value: 'number', label: 'Number', description: 'Numeric value' },
  { value: 'email', label: 'Email', description: 'Email address' },
  { value: 'phone', label: 'Phone', description: 'Phone number' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'time', label: 'Time', description: 'Time picker' },
  { value: 'datetime', label: 'Date & Time', description: 'Date and time picker' },
  { value: 'select', label: 'Dropdown', description: 'Single choice from list' },
  { value: 'multiselect', label: 'Multiple Choice', description: 'Multiple selections' },
  { value: 'checkbox', label: 'Yes/No', description: 'Boolean checkbox' },
  { value: 'url', label: 'Website', description: 'Website URL' },
];

export default function AddCustomFieldScreen() {
  const theme = useTheme();
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [required, setRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [minLength, setMinLength] = useState('');
  const [maxLength, setMaxLength] = useState('');
  const [pattern, setPattern] = useState('');
  const [customError, setCustomError] = useState('');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  
  const [customFieldsService] = useState(() => new CustomFieldsService());

  const needsOptions = type === 'select' || type === 'multiselect';
  const needsValidation = type === 'text' || type === 'textarea' || type === 'number';

  const handleAddOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a field name');
      return;
    }

    if (needsOptions && options.length === 0) {
      Alert.alert('Error', 'Please add at least one option');
      return;
    }

    try {
      // Generate key from name
      const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      
      // Build validation object
      const validation: any = {};
      if (minLength) validation.min_length = parseInt(minLength);
      if (maxLength) validation.max_length = parseInt(maxLength);
      if (pattern) validation.pattern = pattern;
      if (customError) validation.custom_error = customError;
      
      // Get current fields count for display order
      const existingFields = customFieldsService.getFields(eventId);
      
      customFieldsService.createField({
        name: name.trim(),
        key,
        type,
        required,
        default_value: defaultValue || undefined,
        options: needsOptions ? options : undefined,
        validation: Object.keys(validation).length > 0 ? validation : undefined,
        display_order: existingFields.length,
        event_id: eventId,
      });
      
      router.back();
    } catch (error) {
      console.error('Error creating field:', error);
      Alert.alert('Error', 'Failed to create field');
    }
  };

  const selectedType = FIELD_TYPES.find(t => t.value === type);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <CaretLeft size={24} color="white" weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: 'white' }]}>Add Custom Field</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Field Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
            Field Name <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.backgroundPrimary,
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
            }]}
            placeholder="e.g., Employee ID"
            placeholderTextColor={theme.colors.textTertiary}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Field Type */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
            Field Type <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.typeSelector, { 
              backgroundColor: theme.colors.backgroundPrimary,
              borderColor: theme.colors.border,
            }]}
            onPress={() => setShowTypeSelector(!showTypeSelector)}
          >
            <View>
              <Text style={[styles.typeSelectorText, { color: theme.colors.textPrimary }]}>
                {selectedType?.label}
              </Text>
              <Text style={[styles.typeSelectorDesc, { color: theme.colors.textSecondary }]}>
                {selectedType?.description}
              </Text>
            </View>
          </TouchableOpacity>
          
          {showTypeSelector && (
            <View style={[styles.typeList, { backgroundColor: theme.colors.backgroundPrimary }]}>
              {FIELD_TYPES.map((fieldType) => (
                <TouchableOpacity
                  key={fieldType.value}
                  style={[styles.typeOption, { 
                    backgroundColor: type === fieldType.value ? `${theme.colors.primary}15` : 'transparent'
                  }]}
                  onPress={() => {
                    setType(fieldType.value);
                    setShowTypeSelector(false);
                  }}
                >
                  <Text style={[styles.typeOptionLabel, { color: theme.colors.textPrimary }]}>
                    {fieldType.label}
                  </Text>
                  <Text style={[styles.typeOptionDesc, { color: theme.colors.textSecondary }]}>
                    {fieldType.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Required Toggle */}
        <View style={[styles.section, styles.row]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Required Field</Text>
            <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
              Users must fill this field
            </Text>
          </View>
          <Switch
            value={required}
            onValueChange={setRequired}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="white"
          />
        </View>

        {/* Default Value */}
        {type !== 'checkbox' && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Default Value</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.backgroundPrimary,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              }]}
              placeholder="Optional"
              placeholderTextColor={theme.colors.textTertiary}
              value={defaultValue}
              onChangeText={setDefaultValue}
            />
          </View>
        )}

        {/* Options (for select/multiselect) */}
        {needsOptions && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
              Options <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            
            {options.map((option, index) => (
              <View key={index} style={[styles.optionItem, { backgroundColor: theme.colors.backgroundPrimary }]}>
                <Text style={[styles.optionText, { color: theme.colors.textPrimary }]}>{option}</Text>
                <TouchableOpacity onPress={() => handleRemoveOption(index)}>
                  <X size={20} color={theme.colors.error} weight="bold" />
                </TouchableOpacity>
              </View>
            ))}
            
            <View style={styles.addOptionRow}>
              <TextInput
                style={[styles.optionInput, { 
                  backgroundColor: theme.colors.backgroundPrimary,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                }]}
                placeholder="Add option"
                placeholderTextColor={theme.colors.textTertiary}
                value={newOption}
                onChangeText={setNewOption}
                onSubmitEditing={handleAddOption}
              />
              <TouchableOpacity
                style={[styles.addOptionButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddOption}
              >
                <Plus size={20} color="white" weight="bold" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Validation (for text/textarea/number) */}
        {needsValidation && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Validation</Text>
            
            {(type === 'text' || type === 'textarea') && (
              <>
                <View style={styles.validationRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.subLabel, { color: theme.colors.textSecondary }]}>Min Length</Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: theme.colors.backgroundPrimary,
                        color: theme.colors.textPrimary,
                        borderColor: theme.colors.border,
                      }]}
                      placeholder="0"
                      placeholderTextColor={theme.colors.textTertiary}
                      keyboardType="number-pad"
                      value={minLength}
                      onChangeText={setMinLength}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.subLabel, { color: theme.colors.textSecondary }]}>Max Length</Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: theme.colors.backgroundPrimary,
                        color: theme.colors.textPrimary,
                        borderColor: theme.colors.border,
                      }]}
                      placeholder="100"
                      placeholderTextColor={theme.colors.textTertiary}
                      keyboardType="number-pad"
                      value={maxLength}
                      onChangeText={setMaxLength}
                    />
                  </View>
                </View>
                
                <Text style={[styles.subLabel, { color: theme.colors.textSecondary, marginTop: 12 }]}>Pattern (Regex)</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.backgroundPrimary,
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                  }]}
                  placeholder="e.g., ^[A-Z0-9]+$"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={pattern}
                  onChangeText={setPattern}
                />
                
                <Text style={[styles.subLabel, { color: theme.colors.textSecondary, marginTop: 12 }]}>Custom Error Message</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.backgroundPrimary,
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                  }]}
                  placeholder="Error message for invalid input"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={customError}
                  onChangeText={setCustomError}
                />
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Field</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  helpText: {
    fontSize: 13,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typeSelector: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  typeSelectorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeSelectorDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  typeList: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  typeOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  typeOptionDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 15,
  },
  addOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addOptionButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validationRow: {
    flexDirection: 'row',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
