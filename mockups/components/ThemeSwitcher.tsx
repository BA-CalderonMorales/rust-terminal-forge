import React, { useState } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from './ThemeProvider';

export function ThemeSwitcher() {
  const { currentTheme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-hover)] transition-colors p-2"
      >
        <Palette className="w-4 h-4" />
        <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Theme Selector */}
          <div className="absolute top-full right-0 mt-2 z-50 w-80 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-[var(--theme-border)]">
              <h3 className="font-medium text-[var(--theme-text)] text-sm">Choose Theme</h3>
              <p className="text-xs text-[var(--theme-text-muted)] mt-1">Select your terminal aesthetic</p>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className="w-full p-3 hover:bg-[var(--theme-surface-hover)] transition-colors flex items-center gap-3 group"
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
                      <span className="font-medium text-[var(--theme-text)] text-sm">{theme.name}</span>
                      {currentTheme.id === theme.id && (
                        <Check className="w-3 h-3 text-[var(--theme-primary)]" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--theme-text-muted)] mt-0.5">{theme.description}</p>
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
            
            <div className="p-3 border-t border-[var(--theme-border)] bg-[var(--theme-surface)]">
              <p className="text-xs text-[var(--theme-text-muted)] text-center">
                ✨ More themes coming soon
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}