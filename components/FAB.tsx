import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface FABProps {
  icon: React.ReactNode;
  onPress: () => void;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'small' | 'medium' | 'large';
}

export default function FAB({ 
  icon, 
  onPress, 
  label, 
  position = 'bottom-right',
  size = 'medium' 
}: FABProps) {
  const theme = useTheme();

  const sizeStyles = {
    small: { width: 48, height: 48 },
    medium: { width: 56, height: 56 },
    large: { width: 64, height: 64 },
  };

  const positionStyles = {
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'bottom-center': { bottom: 20, alignSelf: 'center' as const },
  };

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        sizeStyles[size],
        positionStyles[position],
        { backgroundColor: theme.colors.primary },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon}
      {label && (
        <View style={[styles.labelContainer, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  labelContainer: {
    position: 'absolute',
    right: '100%',
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  labelText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
