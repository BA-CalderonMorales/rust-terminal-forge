
// Home module - Main terminal component
import React, { useState, useRef, useEffect } from 'react';
import { TerminalSession } from '../../core/types';

interface TerminalProps {
  session: TerminalSession;
  currentPath: string;
  onExecuteCommand: (command: string) => void;
  username: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  session,
  currentPath,
  onExecuteCommand,
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
    return `${username}@rust-terminal:${currentPath}$`;
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

  const visibleHistory = session.history.filter(cmd => cmd.output !== '__CLEAR__');
  const lastClearIndex = session.history.findLastIndex(cmd => cmd.output === '__CLEAR__');
  const displayHistory = lastClearIndex >= 0 
    ? session.history.slice(lastClearIndex + 1).filter(cmd => cmd.output !== '__CLEAR__')
    : visibleHistory;

  return (
    <div className="flex-1 bg-black text-green-400 font-mono text-sm flex flex-col">
      <div 
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-gray-900"
      >
        {displayHistory.map((command) => (
          <div key={command.id} className="mb-2">
            <div className="text-green-300">
              <span className="text-green-500">{getPrompt()}</span>
              <span className="ml-2">{command.command}</span>
            </div>
            {command.output && (
              <div className={`mt-1 whitespace-pre-wrap ${
                command.exitCode === 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {command.output}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="border-t border-green-600 p-4">
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-green-500 mr-2">{getPrompt()}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            className="flex-1 bg-transparent outline-none text-green-400 placeholder-green-600"
            placeholder="Type a command..."
            autoComplete="off"
            spellCheck="false"
          />
        </form>
      </div>
    </div>
  );
};
