import type { Theme as NavigationTheme } from '@react-navigation/native';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme } from '@react-navigation/native';
import type { MD3Theme } from 'react-native-paper';
import { MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';

const baseLight: MD3Theme = MD3LightTheme;
const baseDark: MD3Theme = MD3DarkTheme;

const { LightTheme: navigationLightBase, DarkTheme: navigationDarkBase } = adaptNavigationTheme({
  reactNavigationLight: NavigationLightTheme,
  reactNavigationDark: NavigationDarkTheme,
});

export const lightTheme: MD3Theme = {
  ...baseLight,
  colors: {
    ...baseLight.colors,
    primary: '#38bdf8',
    secondary: '#4ade80',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceVariant: '#e2e8f0',
    outline: '#94a3b8',
  },
};

export const darkTheme: MD3Theme = {
  ...baseDark,
  colors: {
    ...baseDark.colors,
    primary: '#38bdf8',
    secondary: '#4ade80',
    background: '#020617',
    surface: '#0f172a',
    surfaceVariant: '#1f2937',
    outline: '#475569',
  },
};

export const navigationLightTheme: NavigationTheme = {
  ...navigationLightBase,
  colors: {
    ...navigationLightBase.colors,
    primary: lightTheme.colors.primary,
    background: lightTheme.colors.background,
    card: lightTheme.colors.surface,
    text: '#0f172a',
    border: lightTheme.colors.surfaceVariant,
  },
};

export const navigationDarkTheme: NavigationTheme = {
  ...navigationDarkBase,
  colors: {
    ...navigationDarkBase.colors,
    primary: darkTheme.colors.primary,
    background: darkTheme.colors.background,
    card: darkTheme.colors.surface,
    text: '#e2e8f0',
    border: darkTheme.colors.surfaceVariant,
  },
};
