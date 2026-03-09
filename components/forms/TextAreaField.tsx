import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FormField } from './FormField';

interface TextAreaFieldProps extends Omit<TextInputProps, 'style' | 'multiline'> {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  value: string;
  onChangeText: (text: string) => void;
  numberOfLines?: number;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  required = false,
  error,
  helpText,
  value,
  onChangeText,
  numberOfLines = 4,
  ...textInputProps
}) => {
  const theme = useTheme();

  return (
    <FormField label={label} required={required} error={error} helpText={helpText}>
      <TextInput
        style={[
          styles.textarea,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
            color: theme.colors.textPrimary,
            minHeight: numberOfLines * 24 + 24, // Approximate line height
          }
        ]}
        placeholderTextColor={theme.colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        {...textInputProps}
      />
    </FormField>
  );
};

const styles = StyleSheet.create({
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
});