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
  const [currentInput, setCurrentInput] = useState('');
  const [showCursor, setShowCursor] = useState(true);

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
    }
  }, [isConnected]);

  // Process terminal output - keep it simple and show everything
  const processTerminalOutput = useCallback((data: string) => {
    console.log('🔧 Processing terminal data:', {
      length: data.length,
      preview: data.substring(0, 100),
      hasAnsi: /\x1b\[/.test(data)
    });
    
    setOutput(prev => prev + data);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 10);
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
      // Don't show "terminal ready" message - let the shell show its natural prompt
    });

    socket.on('terminal-output', (data) => {
      console.log('📤 Terminal output:', data);
      processTerminalOutput(data);
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

  // Handle command execution
  const executeCommand = useCallback(() => {
    if (currentInput.trim()) {
      // Handle special commands locally for better UX
      if (currentInput.trim() === 'clear') {
        // Clear the terminal display immediately for responsive feel
        setOutput('');
        setCurrentInput('');
        // Also send to backend for consistency
        sendInput(currentInput + '\r');
        return;
      }
      
      // Send command to terminal
      sendInput(currentInput + '\r');
      
      // Clear current input
      setCurrentInput('');
    }
  }, [currentInput, sendInput]);

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
      setOutput(''); // Clear terminal display
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
    <div className={`bg-black text-white font-mono text-sm ${className}`}>
      {/* Connection Status */}
      <div className="px-3 py-1 bg-gray-800 border-b border-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-white text-xs">
            {isConnected ? 'Terminal' : 'Connecting...'}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          Rick's Terminal
        </div>
      </div>

      {/* Terminal Display */}
      <div 
        ref={terminalRef}
        className="relative h-96 bg-black"
        onClick={handleTerminalClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{ 
          fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", "Liberation Mono", "Courier New", monospace',
          fontSize: '13px',
          outline: 'none'
        }}
      >
        {/* Real terminal output */}
        <div 
          className="absolute inset-0 p-3 overflow-y-auto"
          style={{ 
            whiteSpace: 'pre-wrap',
            lineHeight: '1.2',
            color: '#f8f8f2'
          }}
        >
          {!isConnected && (
            <div className="text-yellow-400">Connecting to terminal...</div>
          )}
          {output && <AnsiText>{output}</AnsiText>}
        </div>
        
        {/* Input overlay - positioned at bottom */}
        {isConnected && (
          <div 
            className="absolute bottom-0 left-0 right-0 p-3"
            style={{
              background: 'transparent',
              pointerEvents: currentInput ? 'auto' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#f8f8f2' }}>{currentInput}</span>
              <span 
                className={`inline-block w-2 bg-white ${showCursor ? 'opacity-100' : 'opacity-0'}`}
                style={{ 
                  height: '1.2em',
                  marginLeft: '1px',
                  transition: 'opacity 0.1s'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Minimal footer */}
      <div className="px-3 py-1 border-t border-gray-600 text-xs text-gray-500 bg-gray-900">
        Click to type • Ctrl+C interrupt • Ctrl+L clear
      </div>
    </div>
  );
};