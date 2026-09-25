import { create } from 'zustand';
import { lightTheme, darkTheme } from '../theme/colors';

type ThemeState = {
  isDarkMode: boolean;
  theme: typeof lightTheme;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: false,
  theme: lightTheme,
  toggleTheme: () =>
    set((state) => ({
      isDarkMode: !state.isDarkMode,
      theme: !state.isDarkMode ? darkTheme : lightTheme,
    })),
  setTheme: (isDark: boolean) =>
    set({
      isDarkMode: isDark,
      theme: isDark ? darkTheme : lightTheme,
    }),
}));
