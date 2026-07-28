import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { LIGHT, DARK } from './colors';
import useUIStore from '../store/useUIStore';

const ThemeContext = createContext({ colors: LIGHT, isDark: false });

export const ThemeProvider = ({ children }) => {
  const themeMode = useUIStore((s) => s.themeMode);
  const scheme = useColorScheme();
  const isDark =
    themeMode === 'dark' ? true : themeMode === 'light' ? false : scheme === 'dark';
  const colors = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
