import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { ClipboardText, UserPlus } from 'phosphor-react-native';

type TabSelectorProps = {
  theme: any;
  activeTab: 'paste' | 'manual';
  onTabChange: (tab: 'paste' | 'manual') => void;
};

const TabSelector = ({ theme, activeTab, onTabChange }: TabSelectorProps) => (
  <View style={[
    styles.tabContainer, 
    { backgroundColor: theme.colors.cardBackground },

  ]}>
    <TouchableOpacity 
      style={[
        styles.tab, 
        activeTab === 'paste' && [
          styles.activeTab, 
          { backgroundColor: activeTab === 'paste' ? theme.colors.backgroundPrimary : 'transparent' }
        ]
      ]}
      onPress={() => onTabChange('paste')}
    >
      <ClipboardText 
        size={20} 
        color={activeTab === 'paste' ? theme.colors.primary : theme.colors.textSecondary} 
        weight={activeTab === 'paste' ? "bold" : "regular"}
      />
      <Text style={[styles.tabText, { color: activeTab === 'paste' ? theme.colors.primary : theme.colors.textSecondary }]}>
        Paste Data
      </Text>
    </TouchableOpacity>
    <TouchableOpacity 
      style={[
        styles.tab, 
        activeTab === 'manual' && [
          styles.activeTab, 
          { backgroundColor: activeTab === 'manual' ? theme.colors.backgroundPrimary : 'transparent' }
        ]
      ]}
      onPress={() => onTabChange('manual')}
    >
      <UserPlus 
        size={20} 
        color={activeTab === 'manual' ? theme.colors.primary : theme.colors.textSecondary} 
        weight={activeTab === 'manual' ? "bold" : "regular"}
      />
      <Text style={[styles.tabText, { color: activeTab === 'manual' ? theme.colors.primary : theme.colors.textSecondary }]}>
        Manual Entry
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 2,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TabSelector;
