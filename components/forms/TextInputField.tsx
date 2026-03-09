import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FormField } from './FormField';

interface TextInputFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  value: string;
  onChangeText: (text: string) => void;
}

export const TextInputField: React.FC<TextInputFieldProps> = ({
  label,
  required = false,
  error,
  helpText,
  value,
  onChangeText,
  ...textInputProps
}) => {
  const theme = useTheme();

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
        placeholderTextColor={theme.colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        {...textInputProps}
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