# 🏗️ Technical Architecture

> Comprehensive architectural documentation for Rust Terminal Forge

## 🎯 Architectural Vision

**Rust Terminal Forge** follows **Screaming Architecture** principles - the codebase structure immediately communicates what the application does and how it's organized. The architecture emphasizes simplicity, maintainability, and seamless human-AI collaboration.

### Core Principles

- **KISS (Keep It Simple, Stupid)**: Every component has a clear, single responsibility
- **DRY (Don't Repeat Yourself)**: Shared functionality through smart abstractions
- **YAGNI (You Aren't Gonna Need It)**: Build only what's currently needed
- **SOLID Principles**: Maintainable object-oriented design
- **Mobile-First**: All components designed for touch and gesture interaction

## 🗺️ System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)              │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │   Home      │ │  Terminal   │ │   Commands  │ │   UI    │ │
│ │   (MVVM)    │ │ Components  │ │  (Command   │ │Components│ │
│ │             │ │             │ │  Pattern)   │ │         │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│                WebSocket Communication Layer                │
├─────────────────────────────────────────────────────────────┤
│                    Backend (Rust)                           │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│ │ HTTP Server │ │ PTY Server  │ │ WebSocket   │           │
│ │             │ │ (Real       │ │ Handler     │           │
│ │             │ │ Terminal)   │ │             │           │
│ └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 📂 Project Structure

### Directory Organization

```
rust-terminal-forge/
├── 🎯 Core Application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── RealTerminal.tsx  # Main terminal interface
│   │   │   ├── AnsiText.tsx      # ANSI color rendering
│   │   │   ├── MultiTabTerminal.tsx # Multi-tab system
│   │   │   ├── MobileTabBar.tsx  # Mobile-optimized tabs
│   │   │   └── ui/               # shadcn/ui components
│   │   │
│   │   ├── home/                 # 🏠 MVVM Module
│   │   │   ├── view.tsx          # React components
│   │   │   ├── viewModel.ts      # Business logic
│   │   │   ├── model.ts          # Data management
│   │   │   └── components/       # Module-specific components
│   │   │
│   │   ├── core/                 # 🧠 Business Logic
│   │   │   ├── commands/         # Command handling system
│   │   │   │   ├── BaseCommandHandler.ts
│   │   │   │   ├── FileSystemCommands.ts
│   │   │   │   ├── SystemCommands.ts
│   │   │   │   ├── RustCommands.ts
│   │   │   │   └── ClaudeCodeCommands.ts
│   │   │   ├── filesystem/       # Virtual file system
│   │   │   ├── tabManager.ts     # Tab state management
│   │   │   ├── gestureNavigation.ts # Touch gestures
│   │   │   ├── types.ts          # Core type definitions
│   │   │   ├── storage.ts        # Data persistence
│   │   │   └── validation.ts     # Input validation
│   │   │
│   │   ├── utils/                # 🛠️ Utilities
│   │   ├── hooks/                # React custom hooks
│   │   └── lib/                  # External library configs
│   │
│   ├── tests/                    # 🧪 Test Suite
│   │   ├── integration.test.ts   # End-to-end tests
│   │   ├── tab-management.test.ts # Tab functionality
│   │   ├── gesture-navigation-unit.test.ts
│   │   ├── mobile-tab-ui.test.tsx
│   │   └── secure-commands.test.ts
│   │
│   └── src-rust/                 # 🦀 Rust Backend
│       ├── server/               # HTTP API server
│       ├── pty-server/           # WebSocket PTY server
│       └── shared/               # Shared Rust code
│
├── 🤖 Autonomous System
│   ├── .github/workflows/        # CI/CD and autonomous development
│   │   ├── autonomous-development.yml
│   │   ├── codespace-development.yml
│   │   ├── quality-gates.yml
│   │   ├── self-healing-monitoring.yml
│   │   └── learning-feedback-loop.yml
│   │
│   ├── .claude/                  # Claude Code integration
│   │   ├── commands/             # Custom commands
│   │   ├── helpers/              # Helper functions
│   │   └── settings.json         # Configuration
│   │
│   └── memory/                   # Persistent AI memory
│
└── 📚 Documentation
    ├── README.md                 # Project overview
    ├── DEVELOPMENT.md            # Development guide
    ├── ARCHITECTURE.md           # This file
    ├── AI_INTEGRATION.md         # AI collaboration guide
    └── DEPLOYMENT.md             # Deployment options
```

## 🏛️ Architectural Patterns

### 1. MVVM (Model-View-ViewModel) Pattern

**Location**: `src/home/`

The MVVM pattern provides clear separation of concerns and enables efficient testing:

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│    View     │◄──►│   ViewModel     │◄──►│    Model    │
│ (view.tsx)  │    │ (viewModel.ts)  │    │ (model.ts)  │
└─────────────┘    └─────────────────┘    └─────────────┘
     │                       │                     │
  React UI              Business Logic       Data & State
 Components             & Presentation        Management
```

#### Model Layer
```typescript
// Pure data structures and state management
export interface HomeModel {
  readonly sessions: TerminalSession[];
  readonly currentUser: User | null;
  readonly settings: AppSettings;
}

export class HomeModelImpl implements HomeModel {
  private _sessions: TerminalSession[] = [];
  
  // Immutable access to prevent external mutations
  get sessions(): TerminalSession[] {
    return [...this._sessions];
  }
  
  // Controlled state mutations
  addSession(session: TerminalSession): void {
    this._sessions = [...this._sessions, session];
  }
  
  removeSession(sessionId: string): void {
    this._sessions = this._sessions.filter(s => s.id !== sessionId);
  }
}
```

#### ViewModel Layer
```typescript
// Business logic and presentation logic
export class HomeViewModel {
  private model: HomeModel;
  private observers: (() => void)[] = [];
  
  constructor(model: HomeModel) {
    this.model = model;
  }
  
  // Business operations
  async createTerminalSession(name?: string): Promise<void> {
    const session = await this.terminalService.createSession(name);
    this.model.addSession(session);
    this.notifyObservers();
  }
  
  // View-specific formatting
  getSessionDisplayName(session: TerminalSession): string {
    return session.name || `Terminal ${session.id.slice(0, 8)}`;
  }
  
  // Observer pattern for state changes
  onStateChange(callback: () => void): void {
    this.observers.push(callback);
  }
  
  private notifyObservers(): void {
    this.observers.forEach(callback => callback());
  }
}
```

#### View Layer
```typescript
// Pure UI rendering with no business logic
export const HomeView: React.FC = () => {
  const [viewModel] = useState(() => new HomeViewModel(new HomeModelImpl()));
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    viewModel.onStateChange(() => forceUpdate({}));
    return () => viewModel.cleanup();
  }, [viewModel]);
  
  return (
    <div className=\"home-container\">
      <header className=\"home-header\">
        <h1>Terminal Sessions</h1>
        <button onClick={() => viewModel.createTerminalSession()}>
          New Session
        </button>
      </header>
      
      <main className=\"sessions-grid\">
        {viewModel.getSessions().map(session => (
          <SessionCard 
            key={session.id}
            session={session}
            displayName={viewModel.getSessionDisplayName(session)}
            onActivate={() => viewModel.activateSession(session.id)}
          />
        ))}
      </main>
    </div>
  );
};
```

### 2. Command Pattern

**Location**: `src/core/commands/`

The Command pattern encapsulates terminal commands as objects, enabling extensibility, logging, and undo functionality:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ CommandInvoker  │───►│    Command      │───►│    Receiver     │
│ (Terminal)      │    │   Interface     │    │ (FileSystem)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Concrete Commands   │
                    │ - FileSystemCmd     │
                    │ - SystemCmd         │
                    │ - RustCmd           │
                    │ - ClaudeCodeCmd     │
                    └─────────────────────┘
```

#### Base Command Structure
```typescript
export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  shouldClearInput?: boolean;
  metadata?: Record<string, any>;
}

export abstract class BaseCommandHandler {
  abstract canHandle(command: string): boolean;
  abstract execute(command: string, args: string[]): Promise<CommandResult>;
  
  protected parseCommand(input: string): { command: string; args: string[] } {
    const parts = input.trim().split(/\\s+/);
    return {
      command: parts[0] || '',
      args: parts.slice(1)
    };
  }
  
  protected createResult(
    success: boolean, 
    output: string, 
    options: Partial<CommandResult> = {}
  ): CommandResult {
    return { success, output, ...options };
  }
}
```

#### Concrete Command Implementation
```typescript
export class FileSystemCommands extends BaseCommandHandler {
  canHandle(command: string): boolean {
    return ['ls', 'cd', 'pwd', 'mkdir', 'rm', 'cp', 'mv'].includes(command);
  }
  
  async execute(command: string, args: string[]): Promise<CommandResult> {
    try {
      switch (command) {
        case 'ls': return await this.handleLs(args);
        case 'cd': return await this.handleCd(args);
        case 'pwd': return await this.handlePwd();
        case 'mkdir': return await this.handleMkdir(args);
        default:
          return this.createResult(false, `Command '${command}' not implemented`);
      }
    } catch (error) {
      return this.createResult(false, `Error: ${error.message}`);
    }
  }
  
  private async handleLs(args: string[]): Promise<CommandResult> {
    const flags = this.parseFlags(args);
    const path = args.find(arg => !arg.startsWith('-')) || '.';
    
    const files = await this.fileSystem.listDirectory(path, flags);
    const output = this.formatFileList(files, flags);
    
    return this.createResult(true, output);
  }
}
```

#### Command Factory
```typescript
export class CommandFactory {
  private handlers: BaseCommandHandler[] = [
    new FileSystemCommands(),
    new SystemCommands(),
    new RustCommands(),
    new ClaudeCodeCommands(),
  ];
  
  findHandler(command: string): BaseCommandHandler | null {
    return this.handlers.find(handler => handler.canHandle(command)) || null;
  }
  
  registerHandler(handler: BaseCommandHandler): void {
    this.handlers.push(handler);
  }
  
  async executeCommand(input: string): Promise<CommandResult> {
    const { command } = this.parseInput(input);
    const handler = this.findHandler(command);
    
    if (!handler) {
      return { success: false, output: `Command not found: ${command}` };
    }
    
    return await handler.execute(command, this.parseArgs(input));
  }
}
```

### 3. Vertical Slice Architecture

**Principle**: Organize code by business features rather than technical layers.

```
Feature-Based Organization:
├── home/                    # Feature: Home Dashboard
│   ├── view.tsx            # UI Layer
│   ├── viewModel.ts        # Logic Layer  
│   ├── model.ts            # Data Layer
│   └── components/         # Feature Components
│
├── terminal/               # Feature: Terminal Operations
│   ├── components/
│   │   ├── RealTerminal.tsx
│   │   ├── MultiTabTerminal.tsx
│   │   └── MobileTabBar.tsx
│   ├── hooks/
│   │   ├── useTerminalState.ts
│   │   └── useWebSocket.ts
│   └── utils/
│       ├── ansiParser.ts
│       └── terminalHelpers.ts
│
└── commands/               # Feature: Command Execution
    ├── handlers/
    │   ├── FileSystemCommands.ts
    │   └── SystemCommands.ts
    ├── types.ts
    └── registry.ts
```

**Benefits for AI Agents**:
- **Locality**: All related code in one place
- **Independence**: Features can be modified without affecting others
- **Discoverability**: Easy to find all code related to a feature
- **Testability**: Each slice can be tested in isolation

### 4. Observer Pattern

**Usage**: State change notifications throughout the application

```typescript
// Generic Observer implementation
export class ObservableState<T> {
  private observers: ((state: T) => void)[] = [];
  private _state: T;
  
  constructor(initialState: T) {
    this._state = initialState;
  }
  
  get state(): T {
    return this._state;
  }
  
  setState(newState: T): void {
    this._state = newState;
    this.notifyObservers();
  }
  
  subscribe(observer: (state: T) => void): () => void {
    this.observers.push(observer);
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }
  
  private notifyObservers(): void {
    this.observers.forEach(observer => observer(this._state));
  }
}

// Usage in ViewModels
export class TerminalViewModel {
  private sessionState = new ObservableState<TerminalSession[]>([]);
  
  onSessionsChange(callback: (sessions: TerminalSession[]) => void): () => void {
    return this.sessionState.subscribe(callback);
  }
  
  addSession(session: TerminalSession): void {
    const currentSessions = this.sessionState.state;
    this.sessionState.setState([...currentSessions, session]);
  }
}
```

### 5. Factory Pattern

**Location**: Command creation and UI component instantiation

```typescript
// UI Component Factory
export class ComponentFactory {
  static createTerminal(type: 'single' | 'multi'): React.ComponentType {
    switch (type) {
      case 'single':
        return RealTerminal;
      case 'multi':
        return MultiTabTerminal;
      default:
        throw new Error(`Unknown terminal type: ${type}`);
    }
  }
  
  static createTabBar(platform: 'desktop' | 'mobile'): React.ComponentType {
    return platform === 'mobile' ? MobileTabBar : DesktopTabBar;
  }
}

// Service Factory
export class ServiceFactory {
  private static instances = new Map<string, any>();
  
  static getWebSocketService(): WebSocketService {
    if (!this.instances.has('websocket')) {
      this.instances.set('websocket', new WebSocketService());
    }
    return this.instances.get('websocket');
  }
  
  static getStorageService(): StorageService {
    if (!this.instances.has('storage')) {
      this.instances.set('storage', new LocalStorageService());
    }
    return this.instances.get('storage');
  }
}
```

## 📱 Mobile Architecture

### Touch and Gesture System

The mobile architecture is built around a comprehensive gesture recognition system:

```typescript
// Gesture Handler Architecture
export class GestureHandler {
  private element: HTMLElement;
  private config: GestureConfig;
  private state: GestureState;
  
  constructor(element: HTMLElement, config: GestureConfig) {
    this.element = element;
    this.config = { ...defaultGestureConfig, ...config };
    this.state = this.createInitialState();
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Passive listeners for performance
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: true });
  }
  
  private handleTouchStart = (event: TouchEvent) => {
    // Prevent default for controlled interactions
    if (this.shouldPreventDefault(event)) {
      event.preventDefault();
    }
    
    this.state = {
      ...this.state,
      startX: event.touches[0].clientX,
      startY: event.touches[0].clientY,
      startTime: Date.now(),
      isTracking: true
    };
  };
  
  private handleTouchMove = (event: TouchEvent) => {
    if (!this.state.isTracking) return;
    
    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    
    const deltaX = currentX - this.state.startX;
    const deltaY = currentY - this.state.startY;
    
    // Detect scroll vs swipe intent
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > this.config.scrollThreshold) {
      this.state.isScrolling = true;
      return; // Allow native scrolling
    }
    
    if (Math.abs(deltaX) > this.config.swipeThreshold) {
      event.preventDefault(); // Prevent horizontal scroll
      this.state.currentX = currentX;
      this.state.currentY = currentY;
    }
  };
  
  private handleTouchEnd = (event: TouchEvent) => {
    if (!this.state.isTracking || this.state.isScrolling) {
      this.resetState();
      return;
    }
    
    const gesture = this.analyzeGesture();
    if (gesture) {
      this.executeGesture(gesture);
    }
    
    this.resetState();
  };
  
  private analyzeGesture(): Gesture | null {
    const deltaX = this.state.currentX - this.state.startX;
    const deltaY = this.state.currentY - this.state.startY;
    const deltaTime = Date.now() - this.state.startTime;
    
    // Swipe detection
    if (Math.abs(deltaX) > this.config.swipeThreshold && deltaTime < this.config.maxSwipeTime) {
      return {
        type: 'swipe',
        direction: deltaX > 0 ? 'right' : 'left',
        velocity: Math.abs(deltaX) / deltaTime,
        distance: Math.abs(deltaX)
      };
    }
    
    // Tap detection
    if (Math.abs(deltaX) < this.config.tapThreshold && 
        Math.abs(deltaY) < this.config.tapThreshold &&
        deltaTime < this.config.maxTapTime) {
      return {
        type: 'tap',
        x: this.state.startX,
        y: this.state.startY
      };
    }
    
    // Long press detection
    if (deltaTime > this.config.longPressTime &&
        Math.abs(deltaX) < this.config.tapThreshold &&
        Math.abs(deltaY) < this.config.tapThreshold) {
      return {
        type: 'longpress',
        x: this.state.startX,
        y: this.state.startY
      };
    }
    
    return null;
  }
}
```

### Mobile Component Patterns

```typescript
// Mobile-optimized component with gesture support
export const MobileTabBar: React.FC<MobileTabBarProps> = ({ 
  tabs, 
  activeTabId, 
  onTabChange,
  onTabClose,
  onTabReorder 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gestureHandler, setGestureHandler] = useState<GestureHandler | null>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      const handler = new GestureHandler(containerRef.current, {
        onSwipeLeft: () => navigateToNextTab(),
        onSwipeRight: () => navigateToPreviousTab(),
        onLongPress: (x, y) => showContextMenu(x, y),
        enableHapticFeedback: true
      });
      
      setGestureHandler(handler);
      
      return () => handler.destroy();
    }
  }, []);
  
  const navigateToNextTab = useCallback(() => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    onTabChange(tabs[nextIndex].id);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [tabs, activeTabId, onTabChange]);
  
  return (
    <div 
      ref={containerRef}
      className=\"mobile-tab-bar\"
      style={{
        touchAction: 'pan-y', // Allow vertical scrolling
        WebkitTouchCallout: 'none', // Disable iOS callout
        WebkitUserSelect: 'none', // Disable text selection
        userSelect: 'none'
      }}
    >
      <div className=\"tab-container\">
        {tabs.map((tab, index) => (
          <MobileTab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onActivate={() => onTabChange(tab.id)}
            onClose={() => onTabClose(tab.id)}
            style={{
              minWidth: '44px', // WCAG AA touch target
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

## 🔄 Data Flow Architecture

### Unidirectional Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Action    │───►│    State    │───►│    View     │
│             │    │   Update    │    │   Render    │
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                                     │
       │                                     │
       └─────────────────────────────────────┘
                  User Interaction
```

### State Management Pattern

```typescript
// Central State Store
export class ApplicationState {
  private static instance: ApplicationState;
  private state: AppState;
  private reducers: Map<string, StateReducer> = new Map();
  private observers: Map<string, StateObserver[]> = new Map();
  
  private constructor() {
    this.state = this.createInitialState();
    this.registerReducers();
  }
  
  static getInstance(): ApplicationState {
    if (!ApplicationState.instance) {
      ApplicationState.instance = new ApplicationState();
    }
    return ApplicationState.instance;
  }
  
  dispatch(action: Action): void {
    const reducer = this.reducers.get(action.type);
    if (reducer) {
      const newState = reducer(this.state, action);
      if (newState !== this.state) {
        this.state = newState;
        this.notifyObservers(action.type);
      }
    }
  }
  
  subscribe(actionType: string, observer: StateObserver): () => void {
    if (!this.observers.has(actionType)) {
      this.observers.set(actionType, []);
    }
    
    this.observers.get(actionType)!.push(observer);
    
    return () => {
      const observers = this.observers.get(actionType);
      if (observers) {
        const index = observers.indexOf(observer);
        if (index > -1) {
          observers.splice(index, 1);
        }
      }
    };
  }
  
  getState(): AppState {
    return { ...this.state }; // Return immutable copy
  }
}

// Action Types and Creators
export enum ActionType {
  ADD_TERMINAL_SESSION = 'ADD_TERMINAL_SESSION',
  REMOVE_TERMINAL_SESSION = 'REMOVE_TERMINAL_SESSION',
  UPDATE_SESSION_STATE = 'UPDATE_SESSION_STATE',
  SET_ACTIVE_SESSION = 'SET_ACTIVE_SESSION'
}

export const createAction = {
  addTerminalSession: (session: TerminalSession): Action => ({
    type: ActionType.ADD_TERMINAL_SESSION,
    payload: session
  }),
  
  removeTerminalSession: (sessionId: string): Action => ({
    type: ActionType.REMOVE_TERMINAL_SESSION,
    payload: { sessionId }
  }),
  
  updateSessionState: (sessionId: string, updates: Partial<TerminalSession>): Action => ({
    type: ActionType.UPDATE_SESSION_STATE,
    payload: { sessionId, updates }
  })
};

// State Reducers
export const terminalReducer: StateReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case ActionType.ADD_TERMINAL_SESSION:
      return {
        ...state,
        terminal: {
          ...state.terminal,
          sessions: [...state.terminal.sessions, action.payload]
        }
      };
      
    case ActionType.REMOVE_TERMINAL_SESSION:
      return {
        ...state,
        terminal: {
          ...state.terminal,
          sessions: state.terminal.sessions.filter(
            session => session.id !== action.payload.sessionId
          )
        }
      };
      
    case ActionType.UPDATE_SESSION_STATE:
      return {
        ...state,
        terminal: {
          ...state.terminal,
          sessions: state.terminal.sessions.map(session =>
            session.id === action.payload.sessionId
              ? { ...session, ...action.payload.updates }
              : session
          )
        }
      };
      
    default:
      return state;
  }
};
```

## 🔌 WebSocket Architecture

### Real-time Communication

```typescript
// WebSocket Service Architecture
export class WebSocketService {
  private connections: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  async createConnection(sessionId: string): Promise<WebSocket> {
    const ws = new WebSocket(`ws://localhost:8081/terminal/${sessionId}`);
    
    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        console.log(`WebSocket connected for session ${sessionId}`);
        this.connections.set(sessionId, ws);
        this.reconnectAttempts.set(sessionId, 0);
        resolve(ws);
      };
      
      ws.onerror = (error) => {
        console.error(`WebSocket error for session ${sessionId}:`, error);
        reject(error);
      };
      
      ws.onclose = (event) => {
        console.log(`WebSocket closed for session ${sessionId}:`, event.code);
        this.handleConnectionClose(sessionId, event);
      };
      
      ws.onmessage = (event) => {
        this.handleMessage(sessionId, event.data);
      };
    });
  }
  
  private async handleConnectionClose(sessionId: string, event: CloseEvent): Promise<void> {
    this.connections.delete(sessionId);
    
    // Attempt reconnection for non-intentional closes
    if (event.code !== 1000 && event.code !== 1001) {
      const attempts = this.reconnectAttempts.get(sessionId) || 0;
      
      if (attempts < this.maxReconnectAttempts) {
        console.log(`Attempting to reconnect session ${sessionId} (attempt ${attempts + 1})`);
        this.reconnectAttempts.set(sessionId, attempts + 1);
        
        setTimeout(() => {
          this.createConnection(sessionId).catch(error => {
            console.error(`Reconnection failed for session ${sessionId}:`, error);
          });
        }, this.reconnectDelay * Math.pow(2, attempts)); // Exponential backoff
      } else {
        console.error(`Max reconnection attempts reached for session ${sessionId}`);
        // Notify UI of permanent disconnection
        ApplicationState.getInstance().dispatch({
          type: ActionType.SESSION_DISCONNECTED,
          payload: { sessionId }
        });
      }
    }
  }
  
  sendCommand(sessionId: string, command: string): void {
    const ws = this.connections.get(sessionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'command',
        data: command
      }));
    } else {
      console.error(`WebSocket not available for session ${sessionId}`);
    }
  }
  
  private handleMessage(sessionId: string, data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'output':
          this.handleTerminalOutput(sessionId, message.data);
          break;
        case 'error':
          this.handleTerminalError(sessionId, message.data);
          break;
        case 'status':
          this.handleStatusUpdate(sessionId, message.data);
          break;
      }
    } catch (error) {
      console.error(`Failed to parse WebSocket message for session ${sessionId}:`, error);
    }
  }
  
  closeConnection(sessionId: string): void {
    const ws = this.connections.get(sessionId);
    if (ws) {
      ws.close(1000, 'Session closed by user');
      this.connections.delete(sessionId);
    }
  }
  
  cleanup(): void {
    this.connections.forEach((ws, sessionId) => {
      ws.close(1001, 'Application shutdown');
    });
    this.connections.clear();
    this.reconnectAttempts.clear();
  }
}
```

## 🧪 Testing Architecture

### Test Pyramid Structure

```
         ┌─────────────────┐
         │   E2E Tests     │  ← Few, expensive, high confidence
         │   (Playwright)  │
         └─────────────────┘
        ┌─────────────────────┐
        │ Integration Tests   │  ← Some, moderate cost, good confidence
        │   (React Testing)   │
        └─────────────────────┘
      ┌─────────────────────────┐
      │     Unit Tests          │  ← Many, cheap, fast feedback
      │     (Vitest)            │
      └─────────────────────────┘
```

### Test Organization

```typescript
// Unit Test Example
describe('TerminalViewModel', () => {
  let viewModel: TerminalViewModel;
  let mockModel: jest.Mocked<TerminalModel>;
  
  beforeEach(() => {
    mockModel = createMockModel();
    viewModel = new TerminalViewModel(mockModel);
  });
  
  describe('session management', () => {
    it('should create new session with unique ID', async () => {
      const sessionName = 'Test Session';
      
      await viewModel.createSession(sessionName);
      
      expect(mockModel.addSession).toHaveBeenCalledWith(
        expect.objectContaining({
          name: sessionName,
          id: expect.any(String),
          createdAt: expect.any(Date)
        })
      );
    });
    
    it('should handle session creation errors gracefully', async () => {
      mockModel.addSession.mockRejectedValue(new Error('Network error'));
      
      const result = await viewModel.createSession('Test');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });
});

// Integration Test Example
describe('Terminal Integration', () => {
  it('should create session and establish WebSocket connection', async () => {
    render(<MultiTabTerminal />);
    
    // Create new session
    const newTabButton = screen.getByRole('button', { name: /new session/i });
    fireEvent.click(newTabButton);
    
    // Wait for session to be created
    await waitFor(() => {
      expect(screen.getByText(/session \d+/i)).toBeInTheDocument();
    });
    
    // Verify WebSocket connection
    await waitFor(() => {
      expect(mockWebSocketService.createConnection).toHaveBeenCalled();
    });
    
    // Test command execution
    const terminalInput = screen.getByRole('textbox');
    fireEvent.change(terminalInput, { target: { value: 'ls' } });
    fireEvent.keyDown(terminalInput, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/file1.txt/i)).toBeInTheDocument();
    });
  });
});
```

## 🚀 Performance Architecture

### Optimization Strategies

1. **Component Memoization**
```typescript
export const TerminalTab = React.memo<TerminalTabProps>(({ 
  session, 
  isActive, 
  onActivate 
}) => {
  const displayName = useMemo(() => 
    session.name || `Session ${session.id.slice(0, 8)}`,
    [session.name, session.id]
  );
  
  const handleClick = useCallback(() => {
    onActivate(session.id);
  }, [onActivate, session.id]);
  
  return (
    <button
      className={`terminal-tab ${isActive ? 'active' : ''}`}
      onClick={handleClick}
    >
      {displayName}
    </button>
  );
});
```

2. **Virtual Scrolling for Terminal Output**
```typescript
export const VirtualTerminalOutput: React.FC<Props> = ({ lines }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = useCallback(
    throttle((event: Event) => {
      const element = event.target as HTMLDivElement;
      const scrollTop = element.scrollTop;
      const itemHeight = 20; // Line height
      const containerHeight = element.clientHeight;
      
      const start = Math.floor(scrollTop / itemHeight);
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const end = Math.min(start + visibleCount + 10, lines.length); // Buffer
      
      setVisibleRange({ start, end });
    }, 16), // ~60fps
    [lines.length]
  );
  
  const visibleLines = useMemo(() => 
    lines.slice(visibleRange.start, visibleRange.end),
    [lines, visibleRange]
  );
  
  return (
    <div
      ref={containerRef}
      className=\"terminal-output\"
      onScroll={handleScroll}
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div style={{ height: visibleRange.start * 20 }} /> {/* Top spacer */}
      {visibleLines.map((line, index) => (
        <TerminalLine 
          key={visibleRange.start + index}
          content={line}
        />
      ))}
      <div style={{ height: (lines.length - visibleRange.end) * 20 }} /> {/* Bottom spacer */}
    </div>
  );
};
```

3. **Bundle Splitting and Lazy Loading**
```typescript
// Dynamic imports for code splitting
const LazyTerminalSettings = lazy(() => import('./TerminalSettings'));
const LazyFileManager = lazy(() => import('./FileManager'));

export const MainApplication: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path=\"/\" element={<Terminal />} />
          <Route 
            path=\"/settings\" 
            element={<LazyTerminalSettings />} 
          />
          <Route 
            path=\"/files\" 
            element={<LazyFileManager />} 
          />
        </Routes>
      </Suspense>
    </Router>
  );
};
```

## 🔐 Security Architecture

### Input Validation and Sanitization

```typescript
// Command Input Sanitization
export class CommandValidator {
  private dangerousPatterns: RegExp[] = [
    /rm\s+-rf\s+\//, // Destructive file operations
    /sudo\s+/, // Privilege escalation
    /curl\s+.*\|\s*sh/, // Remote script execution
    /wget\s+.*\|\s*sh/,
    /eval\s*\(/,  // Code evaluation
    /exec\s*\(/
  ];
  
  validateCommand(command: string): ValidationResult {
    // Check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(command)) {
        return {
          isValid: false,
          reason: 'Command contains potentially dangerous operations',
          severity: 'high'
        };
      }
    }
    
    // Check command length
    if (command.length > 1000) {
      return {
        isValid: false,
        reason: 'Command exceeds maximum length',
        severity: 'medium'
      };
    }
    
    // Validate character set
    if (!/^[\x20-\x7E\n\r\t]*$/.test(command)) {
      return {
        isValid: false,
        reason: 'Command contains invalid characters',
        severity: 'medium'
      };
    }
    
    return { isValid: true };
  }
}

// XSS Prevention for Terminal Output
export class OutputSanitizer {
  private allowedTags = ['span', 'div'];
  private allowedAttributes = ['class', 'style'];
  
  sanitizeOutput(output: string): string {
    // Parse ANSI codes safely
    const ansiSegments = this.parseAnsiCodes(output);
    
    // Convert to safe HTML
    return ansiSegments
      .map(segment => this.segmentToHtml(segment))
      .join('');
  }
  
  private segmentToHtml(segment: AnsiSegment): string {
    const safeText = this.escapeHtml(segment.text);
    
    if (segment.styles.length === 0) {
      return safeText;
    }
    
    const styleString = segment.styles
      .map(style => this.styleToCSS(style))
      .filter(Boolean)
      .join('; ');
    
    return `<span style=\"${styleString}\">${safeText}</span>`;
  }
  
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
```

### Session Security

```typescript
// Secure Session Management
export class SessionManager {
  private sessions: Map<string, SecureSession> = new Map();
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  
  createSession(userId: string): SecureSession {
    const sessionId = this.generateSecureId();
    const session: SecureSession = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      isActive: true,
      permissions: this.getUserPermissions(userId)
    };
    
    this.sessions.set(sessionId, session);
    this.scheduleSessionCleanup(sessionId);
    
    return session;
  }
  
  validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return false;
    }
    
    // Check session timeout
    const now = new Date();
    const timeSinceLastAccess = now.getTime() - session.lastAccessedAt.getTime();
    
    if (timeSinceLastAccess > this.sessionTimeout) {
      this.invalidateSession(sessionId);
      return false;
    }
    
    // Update last accessed time
    session.lastAccessedAt = now;
    
    return true;
  }
  
  private generateSecureId(): string {
    // Use crypto.getRandomValues for secure random generation
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  private scheduleSessionCleanup(sessionId: string): void {
    setTimeout(() => {
      const session = this.sessions.get(sessionId);
      if (session) {
        const timeSinceLastAccess = Date.now() - session.lastAccessedAt.getTime();
        if (timeSinceLastAccess >= this.sessionTimeout) {
          this.invalidateSession(sessionId);
        } else {
          // Reschedule cleanup
          this.scheduleSessionCleanup(sessionId);
        }
      }
    }, this.sessionTimeout);
  }
}
```

## 📊 Monitoring and Observability

### Performance Monitoring

```typescript
// Performance Metrics Collection
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  
  measureOperation<T>(operation: string, fn: () => T | Promise<T>): T | Promise<T> {
    const startTime = performance.now();
    
    const recordMetric = (duration: number, success: boolean, error?: Error) => {
      const metric: PerformanceMetric = {
        operation,
        duration,
        success,
        timestamp: new Date(),
        error: error?.message,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      this.addMetric(operation, metric);
    };
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result
          .then(value => {
            recordMetric(performance.now() - startTime, true);
            return value;
          })
          .catch(error => {
            recordMetric(performance.now() - startTime, false, error);
            throw error;
          });
      } else {
        recordMetric(performance.now() - startTime, true);
        return result;
      }
    } catch (error) {
      recordMetric(performance.now() - startTime, false, error as Error);
      throw error;
    }
  }
  
  getMetrics(operation: string): PerformanceMetric[] {
    return this.metrics.get(operation) || [];
  }
  
  getAverageResponseTime(operation: string): number {
    const metrics = this.getMetrics(operation);
    if (metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / metrics.length;
  }
  
  getSuccessRate(operation: string): number {
    const metrics = this.getMetrics(operation);
    if (metrics.length === 0) return 0;
    
    const successful = metrics.filter(metric => metric.success).length;
    return successful / metrics.length;
  }
}

// Usage in components
export const usePerformanceMonitoring = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  
  const measureRender = useCallback((renderFn: () => void) => {
    monitor.measureOperation(`${componentName}:render`, renderFn);
  }, [componentName, monitor]);
  
  const measureAsyncOperation = useCallback(<T>(
    operationName: string, 
    asyncFn: () => Promise<T>
  ) => {
    return monitor.measureOperation(`${componentName}:${operationName}`, asyncFn);
  }, [componentName, monitor]);
  
  return { measureRender, measureAsyncOperation };
};
```

---

## 🎯 Architectural Benefits

### For Human Developers
- **Clear Structure**: Screaming architecture makes navigation intuitive
- **Separation of Concerns**: Each layer has well-defined responsibilities
- **Testability**: Components can be tested in isolation
- **Maintainability**: Changes to one area don't cascade to others
- **Scalability**: New features follow established patterns

### For AI Agents
- **Predictable Patterns**: Consistent structures across all modules
- **Self-Documenting Code**: Architecture explains itself
- **Safe Modifications**: Clear boundaries prevent unintended side effects
- **Context Understanding**: Easy to determine what code does and why
- **Extension Points**: Clear places to add new functionality

### For Collaboration
- **Shared Vocabulary**: Common patterns and terms across team
- **Onboarding Speed**: New contributors understand structure quickly
- **Code Reviews**: Architectural patterns guide review criteria
- **Documentation**: Architecture serves as living documentation
- **Evolution**: Structure supports growth and change

This architecture enables **Rust Terminal Forge** to be a truly collaborative codebase where human creativity and AI intelligence work together to create exceptional software.