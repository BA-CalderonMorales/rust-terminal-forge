import React, { useState, useEffect, useRef } from 'react';
import { themeManager, themes } from '../theme';
import { hapticFeedback } from '../core/gestureNavigation';
import { designTokens } from '../styles/design-tokens';

interface ThemeSwitcherProps {
  className?: string;
  compact?: boolean;
  subtle?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  className = '', 
  compact = false,
  subtle = false 
}) => {
  const [currentTheme, setCurrentTheme] = useState(themeManager.getCurrentTheme());
  const [isOpen, setIsOpen] = useState(false);
  const availableThemes = themeManager.getAvailableThemes();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = themeManager.subscribe((theme) => {
      setCurrentTheme(theme);
    });
    return unsubscribe;
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleThemeChange = (themeKey: string) => {
    themeManager.setTheme(themeKey);
    setIsOpen(false);
    hapticFeedback.medium();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    hapticFeedback.light();
  };

  const handleTouchStart = () => {
    hapticFeedback.light();
  };

  // Professional theme switcher without emojis
  if (subtle) {
    return (
      <div 
        ref={dropdownRef}
        className={`professional-button ${className}`} 
        data-testid="theme-switcher-subtle"
        style={{ 
          position: 'relative',
          display: 'inline-block'
        }}
      >
        <button
          data-testid="theme-switcher-button"
          onClick={toggleDropdown}
          onTouchStart={handleTouchStart}
          tabIndex={0}
          role="button"
          aria-haspopup="listbox"
          aria-label="Switch theme"
          style={{
            background: designTokens.colors.background.elevated,
            border: `1px solid ${designTokens.colors.border.default}`,
            padding: designTokens.spacing[2],
            cursor: 'pointer',
            borderRadius: designTokens.borderRadius.md,
            transition: designTokens.transitions.fast,
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: designTokens.colors.foreground.primary,
            fontSize: designTokens.typography.fontSizes.sm,
            fontFamily: designTokens.typography.fontFamilies.mono
          }}
        >
          <span className="text-icon text-icon--theme" style={{
            fontSize: designTokens.typography.fontSizes.lg,
            color: designTokens.colors.accent.primary
          }} />
        </button>

        {isOpen && (
          <div
            data-testid="theme-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: designTokens.spacing[2],
              background: designTokens.colors.background.elevated,
              border: `1px solid ${designTokens.colors.border.default}`,
              borderRadius: designTokens.borderRadius.lg,
              padding: designTokens.spacing[3],
              minWidth: '200px',
              zIndex: designTokens.zIndex.dropdown,
              boxShadow: designTokens.shadows.lg
            }}
          >
            <div style={{
              fontSize: designTokens.typography.fontSizes.xs,
              color: designTokens.colors.foreground.muted,
              marginBottom: designTokens.spacing[2],
              fontFamily: designTokens.typography.fontFamilies.mono,
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              Theme Selection
            </div>
            {availableThemes.map((theme) => {
              const themeData = themes[theme.key as keyof typeof themes];
              const currentThemeName = themeManager.getCurrentTheme().name;
              const isActive = theme.name === currentThemeName;
              
              return (
                <button
                  key={theme.key}
                  data-theme-key={theme.key}
                  onClick={() => handleThemeChange(theme.key)}
                  className="professional-button"
                  style={{
                    width: '100%',
                    padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
                    background: isActive ? designTokens.colors.accent.primary : 'transparent',
                    border: isActive ? `1px solid ${designTokens.colors.accent.primary}` : '1px solid transparent',
                    borderRadius: designTokens.borderRadius.md,
                    color: isActive ? designTokens.colors.foreground.inverse : designTokens.colors.foreground.primary,
                    fontSize: designTokens.typography.fontSizes.sm,
                    fontFamily: designTokens.typography.fontFamilies.mono,
                    cursor: 'pointer',
                    transition: designTokens.transitions.fast,
                    display: 'flex',
                    alignItems: 'center',
                    gap: designTokens.spacing[2],
                    marginBottom: designTokens.spacing[1],
                    textAlign: 'left'
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: designTokens.colors.accent.primary,
                      flexShrink: 0
                    }}
                  />
                  <span style={{ flex: 1 }}>{theme.name}</span>
                  {isActive && (
                    <span className="text-icon text-icon--success" style={{
                      fontSize: designTokens.typography.fontSizes.xs,
                      color: isActive ? designTokens.colors.foreground.inverse : designTokens.colors.accent.success
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        )}
        
        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-8px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`theme-switcher-compact ${className}`} style={{ position: 'relative' }}>
        <button
          onClick={toggleDropdown}
          style={{
            background: 'var(--terminal-gradient-button)',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            borderRadius: '6px',
            padding: '6px 12px',
            color: 'var(--terminal-neon-green)',
            fontSize: '12px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            minHeight: '32px',
            boxShadow: '0 2px 4px rgba(0, 255, 136, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--terminal-gradient-button-hover)';
            e.currentTarget.style.boxShadow = '0 4px 8px var(--terminal-glow-green)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--terminal-gradient-button)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 255, 136, 0.2)';
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${currentTheme.colors.neonGreen}, ${currentTheme.colors.neonBlue})`,
              boxShadow: `0 0 8px ${currentTheme.colors.glowGreen}`
            }}
          />
          {currentTheme.name}
          <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              background: 'var(--terminal-gradient-header)',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '8px',
              padding: '8px',
              minWidth: '180px',
              zIndex: 1000,
              backdropFilter: 'blur(20px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
              boxShadow: '0 8px 20px var(--terminal-shadow-dark), 0 0 0 1px rgba(0, 255, 136, 0.1)'
            }}
          >
            {availableThemes.map((theme) => {
              const themeData = themes[theme.key as keyof typeof themes];
              return (
                <button
                  key={theme.key}
                  onClick={() => handleThemeChange(theme.key)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: theme.key === themeManager.getCurrentTheme().name.toLowerCase().replace(/\s+/g, '') 
                      ? 'var(--terminal-gradient-button)' 
                      : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'var(--terminal-fg)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--terminal-gradient-button-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.key === themeManager.getCurrentTheme().name.toLowerCase().replace(/\s+/g, '') 
                      ? 'var(--terminal-gradient-button)' 
                      : 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${themeData.colors.neonGreen}, ${themeData.colors.neonBlue})`,
                      boxShadow: `0 0 6px ${themeData.colors.glowGreen}`
                    }}
                  />
                  {theme.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`theme-switcher ${className}`}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        background: 'var(--terminal-gradient-header)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 255, 136, 0.2)',
        backdropFilter: 'blur(20px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
        boxShadow: '0 8px 20px var(--terminal-shadow-dark)'
      }}>
        <h3 style={{
          margin: 0,
          color: 'var(--terminal-neon-green)',
          fontSize: '14px',
          fontFamily: 'monospace',
          fontWeight: '600',
          textShadow: '0 0 8px var(--terminal-glow-green)'
        }}>
          Terminal Theme
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {availableThemes.map((theme) => {
            const themeData = themes[theme.key as keyof typeof themes];
            const isActive = theme.key === themeManager.getCurrentTheme().name.toLowerCase().replace(/\s+/g, '');
            
            return (
              <button
                key={theme.key}
                onClick={() => handleThemeChange(theme.key)}
                style={{
                  padding: '12px 16px',
                  background: isActive 
                    ? 'var(--terminal-gradient-button)' 
                    : 'var(--terminal-gradient-header)',
                  border: isActive 
                    ? '2px solid var(--terminal-neon-green)' 
                    : '1px solid rgba(0, 255, 136, 0.2)',
                  borderRadius: '8px',
                  color: 'var(--terminal-fg)',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isActive 
                    ? '0 4px 12px var(--terminal-glow-green), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                    : '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--terminal-gradient-button-hover)';
                    e.currentTarget.style.boxShadow = '0 4px 8px var(--terminal-glow-green)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--terminal-gradient-header)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${themeData.colors.neonGreen}, ${themeData.colors.neonBlue})`,
                      boxShadow: `0 0 12px ${themeData.colors.glowGreen}`,
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  />
                  <span style={{ fontWeight: isActive ? '600' : '400' }}>{theme.name}</span>
                </div>
                
                {isActive && (
                  <div style={{
                    color: 'var(--terminal-neon-green)',
                    fontSize: '12px',
                    textShadow: '0 0 8px var(--terminal-glow-green)'
                  }}>
                    ✓
                  </div>
                )}
                
                {/* Holographic shimmer effect for active theme */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                      animation: 'holographicShimmer 2s infinite'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};