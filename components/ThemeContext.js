// components/ThemeContext.js
// Provides dark/light mode toggle persisted across sessions via AsyncStorage.
// Usage:  const { colors, isDark, toggleTheme } = useTheme();
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@dmr_theme_mode';

// ── LIGHT COLORS ─────────────────────────────────────────────────────────────
export const LIGHT = {
  // Backgrounds
  bg:           '#F1F5F9',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F7F9FC',
  // Text
  text:         '#0F172A',
  textMid:      '#334155',
  textLight:    '#64748B',
  textMuted:    '#94A3B8',
  // Borders
  border:       '#E2E8F0',
  borderLight:  '#F1F5F9',
  // Brand
  navy:         '#102A56',
  navyDark:     '#0B1E3D',
  navyLight:    '#1a3a6e',
  // Accents
  gold:         '#B48900',
  goldLight:    '#D4A500',
  goldPale:     '#FFF8E7',
  // Status
  green:        '#16A34A',
  greenLight:   '#DCFCE7',
  red:          '#DC2626',
  redLight:     '#FEE2E2',
  amber:        '#D97706',
  amberLight:   '#FEF3C7',
  blue:         '#1D4ED8',
  blueLight:    '#DBEAFE',
  // UI
  tabBar:       '#FFFFFF',
  tabActive:    '#102A56',
  tabInactive:  '#94A3B8',
  statusBar:    'dark-content',
  cardShadow:   '#000',
  offWhite:     '#F7F9FC',
  // Input
  inputBg:      '#F7F9FC',
  inputBorder:  '#E2E8F0',
};

// ── DARK COLORS ───────────────────────────────────────────────────────────────
export const DARK = {
  // Backgrounds
  bg:           '#080E1C',
  surface:      '#111827',
  surfaceAlt:   '#1A2235',
  // Text
  text:         '#F0F4FF',
  textMid:      '#CBD5E1',
  textLight:    '#94A3B8',
  textMuted:    '#64748B',
  // Borders
  border:       '#1E2D4A',
  borderLight:  '#253350',
  // Brand
  navy:         '#4D8BF5',     // brighter blue — readable on dark bg
  navyDark:     '#0B1E3D',     // used as gradient start (stays deep)
  navyLight:    '#2D5FBE',
  // Accents
  gold:         '#F59E0B',     // brighter gold on dark
  goldLight:    '#FBBF24',
  goldPale:     '#292000',
  // Status
  green:        '#22C55E',
  greenLight:   '#052E16',
  red:          '#EF4444',
  redLight:     '#1F0808',
  amber:        '#F59E0B',
  amberLight:   '#1C1000',
  blue:         '#60A5FA',
  blueLight:    '#0C1F4A',
  // UI
  tabBar:       '#111827',
  tabActive:    '#4D8BF5',
  tabInactive:  '#64748B',
  statusBar:    'light-content',
  cardShadow:   '#000',
  offWhite:     '#1A2235',
  // Input
  inputBg:      '#1A2235',
  inputBorder:  '#1E2D4A',
};

const ThemeContext = createContext({
  colors:      LIGHT,
  isDark:      false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  // Load persisted preference
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(val => {
      if (val === 'dark') setIsDark(true);
    });
  }, []);

  function toggleTheme() {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ colors: isDark ? DARK : LIGHT, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
