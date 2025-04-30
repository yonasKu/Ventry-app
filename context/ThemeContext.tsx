import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

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

// Typography styles
const TYPOGRAPHY = {
  display: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  heading1: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
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
  const colorScheme = useColorScheme();
  // Force light mode for testing
  const [isDark, setIsDark] = useState(false);

  // Update theme when system theme changes
  useEffect(() => {
    // Uncomment this line to re-enable system theme
    // setIsDark(colorScheme === 'dark');
  }, [colorScheme]);

  // Construct the theme object
  const theme: Theme = {
    isDark,
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
