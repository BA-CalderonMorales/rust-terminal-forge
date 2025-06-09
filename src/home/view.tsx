// Home module - Enhanced main view with secure authentication
import React, { useState, useEffect } from 'react';
import { HomeViewModel } from './viewModel';
import { TerminalTabs } from './components/TerminalTabs';
import { EditorTabs } from './components/EditorTabs';
import { FileEditor } from './components/FileEditor';
import { Terminal } from './components/Terminal';
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

  const handleExecuteCommand = (command: string) => {
    viewModel.executeCommand(command);
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

  const handleOpenEditor = (file: string) => {
    viewModel.openEditor(file);
  };

  const handleSwitchEditor = (id: string) => {
    viewModel.setActiveEditor(id);
  };

  const handleCloseEditor = (id: string) => {
    viewModel.closeEditor(id);
  };

  const handleUpdateEditor = (id: string, content: string) => {
    viewModel.updateEditorContent(id, content);
  };

  const handleSaveEditor = (id: string) => {
    viewModel.saveEditor(id);
  };

  const currentUser = viewModel.getCurrentUser();
  const sessions = viewModel.getSessions();
  const activeSession = viewModel.getActiveSession();
  const editorSessions = viewModel.getEditorSessions();
  const activeEditor = viewModel.getActiveEditor();

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

  if (isInitializing) {
    return (
      <div className="terminal-app flex items-center justify-center">
        <div className="text-green-400 font-mono">Initializing secure terminal...</div>
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

      <EditorTabs
        sessions={editorSessions}
        activeId={activeEditor?.id || ''}
        onSwitch={handleSwitchEditor}
        onClose={handleCloseEditor}
      />

      {/* Terminal Content */}
      {activeSession && (
        <Terminal
          session={activeSession}
          currentPath={viewModel.getCurrentPath()}
          onExecuteCommand={handleExecuteCommand}
          onOpenEditor={handleOpenEditor}
          username={currentUser?.username || 'user'}
        />
      )}

      {activeEditor && (
        <FileEditor
          session={activeEditor}
          onChange={content => handleUpdateEditor(activeEditor.id, content)}
          onSave={() => handleSaveEditor(activeEditor.id)}
        />
      )}
    </div>
  );
};
