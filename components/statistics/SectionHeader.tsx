import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SectionHeaderProps {
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
});

export default SectionHeader; 