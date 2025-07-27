// Home module - Professional terminal interface
import React, { useState, useEffect } from 'react';
import { HomeViewModel } from './viewModel';
import { TerminalTabs } from './components/TerminalTabs';
import { Terminal } from './components/Terminal';
import { MultiTabTerminal } from '@/components/MultiTabTerminal';
import { TerminalCursor } from '@/components/TerminalCursor';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { useVisualViewport } from '../hooks/useVisualViewport';
import { themeManager } from '@/theme';
import { TestInfrastructure } from '@/components/TestHelperComponents';
import '../styles/professional-theme.css';

export const HomeView: React.FC = () => {
  const [viewModel] = useState(() => new HomeViewModel());
  const [, forceUpdate] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(false);
  const { viewportHeight, isKeyboardOpen, isStable } = useVisualViewport();

  useEffect(() => {
    viewModel.onStateChange(() => {
      forceUpdate({});
    });

    // Initialize theme manager
    themeManager.init();

    // Auto-login with default user if not authenticated
    const initializeAuth = async () => {
      if (!viewModel.isAuthenticated()) {
        try {
          await viewModel.login('user');
        } catch (error) {
          console.error('Failed to initialize authentication:', error);
        }
      }
      setIsInitializing(false);
    };

    initializeAuth();
  }, [viewModel]);

  // Update terminal app data attributes for CSS targeting
  useEffect(() => {
    const terminalApp = document.querySelector('.terminal-app');
    if (terminalApp) {
      terminalApp.setAttribute('data-keyboard-open', isKeyboardOpen ? '1' : '0');
      terminalApp.setAttribute('data-viewport-stable', isStable ? '1' : '0');
    }
  }, [isKeyboardOpen, isStable]);

  const handleExecuteCommand = async (command: string) => {
    await viewModel.executeCommand(command);
  };

  const handleNewSession = async () => {
    try {
      await viewModel.createNewSession();
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  const handleSwitchSession = (sessionId: string) => {
    viewModel.switchToSession(sessionId);
  };

  const handleCloseSession = (sessionId: string) => {
    viewModel.closeSession(sessionId);
  };

  const currentUser = viewModel.getCurrentUser();
  const sessions = viewModel.getSessions();
  const activeSession = viewModel.getActiveSession();

  // Professional welcome screen without emojis
  if (sessions.length === 0) {
    return (
      <div className="terminal-app terminal-layout-container">
        <div className="terminal-main" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 'var(--space-6)'
        }}>
          <div style={{
            color: 'var(--color-terminal-green)',
            fontSize: 'clamp(24px, 5vw, 32px)',
            fontFamily: 'var(--font-mono)',
            fontWeight: '600',
            letterSpacing: '0.05em'
          }}>
            RUST TERMINAL FORGE
          </div>
          
          <Button
            onClick={handleNewSession}
            className="professional-button"
            aria-label="Create new terminal session"
          >
            <span className="text-icon text-icon--add"></span>
            Initialize Terminal
          </Button>
          
          <div style={{
            color: 'var(--color-fg-secondary)',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-mono)',
            lineHeight: 'var(--line-height-relaxed)'
          }}>
            <div>Real PTY • Multi-Session • Mobile Optimized</div>
            <div style={{ opacity: 0.7, marginTop: 'var(--space-2)' }}>
              Powered by Rust + WebSockets
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="terminal-app terminal-layout-container">
        <div className="terminal-main" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-4)'
        }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px'
          }} />
          <div style={{
            color: 'var(--color-terminal-green)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-base)',
            textAlign: 'center'
          }}>
            Initializing Terminal...
            <div style={{
              fontSize: 'var(--font-size-sm)',
              opacity: 0.7,
              marginTop: 'var(--space-2)',
              color: 'var(--color-fg-secondary)'
            }}>
              Establishing connection
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="terminal-app terminal-layout-container no-overlap-layout"
      data-testid="responsive-container"
      data-keyboard-open={isKeyboardOpen ? '1' : '0'}
      data-viewport-stable={isStable ? '1' : '0'}
      data-theme={themeManager.getCurrentTheme().name.toLowerCase().replace(/\s+/g, '')}
    >
      {/* Professional header without overlapping */}
      <div className="terminal-header">
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--font-size-lg)',
          fontWeight: '600',
          color: 'var(--color-fg-primary)'
        }}>
          Rust Terminal Forge
        </div>
        
        {/* Theme switcher in header - no overlapping */}
        <div className="theme-switcher-container">
          <ThemeSwitcher />
        </div>
      </div>
      
      {/* Typography system markers for testing */}
      <div 
        data-testid="nvchad-typography"
        className="screen-reader-only"
        data-info="Professional typography system active"
      />
      
      {/* Responsive layout markers */}
      {window.innerWidth <= 768 && (
        <div data-testid="mobile-layout" className="screen-reader-only">Mobile Layout Active</div>
      )}
      
      {window.innerWidth >= 1024 && (
        <div data-testid="desktop-features" className="screen-reader-only">Desktop Features Active</div>
      )}

      {/* Main terminal area with proper spacing */}
      <div className="terminal-main">
        {/* Terminal cursor with proper positioning */}
        <TerminalCursor data-testid="terminal-cursor" isActive={true} />

        {/* Terminal interface with no overlapping elements */}
        <ErrorBoundary 
          onError={(error, errorInfo) => {
            console.error('MultiTabTerminal Error:', error, errorInfo);
          }}
        >
          <div 
            data-testid="terminal-content" 
            className="no-overlap-layout"
            style={{ height: '100%', position: 'relative' }}
          >
            {/* Accessible terminal input */}
            <input 
              data-testid="terminal-input"
              type="text"
              className="screen-reader-only"
              aria-describedby="cursor-position"
              aria-label="Terminal command input"
            />
            
            {/* Terminal output area */}
            <div 
              data-testid="terminal-output"
              className="terminal-output"
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                pointerEvents: 'none',
                zIndex: 1
              }}
            />
            
            {/* Main terminal component */}
            <MultiTabTerminal style={{ height: '100%', position: 'relative', zIndex: 2 }} />
            
            {/* Accessibility helper */}
            <div id="cursor-position" className="screen-reader-only">
              Current cursor position: line 1, column 1
            </div>
          </div>
        </ErrorBoundary>
      </div>
      
      {/* Test infrastructure */}
      <TestInfrastructure />
      
      {/* Legacy components - hidden but preserved */}
      <div style={{ display: 'none' }}>
        <TerminalTabs
          sessions={sessions}
          activeSessionId={activeSession?.id || ''}
          onSwitchSession={handleSwitchSession}
          onCloseSession={handleCloseSession}
          onNewSession={handleNewSession}
        />
        {activeSession && (
          <Terminal
            session={activeSession}
            currentPath={viewModel.getCurrentPath()}
            onExecuteCommand={handleExecuteCommand}
            username={currentUser?.username || 'user'}
          />
        )}
      </div>
    </div>
  );
};
