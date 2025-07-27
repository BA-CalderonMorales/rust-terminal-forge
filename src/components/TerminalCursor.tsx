/**
 * Terminal Cursor Component - Natural placement with blinking animation
 * TDD GREEN Phase: Minimal implementation to pass failing tests
 */

import React, { useState, useEffect, useRef } from 'react';
import { themeManager } from '../theme';

interface TerminalCursorProps {
  position?: { line: number; col: number };
  isActive?: boolean;
  mode?: 'line' | 'block' | 'underline';
  className?: string;
}

export const TerminalCursor: React.FC<TerminalCursorProps> = ({
  position = { line: 1, col: 1 },
  isActive = true,
  mode = 'line',
  className = ''
}) => {
  const [currentTheme, setCurrentTheme] = useState(themeManager.getCurrentTheme());
  const [isBlinking, setIsBlinking] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const blinkTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const unsubscribe = themeManager.subscribe(setCurrentTheme);
    return unsubscribe;
  }, []);

  // Handle typing pause logic
  useEffect(() => {
    if (isPaused) {
      setIsBlinking(false);
      
      // Resume blinking after 1 second of no typing
      blinkTimeoutRef.current = setTimeout(() => {
        setIsBlinking(true);
        setIsPaused(false);
      }, 1000);
    }

    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
    };
  }, [isPaused]);

  // Responsive cursor size based on viewport
  const getCursorSize = () => {
    const isMobile = window.innerWidth <= 768;
    return {
      width: mode === 'block' ? '1ch' : isMobile ? '3px' : '2px',
      height: mode === 'underline' ? '2px' : '1.2em'
    };
  };

  const cursorStyles = {
    position: 'absolute' as const,
    ...getCursorSize(),
    backgroundColor: currentTheme.colors.neonGreen,
    border: mode === 'line' ? `1px solid ${currentTheme.colors.neonGreen}` : 'none',
    borderRadius: mode === 'block' ? '2px' : '0',
    zIndex: 10,
    pointerEvents: 'none' as const,
    willChange: 'opacity',
    backfaceVisibility: 'hidden' as const,
    transform: 'translateZ(0)', // Hardware acceleration
    
    // Blinking animation
    animation: isActive && isBlinking && !isPaused 
      ? 'cursor-blink 1s infinite' 
      : 'none',
    
    // Focus states
    opacity: isActive ? 1 : 0.3,
    
    // Position based on line/column
    left: `${position.col * 0.6}ch`,
    top: `${(position.line - 1) * 1.4}em`,
    
    // Accessibility
    transition: 'opacity 0.15s ease'
  };

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsBlinking(false);
      } else {
        setIsBlinking(true);
      }
    };

    if (mediaQuery.matches) {
      setIsBlinking(false);
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Global typing pause handler
  useEffect(() => {
    const handleTyping = () => {
      setIsPaused(true);
    };

    // Listen for typing events globally
    document.addEventListener('input', handleTyping);
    document.addEventListener('keydown', handleTyping);

    return () => {
      document.removeEventListener('input', handleTyping);
      document.removeEventListener('keydown', handleTyping);
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        data-testid="terminal-cursor"
        className={`terminal-cursor ${className}`}
        style={cursorStyles}
        aria-hidden="true"
        role="presentation"
      />
      
      <style>{`
        @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        /* Vim-specific cursor styles */
        .cursor-vim-normal {
          width: 1ch !important;
          background-color: ${currentTheme.colors.neonGreen} !important;
        }
        
        .cursor-vim-insert {
          width: 2px !important;
          border-left: 2px solid ${currentTheme.colors.neonGreen} !important;
          background-color: transparent !important;
        }
        
        /* Code editor cursor styles */
        .cursor-code {
          border-left: 2px solid ${currentTheme.colors.neonBlue} !important;
          background-color: transparent !important;
        }
        
        /* AI interface typing cursor */
        .cursor-typing {
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          background-color: ${currentTheme.colors.neonPink} !important;
          animation: typing-pulse 1.5s infinite !important;
        }
        
        @keyframes typing-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        /* Current line highlight for code editor */
        .line-highlight {
          background-color: rgba(0, 255, 136, 0.05) !important;
          border-left: 2px solid ${currentTheme.colors.neonGreen} !important;
          position: relative !important;
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .terminal-cursor {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
};

// Vim-specific cursor component
export const VimCursor: React.FC<{ mode: 'normal' | 'insert' | 'visual'; position?: { line: number; col: number } }> = ({ 
  mode, 
  position 
}) => {
  const cursorClass = `cursor-vim-${mode}`;
  const cursorMode = mode === 'normal' ? 'block' : 'line';
  
  return (
    <TerminalCursor
      data-testid="vim-cursor"
      className={`vim-cursor ${cursorClass}`}
      mode={cursorMode}
      position={position}
      isActive={true}
    />
  );
};

// Code editor cursor with multi-cursor support
export const CodeCursor: React.FC<{ cursors?: Array<{ line: number; col: number }>; currentLine?: number }> = ({ 
  cursors = [{ line: 1, col: 1 }], 
  currentLine 
}) => {
  return (
    <>
      {cursors.map((cursor, index) => (
        <TerminalCursor
          key={index}
          data-testid="code-cursor"
          className="cursor-code"
          mode="line"
          position={cursor}
          isActive={true}
        />
      ))}
      
      {/* Current line highlight */}
      {currentLine && (
        <div
          data-testid="current-line"
          className="line-highlight"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${(currentLine - 1) * 1.4}em`,
            height: '1.4em',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      )}
    </>
  );
};

// AI interface typing indicator
export const AICursor: React.FC<{ isTyping?: boolean }> = ({ isTyping = false }) => {
  return (
    <TerminalCursor
      data-testid="ai-cursor"
      className="cursor-typing"
      mode="line"
      isActive={isTyping}
    />
  );
};