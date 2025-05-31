import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CSV_TEMPLATES } from '../../../../services/CsvService';
import { FileArrowDown } from 'phosphor-react-native';

type TemplateSelectorProps = {
  theme: any;
  selectedTemplate: keyof typeof CSV_TEMPLATES;
  onSelectTemplate: (template: keyof typeof CSV_TEMPLATES) => void;
  onDownloadTemplate: (template: keyof typeof CSV_TEMPLATES) => void;
};

const TemplateSelector = ({ 
  theme, 
  selectedTemplate, 
  onSelectTemplate,
  onDownloadTemplate
}: TemplateSelectorProps) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Select Template
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {(Object.keys(CSV_TEMPLATES) as Array<keyof typeof CSV_TEMPLATES>).map((template) => (
          <TouchableOpacity
            key={template}
            style={[
              styles.templateButton,
              selectedTemplate === template 
                ? { backgroundColor: theme.colors.primary } 
                : { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }
            ]}
            onPress={() => onSelectTemplate(template)}
          >
            <Text 
              style={[
                styles.templateText, 
                { color: selectedTemplate === template ? '#fff' : theme.colors.textPrimary }
              ]}
            >
              {template.charAt(0) + template.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.templateInfo}>
        <Text style={[styles.templateDescription, { color: theme.colors.textSecondary }]}>
          {getTemplateDescription(selectedTemplate)}
        </Text>
        <TouchableOpacity
          style={[styles.downloadButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => onDownloadTemplate(selectedTemplate)}
        >
          <FileArrowDown size={16} color="#fff" weight="regular" />
          <Text style={styles.downloadText}>Download Template</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getTemplateDescription = (template: keyof typeof CSV_TEMPLATES): string => {
  switch (template) {
    case 'STANDARD':
      return 'Basic template with name, email, and phone fields.';
    case 'CONFERENCE':
      return 'For conferences with company and job title fields.';
    case 'WORKSHOP':
      return 'For workshops with skill level field (beginner, intermediate, advanced).';
    case 'NETWORKING':
      return 'For networking events with interests field.';
    default:
      return '';
  }
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  templateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  templateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  templateInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  templateDescription: {
    fontSize: 13,
    marginBottom: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  downloadText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
  },
});

export default TemplateSelector;
