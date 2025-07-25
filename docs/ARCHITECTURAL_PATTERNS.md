# Architectural Patterns Reference

## 🏗️ Core Architectural Principles

This document serves as a reference for maintaining consistent architectural patterns throughout the Rust Terminal Forge codebase. It's designed to help both humans and AI agents understand and follow the established patterns.

## 📐 Design Patterns in Use

### 1. MVVM (Model-View-ViewModel) Pattern

**Location**: `src/home/`

The MVVM pattern provides clear separation of concerns:

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│    View     │◄──►│   ViewModel     │◄──►│    Model    │
│ (view.tsx)  │    │ (viewModel.ts)  │    │ (model.ts)  │
└─────────────┘    └─────────────────┘    └─────────────┘
     │                       │                     │
     │                       │                     │
   React               Business Logic         Data & State
 Components            & Presentation          Management
```

#### Implementation Guidelines

**Model (`model.ts`)**
```typescript
// ✅ Pure data structures and state
export interface HomeModel {
  readonly sessions: TerminalSession[];
  readonly currentUser: User | null;
  readonly currentPath: string;
}

export class HomeModelImpl implements HomeModel {
  private _sessions: TerminalSession[] = [];
  private _currentUser: User | null = null;
  private _currentPath: string = '/';
  
  // Pure getters and setters
  get sessions(): TerminalSession[] {
    return [...this._sessions];
  }
  
  addSession(session: TerminalSession): void {
    this._sessions = [...this._sessions, session];
  }
}
```

**ViewModel (`viewModel.ts`)**
```typescript
// ✅ Business logic and presentation logic
export class HomeViewModel {
  private model: HomeModel;
  private stateChangeCallbacks: (() => void)[] = [];
  
  constructor() {
    this.model = new HomeModelImpl();
  }
  
  // Business logic methods
  async createNewSession(): Promise<void> {
    const newSession = await this.sessionService.create();
    this.model.addSession(newSession);
    this.notifyStateChange();
  }
  
  // View-specific helpers
  getSessionDisplayName(session: TerminalSession): string {
    return session.name || `Session ${session.id.slice(0, 8)}`;
  }
}
```

**View (`view.tsx`)**
```typescript
// ✅ Pure UI rendering
export const HomeView: React.FC = () => {
  const [viewModel] = useState(() => new HomeViewModel());
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    viewModel.onStateChange(() => forceUpdate({}));
  }, [viewModel]);
  
  return (
    <div>
      {viewModel.getSessions().map(session => (
        <SessionTab key={session.id} session={session} />
      ))}
    </div>
  );
};
```

### 2. Command Pattern

**Location**: `src/core/commands/`

The Command pattern encapsulates requests as objects, allowing for parameterization, queuing, and logging.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CommandInvoker│───►│    Command      │───►│    Receiver     │
│                 │    │   Interface     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Concrete Commands   │
                    │ - FileSystemCmd     │
                    │ - SystemCmd         │
                    │ - RustCmd           │
                    └─────────────────────┘
```

#### Base Command Structure
```typescript
// ✅ Command interface
export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  shouldClearInput?: boolean;
}

export abstract class BaseCommandHandler {
  abstract canHandle(command: string): boolean;
  abstract execute(command: string, args: string[]): Promise<CommandResult>;
  
  protected parseCommand(input: string): { command: string; args: string[] } {
    const parts = input.trim().split(/\s+/);
    return {
      command: parts[0] || '',
      args: parts.slice(1)
    };
  }
}
```

#### Concrete Command Implementation
```typescript
// ✅ Specific command handler
export class FileSystemCommands extends BaseCommandHandler {
  canHandle(command: string): boolean {
    return ['ls', 'cd', 'pwd', 'mkdir', 'rm'].includes(command);
  }
  
  async execute(command: string, args: string[]): Promise<CommandResult> {
    switch (command) {
      case 'ls':
        return this.handleLs(args);
      case 'cd':
        return this.handleCd(args);
      default:
        return { success: false, output: 'Command not found' };
    }
  }
  
  private async handleLs(args: string[]): Promise<CommandResult> {
    // Implementation following KISS principle
  }
}
```

### 3. Vertical Slice Architecture

**Principle**: Organize code by business features rather than technical layers.

```
src/
├── home/                    # Feature: Home/Dashboard
│   ├── view.tsx            # UI Layer
│   ├── viewModel.ts        # Logic Layer
│   ├── model.ts            # Data Layer
│   └── components/         # Feature Components
│
├── terminal/               # Feature: Terminal Operations
│   ├── components/         
│   ├── hooks/
│   └── utils/
│
└── commands/               # Feature: Command Execution
    ├── handlers/
    ├── types.ts
    └── registry.ts
```

#### Benefits for AI Agents
- **Locality**: All related code is in one place
- **Independence**: Features can be modified without affecting others
- **Discoverability**: Easy to find all code related to a feature

### 4. Factory Pattern

**Location**: `src/core/commands/`

Used for creating command handlers dynamically.

```typescript
// ✅ Command factory
export class CommandFactory {
  private handlers: BaseCommandHandler[] = [
    new FileSystemCommands(),
    new SystemCommands(),
    new RustCommands(),
  ];
  
  createHandler(command: string): BaseCommandHandler | null {
    return this.handlers.find(handler => handler.canHandle(command)) || null;
  }
  
  registerHandler(handler: BaseCommandHandler): void {
    this.handlers.push(handler);
  }
}
```

### 5. Observer Pattern

**Usage**: State change notifications in ViewModels

```typescript
// ✅ Observer implementation
export class HomeViewModel {
  private observers: (() => void)[] = [];
  
  onStateChange(callback: () => void): void {
    this.observers.push(callback);
  }
  
  private notifyStateChange(): void {
    this.observers.forEach(callback => callback());
  }
  
  // Business methods that trigger notifications
  async updateSession(sessionId: string, updates: Partial<TerminalSession>): Promise<void> {
    // Update logic
    this.notifyStateChange(); // Notify observers
  }
}
```

## 🎯 Screaming Architecture Implementation

The codebase structure should immediately tell you what the application does:

```
rust-terminal-forge/                    # "I'm a Rust Terminal application"
├── src/
│   ├── components/
│   │   ├── RealTerminal.tsx           # "I handle real terminal interactions"
│   │   ├── AnsiText.tsx               # "I render ANSI colored text"
│   │   └── ui/                        # "I'm reusable UI components"
│   ├── home/                          # "I manage the home screen"
│   ├── core/
│   │   ├── commands/                  # "I execute terminal commands"
│   │   ├── filesystem/                # "I manage file operations"
│   │   └── types.ts                   # "I define core types"
│   └── utils/                         # "I'm utility functions"
├── src-rust/                          # "I'm the Rust backend"
│   ├── pty-server/                    # "I manage PTY sessions"
│   └── server/                        # "I'm the HTTP server"
└── deployment/                        # "I handle deployment"
```

## 🔧 Anti-Patterns to Avoid

### ❌ God Objects
```typescript
// DON'T: Massive objects that do everything
class TerminalEverything {
  renderUI() { }
  handleCommands() { }
  manageState() { }
  processFiles() { }
  handleNetworking() { }
  // ... 50 more methods
}
```

### ❌ Tight Coupling
```typescript
// DON'T: Components that directly depend on concrete implementations
class TerminalView {
  private fileSystem = new ConcreteFileSystem(); // Tight coupling
  private commandProcessor = new SpecificProcessor(); // Hard to test
}
```

### ❌ Leaky Abstractions
```typescript
// DON'T: Abstractions that expose implementation details
interface FileSystem {
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
  // ❌ Exposing internal SQL queries
  executeRawSQLQuery(query: string): any;
}
```

## ✅ Patterns to Follow

### Single Responsibility Principle
```typescript
// ✅ Each class has one reason to change
class AnsiColorParser {
  parseAnsiCodes(text: string): AnsiSegment[] {
    // Only responsible for ANSI parsing
  }
}

class TerminalRenderer {
  renderSegments(segments: AnsiSegment[]): JSX.Element {
    // Only responsible for rendering
  }
}
```

### Dependency Injection
```typescript
// ✅ Inject dependencies for flexibility
class CommandProcessor {
  constructor(
    private fileSystem: FileSystemInterface,
    private logger: LoggerInterface
  ) {}
  
  async processCommand(command: string): Promise<CommandResult> {
    this.logger.info('Processing command', { command });
    // Use injected dependencies
  }
}
```

### Interface Segregation
```typescript
// ✅ Small, focused interfaces
interface TerminalOutput {
  write(text: string): void;
  clear(): void;
}

interface TerminalInput {
  onInput(callback: (input: string) => void): void;
  setPrompt(prompt: string): void;
}

// Rather than one large TerminalInterface
```

## 🧩 Component Composition Patterns

### Higher-Order Components (HOCs)
```typescript
// ✅ Reusable behavior composition
const withTerminalConnection = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => {
    const [isConnected, setIsConnected] = useState(false);
    
    return (
      <Component 
        {...props} 
        isConnected={isConnected}
        onConnect={() => setIsConnected(true)}
      />
    );
  };
};
```

### Custom Hooks for Logic Reuse
```typescript
// ✅ Reusable stateful logic
export const useTerminalSession = () => {
  const [session, setSession] = useState<TerminalSession | null>(null);
  
  const createSession = useCallback(async () => {
    const newSession = await sessionService.create();
    setSession(newSession);
  }, []);
  
  const closeSession = useCallback(() => {
    if (session) {
      sessionService.close(session.id);
      setSession(null);
    }
  }, [session]);
  
  return { session, createSession, closeSession };
};
```

## 📏 Metrics and Guidelines

### Code Quality Metrics
- **Cyclomatic Complexity**: < 10 per function
- **File Length**: < 300 lines per file
- **Function Length**: < 50 lines per function
- **Class Responsibilities**: 1 primary responsibility per class

### Naming Conventions
```typescript
// ✅ Clear, descriptive names
const isUserAuthenticated = checkAuthentication();
const terminalSessionManager = new TerminalSessionManager();
const handleCommandExecution = async (command: string) => { };

// Components use PascalCase
const TerminalDisplay: React.FC = () => { };

// Hooks use camelCase with 'use' prefix
const useTerminalState = () => { };

// Constants use SCREAMING_SNAKE_CASE
const DEFAULT_TERMINAL_COLUMNS = 80;
```

### Error Handling Patterns
```typescript
// ✅ Consistent error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

const processCommand = async (command: string): Promise<Result<string>> => {
  try {
    const output = await executeCommand(command);
    return { success: true, data: output };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
};
```

---

**Remember**: These patterns exist to make the codebase more maintainable, testable, and understandable for both humans and AI agents. When in doubt, choose the simpler, more explicit approach that clearly communicates intent! 🎯✨