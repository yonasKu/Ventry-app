import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'phosphor-react-native';
import { useTheme } from '../../context/ThemeContext';
import { FormField } from './FormField';

interface CheckboxFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  required = false,
  error,
  helpText,
  value,
  onValueChange
}) => {
  const theme = useTheme();

  return (
    <FormField label={label} required={required} error={error} helpText={helpText}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => onValueChange(!value)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: value ? theme.colors.primary : theme.colors.surface,
              borderColor: value ? theme.colors.primary : theme.colors.border,
            }
          ]}
        >
          {value && (
            <Check size={18} color="white" weight="bold" />
          )}
        </View>
        <Text style={[styles.checkboxLabel, { color: theme.colors.textPrimary }]}>
          {value ? 'Yes' : 'No'}
        </Text>
      </TouchableOpacity>
    </FormField>
  );
};

const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 16,
  },
});