import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'dark-blue' | 'dark-red' | 'dark-green' | 'dark-purple';

export interface Theme {
  id: ThemeId;
  name: string;
  colors: {
    // Background gradients
    bodyGradient: string;
    // Primary accent colors
    primaryLight: string;
    primaryDark: string;
    // Module tab colors
    tabActive: string;
    tabHover: string;
    // Button and interactive elements
    buttonPrimary: string;
    buttonPrimaryHover: string;
    // Card and panel backgrounds
    cardGradient: string;
    cardBorder: string;
    // Misc
    highlight: string;
    highlightDim: string;
  };
}

export const themes: Record<ThemeId, Theme> = {
  'dark-blue': {
    id: 'dark-blue',
    name: '🔵 Azul Oscuro',
    colors: {
      bodyGradient: 'radial-gradient(circle at top, #1d273a, #090b10 65%)',
      primaryLight: '#7ac9ff',
      primaryDark: '#5ab0e8',
      tabActive: 'linear-gradient(135deg, #7ac9ff, #5ab0e8)',
      tabHover:
        'linear-gradient(135deg, rgba(122, 201, 255, 0.15), rgba(122, 201, 255, 0.08))',
      buttonPrimary:
        'linear-gradient(135deg, rgba(122, 201, 255, 0.1), rgba(122, 201, 255, 0.05))',
      buttonPrimaryHover:
        'linear-gradient(135deg, rgba(122, 201, 255, 0.2), rgba(122, 201, 255, 0.1))',
      cardGradient:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
      cardBorder: 'rgba(255, 255, 255, 0.08)',
      highlight: 'rgba(122, 201, 255, 0.25)',
      highlightDim: 'rgba(122, 201, 255, 0.1)',
    },
  },
  'dark-red': {
    id: 'dark-red',
    name: '🔴 Rojo Oscuro',
    colors: {
      bodyGradient: 'radial-gradient(circle at top, #3a1d1d, #100909 65%)',
      primaryLight: '#ff7a7a',
      primaryDark: '#e85a5a',
      tabActive: 'linear-gradient(135deg, #ff7a7a, #e85a5a)',
      tabHover:
        'linear-gradient(135deg, rgba(255, 122, 122, 0.15), rgba(255, 122, 122, 0.08))',
      buttonPrimary:
        'linear-gradient(135deg, rgba(255, 122, 122, 0.1), rgba(255, 122, 122, 0.05))',
      buttonPrimaryHover:
        'linear-gradient(135deg, rgba(255, 122, 122, 0.2), rgba(255, 122, 122, 0.1))',
      cardGradient:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
      cardBorder: 'rgba(255, 255, 255, 0.08)',
      highlight: 'rgba(255, 122, 122, 0.25)',
      highlightDim: 'rgba(255, 122, 122, 0.1)',
    },
  },
  'dark-green': {
    id: 'dark-green',
    name: '🟢 Verde Oscuro',
    colors: {
      bodyGradient: 'radial-gradient(circle at top, #1d3a1d, #090b09 65%)',
      primaryLight: '#7aff7a',
      primaryDark: '#5ae85a',
      tabActive: 'linear-gradient(135deg, #7aff7a, #5ae85a)',
      tabHover:
        'linear-gradient(135deg, rgba(122, 255, 122, 0.15), rgba(122, 255, 122, 0.08))',
      buttonPrimary:
        'linear-gradient(135deg, rgba(122, 255, 122, 0.1), rgba(122, 255, 122, 0.05))',
      buttonPrimaryHover:
        'linear-gradient(135deg, rgba(122, 255, 122, 0.2), rgba(122, 255, 122, 0.1))',
      cardGradient:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
      cardBorder: 'rgba(255, 255, 255, 0.08)',
      highlight: 'rgba(122, 255, 122, 0.25)',
      highlightDim: 'rgba(122, 255, 122, 0.1)',
    },
  },
  'dark-purple': {
    id: 'dark-purple',
    name: '🟣 Púrpura Oscuro',
    colors: {
      bodyGradient: 'radial-gradient(circle at top, #2d1d3a, #0b090f 65%)',
      primaryLight: '#c77aff',
      primaryDark: '#a85ae8',
      tabActive: 'linear-gradient(135deg, #c77aff, #a85ae8)',
      tabHover:
        'linear-gradient(135deg, rgba(199, 122, 255, 0.15), rgba(199, 122, 255, 0.08))',
      buttonPrimary:
        'linear-gradient(135deg, rgba(199, 122, 255, 0.1), rgba(199, 122, 255, 0.05))',
      buttonPrimaryHover:
        'linear-gradient(135deg, rgba(199, 122, 255, 0.2), rgba(199, 122, 255, 0.1))',
      cardGradient:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
      cardBorder: 'rgba(255, 255, 255, 0.08)',
      highlight: 'rgba(199, 122, 255, 0.25)',
      highlightDim: 'rgba(199, 122, 255, 0.1)',
    },
  },
};

interface ThemeState {
  currentThemeId: ThemeId;
  setTheme: (themeId: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentThemeId: 'dark-blue',
      setTheme: (themeId) => {
        set({ currentThemeId: themeId });
        applyTheme(themes[themeId]);
      },
    }),
    {
      name: 'cesante-theme',
    },
  ),
);

// Apply theme to CSS variables
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
}

// Initialize theme on app start
export function initializeTheme() {
  const currentThemeId = useThemeStore.getState().currentThemeId;
  applyTheme(themes[currentThemeId]);
}
