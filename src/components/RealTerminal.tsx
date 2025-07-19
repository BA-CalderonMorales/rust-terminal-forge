import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AnsiText } from './AnsiText';

interface RealTerminalProps {
  className?: string;
}

export const RealTerminal: React.FC<RealTerminalProps> = ({ className = '' }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [claudeAvailable, setClaudeAvailable] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Process terminal output with enhanced debugging
  const processTerminalOutput = useCallback((data: string) => {
    console.log('🔧 Processing terminal data:', {
      length: data.length,
      preview: data.substring(0, 100),
      hexDump: Array.from(data).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('').substring(0, 100),
      hasAnsi: /\x1b\[/.test(data),
      hasColorAnsi: /\x1b\[[0-9;]*m/.test(data),
      rawBytes: JSON.stringify(data.substring(0, 50))
    });
    
    setOutput(prev => {
      const newOutput = prev + data;
      console.log('🔧 New total output length:', newOutput.length);
      return newOutput;
    });
  }, []);

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
      processTerminalOutput(`Terminal ready (PID: ${data.pid})\r\n`);
    });

    socket.on('terminal-output', (data) => {
      console.log('📤 Terminal output:', data);
      processTerminalOutput(data);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }, 10);
    });

    socket.on('terminal-exit', (data) => {
      console.log('🏁 Terminal exited:', data);
      processTerminalOutput(`\r\nTerminal exited with code: ${data.exitCode}\r\n`);
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendInput(input + '\r');
      setInput('');
    }
  };

  // Handle special key combinations
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      console.log('⛔ Ctrl+C pressed');
      if (socketRef.current) {
        socketRef.current.emit('terminal-interrupt');
      }
      return;
    }

    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      console.log('🧹 Ctrl+L pressed (clear)');
      // Clear the local output display
      setOutput('');
      // Also send clear to the terminal
      sendInput('\f'); // Form feed character for clear
      return;
    }
  };

  // Focus input when terminal is clicked
  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

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

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="h-96 p-4 overflow-y-auto cursor-text bg-black"
        onClick={handleTerminalClick}
        style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          lineHeight: '1.2',
          fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", "Liberation Mono", "Courier New", monospace',
          fontSize: '13px',
          minHeight: '24em',
          color: '#f8f8f2', // Default terminal text color
          backgroundColor: '#1e1e1e' // Dark terminal background
        }}
      >
        {!isConnected && (
          <div className="text-yellow-400">
            🔌 Connecting to Rick's PTY server...
          </div>
        )}
        {output && (
          <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            <AnsiText>{output}</AnsiText>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-600 p-4">
        <div className="flex items-center space-x-2">
          <span className="text-green-400">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your command..."
            className="flex-1 bg-transparent text-white outline-none placeholder-gray-500"
            style={{ fontFamily: 'Consolas, "Courier New", monospace' }}
            disabled={!isConnected}
            autoFocus
          />
        </div>
        <div className="text-xs text-gray-500 mt-2">
          💡 Ctrl+C to interrupt, Ctrl+L to clear, Enter to execute
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
      </form>
    </div>
  );
};