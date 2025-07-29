/**
 * Enhanced RealTerminal with SingletonCursor Integration
 * Demonstrates how to integrate the singleton cursor system with existing components
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AnsiText } from './AnsiText';
import { SingletonCursor, useSingletonCursor } from './SingletonCursor';

// Mobile device detection utility (copied from original)
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0);
};

// Touch capabilities detection (copied from original)
const getTouchCapabilities = () => {
  return {
    hasTouch: 'ontouchstart' in window,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    isMobile: isMobileDevice(),
    supportsHaptics: 'vibrate' in navigator,
    hasVirtualKeyboard: 'virtualKeyboard' in navigator
  };
};

interface EnhancedRealTerminalProps {
  className?: string;
  terminalId?: string; // Unique ID for this terminal instance
}

export const EnhancedRealTerminal: React.FC<EnhancedRealTerminalProps> = ({ 
  className = '',
  terminalId = 'real-terminal-1'
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [output, setOutput] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  
  // Mobile-specific state
  const [touchCapabilities] = useState(getTouchCapabilities());
  const [virtualKeyboardVisible, setVirtualKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });

  // SingletonCursor integration
  const cursor = useSingletonCursor(
    `terminal-cursor-${terminalId}`,
    'terminal',
    outputRef
  );

  // Calculate cursor position based on current input and terminal state
  const calculateCursorPosition = useCallback(() => {
    if (!outputRef.current || !isConnected) return;

    // Get terminal metrics
    const outputElement = outputRef.current;
    const style = window.getComputedStyle(outputElement);
    const lineHeight = parseFloat(style.lineHeight) || 16;
    const fontSize = parseFloat(style.fontSize) || 14;
    const charWidth = fontSize * 0.6; // Approximate character width

    // Calculate number of lines in output
    const outputLines = output.split('\n').length;
    
    // Position cursor at end of current input
    const currentLine = outputLines + 1;
    const currentCol = currentInput.length;

    cursor.updateTextPosition(currentLine, currentCol);
  }, [output, currentInput, isConnected, cursor]);

  // Update cursor position when input or output changes
  useEffect(() => {
    calculateCursorPosition();
  }, [calculateCursorPosition]);

  // Handle focus state and cursor visibility
  useEffect(() => {
    cursor.updateStyle({ 
      opacity: isFocused ? 1 : 0.3 
    });
  }, [isFocused, cursor]);

  // Pause cursor blinking while typing
  useEffect(() => {
    if (currentInput.length > 0) {
      cursor.pauseBlinking();
      
      // Resume after a delay
      const timer = setTimeout(() => {
        cursor.resumeBlinking();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentInput, cursor]);

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
      setIsFocused(true);
    }
  }, [isConnected]);

  // Process terminal output with intelligent scrolling
  const processTerminalOutput = useCallback((data: string) => {
    console.log('🔧 Processing terminal data:', {
      length: data.length,
      preview: data.substring(0, 100),
      hasAnsi: /\u001b\[/.test(data)
    });
    
    setOutput(prev => prev + data);
    
    // Only auto-scroll if user is at bottom
    if (isAutoScrollEnabled) {
      requestAnimationFrame(() => {
        scrollToBottom();
        calculateCursorPosition(); // Update cursor after scroll
      });
    }
  }, [isAutoScrollEnabled, scrollToBottom, calculateCursorPosition]);

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
  }, [processTerminalOutput]);

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
        setOutput('');
        setCurrentInput('');
        sendInput(currentInput + '\r');
        return;
      }
      
      sendInput(currentInput + '\r');
      setCurrentInput('');
    }
  }, [currentInput, sendInput]);

  // Mobile haptic feedback utility
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (touchCapabilities.supportsHaptics && touchCapabilities.isMobile) {
      const patterns = {
        light: [10],
        medium: [50],
        heavy: [100]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [touchCapabilities]);

  // Focus hidden input for mobile keyboard support
  const focusHiddenInput = useCallback(() => {
    if (touchCapabilities.isMobile && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
      hiddenInputRef.current.click();
    }
  }, [touchCapabilities.isMobile]);

  // Virtual keyboard detection
  useEffect(() => {
    if (!touchCapabilities.isMobile) return;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = viewportHeight - currentHeight;
      
      const keyboardVisible = heightDifference > 150;
      setVirtualKeyboardVisible(keyboardVisible);
      setViewportHeight(currentHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewportHeight, touchCapabilities.isMobile]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setLastTouchTime(Date.now());
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartPos.y;
      
      if (Math.abs(deltaY) > 50 && outputRef.current) {
        e.stopPropagation();
      }
    }
  }, [touchStartPos.y]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - lastTouchTime;
    const changedTouch = e.changedTouches[0];
    const deltaX = changedTouch.clientX - touchStartPos.x;
    const deltaY = changedTouch.clientY - touchStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (touchDuration < 300 && distance < 10) {
      triggerHapticFeedback('light');
      focusHiddenInput();
      return;
    }
    
    if (touchDuration > 500 && distance < 20) {
      triggerHapticFeedback('heavy');
      return;
    }
    
    if (distance > 50 && touchDuration < 500) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        triggerHapticFeedback('medium');
      }
    }
  }, [lastTouchTime, touchStartPos, focusHiddenInput, triggerHapticFeedback]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle special key combinations
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      console.log('⛔ Ctrl+C pressed');
      if (socketRef.current) {
        socketRef.current.emit('terminal-interrupt');
      }
      setCurrentInput('');
      return;
    }

    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      console.log('🧹 Ctrl+L pressed (clear)');
      setOutput('');
      sendInput('\f');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      setCurrentInput(prev => prev.slice(0, -1));
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
      setCurrentInput(prev => prev + e.key);
      return;
    }
  }, [executeCommand, sendInput]);

  // Handle focus/blur
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    cursor.show();
  }, [cursor]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    cursor.updateStyle({ opacity: 0.3 });
  }, [cursor]);

  // Focus the terminal when clicked
  const handleTerminalClick = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.focus();
      setIsFocused(true);
    }
  }, []);

  return (
    <div 
      className={`modern-terminal ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: virtualKeyboardVisible ? `${viewportHeight}px` : '100%',
        backgroundColor: '#0f0f0f',
        color: '#e1e1e1',
        fontFamily: 'ui-monospace, "JetBrains Mono", "Fira Code", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
        fontSize: 'clamp(12px, 2.5vw, 14px)',
        lineHeight: '1.4',
        letterSpacing: '0.02em',
        position: 'relative',
        boxSizing: 'border-box',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.6)'
      }}
    >
      {/* SingletonCursor Integration */}
      <SingletonCursor
        id={`terminal-cursor-${terminalId}`}
        context="terminal"
        position={cursor.position}
        isActive={isFocused && isConnected}
        priority={4} // Terminal priority
        containerRef={outputRef}
        onActivate={() => console.log(`Terminal ${terminalId} cursor activated`)}
        onDeactivate={() => console.log(`Terminal ${terminalId} cursor deactivated`)}
        style={{
          boxShadow: isFocused ? '0 0 8px rgba(0, 255, 136, 0.6)' : '0 0 4px rgba(0, 255, 136, 0.3)'
        }}
      />

      {/* Terminal Header */}
      <div 
        className="terminal-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '11px',
          minHeight: '40px',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27CA3F' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#00ff88' : '#ff4757',
                boxShadow: isConnected ? '0 0 8px #00ff88' : '0 0 8px #ff4757',
                animation: isConnected ? 'pulse 2s infinite' : 'none'
              }}
            />
            <span style={{ color: '#e1e1e1', fontSize: '11px', fontWeight: '500' }}>
              Enhanced Terminal (ID: {terminalId})
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isAtBottom && (
            <button
              onClick={scrollToBottom}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.4))',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                borderRadius: '4px',
                padding: touchCapabilities.isMobile ? '8px 12px' : '4px 8px',
                color: '#00ff88',
                fontSize: touchCapabilities.isMobile ? '12px' : '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
              title="Scroll to bottom"
            >
              ↓ Scroll
            </button>
          )}
          <span style={{ color: '#888', fontSize: '10px', fontFamily: 'monospace' }}>
            {isConnected ? 'ONLINE' : 'CONNECTING...'}
          </span>
        </div>
      </div>

      {/* Hidden input for mobile */}
      {touchCapabilities.isMobile && (
        <input
          ref={hiddenInputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            opacity: 0,
            width: '1px',
            height: '1px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '16px',
            transform: 'scale(0)',
            pointerEvents: 'none'
          }}
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      )}

      {/* Main Terminal Area */}
      <div 
        ref={terminalRef}
        className="terminal-main"
        onClick={handleTerminalClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
        role="textbox"
        aria-label={`Enhanced terminal ${terminalId} - tap to type commands`}
        aria-multiline="false"
        aria-describedby="terminal-status"
        style={{
          flex: 1,
          position: 'relative',
          outline: isFocused ? '2px solid rgba(0, 255, 136, 0.3)' : 'none',
          minHeight: touchCapabilities.isMobile ? '44px' : 0,
          overflow: 'hidden',
          touchAction: touchCapabilities.isMobile ? 'manipulation' : 'auto',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
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
            padding: touchCapabilities.isMobile ? '12px 16px' : '16px 20px',
            overflowY: 'auto',
            overflowX: 'hidden',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            scrollBehavior: 'smooth',
            background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)',
            willChange: 'scroll-position',
            transform: 'translateZ(0)',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility',
            WebkitUserSelect: touchCapabilities.isMobile ? 'none' : 'text',
            userSelect: touchCapabilities.isMobile ? 'none' : 'text',
            cursor: touchCapabilities.isMobile ? 'pointer' : 'text',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            fontSize: touchCapabilities.isMobile ? 'clamp(14px, 3vw, 16px)' : 'clamp(12px, 2.5vw, 14px)',
            lineHeight: touchCapabilities.isMobile ? '1.5' : '1.4',
            minHeight: touchCapabilities.isMobile ? '44px' : 'auto'
          }}
        >
          {!isConnected && (
            <div style={{ 
              color: '#00ff88', 
              opacity: 0.9,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'pulse 2s infinite'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#00ff88',
                animation: 'pulse 1.5s infinite'
              }} />
              Establishing secure connection...
            </div>
          )}
          {output && <AnsiText>{output}</AnsiText>}
          
          {/* Input Line - Note: No cursor here, SingletonCursor handles it */}
          {isConnected && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: '1.3em',
                position: 'relative'
              }}
            >
              <span style={{ color: '#d4d4d4' }}>{currentInput}</span>
              
              {/* Mobile keyboard hint */}
              {touchCapabilities.isMobile && currentInput === '' && (
                <span 
                  style={{
                    position: 'absolute',
                    left: '20px',
                    color: '#666',
                    fontSize: '12px',
                    fontStyle: 'italic',
                    pointerEvents: 'none',
                    animation: 'fadeInOut 3s infinite'
                  }}
                >
                  Tap to type...
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div 
        id="terminal-status"
        className="terminal-status"
        role="status"
        aria-live="polite"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 16px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          color: '#888',
          fontSize: '10px',
          minHeight: '32px',
          fontFamily: 'monospace'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: isConnected ? '#00ff88' : '#ff4757' }}>
            {isConnected ? '● READY' : '● CONNECTING'}
          </span>
          <span style={{ opacity: 0.6 }}>|</span>
          <span>SingletonCursor Active</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '9px' }}>
          <span style={{ opacity: 0.7 }}>^C Interrupt</span>
          <span style={{ opacity: 0.7 }}>^L Clear</span>
          <span style={{ color: '#00ff88', opacity: 0.8 }}>Enhanced Terminal</span>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        
        .terminal-output::-webkit-scrollbar {
          width: 6px;
        }
        
        .terminal-output::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        .terminal-output::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #00ff88, #00d4aa);
          border-radius: 3px;
          transition: all 0.2s ease;
        }
        
        .terminal-output::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #00ff88, #00ffaa);
          box-shadow: 0 0 8px rgba(0, 255, 136, 0.4);
        }
        
        .modern-terminal {
          transition: all 0.3s ease;
        }
        
        .modern-terminal:hover {
          box-shadow: 0 25px 30px -5px rgba(0, 0, 0, 0.9), 0 15px 15px -5px rgba(0, 0, 0, 0.7);
        }
      `}</style>
    </div>
  );
};

export default EnhancedRealTerminal;