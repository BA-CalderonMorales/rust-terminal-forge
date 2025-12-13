import React, { useState, useCallback, useRef, useEffect } from 'react';

interface BrowserTerminalProps {
  className?: string;
}

// Demo commands for browser-only mode
const DEMO_COMMANDS: Record<string, (args: string[]) => string> = {
  help: () => `
Available commands (Demo Mode):
  help     - Show this help message
  clear    - Clear the terminal
  echo     - Echo text back
  whoami   - Show current user
  date     - Show current date/time
  ls       - List demo files
  pwd      - Print working directory
  uname    - System information
  cat      - Display file contents (demo)
  history  - Show command history

Note: This is a demo terminal. For full functionality,
run the PTY server locally with: node persistent-pty-server.js
`,
  whoami: () => 'demo-user',
  date: () => new Date().toString(),
  pwd: () => '/home/demo-user/rust-terminal-forge',
  uname: () => 'Browser Terminal v1.0 (Demo Mode)',
  ls: (args) => {
    const files = [
      'src/',
      'public/',
      'package.json',
      'README.md',
      'vite.config.ts',
      'tsconfig.json'
    ];
    return args.includes('-la') || args.includes('-l') 
      ? files.map(f => `drwxr-xr-x  demo-user  ${f}`).join('\n')
      : files.join('  ');
  },
  echo: (args) => args.join(' '),
  cat: (args) => {
    if (args.length === 0) return 'cat: missing file operand';
    const file = args[0];
    if (file === 'README.md') {
      return '# Rust Terminal Forge\n\nA modern terminal emulator built with React and TypeScript.';
    }
    return `cat: ${file}: Demo mode - file preview not available`;
  },
};

export const BrowserTerminal: React.FC<BrowserTerminalProps> = ({ className = '' }) => {
  const [output, setOutput] = useState<string[]>([
    '\x1b[32m╭────────────────────────────────────────────────────────╮\x1b[0m',
    '\x1b[32m│\x1b[0m  \x1b[1;36mRust Terminal Forge\x1b[0m - \x1b[33mDemo Mode\x1b[0m                      \x1b[32m│\x1b[0m',
    '\x1b[32m│\x1b[0m  Backend server not available. Running in demo mode.   \x1b[32m│\x1b[0m',
    '\x1b[32m│\x1b[0m  Type \x1b[1;33mhelp\x1b[0m for available commands.                     \x1b[32m│\x1b[0m',
    '\x1b[32m╰────────────────────────────────────────────────────────╯\x1b[0m',
    ''
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [output, scrollToBottom]);

  const executeCommand = useCallback((cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    // Add to history
    setCommandHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);

    // Parse command
    const parts = trimmedCmd.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Add command line to output
    const promptLine = `\x1b[32mdemo-user\x1b[0m@\x1b[36mterminal\x1b[0m:\x1b[34m~\x1b[0m$ ${trimmedCmd}`;
    
    let result = '';
    
    if (command === 'clear') {
      setOutput([]);
      return;
    } else if (command === 'history') {
      result = commandHistory.map((c, i) => `  ${i + 1}  ${c}`).join('\n');
    } else if (DEMO_COMMANDS[command]) {
      result = DEMO_COMMANDS[command](args);
    } else if (command) {
      result = `\x1b[31m${command}: command not found\x1b[0m (Demo mode - try 'help')`;
    }

    setOutput(prev => [...prev, promptLine, ...result.split('\n'), '']);
  }, [commandHistory]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      setCurrentInput(prev => prev.slice(0, -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      setOutput([]);
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      setOutput(prev => [...prev, `\x1b[32mdemo-user\x1b[0m@\x1b[36mterminal\x1b[0m:\x1b[34m~\x1b[0m$ ${currentInput}^C`, '']);
      setCurrentInput('');
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setCurrentInput(prev => prev + e.key);
    }
  }, [currentInput, executeCommand, commandHistory, historyIndex]);

  const handleClick = useCallback(() => {
    terminalRef.current?.focus();
  }, []);

  // Simple ANSI parser for display
  const parseAnsi = (text: string) => {
    const parts: { text: string; style: React.CSSProperties }[] = [];
    const regex = /\x1b\[([0-9;]*)m/g;
    let lastIndex = 0;
    let currentStyle: React.CSSProperties = {};
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index), style: { ...currentStyle } });
      }
      
      const codes = match[1].split(';').map(Number);
      for (const code of codes) {
        if (code === 0) currentStyle = {};
        else if (code === 1) currentStyle.fontWeight = 'bold';
        else if (code === 30) currentStyle.color = '#000';
        else if (code === 31) currentStyle.color = '#ff5f56';
        else if (code === 32) currentStyle.color = '#27ca3f';
        else if (code === 33) currentStyle.color = '#ffbd2e';
        else if (code === 34) currentStyle.color = '#6eb4ff';
        else if (code === 35) currentStyle.color = '#ff79c6';
        else if (code === 36) currentStyle.color = '#8be9fd';
      }
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), style: { ...currentStyle } });
    }
    
    return parts;
  };

  return (
    <div 
      className={`browser-terminal ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: '#0f0f0f',
        color: '#e1e1e1',
        fontFamily: 'ui-monospace, "JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, monospace',
        fontSize: 'clamp(12px, 2.5vw, 14px)',
        lineHeight: '1.4',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.8)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        minHeight: '40px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27CA3F' }} />
          </div>
          <span style={{ color: '#e1e1e1', fontSize: '11px', fontWeight: '500' }}>
            Rust Terminal Forge
          </span>
        </div>
        <div style={{
          padding: '2px 8px',
          backgroundColor: 'rgba(255, 189, 46, 0.2)',
          border: '1px solid rgba(255, 189, 46, 0.4)',
          borderRadius: '4px',
          color: '#FFBD2E',
          fontSize: '10px',
          fontWeight: '600'
        }}>
          DEMO MODE
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{
          flex: 1,
          outline: 'none',
          position: 'relative'
        }}
      >
        <div
          ref={outputRef}
          style={{
            position: 'absolute',
            inset: 0,
            padding: '16px 20px',
            overflowY: 'auto',
            overflowX: 'hidden',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)'
          }}
        >
          {output.map((line, i) => (
            <div key={i}>
              {parseAnsi(line).map((part, j) => (
                <span key={j} style={part.style}>{part.text}</span>
              ))}
            </div>
          ))}
          
          {/* Current input line */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#27ca3f' }}>demo-user</span>
            <span style={{ color: '#e1e1e1' }}>@</span>
            <span style={{ color: '#8be9fd' }}>terminal</span>
            <span style={{ color: '#e1e1e1' }}>:</span>
            <span style={{ color: '#6eb4ff' }}>~</span>
            <span style={{ color: '#e1e1e1' }}>$ </span>
            <span>{currentInput}</span>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '16px',
              backgroundColor: '#00ff88',
              marginLeft: '1px',
              animation: 'blink 1s step-end infinite'
            }} />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
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
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#FFBD2E' }}>● DEMO</span>
          <span style={{ opacity: 0.6 }}>|</span>
          <span>Browser Terminal</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '9px' }}>
          <span style={{ opacity: 0.7 }}>^C Cancel</span>
          <span style={{ opacity: 0.7 }}>^L Clear</span>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .browser-terminal:focus-within {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(0, 255, 136, 0.2);
        }
      `}</style>
    </div>
  );
};
