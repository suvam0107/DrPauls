import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { LIGHT, DARK, ColorPalette } from './colors';
import useUIStore from '../store/useUIStore';

export interface ThemeContextValue {
  colors: ColorPalette;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: LIGHT,
  isDark: false,
});

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
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

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
