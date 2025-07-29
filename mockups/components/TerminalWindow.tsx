import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface TerminalEntry {
  id: number;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

interface TerminalWindowProps {
  tabName: string;
  path: string;
}

const mockHistory: TerminalEntry[] = [
  {
    id: 1,
    type: 'command',
    content: 'cd ~/projects/terminal-ui',
    timestamp: new Date(Date.now() - 300000)
  },
  {
    id: 2,
    type: 'command',
    content: 'ls -la',
    timestamp: new Date(Date.now() - 280000)
  },
  {
    id: 3,
    type: 'output',
    content: `total 24
drwxr-xr-x  8 user staff  256 Jan 29 10:30 .
drwxr-xr-x  5 user staff  160 Jan 28 15:20 ..
-rw-r--r--  1 user staff   87 Jan 29 10:25 .gitignore
drwxr-xr-x  4 user staff  128 Jan 29 10:30 node_modules
-rw-r--r--  1 user staff 1024 Jan 29 10:28 package.json
drwxr-xr-x  3 user staff   96 Jan 29 10:30 src
-rw-r--r--  1 user staff  245 Jan 29 10:25 tsconfig.json`,
    timestamp: new Date(Date.now() - 275000)
  },
  {
    id: 4,
    type: 'command',
    content: 'npm run dev',
    timestamp: new Date(Date.now() - 120000)
  },
  {
    id: 5,
    type: 'output',
    content: `> terminal-ui@1.0.0 dev
> vite

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help`,
    timestamp: new Date(Date.now() - 115000)
  },
  {
    id: 6,
    type: 'command',
    content: 'git status',
    timestamp: new Date(Date.now() - 60000)
  },
  {
    id: 7,
    type: 'output',
    content: `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/components/Terminal.tsx
        modified:   src/components/FileExplorer.tsx

no changes added to commit (use "git add ." or "git commit -a")`,
    timestamp: new Date(Date.now() - 58000)
  }
];

export function TerminalWindow({ tabName, path }: TerminalWindowProps) {
  const [history, setHistory] = useState<TerminalEntry[]>(mockHistory);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = (command: string) => {
    const newEntry: TerminalEntry = {
      id: Date.now(),
      type: 'command',
      content: command,
      timestamp: new Date()
    };

    setHistory(prev => [...prev, newEntry]);
    setCommandHistory(prev => [...prev, command]);
    
    // Mock command responses
    setTimeout(() => {
      let response = '';
      let responseType: 'output' | 'error' = 'output';
      
      if (command.startsWith('ls')) {
        response = 'components  hooks  utils  App.tsx  index.tsx  styles.css';
      } else if (command.startsWith('pwd')) {
        response = path;
      } else if (command.startsWith('whoami')) {
        response = 'developer';
      } else if (command.startsWith('date')) {
        response = new Date().toString();
      } else if (command.startsWith('echo')) {
        response = command.substring(5);
      } else if (command === 'clear') {
        setHistory([]);
        return;
      } else if (command.trim() === '') {
        return;
      } else {
        response = `command not found: ${command.split(' ')[0]}`;
        responseType = 'error';
      }

      const responseEntry: TerminalEntry = {
        id: Date.now() + 1,
        type: responseType,
        content: response,
        timestamp: new Date()
      };

      setHistory(prev => [...prev, responseEntry]);
    }, 100 + Math.random() * 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCommand.trim()) {
      executeCommand(currentCommand.trim());
      setCurrentCommand('');
      setHistoryIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col transition-colors duration-200" style={{ backgroundColor: 'var(--theme-terminal)' }}>
      {/* Terminal Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm terminal-scrollbar"
      >
        {history.map((entry) => (
          <div key={entry.id} className="mb-2">
            {entry.type === 'command' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs hidden sm:inline" style={{ color: 'var(--theme-success)' }}>
                  {formatTimestamp(entry.timestamp)}
                </span>
                <span style={{ color: 'var(--theme-terminal-prompt)' }}>user@terminal</span>
                <span className="text-[var(--theme-text-muted)]">:</span>
                <span style={{ color: 'var(--theme-terminal-path)' }}>{path}</span>
                <span className="text-[var(--theme-text-muted)]">$</span>
                <span className="text-[var(--theme-text)]">{entry.content}</span>
              </div>
            ) : (
              <div className={`pl-4 sm:pl-20 whitespace-pre-wrap`}
                style={{ color: entry.type === 'error' ? 'var(--theme-terminal-error)' : 'var(--theme-terminal-output)' }}>
                {entry.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Command Input */}
      <div className="border-t p-4 transition-colors" style={{ borderColor: 'var(--theme-border)' }}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs hidden sm:inline" style={{ color: 'var(--theme-success)' }}>
              {formatTimestamp(new Date())}
            </span>
            <span className="text-sm" style={{ color: 'var(--theme-terminal-prompt)' }}>user@terminal</span>
            <span className="text-[var(--theme-text-muted)]">:</span>
            <span className="text-sm truncate max-w-32 sm:max-w-none" style={{ color: 'var(--theme-terminal-path)' }}>{path}</span>
            <span className="text-[var(--theme-text-muted)]">$</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none font-mono text-sm transition-colors"
            style={{ color: 'var(--theme-text)' }}
            placeholder="Type a command..."
            autoFocus
          />
          <ChevronRight className="w-4 h-4 text-[var(--theme-text-muted)]" />
        </form>
      </div>
    </div>
  );
}