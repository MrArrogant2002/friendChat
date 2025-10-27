import { useEffect, useState } from 'react';

type ThemeMode = 'system' | 'light' | 'dark';

type ThemeListener = (mode: ThemeMode) => void;

let currentThemeMode: ThemeMode = 'system';
const listeners = new Set<ThemeListener>();

function emitChange(): void {
  listeners.forEach((listener) => {
    listener(currentThemeMode);
  });
}

export function subscribe(listener: ThemeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getThemeMode(): ThemeMode {
  return currentThemeMode;
}

export function setThemeMode(mode: ThemeMode): void {
  currentThemeMode = mode;
  emitChange();
}

export function useThemePreference(): {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
} {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getThemeMode());

  useEffect(() => {
    const unsubscribe = subscribe(setThemeModeState);
    return () => unsubscribe();
  }, []);

  return {
    themeMode,
    setThemeMode,
  };
}
