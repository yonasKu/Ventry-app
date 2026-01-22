import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Alert, StatusBar, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, CheckCircle } from 'phosphor-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { CustomFieldsService, FieldTemplate } from '../../../../services/CustomFieldsService';
import { initializeBuiltInTemplates } from '../../../../data/fieldTemplates';

export default function FieldTemplatesScreen() {
  const theme = useTheme();
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  
  const [templates, setTemplates] = useState<FieldTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customFieldsService] = useState(() => new CustomFieldsService());

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      // Initialize built-in templates if needed
      await initializeBuiltInTemplates(customFieldsService);
      
      // Load all templates
      const allTemplates = customFieldsService.getTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTemplate = (template: FieldTemplate) => {
    Alert.alert(
      'Apply Template',
      `Apply "${template.name}" template? This will add ${template.fields.length} custom fields to your event.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            try {
              customFieldsService.applyTemplate(template.id, eventId!);
              Alert.alert(
                'Success',
                `${template.fields.length} fields added successfully!`,
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error) {
              console.error('Error applying template:', error);
              Alert.alert('Error', 'Failed to apply template');
            }
          },
        },
      ]
    );
  };

  const getTemplateIcon = (name: string): string => {
    const icons: Record<string, string> = {
      'Corporate Event': '🏢',
      'Conference': '🎓',
      'Restaurant/Club': '🍽️',
      'School/University': '📚',
    };
    return icons[name] || '📋';
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <CaretLeft size={24} color="white" weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: 'white' }]}>Field Templates</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <CaretLeft size={24} color="white" weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: 'white' }]}>Field Templates</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info */}
      <View style={[styles.infoBox, { backgroundColor: `${theme.colors.primary}10` }]}>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          💡 Templates provide pre-configured fields for common event types. Select one to quickly add multiple fields at once.
        </Text>
      </View>

      {/* Templates List */}
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.templateCard, { backgroundColor: theme.colors.backgroundPrimary }]}
            onPress={() => handleApplyTemplate(item)}
          >
            <View style={styles.templateHeader}>
              <Text style={styles.templateIcon}>{getTemplateIcon(item.name)}</Text>
              <View style={styles.templateInfo}>
                <Text style={[styles.templateName, { color: theme.colors.textPrimary }]}>
                  {item.name}
                </Text>
                {item.description && (
                  <Text style={[styles.templateDescription, { color: theme.colors.textSecondary }]}>
                    {item.description}
                  </Text>
                )}
                <Text style={[styles.templateMeta, { color: theme.colors.textTertiary }]}>
                  {item.fields.length} {item.fields.length === 1 ? 'field' : 'fields'}
                </Text>
              </View>
            </View>
            
            <View style={[styles.applyButton, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Text style={[styles.applyButtonText, { color: theme.colors.primary }]}>
                Apply
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No templates available
            </Text>
          </View>
        }
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  templateIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    marginBottom: 6,
  },
  templateMeta: {
    fontSize: 13,
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
