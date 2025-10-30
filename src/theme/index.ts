import type { Theme as NavigationTheme } from '@react-navigation/native';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
} from '@react-navigation/native';
import { Dimensions, Platform } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

// Calculate scaling factor
const scale = screenWidth / 375; // 375 is base width (iPhone X/11/12 standard)
const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale * size - size) * factor;
};

// Typography Scale - Modern Sans-Serif (Poppins/Inter style) with responsive sizing
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
    xs: moderateScale(11, 0.3),
    sm: moderateScale(12, 0.3),
    base: moderateScale(14, 0.3),
    md: moderateScale(16, 0.3),
    lg: moderateScale(18, 0.3),
    xl: moderateScale(20, 0.3),
    xxl: moderateScale(24, 0.3),
    xxxl: moderateScale(28, 0.3),
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};// Spacing Scale (8px rhythm)
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

// Chat-specific colors (Instagram/WhatsApp style)
export const chatColors = {
  light: {
    background: '#FFFFFF', // Pure white background
    messageSent: '#DCF8C6', // WhatsApp green for sent messages
    messageReceived: '#FFFFFF', // White for received messages
    accent: '#0095F6', // Instagram blue
    inputBackground: '#F0F0F0',
    borderColor: '#DBDBDB', // Instagram gray border
    textPrimary: '#262626', // Instagram dark text
    textSecondary: '#8E8E8E', // Instagram gray text
    textOnSent: '#000000', // Text on sent messages
    textOnReceived: '#000000', // Text on received messages
  },
  dark: {
    background: '#000000', // Pure black background
    messageSent: '#056162', // Dark teal for sent messages
    messageReceived: '#262626', // Dark gray for received messages
    accent: '#0095F6', // Instagram blue (same)
    inputBackground: '#121212',
    borderColor: '#262626',
    textPrimary: '#FFFFFF',
    textSecondary: '#A8A8A8',
    textOnSent: '#FFFFFF',
    textOnReceived: '#FFFFFF',
  },
};

// Light Theme - Instagram style
export const lightTheme: MD3Theme = {
  ...baseLight,
  colors: {
    ...baseLight.colors,
    // Main colors - Instagram blue
    primary: '#0095F6', // Instagram blue
    primaryContainer: '#E1F5FE', // Light blue container
    onPrimaryContainer: '#01579B',
    secondary: '#262626', // Instagram dark
    onSecondary: '#FFFFFF',

    // Background colors - Clean white
    background: '#FAFAFA', // Instagram light gray background
    onBackground: '#262626',
    surface: '#FFFFFF', // Pure white cards
    onSurface: '#262626',
    surfaceVariant: '#F0F0F0',
    onSurfaceVariant: '#8E8E8E',

    // Utility colors
    outline: '#DBDBDB', // Instagram border gray
    outlineVariant: '#EFEFEF',
    tertiary: '#00376B',
    onTertiary: '#FFFFFF',

    // Semantic colors
    error: '#ED4956', // Instagram red
    onError: '#FFFFFF',
    errorContainer: '#FFEBEE',
    onErrorContainer: '#B71C1C',

    // Inverse colors
    inverseSurface: '#262626',
    inverseOnSurface: '#FFFFFF',
    inversePrimary: '#0095F6',
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

// Dark Theme - Instagram/WhatsApp dark mode
export const darkTheme: MD3Theme = {
  ...baseDark,
  colors: {
    ...baseDark.colors,
    // Main colors - Instagram blue stays same
    primary: '#0095F6', // Instagram blue
    primaryContainer: '#004A77', // Darker blue container
    onPrimaryContainer: '#B3E5FC',
    secondary: '#FFFFFF',
    onSecondary: '#000000',

    // Background colors - Pure black Instagram style
    background: '#000000', // Pure black
    onBackground: '#FFFFFF',
    surface: '#121212', // Slightly lighter black for cards
    onSurface: '#FFFFFF',
    surfaceVariant: '#1C1C1C',
    onSurfaceVariant: '#A8A8A8',

    // Utility colors
    outline: '#262626', // Dark gray border
    outlineVariant: '#1C1C1C',
    tertiary: '#0095F6',
    onTertiary: '#FFFFFF',

    // Semantic colors
    error: '#F23645', // Slightly brighter red for dark mode
    onError: '#FFFFFF',
    errorContainer: '#4A2C2C',
    onErrorContainer: '#FFCDD2',

    // Inverse colors
    inverseSurface: '#FFFFFF',
    inverseOnSurface: '#000000',
    inversePrimary: '#0095F6',
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
    text: '#262626',
    border: lightTheme.colors.outline,
    notification: lightTheme.colors.primary,
  },
};

export const navigationDarkTheme: NavigationTheme = {
  ...navigationDarkBase,
  colors: {
    ...navigationDarkBase.colors,
    primary: darkTheme.colors.primary,
    background: darkTheme.colors.background,
    card: darkTheme.colors.surface,
    text: '#FFFFFF',
    border: darkTheme.colors.outline,
    notification: darkTheme.colors.primary,
  },
};
