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
  const [isVirtualKeyboardVisible, setIsVirtualKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [showMobileInputOverlay, setShowMobileInputOverlay] = useState(false);
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Mobile keyboard visibility detection
  useEffect(() => {
    if (!touchCapabilities.isMobile) return;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = viewportHeight - currentHeight;
      
      // If height decreased significantly, keyboard is likely open
      if (heightDifference > 150) {
        setIsVirtualKeyboardVisible(true);
        // Adjust terminal layout when keyboard opens
        if (terminalRef.current) {
          terminalRef.current.style.paddingBottom = `${heightDifference}px`;
        }
      } else {
        setIsVirtualKeyboardVisible(false);
        if (terminalRef.current) {
          terminalRef.current.style.paddingBottom = '0px';
        }
      }
    };

    // Visual viewport API for better keyboard detection (if supported)
    if ('visualViewport' in window && window.visualViewport) {
      const visualViewport = window.visualViewport;
      const handleViewportChange = () => {
        const keyboardHeight = window.innerHeight - visualViewport.height;
        setIsVirtualKeyboardVisible(keyboardHeight > 150);
        
        if (keyboardHeight > 150) {
          // Keyboard is visible - adjust layout
          if (outputRef.current) {
            outputRef.current.style.paddingBottom = `${keyboardHeight + 20}px`;
            // Auto-scroll to bottom when keyboard opens
            setTimeout(() => {
              if (outputRef.current) {
                outputRef.current.scrollTo({
                  top: outputRef.current.scrollHeight,
                  behavior: 'smooth'
                });
              }
            }, 300);
          }
        } else {
          // Keyboard is hidden
          if (outputRef.current) {
            outputRef.current.style.paddingBottom = '16px';
          }
        }
      };
      
      visualViewport.addEventListener('resize', handleViewportChange);
      return () => visualViewport.removeEventListener('resize', handleViewportChange);
    } else {
      // Fallback to window resize events
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [touchCapabilities.isMobile, viewportHeight]);

  // Update viewport height on mount
  useEffect(() => {
    setViewportHeight(window.innerHeight);
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

  // Enhanced mobile input handling with hidden input element
  const focusHiddenInput = useCallback(() => {
    if (touchCapabilities.isMobile && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
      hiddenInputRef.current.click();
      setShowMobileInputOverlay(true);
      triggerHapticFeedback('light');
    }
  }, [touchCapabilities.isMobile, triggerHapticFeedback]);

  // Handle hidden input changes (for mobile typing)
  const handleHiddenInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const lastChar = value[value.length - 1];
    
    if (lastChar) {
      setCurrentInput(prev => prev + lastChar);
      // Clear the hidden input to allow continuous typing
      e.target.value = '';
    }
  }, []);

  // Handle hidden input key events (for special keys on mobile)
  const handleHiddenInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand();
      triggerHapticFeedback('medium');
      return;
    }
    
    if (e.key === 'Backspace') {
      e.preventDefault();
      setCurrentInput(prev => prev.slice(0, -1));
      triggerHapticFeedback('light');
      return;
    }
    
    // Handle Ctrl+C on mobile (some mobile keyboards support this)
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      if (socketRef.current) {
        socketRef.current.emit('terminal-interrupt');
      }
      setCurrentInput('');
      triggerHapticFeedback('heavy');
      return;
    }
  }, [executeCommand, triggerHapticFeedback]);

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
      focusHiddenInput();
      triggerHapticFeedback('light');
      return;
    }
    
    // Long press gesture (for context menu simulation)
    if (touchDuration > 500 && distance < 20) {
      // Long press detected - could trigger context actions
      triggerHapticFeedback('heavy');
      // For now, just focus input but could expand for context menu
      focusHiddenInput();
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
    // On mobile, delegate to hidden input for better keyboard support
    if (touchCapabilities.isMobile) {
      focusHiddenInput();
      return;
    }

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
  }, [executeCommand, sendInput, touchCapabilities.isMobile, focusHiddenInput]);

  // Focus the terminal when clicked (enhanced for mobile)
  const handleTerminalClick = useCallback(() => {
    if (touchCapabilities.isMobile) {
      focusHiddenInput();
    } else if (terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [touchCapabilities.isMobile, focusHiddenInput]);

  return (
    <div 
      className={`modern-terminal ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
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
                padding: '4px 8px',
                color: '#00ff88',
                fontSize: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
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
          onChange={handleHiddenInputChange}
          onKeyDown={handleHiddenInputKeyDown}
          onBlur={() => setShowMobileInputOverlay(false)}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            opacity: 0,
            pointerEvents: 'none',
            fontSize: '16px', // Prevent zoom on iOS
            zIndex: -1
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-hidden="true"
        />
      )}

      {/* Mobile Input Overlay */}
      {touchCapabilities.isMobile && showMobileInputOverlay && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(2px)'
          }}
          onClick={() => setShowMobileInputOverlay(false)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              minWidth: '300px',
              maxWidth: '90vw',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              color: '#00ff88',
              fontSize: '14px',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              Mobile Keyboard Active
            </div>
            <div style={{
              color: '#888',
              fontSize: '12px',
              textAlign: 'center'
            }}>
              Tap outside to close
            </div>
          </div>
        </div>
      )}

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
        style={{
          flex: 1,
          position: 'relative',
          outline: 'none',
          minHeight: 0, // Important for flex child
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
            lineHeight: touchCapabilities.isMobile ? '1.5' : '1.4'
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
          
          {/* Mobile floating keyboard button */}
          {touchCapabilities.isMobile && isConnected && (
            <button
              onClick={focusHiddenInput}
              style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '56px',
                height: '56px',
                borderRadius: '28px',
                backgroundColor: '#00ff88',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0, 255, 136, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 100,
                transition: 'all 0.2s ease',
                transform: isVirtualKeyboardVisible ? 'translateY(-100px)' : 'translateY(0)'
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = isVirtualKeyboardVisible ? 
                  'translateY(-100px) scale(0.95)' : 'translateY(0) scale(0.95)';
                triggerHapticFeedback('medium');
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = isVirtualKeyboardVisible ? 
                  'translateY(-100px) scale(1)' : 'translateY(0) scale(1)';
              }}
              title="Open keyboard"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="12" rx="2" stroke="#0f0f0f" strokeWidth="2"/>
                <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M10 14h.01M14 14h.01M18 14h.01" stroke="#0f0f0f" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 18h8" stroke="#0f0f0f" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Modern Status Bar */}
      <div 
        className="terminal-status"
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