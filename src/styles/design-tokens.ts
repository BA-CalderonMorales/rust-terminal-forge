/**
 * Professional Design System Tokens
 * Inspired by VS Code, NvChad, and GitHub Codespaces
 */

export const designTokens = {
  // Professional Color Palette (No emojis, professional icons)
  colors: {
    // Base colors (industry-standard)
    background: {
      primary: '#1e1e1e',      // VS Code dark background
      secondary: '#252526',    // VS Code sidebar background
      tertiary: '#2d2d30',     // VS Code panel background
      elevated: '#3c3c3c',     // Modal/tooltip background
    },
    foreground: {
      primary: '#cccccc',      // Primary text
      secondary: '#9da5b4',    // Secondary text
      muted: '#6a6a6a',        // Muted text
      inverse: '#1e1e1e',      // Inverse text
    },
    accent: {
      primary: '#007acc',      // VS Code blue
      secondary: '#0e70aa',    // Secondary accent
      success: '#28a745',      // GitHub green
      warning: '#ffc107',      // Professional warning
      error: '#f14c4c',        // Professional error
      info: '#17a2b8',         // Info state
    },
    border: {
      default: '#3c3c3c',      // Default border
      muted: '#2d2d30',        // Subtle border
      strong: '#6a6a6a',       // Strong border
    },
    // Terminal-specific colors
    terminal: {
      background: '#0a0a0a',
      foreground: '#cccccc',
      green: '#00ff88',
      blue: '#007acc',
      red: '#f14c4c',
      yellow: '#ffc107',
    }
  },

  // Typography System
  typography: {
    fontFamilies: {
      mono: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, monospace',
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    fontSizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    }
  },

  // Spacing System (8px base unit)
  spacing: {
    0: '0',
    1: '0.25rem',    // 4px
    2: '0.5rem',     // 8px
    3: '0.75rem',    // 12px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    8: '2rem',       // 32px
    10: '2.5rem',    // 40px
    12: '3rem',      // 48px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
  },

  // Professional Icons (Text-only, no emojis)
  icons: {
    close: '×',
    minimize: '−',
    maximize: '□',
    terminal: '■',
    folder: '◼',
    file: '◻',
    success: '✓',
    error: '✗',
    warning: '!',
    info: 'i',
    add: '+',
    settings: '⚙',
    theme: '◐',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    terminal: '0 0 30px rgba(0, 255, 136, 0.2), inset 0 0 50px rgba(0, 255, 136, 0.01)',
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',  // 2px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    full: '9999px',
  },

  // Responsive Breakpoints
  breakpoints: {
    sm: '640px',   // Mobile large
    md: '768px',   // Tablet
    lg: '1024px',  // Desktop small
    xl: '1280px',  // Desktop large
    '2xl': '1536px', // Desktop extra large
  },

  // Animation & Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    base: 0,
    tooltip: 10,
    dropdown: 20,
    modal: 30,
    overlay: 40,
    max: 50,
  }
} as const;

export type DesignTokens = typeof designTokens;