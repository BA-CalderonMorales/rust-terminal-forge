
// Home module - Terminal tabs component
import React from 'react';
import { TerminalSession } from '../../core/types';
import { Button } from '@/components/ui/button';

interface TerminalTabsProps {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onSwitchSession: (sessionId: string) => void;
  onCloseSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export const TerminalTabs: React.FC<TerminalTabsProps> = ({
  sessions,
  activeSessionId,
  onSwitchSession,
  onCloseSession,
  onNewSession
}) => {
  return (
    <div className="bg-gray-900 border-b border-green-600 flex items-center overflow-x-auto">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={`flex items-center border-r border-green-600 ${
            session.id === activeSessionId ? 'bg-green-900' : 'bg-gray-800'
          }`}
        >
          <button
            onClick={() => onSwitchSession(session.id)}
            className="px-4 py-2 text-sm font-mono text-green-400 hover:bg-green-800 transition-colors"
          >
            {session.name}
          </button>
          {sessions.length > 1 && (
            <button
              onClick={() => onCloseSession(session.id)}
              className="px-2 py-2 text-green-400 hover:text-red-400 hover:bg-red-900 transition-colors"
            >
              ×
            </button>
          )}
        </div>
      ))}
      
      <Button
        onClick={onNewSession}
        variant="ghost"
        size="sm"
        className="text-green-400 hover:bg-green-800 font-mono"
      >
        +
      </Button>
    </div>
  );
};
