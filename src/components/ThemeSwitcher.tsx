import React, { useState, useEffect } from 'react';
import { themeManager, themes } from '../theme';
import { hapticFeedback } from '../core/gestureNavigation';

interface ThemeSwitcherProps {
  className?: string;
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  className = '', 
  compact = false 
}) => {
  const [currentTheme, setCurrentTheme] = useState(themeManager.getCurrentTheme());
  const [isOpen, setIsOpen] = useState(false);
  const availableThemes = themeManager.getAvailableThemes();

  useEffect(() => {
    const unsubscribe = themeManager.subscribe((theme) => {
      setCurrentTheme(theme);
    });
    return unsubscribe;
  }, []);

  const handleThemeChange = (themeKey: string) => {
    themeManager.setTheme(themeKey);
    setIsOpen(false);
    hapticFeedback.medium();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    hapticFeedback.light();
  };

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