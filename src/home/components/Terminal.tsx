
// Home module - Main terminal component
import React, { useState, useRef, useEffect } from 'react';
import { TerminalSession } from '../../core/types';

interface TerminalProps {
  session: TerminalSession;
  currentPath: string;
  onExecuteCommand: (command: string) => Promise<void>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentInput.trim()) {
      await onExecuteCommand(currentInput);
      setCurrentInput('');
    }
  };

  const getPrompt = () => {
    return '$';
  };

  const renderOutput = (output: string) => {
    // Enhanced rendering for Claude responses with better formatting
    const parts = [];
    let content = output;

    // Handle code blocks with warnings
    const codeBlockRegex = /\[Code Block (\d+) - (\w+)\](\s*⚠️ WARNING: Contains potentially dangerous code)?\n={50}\n([\s\S]*?)\n={50}/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const beforeText = content.substring(lastIndex, match.index);
        parts.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {formatText(beforeText)}
          </div>
        );
      }

      // Extract code block info
      const blockNumber = match[1];
      const language = match[2];
      const hasWarning = !!match[3];
      const code = match[4];

      parts.push(
        <div key={`code-${match.index}`} className={`my-3 border rounded-lg overflow-hidden ${
          hasWarning ? 'border-yellow-500' : 'border-gray-600'
        }`}>
          <div className={`px-3 py-2 text-xs font-semibold border-b flex items-center justify-between ${
            hasWarning 
              ? 'bg-yellow-900 text-yellow-100 border-yellow-600' 
              : 'bg-gray-800 text-gray-300 border-gray-600'
          }`}>
            <span>Code Block {blockNumber} - {language.toUpperCase()}</span>
            {hasWarning && (
              <span className="text-yellow-300 text-xs">⚠️ DANGEROUS</span>
            )}
          </div>
          <div className="relative">
            <pre className="bg-gray-900 p-4 overflow-x-auto text-sm leading-relaxed">
              <code className={getLanguageColorClass(language)}>{code}</code>
            </pre>
            <button 
              className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs"
              onClick={() => copyToClipboard(code)}
            >
              Copy
            </button>
          </div>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      parts.push(
        <div key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {formatText(remainingText)}
        </div>
      );
    }

    return parts.length > 0 ? <>{parts}</> : formatText(content);
  };

  const formatText = (text: string) => {
    // Enhanced text formatting for Claude responses
    return text
      .split('\n')
      .map((line, index) => {
        // Handle different types of formatting
        if (line.startsWith('✅')) {
          return <div key={index} className="text-green-400 font-semibold">{line}</div>;
        }
        if (line.startsWith('❌') || line.startsWith('⚠️')) {
          return <div key={index} className="text-red-400 font-semibold">{line}</div>;
        }
        if (line.startsWith('💡')) {
          return <div key={index} className="text-blue-400 italic">{line}</div>;
        }
        if (line.includes('Claude Response:')) {
          return <div key={index} className="text-cyan-400 font-semibold border-b border-gray-700 pb-1 mb-2">{line}</div>;
        }
        if (line.match(/^={3,}/)) {
          return <div key={index} className="text-gray-600">{line}</div>;
        }
        return <div key={index}>{line || '\u00A0'}</div>;
      });
  };

  const getLanguageColorClass = (language: string) => {
    switch (language.toLowerCase()) {
      case 'python':
      case 'py':
        return 'text-yellow-300';
      case 'javascript':
      case 'js':
        return 'text-yellow-200';
      case 'typescript':
      case 'ts':
        return 'text-blue-300';
      case 'bash':
      case 'sh':
        return 'text-green-300';
      case 'rust':
      case 'rs':
        return 'text-orange-300';
      case 'json':
        return 'text-purple-300';
      default:
        return 'text-gray-300';
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
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
  
  // Find last clear command index using reverse iteration
  let lastClearIndex = -1;
  for (let i = session.history.length - 1; i >= 0; i--) {
    if (session.history[i].output === '__CLEAR__') {
      lastClearIndex = i;
      break;
    }
  }
  
  const displayHistory = lastClearIndex >= 0 
    ? session.history.slice(lastClearIndex + 1).filter(cmd => cmd.output !== '__CLEAR__')
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
                {renderOutput(command.output)}
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
