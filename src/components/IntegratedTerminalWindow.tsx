import React from 'react';
import { RealTerminal } from './RealTerminal';

interface IntegratedTerminalWindowProps {
  tabName: string;
  path: string;
}

export function IntegratedTerminalWindow({ tabName, path }: IntegratedTerminalWindowProps) {
  return (
    <div className="h-full flex flex-col transition-colors duration-200" style={{ backgroundColor: 'var(--theme-terminal)' }}>
      {/* Use the existing RealTerminal component with full height */}
      <div className="flex-1 relative">
        <RealTerminal className="w-full h-full" />
      </div>
    </div>
  );
}