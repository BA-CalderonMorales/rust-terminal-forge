
// Home module - Main view component
import React, { useState, useEffect } from 'react';
import { HomeViewModel } from './viewModel';
import { TerminalTabs } from './components/TerminalTabs';
import { Terminal } from './components/Terminal';
import { Button } from '@/components/ui/button';

export const HomeView: React.FC = () => {
  const [viewModel] = useState(() => new HomeViewModel());
  const [, forceUpdate] = useState({});

  useEffect(() => {
    viewModel.onStateChange(() => {
      forceUpdate({});
    });

    // Auto-login with default user if not authenticated
    if (!viewModel.isAuthenticated()) {
      viewModel.login('user');
    }
  }, [viewModel]);

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

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="font-mono mb-4 text-base">No terminal sessions available</p>
          <Button
            onClick={handleNewSession}
            className="bg-green-600 hover:bg-green-700 text-black font-mono min-h-[44px] px-6"
          >
            Create New Terminal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col overflow-hidden">
      {/* Terminal Tabs */}
      <TerminalTabs
        sessions={sessions}
        activeSessionId={activeSession.id}
        onSwitchSession={handleSwitchSession}
        onCloseSession={handleCloseSession}
        onNewSession={handleNewSession}
      />

      {/* Terminal */}
      <Terminal
        session={activeSession}
        currentPath={viewModel.getCurrentPath()}
        onExecuteCommand={handleExecuteCommand}
        username={currentUser?.username || 'user'}
      />
    </div>
  );
};
