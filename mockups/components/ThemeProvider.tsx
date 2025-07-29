import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    surface: string;
    surfaceHover: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryHover: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    terminal: string;
    terminalPrompt: string;
    terminalPath: string;
    terminalOutput: string;
    terminalError: string;
  };
};

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Default Dark',
    description: 'Classic terminal dark theme',
    colors: {
      background: '#0f172a',
      surface: '#1e293b',
      surfaceHover: '#334155',
      border: '#475569',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#64748b',
      primary: '#10b981',
      primaryHover: '#059669',
      accent: '#3b82f6',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      terminal: '#0f172a',
      terminalPrompt: '#3b82f6',
      terminalPath: '#a855f7',
      terminalOutput: '#cbd5e1',
      terminalError: '#ef4444'
    }
  },
  {
    id: 'matrix',
    name: 'Matrix Green',
    description: 'The classic green matrix aesthetic',
    colors: {
      background: '#000000',
      surface: '#0d1b0d',
      surfaceHover: '#1a2e1a',
      border: '#22c55e',
      text: '#00ff00',
      textSecondary: '#22c55e',
      textMuted: '#166534',
      primary: '#00ff00',
      primaryHover: '#22c55e',
      accent: '#16a34a',
      success: '#00ff00',
      warning: '#84cc16',
      error: '#ef4444',
      terminal: '#000000',
      terminalPrompt: '#00ff00',
      terminalPath: '#22c55e',
      terminalOutput: '#16a34a',
      terminalError: '#ef4444'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Purple',
    description: 'Neon cyberpunk vibes',
    colors: {
      background: '#0a0a0f',
      surface: '#1a1a2e',
      surfaceHover: '#2d2d4a',
      border: '#a855f7',
      text: '#e879f9',
      textSecondary: '#d8b4fe',
      textMuted: '#7c3aed',
      primary: '#a855f7',
      primaryHover: '#9333ea',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      terminal: '#0a0a0f',
      terminalPrompt: '#a855f7',
      terminalPath: '#e879f9',
      terminalOutput: '#d8b4fe',
      terminalError: '#ef4444'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Deep ocean terminal theme',
    colors: {
      background: '#0c1821',
      surface: '#1e3a5f',
      surfaceHover: '#2563eb',
      border: '#3b82f6',
      text: '#60a5fa',
      textSecondary: '#93c5fd',
      textMuted: '#1e40af',
      primary: '#0ea5e9',
      primaryHover: '#0284c7',
      accent: '#22d3ee',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      terminal: '#0c1821',
      terminalPrompt: '#0ea5e9',
      terminalPath: '#22d3ee',
      terminalOutput: '#93c5fd',
      terminalError: '#ef4444'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    description: 'Warm sunset terminal theme',
    colors: {
      background: '#1a0f0a',
      surface: '#2d1b0e',
      surfaceHover: '#422a1b',
      border: '#ea580c',
      text: '#fed7aa',
      textSecondary: '#fdba74',
      textMuted: '#c2410c',
      primary: '#ea580c',
      primaryHover: '#dc2626',
      accent: '#f59e0b',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      terminal: '#1a0f0a',
      terminalPrompt: '#ea580c',
      terminalPath: '#f59e0b',
      terminalOutput: '#fdba74',
      terminalError: '#ef4444'
    }
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Clean black and white terminal',
    colors: {
      background: '#000000',
      surface: '#1a1a1a',
      surfaceHover: '#2a2a2a',
      border: '#4a4a4a',
      text: '#ffffff',
      textSecondary: '#d4d4d4',
      textMuted: '#6a6a6a',
      primary: '#ffffff',
      primaryHover: '#e5e5e5',
      accent: '#9ca3af',
      success: '#ffffff',
      warning: '#d4d4d4',
      error: '#ffffff',
      terminal: '#000000',
      terminalPrompt: '#ffffff',
      terminalPath: '#d4d4d4',
      terminalOutput: '#a3a3a3',
      terminalError: '#ffffff'
    }
  },
  {
    id: 'retro',
    name: 'Retro Amber',
    description: 'Classic amber terminal',
    colors: {
      background: '#1a1100',
      surface: '#2a1f00',
      surfaceHover: '#3d2f00',
      border: '#fbbf24',
      text: '#fbbf24',
      textSecondary: '#f59e0b',
      textMuted: '#92400e',
      primary: '#fbbf24',
      primaryHover: '#f59e0b',
      accent: '#fcd34d',
      success: '#84cc16',
      warning: '#f59e0b',
      error: '#ef4444',
      terminal: '#1a1100',
      terminalPrompt: '#fbbf24',
      terminalPath: '#f59e0b',
      terminalOutput: '#fcd34d',
      terminalError: '#ef4444'
    }
  },
  {
    id: 'neon',
    name: 'Neon Pink',
    description: 'Vibrant neon pink theme',
    colors: {
      background: '#0f0a0f',
      surface: '#1f1a1f',
      surfaceHover: '#2f1a2f',
      border: '#ec4899',
      text: '#f472b6',
      textSecondary: '#f9a8d4',
      textMuted: '#be185d',
      primary: '#ec4899',
      primaryHover: '#db2777',
      accent: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      terminal: '#0f0a0f',
      terminalPrompt: '#ec4899',
      terminalPath: '#06b6d4',
      terminalOutput: '#f9a8d4',
      terminalError: '#ef4444'
    }
  }
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('terminal-theme');
    if (savedTheme) {
      const theme = themes.find(t => t.id === savedTheme);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
  }, []);

  useEffect(() => {
    // Apply theme to CSS variables
    const root = document.documentElement;
    const { colors } = currentTheme;
    
    root.style.setProperty('--theme-background', colors.background);
    root.style.setProperty('--theme-surface', colors.surface);
    root.style.setProperty('--theme-surface-hover', colors.surfaceHover);
    root.style.setProperty('--theme-border', colors.border);
    root.style.setProperty('--theme-text', colors.text);
    root.style.setProperty('--theme-text-secondary', colors.textSecondary);
    root.style.setProperty('--theme-text-muted', colors.textMuted);
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-primary-hover', colors.primaryHover);
    root.style.setProperty('--theme-accent', colors.accent);
    root.style.setProperty('--theme-success', colors.success);
    root.style.setProperty('--theme-warning', colors.warning);
    root.style.setProperty('--theme-error', colors.error);
    root.style.setProperty('--theme-terminal', colors.terminal);
    root.style.setProperty('--theme-terminal-prompt', colors.terminalPrompt);
    root.style.setProperty('--theme-terminal-path', colors.terminalPath);
    root.style.setProperty('--theme-terminal-output', colors.terminalOutput);
    root.style.setProperty('--theme-terminal-error', colors.terminalError);
  }, [currentTheme]);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('terminal-theme', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}