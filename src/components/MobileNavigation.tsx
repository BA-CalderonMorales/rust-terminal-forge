/**
 * Mobile Navigation Component
 * Bottom navigation bar optimized for agentic work on mobile devices
 * Features gesture-based navigation and quick actions
 */

import React, { useState, useCallback } from 'react';
import { 
  Terminal, 
  Plus, 
  Settings, 
  FolderOpen, 
  Command,
  ChevronUp,
  Keyboard
} from 'lucide-react';
import { useProfessionalTheme } from './ProfessionalThemeProvider';

interface MobileNavigationProps {
  activeTab: string;
  onNewTerminal: () => void;
  onToggleExplorer: () => void;
  onToggleSettings: () => void;
  onQuickCommand: () => void;
  sessionCount: number;
  isExplorerOpen: boolean;
}

export function MobileNavigation({
  activeTab,
  onNewTerminal,
  onToggleExplorer,
  onToggleSettings,
  onQuickCommand,
  sessionCount,
  isExplorerOpen
}: MobileNavigationProps) {
  const { currentTheme } = useProfessionalTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Haptic feedback for touch interactions
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = { light: [10], medium: [30], heavy: [50] };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  const handleAction = useCallback((action: () => void, hapticType: 'light' | 'medium' | 'heavy' = 'light') => {
    triggerHaptic(hapticType);
    action();
  }, [triggerHaptic]);

  return (
    <>
      {/* Floating Action Button for Quick Terminal */}
      <button
        onClick={() => handleAction(onNewTerminal, 'medium')}
        className="mobile-fab"
        style={{
          position: 'fixed',
          right: 'max(16px, env(safe-area-inset-right))',
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: currentTheme.colors.primary,
          color: currentTheme.colors.background,
          border: 'none',
          boxShadow: `0 4px 20px ${currentTheme.colors.primary}40, 0 2px 8px rgba(0,0,0,0.3)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100,
          transition: 'all 0.2s ease',
          touchAction: 'manipulation',
        }}
        aria-label="Create new terminal"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Quick Actions Panel (expandable) */}
      {showQuickActions && (
        <div
          className="quick-actions-panel"
          style={{
            position: 'fixed',
            left: 'max(16px, env(safe-area-inset-left))',
            right: 'max(16px, env(safe-area-inset-right))',
            bottom: 'calc(80px + env(safe-area-inset-bottom))',
            backgroundColor: currentTheme.colors.surface,
            borderRadius: '16px',
            padding: '16px',
            boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
            border: `1px solid ${currentTheme.colors.border}`,
            zIndex: 99,
          }}
        >
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '12px' 
          }}>
            <QuickActionButton
              icon={<Terminal className="w-5 h-5" />}
              label="Terminal"
              onClick={() => handleAction(onNewTerminal)}
              theme={currentTheme}
              isActive={true}
            />
            <QuickActionButton
              icon={<Command className="w-5 h-5" />}
              label="Command"
              onClick={() => handleAction(onQuickCommand)}
              theme={currentTheme}
            />
            <QuickActionButton
              icon={<FolderOpen className="w-5 h-5" />}
              label="Files"
              onClick={() => handleAction(onToggleExplorer)}
              theme={currentTheme}
              isActive={isExplorerOpen}
            />
            <QuickActionButton
              icon={<Settings className="w-5 h-5" />}
              label="Settings"
              onClick={() => handleAction(onToggleSettings)}
              theme={currentTheme}
            />
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: currentTheme.colors.surface,
          borderTop: `1px solid ${currentTheme.colors.border}`,
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          zIndex: 100,
          backdropFilter: 'blur(20px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: '64px',
          maxWidth: '480px',
          margin: '0 auto',
        }}>
          {/* Terminal Tab */}
          <NavButton
            icon={<Terminal className="w-5 h-5" />}
            label="Terminal"
            isActive={activeTab === 'terminal'}
            badge={sessionCount > 0 ? sessionCount : undefined}
            onClick={() => triggerHaptic('light')}
            theme={currentTheme}
          />

          {/* Explorer Tab */}
          <NavButton
            icon={<FolderOpen className="w-5 h-5" />}
            label="Files"
            isActive={isExplorerOpen}
            onClick={() => handleAction(onToggleExplorer)}
            theme={currentTheme}
          />

          {/* Quick Actions Toggle */}
          <NavButton
            icon={<ChevronUp className={`w-5 h-5 transition-transform ${showQuickActions ? 'rotate-180' : ''}`} />}
            label="Actions"
            onClick={() => {
              triggerHaptic('light');
              setShowQuickActions(!showQuickActions);
            }}
            theme={currentTheme}
            isActive={showQuickActions}
          />

          {/* Settings Tab */}
          <NavButton
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            onClick={() => handleAction(onToggleSettings)}
            theme={currentTheme}
          />
        </div>
      </nav>

      <style>{`
        .mobile-fab {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .mobile-fab:active {
          transform: scale(0.92);
        }
        
        .mobile-fab:hover {
          transform: scale(1.05);
        }

        .mobile-bottom-nav {
          transition: transform 0.3s ease;
        }

        .quick-actions-panel {
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Hide on larger screens */
        @media (min-width: 769px) {
          .mobile-bottom-nav,
          .mobile-fab,
          .quick-actions-panel {
            display: none !important;
          }
        }

        /* Landscape optimizations */
        @media (max-height: 500px) and (orientation: landscape) {
          .mobile-bottom-nav {
            height: 48px;
          }
          
          .mobile-fab {
            width: 48px;
            height: 48px;
            bottom: calc(56px + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </>
  );
}

// Nav Button Component
interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  badge?: number;
  onClick: () => void;
  theme: ReturnType<typeof useProfessionalTheme>['currentTheme'];
}

function NavButton({ icon, label, isActive, badge, onClick, theme }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '8px 16px',
        minWidth: '64px',
        minHeight: '48px',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '12px',
        color: isActive ? theme.colors.primary : theme.colors.textMuted,
        cursor: 'pointer',
        position: 'relative',
        touchAction: 'manipulation',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ position: 'relative' }}>
        {icon}
        {badge !== undefined && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-8px',
              backgroundColor: theme.colors.primary,
              color: theme.colors.background,
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '1px 5px',
              minWidth: '16px',
              textAlign: 'center',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>
        {label}
      </span>
    </button>
  );
}

// Quick Action Button Component
interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  theme: ReturnType<typeof useProfessionalTheme>['currentTheme'];
  isActive?: boolean;
}

function QuickActionButton({ icon, label, onClick, theme, isActive }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '12px',
        backgroundColor: isActive ? `${theme.colors.primary}20` : theme.colors.surfaceHover,
        border: isActive ? `1px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
        borderRadius: '12px',
        color: isActive ? theme.colors.primary : theme.colors.text,
        cursor: 'pointer',
        touchAction: 'manipulation',
        transition: 'all 0.2s ease',
      }}
    >
      {icon}
      <span style={{ fontSize: '11px', fontWeight: 500 }}>
        {label}
      </span>
    </button>
  );
}

export default MobileNavigation;
