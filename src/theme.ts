// NvChad-inspired cyberpunk theme with multiple color schemes
export const themes = {
  cyberpunk: {
    name: 'Cyberpunk Neon',
    colors: {
      // Core cyberpunk palette
      background: '#0a0a0a',
      backgroundSecondary: '#0f0f0f',
      backgroundTertiary: '#1a1a1a',
      foreground: '#e1e1e1',
      
      // Neon accent colors
      neonGreen: '#00ff88',
      neonBlue: '#00d4ff',
      neonPink: '#ff007f',
      neonPurple: '#b000ff',
      electricBlue: '#0080ff',
      
      // Terminal specific
      primary: '#00ff88',
      secondary: '#ff4757',
      accent: '#00d4ff',
      border: '#333333',
      text: '#e1e1e1',
      textSecondary: '#b3b3b3',
      textMuted: '#666666',
      
      // Status colors
      error: '#ff4757',
      success: '#00ff88',
      warning: '#ffaa00',
      info: '#00d4ff',
      
      // UI elements
      tabActive: '#00ff88',
      tabInactive: '#2a2a2a',
      button: '#00ff88',
      buttonHover: '#00d470',
      
      // Shadows and glows
      glowGreen: 'rgba(0, 255, 136, 0.6)',
      glowBlue: 'rgba(0, 212, 255, 0.6)',
      glowPink: 'rgba(255, 0, 127, 0.6)',
      shadowDark: 'rgba(0, 0, 0, 0.8)'
    },
    gradients: {
      backgroundMain: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #0a0a0a 75%, #1a1a1a 100%)',
      backgroundHeader: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
      backgroundTerminal: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)',
      neonButton: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.4))',
      neonButtonHover: 'linear-gradient(135deg, rgba(0, 255, 136, 0.4), rgba(0, 255, 136, 0.6))'
    }
  },
  
  matrix: {
    name: 'Matrix Green',
    colors: {
      background: '#000000',
      backgroundSecondary: '#001100',
      backgroundTertiary: '#002200',
      foreground: '#00ff00',
      
      neonGreen: '#00ff00',
      neonBlue: '#00ff88',
      neonPink: '#88ff00',
      neonPurple: '#44ff00',
      electricBlue: '#00ff66',
      
      primary: '#00ff00',
      secondary: '#ff0000',
      accent: '#00ff88',
      border: '#004400',
      text: '#00ff00',
      textSecondary: '#00cc00',
      textMuted: '#008800',
      
      error: '#ff0000',
      success: '#00ff00',
      warning: '#ffff00',
      info: '#00ff88',
      
      tabActive: '#00ff00',
      tabInactive: '#002200',
      button: '#00ff00',
      buttonHover: '#00cc00',
      
      glowGreen: 'rgba(0, 255, 0, 0.8)',
      glowBlue: 'rgba(0, 255, 136, 0.6)',
      glowPink: 'rgba(136, 255, 0, 0.6)',
      shadowDark: 'rgba(0, 0, 0, 0.9)'
    },
    gradients: {
      backgroundMain: 'linear-gradient(135deg, #000000 0%, #001100 50%, #000000 100%)',
      backgroundHeader: 'linear-gradient(135deg, #002200 0%, #004400 100%)',
      backgroundTerminal: 'linear-gradient(135deg, #000000 0%, #001100 50%, #000000 100%)',
      neonButton: 'linear-gradient(135deg, rgba(0, 255, 0, 0.2), rgba(0, 255, 0, 0.4))',
      neonButtonHover: 'linear-gradient(135deg, rgba(0, 255, 0, 0.4), rgba(0, 255, 0, 0.6))'
    }
  },
  
  synthwave: {
    name: 'Synthwave Sunset',
    colors: {
      background: '#0d1117',
      backgroundSecondary: '#1c0a2e',
      backgroundTertiary: '#2d1b47',
      foreground: '#ff79c6',
      
      neonGreen: '#50fa7b',
      neonBlue: '#8be9fd',
      neonPink: '#ff79c6',
      neonPurple: '#bd93f9',
      electricBlue: '#6272a4',
      
      primary: '#ff79c6',
      secondary: '#f1fa8c',
      accent: '#8be9fd',
      border: '#44475a',
      text: '#f8f8f2',
      textSecondary: '#6272a4',
      textMuted: '#44475a',
      
      error: '#ff5555',
      success: '#50fa7b',
      warning: '#f1fa8c',
      info: '#8be9fd',
      
      tabActive: '#ff79c6',
      tabInactive: '#44475a',
      button: '#ff79c6',
      buttonHover: '#ff92d6',
      
      glowGreen: 'rgba(80, 250, 123, 0.6)',
      glowBlue: 'rgba(139, 233, 253, 0.6)',
      glowPink: 'rgba(255, 121, 198, 0.6)',
      shadowDark: 'rgba(13, 17, 23, 0.8)'
    },
    gradients: {
      backgroundMain: 'linear-gradient(135deg, #0d1117 0%, #1c0a2e 50%, #0d1117 100%)',
      backgroundHeader: 'linear-gradient(135deg, #2d1b47 0%, #44475a 100%)',
      backgroundTerminal: 'linear-gradient(135deg, #0d1117 0%, #1c0a2e 50%, #0d1117 100%)',
      neonButton: 'linear-gradient(135deg, rgba(255, 121, 198, 0.2), rgba(255, 121, 198, 0.4))',
      neonButtonHover: 'linear-gradient(135deg, rgba(255, 121, 198, 0.4), rgba(255, 121, 198, 0.6))'
    }
  }
};

// Default theme
export const defaultTheme = themes.cyberpunk;

// Theme manager
export class ThemeManager {
  private currentTheme: string = 'cyberpunk';
  private listeners: ((theme: any) => void)[] = [];

  getCurrentTheme() {
    return themes[this.currentTheme as keyof typeof themes] || defaultTheme;
  }

  setTheme(themeName: string) {
    if (themes[themeName as keyof typeof themes]) {
      this.currentTheme = themeName;
      this.notifyListeners();
      // Store preference
      localStorage.setItem('terminal-theme', themeName);
    }
  }

  getAvailableThemes() {
    return Object.keys(themes).map(key => ({
      key,
      name: themes[key as keyof typeof themes].name
    }));
  }

  subscribe(listener: (theme: any) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const theme = this.getCurrentTheme();
    this.updateCSSVariables(theme);
    this.listeners.forEach(listener => listener(theme));
  }

  private updateCSSVariables(theme: any) {
    const root = document.documentElement;
    
    // Update CSS custom properties for immediate theme application
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--terminal-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value as string);
    });
    
    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--terminal-gradient-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value as string);
    });

    // Add NvChad-specific CSS variables for TDD compliance
    root.style.setProperty('--nvchad-primary', theme.colors.primary);
    root.style.setProperty('--nvchad-secondary', theme.colors.secondary);
    root.style.setProperty('--nvchad-background', theme.colors.background);
    root.style.setProperty('--nvchad-accent', theme.colors.accent);
    root.style.setProperty('--nvchad-text', theme.colors.text);
    root.style.setProperty('--nvchad-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--nvchad-text-muted', theme.colors.textMuted);
    root.style.setProperty('--nvchad-border', theme.colors.border);
    root.style.setProperty('--nvchad-neon-green', theme.colors.neonGreen);
    root.style.setProperty('--nvchad-neon-blue', theme.colors.neonBlue);
    root.style.setProperty('--nvchad-glow-green', theme.colors.glowGreen);
    
    // Apply theme class to body for additional styling
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${this.currentTheme}`);
  }

  init() {
    // Load saved theme
    const saved = localStorage.getItem('terminal-theme');
    if (saved && themes[saved as keyof typeof themes]) {
      this.currentTheme = saved;
    }
    // Apply initial theme
    this.updateCSSVariables(this.getCurrentTheme());
  }
}

// Global theme manager instance
export const themeManager = new ThemeManager();

// Typography configuration
export const typography = {
  fontFamilies: {
    mono: 'ui-monospace, "JetBrains Mono", "Fira Code", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
    sansSerif: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  fontSizes: {
    xs: 'clamp(10px, 2vw, 12px)',
    sm: 'clamp(12px, 2.5vw, 14px)',
    base: 'clamp(14px, 3vw, 16px)',
    lg: 'clamp(16px, 3.5vw, 18px)',
    xl: 'clamp(18px, 4vw, 20px)',
    '2xl': 'clamp(20px, 5vw, 24px)'
  },
  lineHeights: {
    tight: '1.2',
    normal: '1.4',
    relaxed: '1.6'
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em'
  }
};

// Animation configurations
export const animations = {
  durations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  easings: {
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
  }
};

// Legacy export for backwards compatibility
export const theme = defaultTheme;
