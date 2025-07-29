import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { useProfessionalTheme } from './ProfessionalThemeProvider';

export function ProfessionalThemeSwitcher() {
  const { currentTheme, setTheme, themes } = useProfessionalTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-[var(--theme-surface-hover)]"
        style={{ 
          color: 'var(--theme-text-muted)',
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--theme-text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--theme-text-muted)';
        }}
      >
        <Palette className="w-4 h-4" />
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Theme Selector */}
          <div 
            className="absolute top-full right-0 mt-2 z-50 w-80 rounded-lg shadow-2xl overflow-hidden border"
            style={{ 
              backgroundColor: 'var(--theme-surface)', 
              borderColor: 'var(--theme-border)' 
            }}
          >
            <div className="p-3 border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <h3 className="font-medium text-sm" style={{ color: 'var(--theme-text)' }}>Choose Theme</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>Select your terminal aesthetic</p>
            </div>
            
            <div className="max-h-80 overflow-y-auto terminal-scrollbar">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className="w-full p-3 transition-colors flex items-center gap-3 group"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--theme-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Theme Preview */}
                  <div className="flex-shrink-0 w-12 h-8 rounded border overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
                    <div className="w-full h-2" style={{ backgroundColor: theme.colors.surface }} />
                    <div className="px-1 py-0.5 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                      <div className="w-4 h-0.5 rounded" style={{ backgroundColor: theme.colors.text }} />
                    </div>
                  </div>
                  
                  {/* Theme Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" style={{ color: 'var(--theme-text)' }}>{theme.name}</span>
                      {currentTheme.id === theme.id && (
                        <Check className="w-3 h-3" style={{ color: 'var(--theme-primary)' }} />
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{theme.description}</p>
                  </div>
                  
                  {/* Color Palette Preview */}
                  <div className="flex-shrink-0 flex gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.success }} />
                  </div>
                </button>
              ))}
            </div>
            
            <div className="p-3 border-t" style={{ 
              borderColor: 'var(--theme-border)', 
              backgroundColor: 'var(--theme-surface)' 
            }}>
              <p className="text-xs text-center" style={{ color: 'var(--theme-text-muted)' }}>
                Professional Terminal Themes
              </p>
            </div>
          </div>
        </>
      )}
      
      <style>{`
        .terminal-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .terminal-scrollbar::-webkit-scrollbar-track {
          background: var(--theme-surface);
        }
        
        .terminal-scrollbar::-webkit-scrollbar-thumb {
          background: var(--theme-border);
          border-radius: 2px;
        }
        
        .terminal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--theme-text-muted);
        }
      `}</style>
    </div>
  );
}