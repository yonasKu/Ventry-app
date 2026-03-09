import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { CaretDown, Check, X } from 'phosphor-react-native';
import { useTheme } from '../../context/ThemeContext';
import { FormField } from './FormField';

interface MultiSelectFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  value: string[];
  onValueChange: (value: string[]) => void;
  options: string[];
  placeholder?: string;
}

export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  required = false,
  error,
  helpText,
  value = [],
  onValueChange,
  options,
  placeholder = 'Select options'
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (option: string) => {
    if (value.includes(option)) {
      onValueChange(value.filter(v => v !== option));
    } else {
      onValueChange([...value, option]);
    }
  };

  const handleRemove = (option: string) => {
    onValueChange(value.filter(v => v !== option));
  };

  const displayText = value.length > 0 
    ? `${value.length} selected` 
    : placeholder;

  return (
    <FormField label={label} required={required} error={error} helpText={helpText}>
      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
          }
        ]}
        onPress={() => setIsOpen(true)}
      >
        <Text
          style={[
            styles.selectText,
            {
              color: value.length > 0 ? theme.colors.textPrimary : theme.colors.textTertiary,
            }
          ]}
        >
          {displayText}
        </Text>
        <CaretDown size={20} color={theme.colors.textSecondary} weight="bold" />
      </TouchableOpacity>

      {value.length > 0 && (
        <View style={styles.selectedContainer}>
          {value.map((item, index) => (
            <View
              key={index}
              style={[styles.selectedChip, { backgroundColor: theme.colors.primary + '20' }]}
            >
              <Text style={[styles.selectedChipText, { color: theme.colors.primary }]}>
                {item}
              </Text>
              <TouchableOpacity
                onPress={() => handleRemove(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color={theme.colors.primary} weight="bold" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                {label}
              </Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={[styles.doneButton, { color: theme.colors.primary }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {options.map((option, index) => {
                const isSelected = value.includes(option);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.option,
                      { borderBottomColor: theme.colors.border }
                    ]}
                    onPress={() => handleToggle(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: isSelected ? theme.colors.primary : theme.colors.textPrimary,
                          fontWeight: isSelected ? '600' : '400',
                        }
                      ]}
                    >
                      {option}
                    </Text>
                    {isSelected && (
                      <Check size={20} color={theme.colors.primary} weight="bold" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </FormField>
  );
};

const styles = StyleSheet.create({
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 16,
    flex: 1,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  selectedChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
});