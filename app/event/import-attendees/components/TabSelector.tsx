import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ClipboardText, UserPlus } from 'phosphor-react-native';

type TabSelectorProps = {
  activeTab: 'paste' | 'manual';
  setActiveTab: (tab: 'paste' | 'manual') => void;
  theme: any;
};

const TabSelector = ({ activeTab, setActiveTab, theme }: TabSelectorProps) => (
  <View style={[styles.tabContainer, { backgroundColor: theme.colors.cardBackground }, theme.shadows.sm]}>
    <TouchableOpacity 
      style={[styles.tab, activeTab === 'paste' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]]}
      onPress={() => setActiveTab('paste')}
    >
      <ClipboardText 
        size={18} 
        color={activeTab === 'paste' ? theme.colors.primary : theme.colors.textSecondary} 
        weight={activeTab === 'paste' ? "bold" : "regular"}
      />
      <Text style={[styles.tabText, { color: activeTab === 'paste' ? theme.colors.primary : theme.colors.textSecondary }]}>
        Paste Data
      </Text>
    </TouchableOpacity>
    <TouchableOpacity 
      style={[styles.tab, activeTab === 'manual' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]]}
      onPress={() => setActiveTab('manual')}
    >
      <UserPlus 
        size={18} 
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
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TabSelector;
