/**
 * NvChad-Inspired Status Line Component
 * Modern, minimal statusline with git, file, and terminal info
 */

import React, { useState, useEffect } from 'react';
import { themeManager } from '../theme';

interface StatusLineProps {
  currentPath?: string;
  activeSession?: string;
  gitBranch?: string;
  terminalCount?: number;
  isConnected?: boolean;
}

export const NvChadStatusLine: React.FC<StatusLineProps> = ({
  currentPath = '/workspaces/rust-terminal-forge',
  activeSession = 'Terminal 1',
  gitBranch = 'main',
  terminalCount = 1,
  isConnected = true
}) => {
  const [currentTheme, setCurrentTheme] = useState(themeManager.getCurrentTheme());
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const unsubscribe = themeManager.subscribe(setCurrentTheme);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="nvchad-statusline"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '28px',
        padding: '0 16px',
        background: 'var(--terminal-gradient-header)',
        borderTop: '1px solid rgba(0, 255, 136, 0.1)',
        backdropFilter: 'blur(15px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(15px) saturate(1.1)',
        fontSize: '11px',
        fontFamily: 'monospace',
        color: 'var(--terminal-text-secondary)',
        fontWeight: '500',
        letterSpacing: '0.5px'
      }}
    >
      {/* Left side - Mode and session info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Terminal mode indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            background: 'var(--terminal-gradient-button)',
            borderRadius: '4px',
            color: 'var(--terminal-neon-green)',
            fontSize: '10px',
            fontWeight: '600',
            textTransform: 'uppercase',
            boxShadow: '0 0 8px rgba(0, 255, 136, 0.3)'
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isConnected ? 'var(--terminal-success)' : 'var(--terminal-error)',
              animation: isConnected ? 'pulse 2s infinite' : 'none'
            }}
          />
          TERM
        </div>

        {/* Session info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--terminal-text-muted)' }}>Session:</span>
          <span style={{ color: 'var(--terminal-neon-green)', fontWeight: '600' }}>
            {activeSession}
          </span>
        </div>

        {/* Terminal count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--terminal-text-muted)' }}>Tabs:</span>
          <span style={{ 
            color: 'var(--terminal-accent)', 
            fontWeight: '600',
            padding: '2px 6px',
            background: 'rgba(0, 212, 255, 0.1)',
            borderRadius: '3px',
            border: '1px solid rgba(0, 212, 255, 0.3)'
          }}>
            {terminalCount}
          </span>
        </div>
      </div>

      {/* Center - Current path */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          maxWidth: '400px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        <span style={{ color: 'var(--terminal-text-muted)' }}>📁</span>
        <span
          style={{
            color: 'var(--terminal-foreground)',
            fontWeight: '500',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }}
          title={currentPath}
        >
          {currentPath.split('/').pop() || currentPath}
        </span>
      </div>

      {/* Right side - Git, theme, and time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Git branch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--terminal-text-muted)' }}>⎇</span>
          <span style={{ color: 'var(--terminal-warning)', fontWeight: '600' }}>
            {gitBranch}
          </span>
        </div>

        {/* Theme indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${currentTheme.colors.neonGreen}, ${currentTheme.colors.neonBlue})`,
              boxShadow: `0 0 6px ${currentTheme.colors.glowGreen}`
            }}
          />
          <span style={{ color: 'var(--terminal-text-secondary)', fontSize: '10px' }}>
            {currentTheme.name}
          </span>
        </div>

        {/* Time */}
        <div style={{ 
          color: 'var(--terminal-text-muted)', 
          fontSize: '10px',
          fontFamily: 'monospace',
          letterSpacing: '0.5px'
        }}>
          {time.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};