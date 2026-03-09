import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface FormProgressProps {
  currentSection: number;
  totalSections: number;
  completionPercentage: number;
}

export const FormProgress: React.FC<FormProgressProps> = ({
  currentSection,
  totalSections,
  completionPercentage,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
          Section {currentSection} of {totalSections}
        </Text>
        <Text style={[styles.percentageText, { color: theme.colors.primary }]}>
          {Math.round(completionPercentage)}% Complete
        </Text>
      </View>
      <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.colors.primary,
              width: `${completionPercentage}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
