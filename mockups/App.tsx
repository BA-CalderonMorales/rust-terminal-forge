import React from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { TerminalLayout } from './components/TerminalLayout';

export default function App() {
  return (
    <ThemeProvider>
      <div className="h-screen w-full">
        <TerminalLayout />
      </div>
    </ThemeProvider>
  );
}