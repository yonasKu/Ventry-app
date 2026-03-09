import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Presentation,
  ForkKnife,
  Heart,
  ChalkboardTeacher,
  Trophy,
  Clock,
} from 'phosphor-react-native';
import { useTheme } from '../context/ThemeContext';
import { EventCategory, CategoryInfo } from '../types/FormTypes';
import { getAllCategories } from '../config/CategoryFormConfigs';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface CategorySelectionScreenProps {
  onSelectCategory: (category: EventCategory) => void;
}

const CategoryIcon: React.FC<{ icon: string; color: string; size: number }> = ({
  icon,
  color,
  size,
}) => {
  const iconProps = { size, color, weight: 'regular' as const };

  switch (icon) {
    case 'presentation':
      return <Presentation {...iconProps} />;
    case 'fork-knife':
      return <ForkKnife {...iconProps} />;
    case 'heart':
      return <Heart {...iconProps} />;
    case 'chalkboard-teacher':
      return <ChalkboardTeacher {...iconProps} />;
    case 'trophy':
      return <Trophy {...iconProps} />;
    default:
      return <Presentation {...iconProps} />;
  }
};

export const CategorySelectionScreen: React.FC<CategorySelectionScreenProps> = ({
  onSelectCategory,
}) => {
  const theme = useTheme();
  const categories = getAllCategories();

  const renderCategoryCard = (category: CategoryInfo) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => onSelectCategory(category.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
        <CategoryIcon icon={category.icon} color={theme.colors.primary} size={32} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.categoryName, { color: theme.colors.textPrimary }]}>
          {category.name}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {category.description}
        </Text>

        <View style={styles.timeContainer}>
          <Clock size={14} color={theme.colors.textTertiary} weight="regular" />
          <Text style={[styles.timeText, { color: theme.colors.textTertiary }]}>
            {category.estimatedTime}
          </Text>
        </View>

        <View style={styles.fieldsContainer}>
          <Text style={[styles.fieldsLabel, { color: theme.colors.textSecondary }]}>
            Includes:
          </Text>
          <View style={styles.fieldChips}>
            {category.specialFields.slice(0, 3).map((field, index) => (
              <View
                key={index}
                style={[
                  styles.fieldChip,
                  {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.fieldChipText, { color: theme.colors.textSecondary }]}>
                  {field}
                </Text>
              </View>
            ))}
            {category.specialFields.length > 3 && (
              <View
                style={[
                  styles.fieldChip,
                  {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.fieldChipText, { color: theme.colors.textSecondary }]}>
                  +{category.specialFields.length - 3} more
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.examplesContainer}>
          <Text style={[styles.examplesLabel, { color: theme.colors.textTertiary }]}>
            Examples: {category.examples.join(', ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Select Event Category
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Choose the category that best matches your event type
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.map(renderCategoryCard)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  content: {
    gap: 12,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
  },
  fieldsContainer: {
    marginTop: 4,
  },
  fieldsLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  fieldChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  examplesContainer: {
    marginTop: 4,
  },
  examplesLabel: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
