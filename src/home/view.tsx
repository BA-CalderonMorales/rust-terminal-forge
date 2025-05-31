
// Home module - Main view component
import React, { useState, useEffect } from 'react';
import { HomeViewModel } from './viewModel';
import { LoginForm } from './components/LoginForm';
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
  }, [viewModel]);

  const handleLogin = (username: string) => {
    viewModel.login(username);
  };

  const handleLogout = () => {
    viewModel.logout();
  };

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

  if (!viewModel.isAuthenticated()) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const currentUser = viewModel.getCurrentUser();
  const sessions = viewModel.getSessions();
  const activeSession = viewModel.getActiveSession();

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono mb-4">No terminal sessions available</p>
          <Button
            onClick={handleNewSession}
            className="bg-green-600 hover:bg-green-700 text-black font-mono"
          >
            Create New Terminal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-green-600 p-4 flex justify-between items-center">
        <div className="font-mono">
          <span className="text-green-300">Rust Terminal - </span>
          <span className="text-green-400">{currentUser?.username}</span>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="text-green-400 hover:bg-red-900 hover:text-red-400 font-mono"
        >
          Logout
        </Button>
      </div>

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
