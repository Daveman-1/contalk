'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('dark');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ct_theme');
      const initial = saved === 'light' ? 'light' : 'dark';
      setThemeState(initial);
      document.documentElement.setAttribute('data-theme', initial);
    } catch {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const setTheme = (next) => {
    const valid = next === 'light' ? 'light' : 'dark';
    setThemeState(valid);
    document.documentElement.setAttribute('data-theme', valid);
    try {
      localStorage.setItem('ct_theme', valid);
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
