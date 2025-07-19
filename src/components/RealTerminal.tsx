import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AnsiText } from './AnsiText';

interface RealTerminalProps {
  className?: string;
}

export const RealTerminal: React.FC<RealTerminalProps> = ({ className = '' }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [output, setOutput] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Smart auto-scroll detection
  const checkScrollPosition = useCallback(() => {
    const element = outputRef.current;
    if (!element) return;
    
    const { scrollTop, scrollHeight, clientHeight } = element;
    const nearBottom = (scrollTop + clientHeight) >= (scrollHeight - 50);
    
    setIsAtBottom(nearBottom);
    setIsAutoScrollEnabled(nearBottom);
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTo({
        top: outputRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Auto-focus terminal when connected
  useEffect(() => {
    if (isConnected && terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [isConnected]);

  // Process terminal output with intelligent scrolling
  const processTerminalOutput = useCallback((data: string) => {
    console.log('🔧 Processing terminal data:', {
      length: data.length,
      preview: data.substring(0, 100),
      hasAnsi: /\x1b\[/.test(data)
    });
    
    setOutput(prev => prev + data);
    
    // Only auto-scroll if user is at bottom
    if (isAutoScrollEnabled) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [isAutoScrollEnabled, scrollToBottom]);

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
    <div 
      className={`terminal-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'ui-monospace, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
        fontSize: '14px',
        lineHeight: '1.3',
        letterSpacing: '0.05em',
        position: 'relative'
      }}
    >
      {/* Professional Terminal Header */}
      <div 
        className="terminal-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 12px',
          backgroundColor: '#2d2d30',
          borderBottom: '1px solid #3c3c3c',
          fontSize: '12px',
          minHeight: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#4CAF50' : '#FF5722'
            }}
          />
          <span style={{ color: '#cccccc', fontSize: '11px' }}>
            Terminal
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isAtBottom && (
            <button
              onClick={scrollToBottom}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '3px',
                padding: '2px 6px',
                color: '#cccccc',
                fontSize: '11px',
                cursor: 'pointer'
              }}
              title="Scroll to bottom"
            >
              ↓
            </button>
          )}
          <span style={{ color: '#8c8c8c', fontSize: '11px' }}>
            Rick's Terminal
          </span>
        </div>
      </div>

      {/* Main Terminal Area */}
      <div 
        ref={terminalRef}
        className="terminal-main"
        onClick={handleTerminalClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{
          flex: 1,
          position: 'relative',
          outline: 'none',
          minHeight: 0, // Important for flex child
          overflow: 'hidden'
        }}
      >
        {/* Terminal Output */}
        <div 
          ref={outputRef}
          className="terminal-output"
          onScroll={checkScrollPosition}
          style={{
            position: 'absolute',
            inset: 0,
            padding: '12px',
            overflowY: 'auto',
            overflowX: 'hidden',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            scrollBehavior: 'smooth',
            // Hardware acceleration
            willChange: 'scroll-position',
            transform: 'translateZ(0)',
            // Professional text rendering
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeSpeed',
            // Selection styling
            WebkitUserSelect: 'text',
            userSelect: 'text',
            cursor: 'text'
          }}
        >
          {!isConnected && (
            <div style={{ color: '#FFB74D', opacity: 0.8 }}>
              Connecting to terminal...
            </div>
          )}
          {output && <AnsiText>{output}</AnsiText>}
          
          {/* Input Line */}
          {isConnected && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: '1.3em'
              }}
            >
              <span style={{ color: '#d4d4d4' }}>{currentInput}</span>
              <span 
                className="terminal-cursor"
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '1.3em',
                  backgroundColor: showCursor ? '#007ACC' : 'transparent',
                  marginLeft: '1px',
                  transition: 'background-color 0.1s ease',
                  animation: showCursor ? 'none' : 'blink 1s linear infinite'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Professional Status Bar */}
      <div 
        className="terminal-status"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 12px',
          backgroundColor: '#007ACC',
          color: '#ffffff',
          fontSize: '11px',
          minHeight: '20px'
        }}
      >
        <div>
          Terminal Ready
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>Ctrl+C</span>
          <span>•</span>
          <span>Ctrl+L</span>
        </div>
      </div>

      {/* Add CSS for cursor animation */}
      <style jsx>{`
        @keyframes blink {
          0%, 50% { background-color: #007ACC; }
          51%, 100% { background-color: transparent; }
        }
        
        .terminal-output::-webkit-scrollbar {
          width: 8px;
        }
        
        .terminal-output::-webkit-scrollbar-track {
          background: #2d2d30;
        }
        
        .terminal-output::-webkit-scrollbar-thumb {
          background: #464647;
          border-radius: 4px;
        }
        
        .terminal-output::-webkit-scrollbar-thumb:hover {
          background: #5a5a5a;
        }
        
        .terminal-container {
          background: linear-gradient(135deg, #1e1e1e 0%, #252526 100%);
        }
        
        .terminal-header {
          backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
};