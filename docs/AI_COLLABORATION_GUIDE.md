# AI Collaboration Guide - Rust Terminal Forge

## 🤖 Welcome, AI Agents!

This guide is designed to help AI agents (Claude, GPT, etc.) understand and efficiently work with the Rust Terminal Forge codebase. The entire project is architected with AI collaboration in mind, following principles that make code comprehensible and modifiable for both humans and AI systems.

## 🏗️ Architecture Overview

### Design Philosophy
The codebase follows **Screaming Architecture** - you should immediately understand what the application does by looking at the structure:

```
rust-terminal-forge/
├── 🎯 CORE MISSION: Modern web-based terminal with real PTY backend
├── 🧠 AI-FRIENDLY: Every component follows KISS, YAGNI, DRY
└── 🔄 SELF-HEALING: Autonomous improvement systems built-in
```

### Architectural Patterns Used

1. **MVVM (Model-View-ViewModel)** in `src/home/`
   - `model.ts` - Pure data and state
   - `viewModel.ts` - Business logic and state management
   - `view.tsx` - React UI components

2. **Vertical Slice Architecture**
   - Features are organized by business capability
   - Each slice contains all layers (UI, logic, data)

3. **Command Pattern** in `src/core/commands/`
   - Encapsulated command execution
   - Extensible and testable

## 🗺️ Codebase Navigation Map

### Frontend (React + TypeScript)
```
src/
├── components/
│   ├── RealTerminal.tsx     # 🎯 MAIN: Real PTY terminal interface
│   ├── AnsiText.tsx         # ANSI color parsing and rendering
│   └── ui/                  # Reusable UI components (shadcn/ui)
│
├── home/                    # 🏠 MVVM: Home page module
│   ├── view.tsx            # React components
│   ├── viewModel.ts        # Business logic
│   ├── model.ts            # Data management
│   └── components/         # Module-specific components
│       ├── TerminalTabs.tsx # Tab management
│       └── Terminal.tsx     # Legacy terminal (mostly unused)
│
├── core/                   # 🧠 BUSINESS LOGIC
│   ├── commands/           # Command handling system
│   │   ├── BaseCommandHandler.ts
│   │   ├── FileSystemCommands.ts
│   │   ├── SystemCommands.ts
│   │   ├── RustCommands.ts
│   │   └── filesystem/     # File system command implementations
│   ├── filesystem/         # Virtual file system
│   ├── types.ts           # Core type definitions
│   ├── storage.ts         # Data persistence
│   └── validation.ts      # Input validation
│
├── utils/                 # 🛠️ UTILITIES
├── hooks/                 # React custom hooks
└── lib/                  # External library configurations
```

### Backend (Rust)
```
src-rust/ (or in Cargo.toml workspace)
├── server/               # HTTP API server
├── pty-server/          # WebSocket PTY server
└── shared/              # Shared Rust code
```

## 🎯 AI Agent Task Patterns

### When Modifying Components

1. **Always Read First**: Use the `Read` tool to understand current implementation
2. **Follow Existing Patterns**: Match the coding style and architecture
3. **Maintain Type Safety**: All TypeScript must be properly typed
4. **Test Your Changes**: Run `npm run typecheck` and `npm run build`

### Common AI Tasks

#### 🔧 Refactoring Components
```typescript
// ❌ DON'T: Create monolithic components
const HugeComponent = () => {
  // 500 lines of mixed concerns
}

// ✅ DO: Follow Single Responsibility Principle
const TerminalHeader = ({ isConnected, onScrollToBottom }) => {
  // Clear, focused responsibility
}
```

#### 🎨 Adding UI Features
```typescript
// ✅ PATTERN: Use the established component structure
const NewFeature: React.FC<NewFeatureProps> = ({ prop1, prop2 }) => {
  // 1. State management
  const [state, setState] = useState(initialState);
  
  // 2. Effects and handlers
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  const handleAction = useCallback(() => {
    // Event handlers
  }, [dependencies]);
  
  // 3. Render with consistent styling
  return (
    <div className="feature-container" style={{ 
      /* Consistent with existing styles */ 
    }}>
      {/* JSX */}
    </div>
  );
};
```

#### 🔌 Extending Command System
```typescript
// ✅ PATTERN: Extend BaseCommandHandler
export class NewCommandHandler extends BaseCommandHandler {
  canHandle(command: string): boolean {
    return command.startsWith('newcommand');
  }
  
  async execute(command: string, args: string[]): Promise<CommandResult> {
    // Implementation following KISS principle
    return {
      success: true,
      output: 'Command executed',
      shouldClearInput: true
    };
  }
}
```

## 🧠 AI-Friendly Code Principles

### 1. KISS (Keep It Simple, Stupid)
```typescript
// ❌ COMPLEX: Hard for AI to understand and modify
const processData = (data: any) => {
  return data.map(item => item?.nested?.deeply?.buried?.value || 
    (item.alternative && item.alternative.path ? 
      item.alternative.path.getValue() : null))
    .filter(Boolean)
    .reduce((acc, val) => ({ ...acc, [val.id]: val }), {});
}

// ✅ SIMPLE: Easy for AI to understand and modify
const processData = (data: DataItem[]) => {
  const validItems = data.filter(item => isValidItem(item));
  const processedItems = validItems.map(item => transformItem(item));
  return createItemMap(processedItems);
}
```

### 2. DRY (Don't Repeat Yourself)
```typescript
// ✅ PATTERN: Create reusable utilities
// src/utils/terminalHelpers.ts
export const createTerminalStyle = (isActive: boolean) => ({
  background: isActive ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 0, 0, 0.2)',
  color: isActive ? '#00ff88' : '#888',
  transition: 'all 0.2s ease'
});

// Use across multiple components
const tabStyle = createTerminalStyle(isActive);
```

### 3. YAGNI (You Aren't Gonna Need It)
```typescript
// ❌ OVER-ENGINEERING: Don't build what might be needed
interface FlexibleConfigurableExtensibleTerminalSettings {
  theme?: ThemeConfig;
  plugins?: PluginConfig[];
  customHooks?: HookConfig[];
  advancedFeatures?: AdvancedConfig;
}

// ✅ MINIMAL: Build what's actually needed
interface TerminalSettings {
  fontSize: number;
  theme: 'dark' | 'light';
  enableSound: boolean;
}
```

## 📋 AI Task Checklist

When working on the codebase, follow this checklist:

### Pre-Modification
- [ ] Read and understand the existing code
- [ ] Identify the architectural pattern being used
- [ ] Check for similar implementations elsewhere
- [ ] Understand the data flow and dependencies

### During Modification
- [ ] Follow existing naming conventions
- [ ] Maintain consistent indentation and formatting
- [ ] Add appropriate TypeScript types
- [ ] Keep functions small and focused (< 50 lines)
- [ ] Use descriptive variable and function names

### Post-Modification
- [ ] Run `npm run typecheck` to verify types
- [ ] Run `npm run lint` to check code style
- [ ] Test the functionality manually if possible
- [ ] Update related documentation if needed

## 🔧 Common Patterns and Utilities

### State Management Pattern
```typescript
// ✅ PATTERN: Consistent state updates
const useTerminalState = () => {
  const [state, setState] = useState<TerminalState>({
    isConnected: false,
    output: '',
    currentInput: ''
  });
  
  const updateState = useCallback((updates: Partial<TerminalState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  
  return { state, updateState };
};
```

### Error Handling Pattern
```typescript
// ✅ PATTERN: Consistent error handling
const handleAsyncOperation = async () => {
  try {
    const result = await riskyOperation();
    return { success: true, data: result };
  } catch (error) {
    console.error('Operation failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
```

### Component Props Pattern
```typescript
// ✅ PATTERN: Well-defined interfaces
interface TerminalComponentProps {
  // Required props first
  isConnected: boolean;
  onCommand: (command: string) => void;
  
  // Optional props with defaults
  className?: string;
  theme?: 'dark' | 'light';
  
  // Event handlers with clear names
  onConnect?: () => void;
  onDisconnect?: () => void;
}
```

## 🚀 Performance Considerations

### React Performance
```typescript
// ✅ PATTERN: Optimize re-renders
const ExpensiveComponent = React.memo<Props>(({ data, onAction }) => {
  const memoizedValue = useMemo(() => expensiveCalculation(data), [data]);
  
  const handleClick = useCallback(() => {
    onAction(memoizedValue);
  }, [onAction, memoizedValue]);
  
  return <div onClick={handleClick}>{memoizedValue}</div>;
});
```

### Bundle Size
- Use dynamic imports for large dependencies
- Prefer named imports over default imports
- Avoid importing entire libraries

## 🔍 Debugging and Logging

### Consistent Logging Pattern
```typescript
// ✅ PATTERN: Structured logging
const logger = {
  debug: (message: string, data?: any) => {
    console.log(`🐛 [DEBUG] ${message}`, data);
  },
  info: (message: string, data?: any) => {
    console.log(`ℹ️ [INFO] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`❌ [ERROR] ${message}`, error);
  }
};
```

## 🤝 Human-AI Collaboration Notes

### When to Ask for Human Input
- Making architectural decisions that affect multiple modules
- Changing core business logic
- Adding new external dependencies
- Making breaking changes to APIs

### When to Proceed Autonomously
- Fixing TypeScript errors
- Improving code formatting and style
- Adding documentation and comments
- Implementing requested features following existing patterns
- Optimizing performance without changing behavior

## 📚 Learning Resources

For deeper understanding of the patterns used:
- **MVVM Pattern**: Look at `src/home/` for reference implementation
- **Command Pattern**: Study `src/core/commands/` structure
- **React Best Practices**: Follow patterns in `src/components/`
- **TypeScript Usage**: Check existing type definitions in `src/core/types.ts`

---

**Remember**: This codebase is designed to be a peaceful, collaborative environment where AI agents can effectively contribute to pushing past the limits of human capabilities. Every change should make the code more maintainable, more understandable, and more delightful to work with! 🚀✨