import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { X } from 'phosphor-react-native';
import { useTheme } from '../context/ThemeContext';
import { Event } from '../services/DatabaseService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FilterOptions {
  selectedEventId: string | null;
  timeFilter: 'week' | 'month' | 'year' | 'all';
  category: string | null;
  status: 'upcoming' | 'past' | 'all';
  checkInStatus: 'all' | 'high' | 'medium' | 'low'; // Check-in rate filter
  attendeeRange: { min: number | null; max: number | null }; // Attendee count range
  sortBy: 'date' | 'name' | 'attendees' | 'checkInRate'; // Sort option
}

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  events: Event[];
  showTimeFilter?: boolean;
  showEventFilter?: boolean;
  showCategoryFilter?: boolean;
  showStatusFilter?: boolean;
  showCheckInFilter?: boolean;
  showAttendeeRangeFilter?: boolean;
  showSortOptions?: boolean;
}

const EVENT_CATEGORIES = [
  'Corporate Event',
  'Conference',
  'Workshop',
  'Restaurant/Club',
  'School/University',
];

export default function FilterSheet({
  visible,
  onClose,
  onApply,
  currentFilters,
  events,
  showTimeFilter = true,
  showEventFilter = true,
  showCategoryFilter = false,
  showStatusFilter = false,
  showCheckInFilter = false,
  showAttendeeRangeFilter = false,
  showSortOptions = false,
}: FilterSheetProps) {
  const theme = useTheme();
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [localFilters, setLocalFilters] = useState<FilterOptions>(currentFilters);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleReset = () => {
    setLocalFilters({
      selectedEventId: null,
      timeFilter: 'all',
      category: null,
      status: 'all',
      checkInStatus: 'all',
      attendeeRange: { min: null, max: null },
      sortBy: 'date',
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sheetContainer,
            { backgroundColor: theme.colors.backgroundPrimary },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={handleReset}>
              <Text style={[styles.resetText, { color: theme.colors.primary }]}>
                Reset
              </Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Filters
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.textPrimary} weight="bold" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Filter by Event */}
            {showEventFilter && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Filter By Event
                </Text>
                <View style={styles.chipContainer}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      {
                        backgroundColor: localFilters.selectedEventId === null
                          ? theme.colors.primary
                          : theme.colors.backgroundSecondary,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => setLocalFilters({ ...localFilters, selectedEventId: null })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: localFilters.selectedEventId === null
                            ? 'white'
                            : theme.colors.textPrimary,
                        },
                      ]}
                    >
                      All Events
                    </Text>
                  </TouchableOpacity>
                  {events.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: localFilters.selectedEventId === event.id
                            ? theme.colors.primary
                            : theme.colors.backgroundSecondary,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() =>
                        setLocalFilters({ ...localFilters, selectedEventId: event.id })
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: localFilters.selectedEventId === event.id
                              ? 'white'
                              : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {event.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Filter by Time Period */}
            {showTimeFilter && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Filter By Time Period
                </Text>
                <View style={styles.chipContainer}>
                  {(['week', 'month', 'year', 'all'] as const).map((period) => (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: localFilters.timeFilter === period
                            ? theme.colors.primary
                            : theme.colors.backgroundSecondary,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => setLocalFilters({ ...localFilters, timeFilter: period })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: localFilters.timeFilter === period
                              ? 'white'
                              : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Filter by Category */}
            {showCategoryFilter && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Filter By Category
                </Text>
                <View style={styles.chipContainer}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      {
                        backgroundColor: localFilters.category === null
                          ? theme.colors.primary
                          : theme.colors.backgroundSecondary,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => setLocalFilters({ ...localFilters, category: null })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: localFilters.category === null
                            ? 'white'
                            : theme.colors.textPrimary,
                        },
                      ]}
                    >
                      All Categories
                    </Text>
                  </TouchableOpacity>
                  {EVENT_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: localFilters.category === category
                            ? theme.colors.primary
                            : theme.colors.backgroundSecondary,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => setLocalFilters({ ...localFilters, category })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: localFilters.category === category
                              ? 'white'
                              : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Filter by Status */}
            {showStatusFilter && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Filter By Status
                </Text>
                <View style={styles.chipContainer}>
                  {(['all', 'upcoming', 'past'] as const).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: localFilters.status === status
                            ? theme.colors.primary
                            : theme.colors.backgroundSecondary,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => setLocalFilters({ ...localFilters, status })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: localFilters.status === status
                              ? 'white'
                              : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Filter by Check-in Rate */}
            {showCheckInFilter && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Filter By Check-in Rate
                </Text>
                <View style={styles.chipContainer}>
                  {([
                    { value: 'all', label: 'All' },
                    { value: 'high', label: 'High (>70%)' },
                    { value: 'medium', label: 'Medium (30-70%)' },
                    { value: 'low', label: 'Low (<30%)' },
                  ] as const).map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: localFilters.checkInStatus === option.value
                            ? theme.colors.primary
                            : theme.colors.backgroundSecondary,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => setLocalFilters({ ...localFilters, checkInStatus: option.value })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: localFilters.checkInStatus === option.value
                              ? 'white'
                              : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Filter by Attendee Count Range */}
            {showAttendeeRangeFilter && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Filter By Attendee Count
                </Text>
                <View style={styles.rangeContainer}>
                  <View style={styles.rangeInputContainer}>
                    <Text style={[styles.rangeLabel, { color: theme.colors.textSecondary }]}>Min</Text>
                    <TextInput
                      style={[styles.rangeInput, { 
                        color: theme.colors.textPrimary,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.backgroundSecondary,
                      }]}
                      placeholder="0"
                      placeholderTextColor={theme.colors.textTertiary}
                      keyboardType="number-pad"
                      value={localFilters.attendeeRange.min?.toString() || ''}
                      onChangeText={(text) => {
                        const num = text ? parseInt(text) : null;
                        setLocalFilters({
                          ...localFilters,
                          attendeeRange: { ...localFilters.attendeeRange, min: num },
                        });
                      }}
                    />
                  </View>
                  <Text style={[styles.rangeSeparator, { color: theme.colors.textSecondary }]}>to</Text>
                  <View style={styles.rangeInputContainer}>
                    <Text style={[styles.rangeLabel, { color: theme.colors.textSecondary }]}>Max</Text>
                    <TextInput
                      style={[styles.rangeInput, { 
                        color: theme.colors.textPrimary,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.backgroundSecondary,
                      }]}
                      placeholder="∞"
                      placeholderTextColor={theme.colors.textTertiary}
                      keyboardType="number-pad"
                      value={localFilters.attendeeRange.max?.toString() || ''}
                      onChangeText={(text) => {
                        const num = text ? parseInt(text) : null;
                        setLocalFilters({
                          ...localFilters,
                          attendeeRange: { ...localFilters.attendeeRange, max: num },
                        });
                      }}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Sort Options */}
            {showSortOptions && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Sort By
                </Text>
                <View style={styles.chipContainer}>
                  {([
                    { value: 'date', label: 'Date' },
                    { value: 'name', label: 'Name' },
                    { value: 'attendees', label: 'Attendees' },
                    { value: 'checkInRate', label: 'Check-in Rate' },
                  ] as const).map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: localFilters.sortBy === option.value
                            ? theme.colors.primary
                            : theme.colors.backgroundSecondary,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => setLocalFilters({ ...localFilters, sortBy: option.value })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: localFilters.sortBy === option.value
                              ? 'white'
                              : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Apply Button */}
          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeInputContainer: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  rangeInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  rangeSeparator: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 20,
  },
});
