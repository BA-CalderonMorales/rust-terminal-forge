
// Home module - Modern terminal tabs with cyberpunk aesthetics
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
    <div className="terminal-tabs" style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
      borderBottom: '2px solid rgba(0, 255, 136, 0.2)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
    }}>
      <ScrollArea className="w-full">
        <div className="flex items-center min-w-max">
          {sessions.map((session, index) => (
            <div
              key={session.id}
              className="flex items-center border-r transition-all duration-200"
              style={{
                borderColor: session.id === activeSessionId ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                background: session.id === activeSessionId 
                  ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 255, 136, 0.25))' 
                  : 'rgba(0, 0, 0, 0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Active tab indicator */}
              {session.id === activeSessionId && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, #00ff88, #00d4aa)',
                  boxShadow: '0 0 8px rgba(0, 255, 136, 0.6)'
                }} />
              )}
              
              <button
                onClick={() => onSwitchSession(session.id)}
                className="px-3 sm:px-4 py-2 sm:py-3 font-mono text-sm sm:text-base transition-all duration-200 min-h-[48px] flex items-center whitespace-nowrap touch-manipulation"
                style={{
                  color: session.id === activeSessionId ? '#00ff88' : '#888',
                  fontWeight: session.id === activeSessionId ? '600' : '400',
                  textShadow: session.id === activeSessionId ? '0 0 8px rgba(0, 255, 136, 0.6)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (session.id !== activeSessionId) {
                    e.currentTarget.style.color = '#aaa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (session.id !== activeSessionId) {
                    e.currentTarget.style.color = '#888';
                  }
                }}
              >
                <span style={{ marginRight: '6px', fontSize: '10px', opacity: 0.7 }}>#{index + 1}</span>
                {session.name}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseSession(session.id);
                }}
                className="px-2 py-2 sm:py-3 transition-all duration-200 min-h-[48px] flex items-center touch-manipulation"
                style={{
                  color: '#ff4757',
                  opacity: 0.6
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.color = '#ff6b7a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.6';
                  e.currentTarget.style.color = '#ff4757';
                }}
                aria-label="Close session"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          
          <Button
            onClick={onNewSession}
            variant="ghost"
            size="sm"
            className="font-mono border-0 rounded-none min-h-[48px] px-3 sm:px-4 whitespace-nowrap touch-manipulation transition-all duration-200"
            style={{
              color: '#00ff88',
              background: 'rgba(0, 255, 136, 0.05)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 136, 0.15)';
              e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(0, 255, 136, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 136, 0.05)';
              e.currentTarget.style.boxShadow = 'none';
            }}
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
