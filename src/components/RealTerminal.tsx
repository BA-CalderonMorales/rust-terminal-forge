import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AnsiText } from './AnsiText';

interface RealTerminalProps {
  className?: string;
}

interface TerminalLine {
  id: string;
  content: string;
  isPrompt?: boolean;
  timestamp: number;
}

export const RealTerminal: React.FC<RealTerminalProps> = ({ className = '' }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [claudeAvailable, setClaudeAvailable] = useState<boolean | null>(null);
  const [showCursor, setShowCursor] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Auto-focus terminal when connected
  useEffect(() => {
    if (isConnected && terminalRef.current) {
      terminalRef.current.focus();
      setIsInputFocused(true);
    }
  }, [isConnected]);

  // Scroll to bottom when current input changes (while typing)
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [currentInput]);

  // Add new lines to terminal
  const addLine = useCallback((content: string, isPrompt = false) => {
    const newLine: TerminalLine = {
      id: `line-${Date.now()}-${Math.random()}`,
      content,
      isPrompt,
      timestamp: Date.now()
    };
    setLines(prev => [...prev, newLine]);
    
    // Auto-scroll to bottom when new content is added
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 10);
  }, []);

  // Process terminal output
  const processTerminalOutput = useCallback((data: string) => {
    console.log('🔧 Processing terminal data:', {
      length: data.length,
      preview: data.substring(0, 100),
      hexDump: Array.from(data).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('').substring(0, 100),
      hasAnsi: /\x1b\[/.test(data),
      hasColorAnsi: /\x1b\[[0-9;]*m/.test(data),
      rawBytes: JSON.stringify(data.substring(0, 50))
    });
    
    // Handle the data more intelligently - some output might not have newlines
    // but we still want to display it immediately
    if (data.includes('\n')) {
      // Split data into lines and add each as a separate line
      const lines = data.split('\n');
      lines.forEach((line, index) => {
        if (line || index < lines.length - 1) { // Include empty lines except the final one if it's empty
          addLine(line);
        }
      });
    } else {
      // For data without newlines, add as a single line
      // This handles things like prompts, partial output, etc.
      addLine(data);
    }
  }, [addLine]);

  // Initialize socket connection
  useEffect(() => {
    console.log('🚀 Connecting to Rick\'s PTY server...');
    
    const socket = io('/', {
      transports: ['websocket']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to PTY server');
      setIsConnected(true);
      
      // Create terminal session
      socket.emit('create-terminal', { 
        cols: 80, 
        rows: 24 
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from PTY server');
      setIsConnected(false);
    });

    socket.on('terminal-ready', (data) => {
      console.log('🎯 Terminal ready:', data);
      setClaudeAvailable(data.claudeAvailable);
      addLine(`Terminal ready (PID: ${data.pid})`);
      addLine(''); // Empty line for spacing
    });

    socket.on('terminal-output', (data) => {
      console.log('📤 Terminal output:', data);
      processTerminalOutput(data);
    });

    socket.on('terminal-exit', (data) => {
      console.log('🏁 Terminal exited:', data);
      addLine('');
      addLine(`Terminal exited with code: ${data.exitCode}`);
    });

    return () => {
      console.log('🧹 Cleaning up socket connection');
      socket.disconnect();
    };
  }, []);

  // Send input to terminal
  const sendInput = useCallback((data: string) => {
    if (socketRef.current && isConnected) {
      console.log('⌨️ Sending input:', data.replace(/\r?\n/g, '\\n'));
      socketRef.current.emit('terminal-input', data);
    }
  }, [isConnected]);

  // Handle command execution
  const executeCommand = useCallback(() => {
    if (currentInput.trim()) {
      // Add the command to the terminal display with prompt
      addLine(`$ ${currentInput}`, true);
      
      // Send command to terminal
      sendInput(currentInput + '\r');
      
      // Clear current input
      setCurrentInput('');
    }
  }, [currentInput, sendInput, addLine]);

  // Handle keyboard input for the unified terminal
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle special key combinations
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      console.log('⛔ Ctrl+C pressed');
      if (socketRef.current) {
        socketRef.current.emit('terminal-interrupt');
      }
      setCurrentInput(''); // Clear current input on interrupt
      return;
    }

    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      console.log('🧹 Ctrl+L pressed (clear)');
      setLines([]); // Clear terminal display
      sendInput('\f'); // Send clear to terminal
      return;
    }

    // Handle Enter key
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand();
      return;
    }

    // Handle Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      setCurrentInput(prev => prev.slice(0, -1));
      return;
    }

    // Handle regular character input
    if (e.key.length === 1) {
      e.preventDefault();
      setCurrentInput(prev => prev + e.key);
      return;
    }
  }, [executeCommand, sendInput]);

  // Focus the terminal when clicked
  const handleTerminalClick = useCallback(() => {
    setIsInputFocused(true);
    if (terminalRef.current) {
      terminalRef.current.focus();
    }
  }, []);

  return (
    <div className={`bg-black text-white font-mono text-sm ${className}`} style={{ fontFamily: 'Consolas, "Courier New", monospace' }}>
      {/* Connection Status */}
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-white text-xs">
              {isConnected ? 'Connected to PTY Server' : 'Disconnected'}
            </span>
          </div>
          {claudeAvailable !== null && (
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${claudeAvailable ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
              <span className="text-white text-xs">
                Claude CLI {claudeAvailable ? 'Available' : 'Not Found'}
              </span>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-400">
          Rick's Interdimensional Terminal™
        </div>
      </div>

      {/* Unified Terminal Area */}
      <div 
        ref={terminalRef}
        className="h-96 p-4 overflow-y-auto cursor-text bg-black"
        onClick={handleTerminalClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          lineHeight: '1.2',
          fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", "Liberation Mono", "Courier New", monospace',
          fontSize: '13px',
          minHeight: '24em',
          color: '#f8f8f2',
          backgroundColor: '#1e1e1e',
          outline: 'none' // Remove focus outline
        }}
      >
        {!isConnected && (
          <div className="text-yellow-400">
            🔌 Connecting to Rick's PTY server...
          </div>
        )}
        
        {/* Historical output lines */}
        {lines.map((line) => (
          <div key={line.id} style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            <AnsiText>{line.content}</AnsiText>
          </div>
        ))}
        
        {/* Current input line with prompt and cursor */}
        {isConnected && (
          <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'inherit' }}>
            <span className="text-green-400">$ </span>
            <span style={{ color: '#f8f8f2' }}>{currentInput}</span>
            <span 
              className={`inline-block w-2 bg-white ${showCursor ? 'opacity-100' : 'opacity-0'}`}
              style={{ 
                height: '1.2em',
                marginLeft: '2px',
                transition: 'opacity 0.1s'
              }}
            />
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="px-4 py-2 border-t border-gray-600 text-xs text-gray-500">
        💡 Click in terminal to type • Ctrl+C to interrupt • Ctrl+L to clear • Enter to execute
        {claudeAvailable === false && (
          <span className="block text-yellow-400 mt-1">
            📦 Install Claude CLI: npm install -g @anthropic-ai/claude-code
          </span>
        )}
        {claudeAvailable === true && (
          <span className="block text-blue-400 mt-1">
            🤖 Try: claude --help
          </span>
        )}
      </div>
    </div>
  );
};