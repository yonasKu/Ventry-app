import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { FilterType } from '@/services/SearchService';
import FilterService from '@/services/FilterService';
import { Attendee } from '@/services/DatabaseService';

interface QuickFilterChipsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  attendees: Attendee[];
}

export default function QuickFilterChips({
  activeFilter,
  onFilterChange,
  attendees,
}: QuickFilterChipsProps) {
  const theme = useTheme();
  const filterConfigs = FilterService.getAllFilterConfigs();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {filterConfigs.map((config) => {
        const isActive = activeFilter === config.type;
        const count = FilterService.getFilterCount(attendees, config.type);
        
        return (
          <TouchableOpacity
            key={config.type}
            onPress={() => onFilterChange(config.type)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                borderColor: isActive ? theme.colors.primary : theme.colors.border,
              }
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                theme.typography.bodySmall,
                {
                  color: isActive ? '#FFFFFF' : theme.colors.text,
                  fontWeight: isActive ? '600' : '400',
                }
              ]}
            >
              {config.label}
            </Text>
            
            {count > 0 && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.3)' : theme.colors.primary + '20',
                  }
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: isActive ? '#FFFFFF' : theme.colors.primary,
                    }
                  ]}
                >
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
