// Home module - Enhanced main view with secure authentication
import React, { useState, useEffect } from 'react';
import { HomeViewModel } from './viewModel';
import { TerminalTabs } from './components/TerminalTabs';
import { Terminal } from './components/Terminal';
import { RealTerminal } from '@/components/RealTerminal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useVisualViewport } from '../hooks/useVisualViewport';

export const HomeView: React.FC = () => {
  const [viewModel] = useState(() => new HomeViewModel());
  const [, forceUpdate] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);
  const { viewportHeight, isKeyboardOpen, isStable } = useVisualViewport();

  useEffect(() => {
    viewModel.onStateChange(() => {
      forceUpdate({});
    });

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

  // If no sessions exist, show modern welcome screen
  if (sessions.length === 0) {
    return (
      <div className="terminal-no-sessions" style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(0, 255, 136, 0.05) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(0, 255, 136, 0.03) 0%, transparent 50%)',
          animation: 'pulse 4s ease-in-out infinite'
        }} />
        
        <div className="text-center relative z-10">
          <div style={{
            marginBottom: '24px',
            color: '#00ff88',
            fontSize: 'clamp(24px, 5vw, 32px)',
            fontFamily: 'monospace',
            fontWeight: '600',
            textShadow: '0 0 20px rgba(0, 255, 136, 0.5)'
          }}>
            RUST TERMINAL FORGE
          </div>
          
          <Button
            onClick={handleNewSession}
            variant="ghost"
            size="lg"
            className="font-mono border rounded-lg transition-all duration-300 transform hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.2))',
              border: '2px solid rgba(0, 255, 136, 0.4)',
              color: '#00ff88',
              padding: '20px 32px',
              fontSize: '18px',
              boxShadow: '0 0 20px rgba(0, 255, 136, 0.3), inset 0 0 20px rgba(0, 255, 136, 0.1)',
              backdropFilter: 'blur(10px)'
            }}
            aria-label="Create new terminal session"
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 136, 0.5), inset 0 0 30px rgba(0, 255, 136, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.3), inset 0 0 20px rgba(0, 255, 136, 0.1)';
            }}
          >
            <Plus size={28} style={{ marginRight: '8px' }} />
            Initialize Terminal
          </Button>
          
          <div style={{
            marginTop: '24px',
            color: '#888',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}>
            <div>Real PTY • Multi-Session • Mobile Optimized</div>
            <div style={{ opacity: 0.6, marginTop: '8px', fontSize: '12px' }}>
              Powered by Rust + WebSockets
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="terminal-app flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(0, 255, 136, 0.3)',
            borderTop: '3px solid #00ff88',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{
            color: '#00ff88',
            fontFamily: 'monospace',
            fontSize: '16px',
            textAlign: 'center'
          }}>
            Initializing Secure Terminal...
            <div style={{
              fontSize: '12px',
              opacity: 0.7,
              marginTop: '8px'
            }}>
              Establishing encrypted connection
            </div>
          </div>
        </div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div 
      className="terminal-app"
      data-keyboard-open={isKeyboardOpen ? '1' : '0'}
      data-viewport-stable={isStable ? '1' : '0'}
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #0a0a0a 75%, #1a1a1a 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 20s ease infinite'
      }}
    >
      {/* Terminal Tabs - Fixed at top */}
      <TerminalTabs
        sessions={sessions}
        activeSessionId={activeSession?.id || ''}
        onSwitchSession={handleSwitchSession}
        onCloseSession={handleCloseSession}
        onNewSession={handleNewSession}
      />

      {/* Terminal Content */}
      <div className="flex flex-col h-full" style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #0a0a0a 100%)',
        padding: 'clamp(8px, 2vw, 16px)'
      }}>
        {/* Modern PTY Terminal Interface */}
        <div className="flex-1" style={{
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}>
          <RealTerminal className="h-full" />
        </div>
        
        {/* Original Terminal - HIDDEN FOR NOW TO AVOID CONFUSION */}
        {false && activeSession && (
          <div className="flex-1 border-b border-gray-600" style={{display: 'none'}}>
            <div className="px-4 py-2 bg-gray-800 text-white text-xs">
              Original Simulated Terminal (Hidden - Use Real Terminal Above)
            </div>
            <Terminal
              session={activeSession}
              currentPath={viewModel.getCurrentPath()}
              onExecuteCommand={handleExecuteCommand}
              username={currentUser?.username || 'user'}
            />
          </div>
        )}
      </div>
    </div>
  );
};
