
// Home module - Enhanced main view with improved mobile support
import React, { useState, useEffect } from 'react';
import { HomeViewModel } from './viewModel';
import { TerminalTabs } from './components/TerminalTabs';
import { Terminal } from './components/Terminal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useVisualViewport } from '../hooks/useVisualViewport';

export const HomeView: React.FC = () => {
  const [viewModel] = useState(() => new HomeViewModel());
  const [, forceUpdate] = useState({});
  const { viewportHeight, isKeyboardOpen, isStable } = useVisualViewport();

  useEffect(() => {
    viewModel.onStateChange(() => {
      forceUpdate({});
    });

    // Auto-login with default user if not authenticated
    if (!viewModel.isAuthenticated()) {
      viewModel.login('user');
    }
  }, [viewModel]);

  // Update terminal app data attributes for CSS targeting
  useEffect(() => {
    const terminalApp = document.querySelector('.terminal-app');
    if (terminalApp) {
      terminalApp.setAttribute('data-keyboard-open', isKeyboardOpen ? '1' : '0');
      terminalApp.setAttribute('data-viewport-stable', isStable ? '1' : '0');
    }
  }, [isKeyboardOpen, isStable]);

  const handleExecuteCommand = (command: string) => {
    viewModel.executeCommand(command);
  };

  const handleNewSession = () => {
    viewModel.createNewSession();
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

  // If no sessions exist, show centered plus icon
  if (sessions.length === 0) {
    return (
      <div className="terminal-no-sessions">
        <div className="text-center">
          <Button
            onClick={handleNewSession}
            variant="ghost"
            size="lg"
            className="text-green-400 hover:bg-green-900/30 font-mono border border-green-600 rounded-lg p-8"
            aria-label="Create new terminal session"
          >
            <Plus size={48} />
          </Button>
          <p className="font-mono mt-4 text-sm text-green-500">Click to create a new terminal</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="terminal-app"
      data-keyboard-open={isKeyboardOpen ? '1' : '0'}
      data-viewport-stable={isStable ? '1' : '0'}
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
      {activeSession && (
        <Terminal
          session={activeSession}
          currentPath={viewModel.getCurrentPath()}
          onExecuteCommand={handleExecuteCommand}
          username={currentUser?.username || 'user'}
        />
      )}
    </div>
  );
};
