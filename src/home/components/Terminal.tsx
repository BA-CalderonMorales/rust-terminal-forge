
// Home module - Main terminal component
import React, { useState, useRef, useEffect } from 'react';
import { TerminalSession, OPEN_EDITOR_PREFIX } from '../../core/types';

interface TerminalProps {
  session: TerminalSession;
  currentPath: string;
  onExecuteCommand: (command: string) => void;
  onOpenEditor: (filePath: string) => void;
  username: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  session,
  currentPath,
  onExecuteCommand,
  onOpenEditor,
  username
}) => {
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentInput.trim()) {
      onExecuteCommand(currentInput);
      setCurrentInput('');
    }
  };

  const getPrompt = () => {
    return '$';
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [session.id]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [session.history]);

  useEffect(() => {
    const last = session.history[session.history.length - 1];
    if (last && last.output.startsWith(OPEN_EDITOR_PREFIX)) {
      onOpenEditor(last.output.slice(OPEN_EDITOR_PREFIX.length));
    }
  }, [session.history, onOpenEditor]);

  const visibleHistory = session.history.filter(
    cmd => cmd.output !== '__CLEAR__' && !cmd.output.startsWith(OPEN_EDITOR_PREFIX)
  );
  
  // Find last clear command index using reverse iteration
  let lastClearIndex = -1;
  for (let i = session.history.length - 1; i >= 0; i--) {
    if (session.history[i].output === '__CLEAR__') {
      lastClearIndex = i;
      break;
    }
  }
  
  const displayHistory = lastClearIndex >= 0
    ? session.history.slice(lastClearIndex + 1).filter(cmd => cmd.output !== '__CLEAR__' && !cmd.output.startsWith(OPEN_EDITOR_PREFIX))
    : visibleHistory;

  const handleTerminalTap = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="terminal-container">
      <div 
        ref={terminalRef}
        className="terminal-content"
        onClick={handleTerminalTap}
      >
        {displayHistory.map((command) => (
          <div key={command.id} className="mb-3 sm:mb-2">
            <div className="text-green-300 text-sm sm:text-base break-all">
              <span className="text-green-500">{getPrompt()}</span>
              <span className="ml-2">{command.command}</span>
            </div>
            {command.output && (
              <div className={`mt-1 whitespace-pre-wrap text-sm sm:text-base break-words ${
                command.exitCode === 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {command.output}
              </div>
            )}
          </div>
        ))}
        {/* Spacer to ensure content is always above input */}
        <div className="h-20"></div>
      </div>
      
      <div className="terminal-input">
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-green-500 mr-2 text-sm sm:text-base flex-shrink-0">
            {getPrompt()}
          </span>
          <div className="relative flex-1 font-mono text-green-400">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              className="absolute inset-0 w-full bg-transparent outline-none caret-transparent text-transparent placeholder-green-600 text-base sm:text-sm"
              placeholder="Type a command..."
              autoComplete="off"
              spellCheck="false"
              autoCapitalize="off"
              autoCorrect="off"
              inputMode="text"
            />
            <span aria-hidden="true">{currentInput}</span>
            <span className="terminal-cursor" aria-hidden="true">&nbsp;</span>
          </div>
        </form>
      </div>
    </div>
  );
};
