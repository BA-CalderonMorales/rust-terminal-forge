import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AnsiText } from './AnsiText';

// Mobile device detection utility
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0);
};

// Touch capabilities detection
const getTouchCapabilities = () => {
  return {
    hasTouch: 'ontouchstart' in window,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    isMobile: isMobileDevice(),
    supportsHaptics: 'vibrate' in navigator,
    // Detect if device supports virtual keyboard
    hasVirtualKeyboard: 'virtualKeyboard' in navigator
  };
};

interface RealTerminalProps {
  className?: string;
}

export const RealTerminal: React.FC<RealTerminalProps> = ({ className = '' }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [output, setOutput] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  // Mobile-specific state
  const [touchCapabilities] = useState(getTouchCapabilities());
  const [virtualKeyboardVisible, setVirtualKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });

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
      
      // If height decreased by more than 150px, assume virtual keyboard is visible
      const keyboardVisible = heightDifference > 150;
      setVirtualKeyboardVisible(keyboardVisible);
      setViewportHeight(currentHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewportHeight, touchCapabilities.isMobile]);

  

  

  // Touch event handlers with gesture recognition
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setLastTouchTime(Date.now());
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Prevent default behavior for better scrolling control
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartPos.y;
      
      // If scrolling up/down significantly, ensure proper scroll behavior
      if (Math.abs(deltaY) > 50 && outputRef.current) {
        // Let the browser handle scrolling naturally
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
    
    // Tap gesture (short duration, minimal movement)
    if (touchDuration < 300 && distance < 10) {
      triggerHapticFeedback('light');
      focusHiddenInput();
      return;
    }
    
    // Long press gesture (for context menu simulation)
    if (touchDuration > 500 && distance < 20) {
      // Long press detected - could trigger context actions
      triggerHapticFeedback('heavy');
      return;
    }
    
    // Swipe gestures
    if (distance > 50 && touchDuration < 500) {
      // Horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          // Swipe right - could implement tab switching or other actions
          triggerHapticFeedback('medium');
        } else {
          // Swipe left - could implement back/history
          triggerHapticFeedback('medium');
        }
      }
      // Vertical swipe is handled by normal scrolling
    }
  }, [lastTouchTime, touchStartPos, focusHiddenInput, triggerHapticFeedback]);

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
    if (terminalRef.current) {
      terminalRef.current.focus();
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
      {/* Modern Terminal Header */}
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
          {/* macOS-style window controls */}
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
              Rust Terminal Forge
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
                backdropFilter: 'blur(10px)',
                minHeight: touchCapabilities.isMobile ? '44px' : 'auto',
                minWidth: touchCapabilities.isMobile ? '44px' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Scroll to bottom"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 255, 136, 0.3), rgba(0, 255, 136, 0.5))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.4))';
              }}
            >
              ↓ Scroll
            </button>
          )}
          <span style={{ color: '#888', fontSize: '10px', fontFamily: 'monospace' }}>
            {isConnected ? 'ONLINE' : 'CONNECTING...'}
          </span>
        </div>
      </div>

      {/* Hidden input for mobile keyboard support */}
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
            fontSize: '16px', // Prevent zoom on iOS
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

      {/* Mobile Input Overlay */}
      

      {/* Main Terminal Area */}
      <div 
        ref={terminalRef}
        className="terminal-main"
        onClick={handleTerminalClick}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
        role="textbox"
        aria-label="Terminal interface - tap to type commands"
        aria-multiline="false"
        aria-describedby="terminal-status"
        style={{
          flex: 1,
          position: 'relative',
          outline: 'none',
          minHeight: touchCapabilities.isMobile ? '44px' : 0, // Important for flex child + mobile touch target
          overflow: 'hidden',
          // Enhanced touch handling
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
            // Hardware acceleration
            willChange: 'scroll-position',
            transform: 'translateZ(0)',
            // Enhanced text rendering
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility',
            // Mobile-optimized selection styling
            WebkitUserSelect: touchCapabilities.isMobile ? 'none' : 'text',
            userSelect: touchCapabilities.isMobile ? 'none' : 'text',
            cursor: touchCapabilities.isMobile ? 'pointer' : 'text',
            // Mobile scrolling enhancements
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            // Mobile font size adjustments
            fontSize: touchCapabilities.isMobile ? 'clamp(14px, 3vw, 16px)' : 'clamp(12px, 2.5vw, 14px)',
            lineHeight: touchCapabilities.isMobile ? '1.5' : '1.4',
            // Ensure minimum touch target size
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
          
          {/* Input Line */}
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
              <span 
                className="terminal-cursor"
                style={{
                  display: 'inline-block',
                  width: touchCapabilities.isMobile ? '12px' : '10px',
                  height: '1.4em',
                  backgroundColor: showCursor ? '#00ff88' : 'transparent',
                  marginLeft: '2px',
                  borderRadius: '1px',
                  boxShadow: showCursor ? '0 0 8px rgba(0, 255, 136, 0.6)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              />
              
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

      {/* Modern Status Bar */}
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
          <span>PTY Session Active</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '9px' }}>
          <span style={{ opacity: 0.7 }}>^C Interrupt</span>
          <span style={{ opacity: 0.7 }}>^L Clear</span>
          <span style={{ color: '#00ff88', opacity: 0.8 }}>Rust Terminal Forge</span>
        </div>
      </div>

      {/* Enhanced CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        
        @keyframes blink {
          0%, 50% { background-color: #00ff88; box-shadow: 0 0 8px rgba(0, 255, 136, 0.6); }
          51%, 100% { background-color: transparent; box-shadow: none; }
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
        
        .terminal-header {
          transition: all 0.2s ease;
        }
        
        /* Mobile-specific animations */
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        
        @keyframes mobileKeyboardSlide {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes mobileFabPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        /* Enhanced mobile optimizations */
        @media (max-width: 768px) {
          .modern-terminal {
            border-radius: 0;
            box-shadow: none;
          }
          
          .terminal-header {
            padding: 6px 12px;
            min-height: 36px;
          }
          
          .terminal-output {
            padding: 12px 14px;
            /* Better touch scrolling */
            -webkit-overflow-scrolling: touch;
            overscroll-behavior-y: contain;
            /* Enhanced text selection on mobile */
            -webkit-touch-callout: default;
            -webkit-user-select: text;
            user-select: text;
          }
          
          .terminal-status {
            padding: 4px 12px;
            min-height: 28px;
            font-size: 9px;
          }
          
          /* Mobile keyboard button animations */
          .mobile-keyboard-fab {
            animation: mobileFabPulse 2s infinite;
          }
          
          .mobile-keyboard-fab:active {
            animation: none;
            transform: scale(0.95);
          }
          
          /* Improved mobile input overlay */
          .mobile-input-overlay {
            animation: mobileKeyboardSlide 0.3s ease-out;
          }
          
          /* Better mobile scrollbar */
          .terminal-output::-webkit-scrollbar {
            width: 4px;
          }
          
          .terminal-output::-webkit-scrollbar-thumb {
            background: rgba(0, 255, 136, 0.6);
            border-radius: 2px;
          }
          
          /* Mobile text selection improvements */
          .terminal-output::selection {
            background: rgba(0, 255, 136, 0.3);
            color: inherit;
          }
          
          .terminal-output::-moz-selection {
            background: rgba(0, 255, 136, 0.3);
            color: inherit;
          }
        }
        
        /* Landscape orientation optimizations */
        @media (max-width: 768px) and (orientation: landscape) {
          .terminal-header {
            min-height: 32px;
            padding: 4px 12px;
          }
          
          .terminal-status {
            min-height: 24px;
            font-size: 8px;
          }
          
          .terminal-output {
            padding: 8px 12px;
          }
        }
        
        /* High DPI display optimizations */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .modern-terminal {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        }
        
        /* Accessibility improvements for mobile */
        @media (prefers-reduced-motion: reduce) {
          .mobile-keyboard-fab {
            animation: none;
          }
          
          .mobile-input-overlay {
            animation: none;
          }
        }
        
        /* Dark mode adjustments for mobile */
        @media (prefers-color-scheme: dark) and (max-width: 768px) {
          .modern-terminal {
            background-color: #000;
          }
          
          .terminal-output {
            background: linear-gradient(135deg, #000 0%, #111 50%, #000 100%);
          }
        }
      `}</style>
    </div>
  );
};