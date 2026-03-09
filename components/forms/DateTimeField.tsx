import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'phosphor-react-native';
import { useTheme } from '../../context/ThemeContext';
import { FormField } from './FormField';

interface DateTimeFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  value: Date;
  onValueChange: (value: Date) => void;
  mode: 'date' | 'time';
}

export const DateTimeField: React.FC<DateTimeFieldProps> = ({
  label,
  required = false,
  error,
  helpText,
  value,
  onValueChange,
  mode
}) => {
  const theme = useTheme();
  const [show, setShow] = useState(false);

  const handleChange = (_event: any, selectedValue?: Date) => {
    setShow(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedValue) {
      onValueChange(selectedValue);
    }
  };

  const formatDate = (date: Date) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    if (!date) return 'Select time';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Use current date/time as default if value is undefined
  const currentValue = value || new Date();
  const displayValue = mode === 'date' ? formatDate(value) : formatTime(value);
  const Icon = mode === 'date' ? Calendar : Clock;

  return (
    <FormField label={label} required={required} error={error} helpText={helpText}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
          }
        ]}
        onPress={() => setShow(true)}
      >
        <Icon size={20} color={theme.colors.textSecondary} weight="regular" />
        <Text style={[styles.text, { color: theme.colors.textPrimary }]}>
          {displayValue}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={currentValue}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </FormField>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  text: {
    fontSize: 16,
    flex: 1,
  },
});