import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FormField } from './FormField';

interface NumberInputFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  placeholder?: string;
  value?: number;
  onChangeValue: (value: number | undefined) => void;
  onBlur?: () => void;
}

export const NumberInputField: React.FC<NumberInputFieldProps> = ({
  label,
  required = false,
  error,
  helpText,
  placeholder,
  value,
  onChangeValue,
  onBlur,
}) => {
  const theme = useTheme();

  const handleChange = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    
    if (numericValue === '') {
      onChangeValue(undefined);
    } else {
      onChangeValue(parseInt(numericValue, 10));
    }
  };

  return (
    <FormField label={label} required={required} error={error} helpText={helpText}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
            color: theme.colors.textPrimary,
          }
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        value={value !== undefined ? String(value) : ''}
        onChangeText={handleChange}
        onBlur={onBlur}
        keyboardType="number-pad"
      />
    </FormField>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
});