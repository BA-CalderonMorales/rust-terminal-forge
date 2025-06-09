import React from 'react';
import { EditorSession } from '../../core/types';
import { X } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface EditorTabsProps {
  sessions: EditorSession[];
  activeSessionId: string;
  onSwitchSession: (sessionId: string) => void;
  onCloseSession: (sessionId: string) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  sessions,
  activeSessionId,
  onSwitchSession,
  onCloseSession
}) => {
  if (sessions.length === 0) return null;

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
                aria-label="Close editor"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
