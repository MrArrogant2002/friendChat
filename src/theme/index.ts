import type { Theme as NavigationTheme } from '@react-navigation/native';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
} from '@react-navigation/native';
import { Platform } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';

// Typography Scale - Modern Sans-Serif (Poppins/Inter style)
export const typography = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  sizes: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

// Spacing Scale (8px rhythm)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border Radius Scale
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

// Shadow Elevations
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};

const baseLight: MD3Theme = MD3LightTheme;
const baseDark: MD3Theme = MD3DarkTheme;

const { LightTheme: navigationLightBase, DarkTheme: navigationDarkBase } = adaptNavigationTheme({
  reactNavigationLight: NavigationLightTheme,
  reactNavigationDark: NavigationDarkTheme,
});

// Light Theme - Soft green and blue palette
export const lightTheme: MD3Theme = {
  ...baseLight,
  colors: {
    ...baseLight.colors,
    // Main colors
    primary: '#93BFC7', // Soft blue for icons and accents
    primaryContainer: '#ABE7B2', // Light green for sent message bubbles
    onPrimaryContainer: '#333333',
    secondary: '#93BFC7', // Soft blue for highlights
    onSecondary: '#FFFFFF',

    // Background colors
    background: '#ECF4E8', // Soft greenish background
    onBackground: '#333333', // Dark text
    surface: '#FFFFFF',
    onSurface: '#333333',
    surfaceVariant: '#E5F0E1',
    onSurfaceVariant: '#4A5A4A',

    // Utility colors
    outline: '#93BFC7',
    outlineVariant: '#C8E6CA',
    tertiary: '#ABE7B2',
    onTertiary: '#333333',

    // Semantic colors
    error: '#D32F2F',
    onError: '#FFFFFF',
    errorContainer: '#FFEBEE',
    onErrorContainer: '#B71C1C',

    // Inverse colors for dark elements on light theme
    inverseSurface: '#1C1C1C',
    inverseOnSurface: '#ECECEC',
    inversePrimary: '#CBF3BB',
  },
  fonts: {
    ...baseLight.fonts,
    labelLarge: {
      ...baseLight.fonts.labelLarge,
      fontWeight: typography.fontWeights.medium,
    },
    titleMedium: {
      ...baseLight.fonts.titleMedium,
      fontWeight: typography.fontWeights.semibold,
    },
    headlineSmall: {
      ...baseLight.fonts.headlineSmall,
      fontWeight: typography.fontWeights.bold,
    },
  },
};

// Dark Theme - Improved contrast and readability
export const darkTheme: MD3Theme = {
  ...baseDark,
  colors: {
    ...baseDark.colors,
    // Main colors - softer, less harsh
    primary: '#7BA8B0', // Slightly muted blue for better dark mode
    primaryContainer: '#9DD3A7', // Softer green (less bright than #CBF3BB)
    onPrimaryContainer: '#1A2420', // Darker text for better contrast
    secondary: '#7BA8B0',
    onSecondary: '#1A2420',

    // Background colors - less extreme contrast
    background: '#0F1410', // Very dark green-tinted background
    onBackground: '#E5E9E6', // Slightly softer white
    surface: '#1E2622', // Dark surface with green tint
    onSurface: '#E5E9E6',
    surfaceVariant: '#2A3330', // Lighter variant for contrast
    onSurfaceVariant: '#B8C2BD', // Muted gray-green

    // Utility colors
    outline: '#7BA8B0',
    outlineVariant: '#3A4440', // Subtle borders
    tertiary: '#9DD3A7',
    onTertiary: '#1A2420',

    // Semantic colors - softer for dark mode
    error: '#E57373', // Softer red
    onError: '#1A2420',
    errorContainer: '#4A2C2C', // Less harsh red container
    onErrorContainer: '#FFCDD2',

    // Inverse colors
    inverseSurface: '#E5E9E6',
    inverseOnSurface: '#1A2420',
    inversePrimary: '#7BA8B0',
  },
  fonts: {
    ...baseDark.fonts,
    labelLarge: {
      ...baseDark.fonts.labelLarge,
      fontWeight: typography.fontWeights.medium,
    },
    titleMedium: {
      ...baseDark.fonts.titleMedium,
      fontWeight: typography.fontWeights.semibold,
    },
    headlineSmall: {
      ...baseDark.fonts.headlineSmall,
      fontWeight: typography.fontWeights.bold,
    },
  },
};

export const navigationLightTheme: NavigationTheme = {
  ...navigationLightBase,
  colors: {
    ...navigationLightBase.colors,
    primary: lightTheme.colors.primary,
    background: lightTheme.colors.background,
    card: lightTheme.colors.surface,
    text: '#333333',
    border: lightTheme.colors.outlineVariant,
    notification: lightTheme.colors.primaryContainer,
  },
};

export const navigationDarkTheme: NavigationTheme = {
  ...navigationDarkBase,
  colors: {
    ...navigationDarkBase.colors,
    primary: darkTheme.colors.primary,
    background: darkTheme.colors.background,
    card: darkTheme.colors.surface,
    text: '#ECECEC',
    border: darkTheme.colors.outlineVariant,
    notification: darkTheme.colors.primaryContainer,
  },
};
