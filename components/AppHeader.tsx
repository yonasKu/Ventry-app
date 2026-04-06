import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeft } from 'phosphor-react-native';
import { useTheme } from '../context/ThemeContext';
import { router } from 'expo-router';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  showBackButton?: boolean;
  statusBarStyle?: 'light-content' | 'dark-content';
}

export default function AppHeader({
  title,
  onBack,
  rightComponent,
  backgroundColor,
  textColor,
  showBackButton = true,
  statusBarStyle = 'light-content'
}: AppHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const headerBg = backgroundColor || theme.colors.primary;
  const headerTextColor = textColor || 'white';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <>
      <StatusBar barStyle={statusBarStyle} backgroundColor={headerBg} />
      <View style={[
        styles.header, 
        { 
          backgroundColor: headerBg,
          paddingTop: insets.top + 12,
          paddingBottom: 16
        }
      ]}>
        <View style={styles.headerContent}>
          {showBackButton ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <CaretLeft size={18} color={headerTextColor} weight="regular" />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
          
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: headerTextColor }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
          
          <View style={styles.rightContainer}>
            {rightComponent || <View style={styles.rightPlaceholder} />}
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 44,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  rightContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPlaceholder: {
    width: 36,
    height: 36,
  },
});