import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AnsiText } from './AnsiText';
import { MobileTabBar } from './MobileTabBar';
import { NvChadStatusLine } from './NvChadStatusLine';
import { GestureHandler, hapticFeedback } from '../core/gestureNavigation';
import { tabManager } from '../core/tabManager';
import { TerminalSession, TabState } from '../core/types';

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
    hasVirtualKeyboard: 'virtualKeyboard' in navigator
  };
};

interface MultiTabTerminalProps {
  className?: string;
}

interface SessionOutput {
  [sessionId: string]: string;
}

interface SessionInput {
  [sessionId: string]: string;
}

interface SocketMap {
  [sessionId: string]: Socket;
}

export const MultiTabTerminal: React.FC<MultiTabTerminalProps> = ({ className = '' }) => {
  // Terminal state
  const terminalRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const gestureHandlerRef = useRef<GestureHandler | null>(null);
  
  // Socket connections per session
  const socketsRef = useRef<SocketMap>({});
  const [sessionOutputs, setSessionOutputs] = useState<SessionOutput>({});
  const [sessionInputs, setSessionInputs] = useState<SessionInput>({});
  const [connectionStates, setConnectionStates] = useState<{ [key: string]: boolean }>({});
  
  // Tab management state
  const [tabState, setTabState] = useState<TabState>(tabManager.getState());
  const [showCursor, setShowCursor] = useState(true);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  // Mobile-specific state
  const [touchCapabilities] = useState(getTouchCapabilities());
  const [virtualKeyboardVisible, setVirtualKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  // Gesture navigation state
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to tab manager state changes
  useEffect(() => {
    const unsubscribe = tabManager.subscribe((newState) => {
      setTabState(newState);
    });

    return unsubscribe;
  }, []);

  // Initialize first session if none exist
  useEffect(() => {
    if (tabState.sessions.length === 0) {
      tabManager.createSession('Terminal 1');
    }
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

  // Get current session output and input
  const activeSession = tabManager.getActiveSession();
  const currentOutput = activeSession ? sessionOutputs[activeSession.id] || '' : '';
  const currentInput = activeSession ? sessionInputs[activeSession.id] || '' : '';

  // Process terminal output with intelligent scrolling
  const processTerminalOutput = useCallback((sessionId: string, data: string) => {
    setSessionOutputs(prev => ({
      ...prev,
      [sessionId]: (prev[sessionId] || '') + data
    }));
    
    // Only auto-scroll if this is the active session and user is at bottom
    if (sessionId === tabManager.getActiveSession()?.id && isAutoScrollEnabled) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [isAutoScrollEnabled, scrollToBottom]);

  // Initialize socket connection for a session
  const initializeSocketForSession = useCallback((session: TerminalSession) => {
    if (socketsRef.current[session.id]) {
      return; // Already connected
    }

    console.log(`🚀 Connecting PTY for session: ${session.name}`);
    
    const socket = io('/', {
      transports: ['websocket'],
      query: { sessionId: session.id }
    });

    socketsRef.current[session.id] = socket;

    socket.on('connect', () => {
      console.log(`✅ Connected PTY for session: ${session.name}`);
      setConnectionStates(prev => ({ ...prev, [session.id]: true }));
      
      // Create terminal session
      socket.emit('create-terminal', { 
        sessionId: session.id,
        cols: 80, 
        rows: 24 
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ Disconnected PTY for session: ${session.name}`);
      setConnectionStates(prev => ({ ...prev, [session.id]: false }));
    });

    socket.on('terminal-ready', (data) => {
      console.log(`🎯 Terminal ready for session: ${session.name}`, data);
    });

    socket.on('terminal-output', (data) => {
      console.log(`📤 Terminal output for ${session.name}:`, data);
      processTerminalOutput(session.id, data);
    });

    socket.on('terminal-exit', (data) => {
      console.log(`🏁 Terminal exited for ${session.name}:`, data);
      processTerminalOutput(session.id, `\r\nTerminal exited with code: ${data.exitCode}\r\n`);
    });

    return socket;
  }, [processTerminalOutput]);

  // Initialize sockets for all existing sessions
  useEffect(() => {
    tabState.sessions.forEach(session => {
      initializeSocketForSession(session);
    });
  }, [tabState.sessions, initializeSocketForSession]);

  // Send input to terminal
  const sendInput = useCallback((data: string, sessionId?: string) => {
    const targetSessionId = sessionId || activeSession?.id;
    if (!targetSessionId) return;

    const socket = socketsRef.current[targetSessionId];
    if (socket && connectionStates[targetSessionId]) {
      console.log(`⌨️ Sending input to ${targetSessionId}:`, data.replace(/\r?\n/g, '\\n'));
      socket.emit('terminal-input', data);
    }
  }, [activeSession?.id, connectionStates]);

  // Handle command execution
  const executeCommand = useCallback(() => {
    if (!activeSession || !currentInput.trim()) return;

    const sessionId = activeSession.id;
    
    // Handle special commands locally for better UX
    if (currentInput.trim() === 'clear') {
      setSessionOutputs(prev => ({ ...prev, [sessionId]: '' }));
      setSessionInputs(prev => ({ ...prev, [sessionId]: '' }));
      sendInput(currentInput + '\r', sessionId);
      return;
    }
    
    // Send command to terminal
    sendInput(currentInput + '\r', sessionId);
    
    // Clear current input
    setSessionInputs(prev => ({ ...prev, [sessionId]: '' }));
  }, [activeSession, currentInput, sendInput]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!activeSession) return;

    const sessionId = activeSession.id;

    // Handle special key combinations
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      const socket = socketsRef.current[sessionId];
      if (socket) {
        socket.emit('terminal-interrupt');
      }
      setSessionInputs(prev => ({ ...prev, [sessionId]: '' }));
      return;
    }

    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      setSessionOutputs(prev => ({ ...prev, [sessionId]: '' }));
      sendInput('\f', sessionId);
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
      setSessionInputs(prev => ({
        ...prev,
        [sessionId]: (prev[sessionId] || '').slice(0, -1)
      }));
      return;
    }

    // Handle regular character input
    if (e.key.length === 1) {
      e.preventDefault();
      setSessionInputs(prev => ({
        ...prev,
        [sessionId]: (prev[sessionId] || '') + e.key
      }));
    }
  }, [activeSession, executeCommand, sendInput]);

  // Tab management functions
  const handleTabClick = useCallback((sessionId: string) => {
    tabManager.switchToSession(sessionId);
    hapticFeedback.cyberpunkPulse();
  }, []);

  const handleTabClose = useCallback((sessionId: string) => {
    tabManager.closeSession(sessionId);
    hapticFeedback.medium();
    
    // Clean up socket connection
    const socket = socketsRef.current[sessionId];
    if (socket) {
      socket.disconnect();
      delete socketsRef.current[sessionId];
    }
    
    // Clean up session data
    setSessionOutputs(prev => {
      const newOutputs = { ...prev };
      delete newOutputs[sessionId];
      return newOutputs;
    });
    
    setSessionInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[sessionId];
      return newInputs;
    });
  }, []);

  const handleNewTab = useCallback(() => {
    const newSession = tabManager.createSession();
    initializeSocketForSession(newSession);
    hapticFeedback.terminalBoot();
  }, [initializeSocketForSession]);

  const handleRestoreTab = useCallback(() => {
    const restoredSession = tabManager.restoreClosedTab();
    if (restoredSession) {
      initializeSocketForSession(restoredSession);
      hapticFeedback.medium();
    }
  }, [initializeSocketForSession]);

  // Gesture navigation
  const handleSwipeLeft = useCallback(() => {
    const state = tabManager.getState();
    if (state.sessions.length <= 1) return;

    const currentIndex = state.tabOrder.indexOf(state.activeSessionId!);
    const nextIndex = currentIndex < state.sessions.length - 1 ? currentIndex + 1 : 0;
    const nextTabId = state.tabOrder[nextIndex];
    
    tabManager.switchToSession(nextTabId);
    hapticFeedback.neonSwipe();
  }, []);

  const handleSwipeRight = useCallback(() => {
    const state = tabManager.getState();
    if (state.sessions.length <= 1) return;

    const currentIndex = state.tabOrder.indexOf(state.activeSessionId!);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : state.sessions.length - 1;
    const previousTabId = state.tabOrder[previousIndex];
    
    tabManager.switchToSession(previousTabId);
    hapticFeedback.neonSwipe();
  }, []);

  const focusHiddenInput = useCallback(() => {
    if (touchCapabilities.isMobile && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
      hiddenInputRef.current.click();
    }
  }, [touchCapabilities.isMobile]);

  // Initialize gesture handler
  useEffect(() => {
    if (!terminalRef.current || !touchCapabilities.isMobile) return;

    gestureHandlerRef.current = new GestureHandler(terminalRef.current, {
      onSwipeLeft: handleSwipeLeft,
      onSwipeRight: handleSwipeRight,
      onTap: focusHiddenInput
    });

    return () => {
      gestureHandlerRef.current?.destroy();
    };
  }, [handleSwipeLeft, handleSwipeRight, focusHiddenInput, touchCapabilities.isMobile]);

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

  // Focus terminal when active session changes
  useEffect(() => {
    if (activeSession && terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [activeSession?.id]);

  // Auto-focus terminal when connected
  useEffect(() => {
    if (activeSession && connectionStates[activeSession.id] && terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [activeSession, connectionStates]);

  // Handle terminal click
  const handleTerminalClick = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.focus();
    }
    
    if (touchCapabilities.isMobile) {
      focusHiddenInput();
    }
  }, [touchCapabilities.isMobile, focusHiddenInput]);

  const isConnected = activeSession ? connectionStates[activeSession.id] || false : false;

  return (
    <div 
      className={`multi-tab-terminal ${className}`}
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
      {/* Mobile Tab Bar */}
      <MobileTabBar
        sessions={tabState.sessions}
        activeSessionId={tabState.activeSessionId}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onNewTab={handleNewTab}
        settings={tabState.settings}
        canCreateNewTab={tabManager.canCreateNewTab()}
        hasClosedTabs={tabManager.hasClosedTabs()}
        onRestoreTab={handleRestoreTab}
      />

      {/* Terminal Header */}
      <div 
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
              {activeSession?.name || 'Multi-Tab Terminal'}
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
                minWidth: touchCapabilities.isMobile ? '44px' : 'auto'
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

      {/* Hidden input for mobile keyboard support */}
      {touchCapabilities.isMobile && (
        <input
          ref={hiddenInputRef}
          type="text"
          value={currentInput}
          onChange={(e) => {
            if (activeSession) {
              setSessionInputs(prev => ({ ...prev, [activeSession.id]: e.target.value }));
            }
          }}
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
        onClick={handleTerminalClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="textbox"
        aria-label={`Terminal interface for ${activeSession?.name || 'session'} - tap to type commands`}
        style={{
          flex: 1,
          position: 'relative',
          outline: 'none',
          minHeight: touchCapabilities.isMobile ? '44px' : 0,
          overflow: 'hidden',
          touchAction: touchCapabilities.isMobile ? 'manipulation' : 'auto',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
      >
        <div 
          ref={outputRef}
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
              Establishing connection for {activeSession?.name || 'session'}...
            </div>
          )}
          
          {currentOutput && <AnsiText>{currentOutput}</AnsiText>}
          
          {/* Input Line */}
          {isConnected && activeSession && (
            <div style={{ display: 'flex', alignItems: 'center', minHeight: '1.3em', position: 'relative' }}>
              <span style={{ color: '#d4d4d4' }}>{currentInput}</span>
              <span 
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
                  Tap to type... (Swipe to switch tabs)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NvChad-Inspired Status Line */}
      <NvChadStatusLine
        currentPath={currentPath}
        activeSession={activeSession?.name}
        gitBranch="main"
        terminalCount={tabState.sessions.length}
        isConnected={isConnected}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};