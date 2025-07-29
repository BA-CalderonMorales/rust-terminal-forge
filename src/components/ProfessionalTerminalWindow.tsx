import React from 'react';
import { RealTerminal } from './RealTerminal';

interface ProfessionalTerminalWindowProps {
  tabName: string;
  path: string;
}

export function ProfessionalTerminalWindow({ tabName, path }: ProfessionalTerminalWindowProps) {
  return (
    <div className="h-full w-full" style={{ backgroundColor: 'var(--theme-terminal)', position: 'relative' }}>
      {/* Terminal Window Content - Use existing RealTerminal with proper positioning */}
      <RealTerminal className="professional-terminal-integration" />
      
      <style>{`
        /* Integration styles for professional terminal - ensure proper focus and interaction */
        .professional-terminal-integration {
          /* Ensure full positioning works properly */
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          /* Override theme colors */
          background-color: var(--theme-terminal) !important;
          color: var(--theme-text) !important;
          /* Ensure click events work */
          pointer-events: auto !important;
          /* Ensure focus works */
          outline: none !important;
        }
        
        /* Ensure terminal header integrates with theme */
        .professional-terminal-integration .terminal-header {
          background: linear-gradient(135deg, var(--theme-surface) 0%, var(--theme-surface-hover) 100%) !important;
          border-bottom: 1px solid var(--theme-border) !important;
        }
        
        /* Ensure terminal output integrates with theme */
        .professional-terminal-integration .terminal-output {
          background: var(--theme-terminal) !important;
          color: var(--theme-terminal-output) !important;
          /* Ensure proper interaction */
          pointer-events: auto !important;
          cursor: text !important;
        }
        
        /* Ensure terminal main area is interactive */
        .professional-terminal-integration .terminal-main {
          pointer-events: auto !important;
          outline: none !important;
        }
        
        /* Terminal status bar */
        .professional-terminal-integration .terminal-status {
          background: linear-gradient(135deg, var(--theme-surface) 0%, var(--theme-surface-hover) 100%) !important;
          border-top: 1px solid var(--theme-border) !important;
          color: var(--theme-text-muted) !important;
        }
        
        /* Cursor styling */
        .professional-terminal-integration .singleton-cursor {
          background-color: var(--theme-primary) !important;
          box-shadow: 0 0 8px var(--theme-primary) !important;
        }
        
        /* Scrollbar integration */
        .professional-terminal-integration .terminal-output::-webkit-scrollbar-thumb {
          background: var(--theme-border) !important;
        }
        
        .professional-terminal-integration .terminal-output::-webkit-scrollbar-thumb:hover {
          background: var(--theme-text-muted) !important;
        }
        
        /* Status indicators with theme colors */
        .professional-terminal-integration .terminal-header [style*="background-color: #00ff88"] {
          background-color: var(--theme-success) !important;
          box-shadow: 0 0 8px var(--theme-success) !important;
        }
        
        .professional-terminal-integration .terminal-header [style*="background-color: #ff4757"] {
          background-color: var(--theme-error) !important;
          box-shadow: 0 0 8px var(--theme-error) !important;
        }
        
        /* Button styling */
        .professional-terminal-integration button {
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-hover)) !important;
          border: 1px solid var(--theme-border) !important;
          color: var(--theme-text) !important;
        }
        
        .professional-terminal-integration button:hover {
          background: linear-gradient(135deg, var(--theme-primary-hover), var(--theme-primary)) !important;
        }
      `}</style>
    </div>
  );
}