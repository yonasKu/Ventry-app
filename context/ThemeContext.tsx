import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme colors based on our theme guide
const COLORS = {
  // Primary brand colors
  primaryTeal: '#0D9488',
  accentAmber: '#F59E0B',
  
  // Supporting brand colors
  successGreen: '#10B981',
  errorRed: '#EF4444',
  
  // Neutral colors
  neutralDark: '#1F2937',
  neutralMedium: '#6B7280',
  neutralLight: '#E5E7EB',
  neutralExtraLight: '#F9FAFB',
  neutralWhite: '#FFFFFF',
  neutralBlack: '#111827',
  
  // Light theme specific
  light: {
    backgroundPrimary: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    surface: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    divider: '#E5E7EB',
  },
  
  // Dark theme specific
  dark: {
    backgroundPrimary: '#111827',
    backgroundSecondary: '#1F2937',
    surface: '#1F2937',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    border: '#374151',
    divider: '#374151',
  }
};

type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

// Typography styles
const TYPOGRAPHY = {
  display: {
    fontSize: 28,
    fontWeight: '700' as FontWeight,
    lineHeight: 34,
  },
  heading1: {
    fontSize: 22,
    fontWeight: '700' as FontWeight,
    lineHeight: 28,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '600' as FontWeight,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as FontWeight,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as FontWeight,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as FontWeight,
    lineHeight: 16,
  },
};

// Spacing values for consistent layout
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius values
const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

// Shadow styles
const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
};

// Theme interface
export interface Theme {
  isDark: boolean;
  toggleTheme: () => void; // Add toggle function
  colors: {
    // Primary brand colors
    primary: string;
    accent: string;
    
    // Supporting colors
    success: string;
    error: string;
    
    // Background colors
    backgroundPrimary: string;
    backgroundSecondary: string;
    surface: string;
    
    // Text colors
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    
    // UI element colors
    border: string;
    divider: string;
    
    // Additional colors
    neutralBlack: string;
    neutralWhite: string;
  };
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  borderRadius: typeof BORDER_RADIUS;
  shadows: typeof SHADOWS;
}

// Create the context
const ThemeContext = createContext<Theme | undefined>(undefined);

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when system theme changes (only if no manual preference is set)
  useEffect(() => {
    if (!isLoading) {
      checkSystemTheme();
    }
  }, [systemColorScheme, isLoading]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('dark_mode_enabled');
      if (savedTheme !== null) {
        setIsDark(JSON.parse(savedTheme));
      } else {
        // No saved preference, use system theme
        setIsDark(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      setIsDark(systemColorScheme === 'dark');
    } finally {
      setIsLoading(false);
    }
  };

  const checkSystemTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('dark_mode_enabled');
      // Only follow system theme if no manual preference is set
      if (savedTheme === null) {
        setIsDark(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error checking system theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('dark_mode_enabled', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Construct the theme object
  const theme: Theme = {
    isDark,
    toggleTheme, // Add the toggle function to the theme object
    colors: {
      // Primary brand colors
      primary: COLORS.primaryTeal,
      accent: COLORS.accentAmber,
      
      // Supporting colors
      success: COLORS.successGreen,
      error: COLORS.errorRed,
      
      // Theme-specific colors
      backgroundPrimary: isDark ? COLORS.dark.backgroundPrimary : COLORS.light.backgroundPrimary,
      backgroundSecondary: isDark ? COLORS.dark.backgroundSecondary : COLORS.light.backgroundSecondary,
      surface: isDark ? COLORS.dark.surface : COLORS.light.surface,
      textPrimary: isDark ? COLORS.dark.textPrimary : COLORS.light.textPrimary,
      textSecondary: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary,
      textTertiary: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary,
      border: isDark ? COLORS.dark.border : COLORS.light.border,
      divider: isDark ? COLORS.dark.divider : COLORS.light.divider,

      // Additional colors
      neutralBlack: COLORS.neutralBlack,
      neutralWhite: COLORS.neutralWhite,
    },
    typography: TYPOGRAPHY,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    shadows: SHADOWS,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

// Custom hook to use the theme
export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
