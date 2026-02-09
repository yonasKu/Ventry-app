import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Alert, StatusBar, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, Plus, PencilSimple, Trash, DotsSixVertical, Check, X } from 'phosphor-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';
import { CustomFieldsService, CustomField } from '../../../services/CustomFieldsService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomFieldsScreen() {
  const theme = useTheme();
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const { getEventById } = useEvents();
  
  const [event, setEvent] = useState<any>(null);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customFieldsService] = useState(() => new CustomFieldsService());

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    if (!eventId) return;
    
    setIsLoading(true);
    try {
      const eventData = await getEventById(eventId);
      setEvent(eventData);
      
      // Load custom fields for this event
      const eventFields = customFieldsService.getFields(eventId);
      setFields(eventFields);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load custom fields');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddField = () => {
    router.push(`/event/custom-fields/add/${eventId}`);
  };

  const handleEditField = (fieldId: string) => {
    router.push(`/event/custom-fields/edit/${eventId}?fieldId=${fieldId}`);
  };

  const handleDeleteField = (field: CustomField) => {
    Alert.alert(
      'Delete Field',
      `Are you sure you want to delete "${field.name}"? This will remove all data for this field.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              customFieldsService.deleteField(field.id);
              setFields(fields.filter(f => f.id !== field.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete field');
            }
          },
        },
      ]
    );
  };

  const handleApplyTemplate = () => {
    router.push(`/event/custom-fields/templates/${eventId}`);
  };

  const getFieldTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      text: 'Text',
      textarea: 'Long Text',
      number: 'Number',
      email: 'Email',
      phone: 'Phone',
      date: 'Date',
      time: 'Time',
      datetime: 'Date & Time',
      select: 'Dropdown',
      multiselect: 'Multiple Choice',
      checkbox: 'Yes/No',
      url: 'Website',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <CaretLeft size={24} color="white" weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: 'white' }]}>Custom Fields</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <CaretLeft size={24} color="white" weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: 'white' }]}>Custom Fields</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Event Info */}
      {event && (
        <View style={[styles.eventInfo, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <Text style={[styles.eventName, { color: theme.colors.textPrimary }]}>
            {event.title}
          </Text>
          <Text style={[styles.eventMeta, { color: theme.colors.textSecondary }]}>
            {fields.length} custom {fields.length === 1 ? 'field' : 'fields'}
          </Text>
        </View>
      )}

      {/* Template Button */}
      <View style={styles.templateSection}>
        <TouchableOpacity
          style={[styles.templateButton, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={handleApplyTemplate}
        >
          <Text style={[styles.templateButtonText, { color: theme.colors.primary }]}>
            📋 Apply Template
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fields List */}
      <FlatList
        data={fields}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.fieldCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
            <View style={styles.fieldHeader}>
              <DotsSixVertical size={20} color={theme.colors.textTertiary} weight="bold" />
              <View style={styles.fieldInfo}>
                <Text style={[styles.fieldName, { color: theme.colors.textPrimary }]}>
                  {item.name}
                  {item.required && <Text style={{ color: theme.colors.error }}> *</Text>}
                </Text>
                <Text style={[styles.fieldMeta, { color: theme.colors.textSecondary }]}>
                  {getFieldTypeLabel(item.type)}
                  {item.options && ` • ${item.options.length} options`}
                </Text>
              </View>
            </View>
            
            <View style={styles.fieldActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditField(item.id)}
              >
                <PencilSimple size={20} color={theme.colors.primary} weight="regular" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteField(item)}
              >
                <Trash size={20} color={theme.colors.error} weight="regular" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No custom fields yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>
              Add fields to collect additional information from attendees
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddField}
      >
        <Plus size={24} color="white" weight="bold" />
        <Text style={styles.addButtonText}>Add Field</Text>
      </TouchableOpacity>
    </SafeAreaView>
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
  eventInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 14,
  },
  templateSection: {
    padding: 16,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(13, 148, 136, 0.2)',
  },
  templateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fieldInfo: {
    marginLeft: 12,
    flex: 1,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldMeta: {
    fontSize: 13,
  },
  fieldActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
