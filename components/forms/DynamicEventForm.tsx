import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { CategoryFormConfig, FormFieldConfig, FormFieldValue } from '../../types/FormTypes';
import { validateFormData } from '../../utils/formConfigUtils';
import { FormSection } from './FormSection';
import { FormProgress } from './FormProgress';
import { TextInputField } from './TextInputField';
import { TextAreaField } from './TextAreaField';
import { NumberInputField } from './NumberInputField';
import { SelectField } from './SelectField';
import { MultiSelectField } from './MultiSelectField';
import { CheckboxField } from './CheckboxField';
import { DateTimeField } from './DateTimeField';

interface DynamicEventFormProps {
  config: CategoryFormConfig;
  initialData?: Record<string, FormFieldValue>;
  onDataChange?: (data: Record<string, FormFieldValue>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export const DynamicEventForm: React.FC<DynamicEventFormProps> = ({
  config,
  initialData = {},
  onDataChange,
  onValidationChange,
}) => {
  const [formData, setFormData] = useState<Record<string, FormFieldValue>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Calculate form completion
  const calculateCompletion = () => {
    const allFields = config.sections.flatMap(section => section.fields);
    const requiredFields = allFields.filter(field => field.required);
    const filledRequiredFields = requiredFields.filter(field => {
      const value = formData[field.id];
      return value !== undefined && value !== null && value !== '';
    });
    
    return requiredFields.length > 0
      ? (filledRequiredFields.length / requiredFields.length) * 100
      : 100;
  };

  // Validate a single field
  const validateField = (field: FormFieldConfig, value: FormFieldValue): string | null => {
    if (!field.validation) return null;

    for (const rule of field.validation) {
      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            return rule.message;
          }
          break;
        case 'minLength':
          if (typeof value === 'string' && value.length < (rule.value as number)) {
            return rule.message;
          }
          break;
        case 'maxLength':
          if (typeof value === 'string' && value.length > (rule.value as number)) {
            return rule.message;
          }
          break;
        case 'min':
          if (typeof value === 'number' && value < (rule.value as number)) {
            return rule.message;
          }
          break;
        case 'max':
          if (typeof value === 'number' && value > (rule.value as number)) {
            return rule.message;
          }
          break;
        case 'pattern':
          if (typeof value === 'string' && !(rule.value as RegExp).test(value)) {
            return rule.message;
          }
          break;
      }
    }

    return null;
  };

  // Handle field value change
  const handleFieldChange = (fieldId: string, value: FormFieldValue) => {
    const newFormData = { ...formData, [fieldId]: value };
    setFormData(newFormData);

    // Find the field config
    const field = config.sections
      .flatMap(section => section.fields)
      .find(f => f.id === fieldId);

    if (field) {
      // Validate the field
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [fieldId]: error || '',
      }));
    }

    // Notify parent of data change
    if (onDataChange) {
      onDataChange(newFormData);
    }
  };

  // Handle field blur (mark as touched)
  const handleFieldBlur = (fieldId: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldId));
  };

  // Validate entire form
  useEffect(() => {
    const allFields = config.sections.flatMap(section => section.fields);
    let isValid = true;

    for (const field of allFields) {
      const value = formData[field.id];
      const error = validateField(field, value);
      
      if (error) {
        isValid = false;
        break;
      }
    }

    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [formData, config]);

  // Render a single field based on its type
  const renderField = (field: FormFieldConfig) => {
    const value = formData[field.id];
    const error = touchedFields.has(field.id) ? errors[field.id] : undefined;

    const commonProps = {
      label: field.label,
      value,
      error,
      required: field.required,
      helpText: field.helpText,
      onBlur: () => handleFieldBlur(field.id),
    };

    switch (field.type) {
      case 'text':
        return (
          <TextInputField
            key={field.id}
            {...commonProps}
            placeholder={field.placeholder}
            value={value as string}
            onChangeText={(text) => handleFieldChange(field.id, text)}
          />
        );

      case 'textarea':
        return (
          <TextAreaField
            key={field.id}
            {...commonProps}
            placeholder={field.placeholder}
            value={value as string}
            onChangeText={(text) => handleFieldChange(field.id, text)}
          />
        );

      case 'number':
        return (
          <NumberInputField
            key={field.id}
            {...commonProps}
            placeholder={field.placeholder}
            value={value as number}
            onChangeValue={(num) => handleFieldChange(field.id, num)}
          />
        );

      case 'select':
        return (
          <SelectField
            key={field.id}
            {...commonProps}
            options={field.options || []}
            value={value as string}
            onValueChange={(val) => handleFieldChange(field.id, val)}
          />
        );

      case 'multiselect':
        return (
          <MultiSelectField
            key={field.id}
            {...commonProps}
            options={field.options || []}
            value={value as string[]}
            onValueChange={(val) => handleFieldChange(field.id, val)}
          />
        );

      case 'checkbox':
        return (
          <CheckboxField
            key={field.id}
            {...commonProps}
            value={value as boolean}
            onValueChange={(val) => handleFieldChange(field.id, val)}
          />
        );

      case 'date':
      case 'time':
        return (
          <DateTimeField
            key={field.id}
            {...commonProps}
            mode={field.type}
            value={value as Date}
            onValueChange={(val) => handleFieldChange(field.id, val)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <FormProgress
        currentSection={1}
        totalSections={config.sections.length}
        completionPercentage={calculateCompletion()}
      />

      {config.sections.map((section) => (
        <FormSection
          key={section.id}
          title={section.title}
          description={section.description}
        >
          {section.fields.map(renderField)}
        </FormSection>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
