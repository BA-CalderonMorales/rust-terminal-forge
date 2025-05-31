
// Home module - Terminal tabs component for session management
import React from 'react';
import { TerminalSession } from '../../core/types';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface TerminalTabsProps {
  sessions: TerminalSession[];
  activeSessionId: string;
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
  // If no sessions, don't render the tabs bar
  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="terminal-tabs">
      <ScrollArea className="w-full">
        <div className="flex items-center min-w-max">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center border-r border-green-600 ${
                session.id === activeSessionId 
                  ? 'bg-green-900/30 text-green-300' 
                  : 'bg-gray-800 text-green-500 hover:bg-gray-700'
              }`}
            >
              <button
                onClick={() => onSwitchSession(session.id)}
                className="px-3 sm:px-4 py-2 sm:py-3 font-mono text-sm sm:text-base transition-colors min-h-[48px] flex items-center whitespace-nowrap touch-manipulation"
              >
                {session.name}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseSession(session.id);
                }}
                className="px-2 py-2 sm:py-3 text-red-400 hover:text-red-300 transition-colors min-h-[48px] flex items-center touch-manipulation"
                aria-label="Close session"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          
          <Button
            onClick={onNewSession}
            variant="ghost"
            size="sm"
            className="text-green-400 hover:bg-green-900/30 font-mono border-0 rounded-none min-h-[48px] px-3 sm:px-4 whitespace-nowrap touch-manipulation"
            aria-label="New session"
          >
            <Plus size={16} className="sm:mr-1" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
