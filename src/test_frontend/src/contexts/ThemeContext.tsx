import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Interface untuk Theme Context
interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

// Interface untuk ThemeProvider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Buat context dengan default values
const ThemeContext = createContext<ThemeContextType | null>(null);

// Local storage key untuk menyimpan preferensi theme
const THEME_STORAGE_KEY = 'todo-app-theme';

// Custom hook untuk menggunakan theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ThemeProvider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Load theme preference dari localStorage ketika component mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Apply theme ke document ketika isDarkMode berubah
  useEffect(() => {
    applyTheme(isDarkMode);
    saveThemePreference(isDarkMode);
  }, [isDarkMode]);

  /**
   * Load theme preference dari localStorage
   */
  const loadThemePreference = (): void => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // Jika tidak ada preference tersimpan, gunakan system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(prefersDark);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fallback ke light mode jika error
      setIsDarkMode(false);
    }
  };

  /**
   * Save theme preference ke localStorage
   */
  const saveThemePreference = (isDark: boolean): void => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  /**
   * Apply theme dengan menambah/menghapus class 'dark' dari document
   */
  const applyTheme = (isDark: boolean): void => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  /**
   * Toggle dark mode on/off
   */
  const toggleDarkMode = (): void => {
    setIsDarkMode(prev => !prev);
  };

  // Context value yang akan di-provide
  const value: ThemeContextType = {
    isDarkMode,
    toggleDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
