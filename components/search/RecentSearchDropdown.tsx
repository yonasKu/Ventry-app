import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert 
} from 'react-native';
import { Clock, X, Trash } from 'phosphor-react-native';
import { useTheme } from '@/context/ThemeContext';
import { RecentSearch } from '@/services/SearchService';
import { formatDistance } from 'date-fns';

interface RecentSearchDropdownProps {
  searches: RecentSearch[];
  onSelectSearch: (query: string) => void;
  onDeleteSearch: (searchId: string) => void;
  onClearAll: () => void;
  visible: boolean;
}

export default function RecentSearchDropdown({
  searches,
  onSelectSearch,
  onDeleteSearch,
  onClearAll,
  visible,
}: RecentSearchDropdownProps) {
  const theme = useTheme();

  if (!visible || searches.length === 0) {
    return null;
  }

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Recent Searches',
      'Are you sure you want to clear all recent searches?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: onClearAll 
        },
      ]
    );
  };

  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>
          Recent Searches
        </Text>
        <TouchableOpacity 
          onPress={handleClearAll}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {searches.map((search) => (
          <View 
            key={search.id}
            style={[
              styles.searchItem,
              { borderBottomColor: theme.colors.border }
            ]}
          >
            <TouchableOpacity
              style={styles.searchContent}
              onPress={() => onSelectSearch(search.query)}
              activeOpacity={0.7}
            >
              <Clock 
                size={16} 
                color={theme.colors.textSecondary} 
                weight="regular"
              />
              <View style={styles.searchTextContainer}>
                <Text 
                  style={[
                    styles.searchQuery,
                    theme.typography.body,
                    { color: theme.colors.textPrimary }
                  ]}
                  numberOfLines={1}
                >
                  {search.query}
                </Text>
                <Text 
                  style={[
                    styles.searchTime,
                    { color: theme.colors.textSecondary }
                  ]}
                >
                  {formatDistance(search.timestamp, Date.now(), { addSuffix: true })}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => onDeleteSearch(search.id)}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={theme.colors.textSecondary} weight="bold" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: -4,
    borderRadius: 10,
    borderWidth: 1,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollView: {
    maxHeight: 250,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  searchQuery: {
    fontSize: 15,
    marginBottom: 2,
  },
  searchTime: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
});
