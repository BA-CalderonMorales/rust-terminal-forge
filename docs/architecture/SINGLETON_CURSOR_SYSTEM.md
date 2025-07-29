# SingletonCursor System

## Overview

The SingletonCursor system is a centralized cursor management solution that eliminates dual cursor chaos in multi-component applications. It provides physics-based animations, perfect blink synchronization, and sub-pixel positioning accuracy while ensuring only one cursor exists across the entire application.

## 🎯 Key Features

### ✅ Dual Cursor Elimination
- **Global Singleton Pattern**: Only one cursor exists across the entire application
- **Priority-Based Management**: Higher priority cursors automatically take precedence
- **Seamless Transitions**: Smooth animations when switching between different cursor contexts

### ⚡ Physics-Based Animations
- **Spring Dynamics**: Realistic motion with configurable spring constants and damping
- **Sub-Pixel Accuracy**: Precise positioning using hardware-accelerated transforms
- **Multiple Physics Presets**: Optimized configurations for different use cases

### 🎨 Perfect Synchronization
- **Unified Blinking**: Single blink cycle across all cursor contexts
- **Typing Pause Logic**: Automatic blink pausing during user input
- **Reduced Motion Support**: Respects accessibility preferences

### 🔧 FluidAnimator Integration
- **Seamless Integration**: Works with existing FluidAnimator for enhanced animations
- **Custom Easing Functions**: Rick's scientific easing functions for natural motion
- **Performance Optimized**: Hardware acceleration and efficient rendering

## 📁 Architecture

```
src/components/
├── CursorManager.ts          # Core singleton manager
├── SingletonCursor.tsx       # React component interface
├── CursorPhysics.ts         # Advanced physics engine
└── EnhancedRealTerminal.tsx # Integration example
```

## 🚀 Quick Start

### 1. Basic Usage

```tsx
import { SingletonCursor } from './components/SingletonCursor';

function MyTerminal() {
  return (
    <div>
      <SingletonCursor
        id="my-terminal-cursor"
        context="terminal"
        position={{ x: 10, y: 20 }}
        isActive={true}
        priority={5}
      />
      {/* Your terminal content */}
    </div>
  );
}
```

### 2. Using the Hook

```tsx
import { useSingletonCursor } from './components/SingletonCursor';

function MyComponent() {
  const cursor = useSingletonCursor('my-cursor', 'terminal');
  
  // Update cursor position
  cursor.updateTextPosition(5, 10); // Line 5, Column 10
  cursor.updatePixelPosition(100, 200); // Pixel coordinates
  
  // Control visibility
  cursor.show();
  cursor.hide();
  
  // Control blinking
  cursor.pauseBlinking();
  cursor.resumeBlinking();
  
  return (
    <div>
      <SingletonCursor {...cursor.cursorProps} />
      {/* Your content */}
    </div>
  );
}
```

### 3. Context Provider

```tsx
import { CursorProvider } from './components/SingletonCursor';

function App() {
  return (
    <CursorProvider>
      {/* All cursor components will share the same context */}
      <MyTerminal />
      <MyVimEditor />
      <MyCodeEditor />
    </CursorProvider>
  );
}
```

## 🎛️ Configuration Options

### Cursor Contexts

Each cursor context has default styling and priority:

```typescript
type CursorContext = 'terminal' | 'vim' | 'code' | 'ai';

// Default priorities:
// ai: 10     (Highest - AI interactions)
// vim: 8     (High - Vim mode)
// code: 6    (Medium-high - Code editing)
// terminal: 4 (Medium - Terminal input)
```

### Physics Presets

```typescript
import { PhysicsPresets } from './components/CursorPhysics';

// Available presets:
PhysicsPresets.terminal  // Snappy response
PhysicsPresets.code      // Smooth, flowing motion
PhysicsPresets.ai        // Bouncy, attention-grabbing
PhysicsPresets.vim       // Heavy, deliberate motion
PhysicsPresets.precise   // Ultra-smooth for precision
```

### Custom Styling

```tsx
<SingletonCursor
  id="custom-cursor"
  context="terminal"
  position={{ x: 10, y: 10 }}
  style={{
    width: 3,
    height: 20,
    backgroundColor: '#ff0099',
    borderRadius: 2,
    boxShadow: '0 0 10px rgba(255, 0, 153, 0.8)',
    blinkSpeed: 800
  }}
/>
```

## 🔬 Advanced Features

### Physics-Based Movement

```typescript
import { CursorPhysics, createPhysicsCursor } from './components/CursorPhysics';

const element = document.getElementById('cursor');
const physics = createPhysicsCursor(element, { x: 0, y: 0 }, 'terminal');

// Animate to position with spring physics
physics.moveTo({ x: 100, y: 50 });

// Add impulse force
physics.addImpulse({ x: 50, y: -30 });

// Custom configuration
physics.updateConfig({
  springConstant: 300,
  dampening: 0.8,
  friction: 0.7
});
```

### Priority Management

```typescript
import { CursorManager } from './components/CursorManager';

// Register multiple cursors
CursorManager.registerCursor({
  id: 'terminal-1',
  context: 'terminal',
  priority: 4,
  isActive: true,
  // ... other config
});

CursorManager.registerCursor({
  id: 'vim-editor',
  context: 'vim',
  priority: 8,
  isActive: true,
  // ... other config
});

// vim-editor will be active due to higher priority
const activeCursor = CursorManager.getActiveCursor();
console.log(activeCursor.id); // 'vim-editor'
```

### Event Handling

```tsx
<SingletonCursor
  id="event-cursor"
  context="terminal"
  position={{ x: 10, y: 10 }}
  onActivate={() => console.log('Cursor became active')}
  onDeactivate={() => console.log('Cursor became inactive')}
/>
```

## 🧪 Testing

The system includes comprehensive tests covering:

- Singleton behavior verification
- Physics animation accuracy
- Priority management
- Blink synchronization
- Performance optimization
- Accessibility compliance

```bash
# Run tests
npm test singleton-cursor.test.ts
```

## 🎨 Integration Examples

### Terminal Integration

```tsx
import { SingletonCursor, useSingletonCursor } from './components/SingletonCursor';

function Terminal({ terminalId }) {
  const cursor = useSingletonCursor(`terminal-${terminalId}`, 'terminal');
  const [currentInput, setCurrentInput] = useState('');
  const [output, setOutput] = useState('');
  
  // Update cursor position based on input
  useEffect(() => {
    const lines = output.split('\n').length;
    cursor.updateTextPosition(lines + 1, currentInput.length);
  }, [output, currentInput, cursor]);
  
  return (
    <div>
      <SingletonCursor
        {...cursor.cursorProps}
        isActive={isFocused}
        priority={4}
      />
      <div>{output}</div>
      <div>{currentInput}</div>
    </div>
  );
}
```

### Vim Editor Integration

```tsx
function VimEditor() {
  const [mode, setMode] = useState('normal');
  const cursor = useSingletonCursor('vim-cursor', 'vim');
  
  // Different cursor styles for different vim modes
  useEffect(() => {
    const style = mode === 'normal' 
      ? { mode: 'block', width: 12 }
      : { mode: 'line', width: 2 };
    
    cursor.updateStyle(style);
  }, [mode, cursor]);
  
  return (
    <div>
      <SingletonCursor
        {...cursor.cursorProps}
        priority={8} // High priority for vim
      />
      {/* Vim editor content */}
    </div>
  );
}
```

### Multi-Cursor Code Editor

```tsx
function CodeEditor() {
  const [cursors, setCursors] = useState([{ line: 1, col: 1 }]);
  const primaryCursor = useSingletonCursor('code-primary', 'code');
  
  // Only show the primary cursor through singleton system
  useEffect(() => {
    const primary = cursors[0];
    if (primary) {
      primaryCursor.updateTextPosition(primary.line, primary.col);
    }
  }, [cursors, primaryCursor]);
  
  return (
    <div>
      <SingletonCursor
        {...primaryCursor.cursorProps}
        priority={6}
        style={{ backgroundColor: '#0099ff' }}
      />
      {/* Code editor content */}
    </div>
  );
}
```

## 🔧 Performance Optimizations

### Hardware Acceleration

- Uses `transform3d` for sub-pixel positioning
- Hardware-accelerated animations with `willChange`
- Efficient RAF-based physics updates

### Memory Management

- Automatic cleanup on component unmount
- Optimized physics state management
- Minimal DOM manipulation

### Accessibility

- Respects `prefers-reduced-motion`
- Proper ARIA attributes
- Screen reader compatibility

## 🐛 Troubleshooting

### Common Issues

1. **Multiple cursors visible**: Check that all components use the SingletonCursor system
2. **Poor animation performance**: Ensure hardware acceleration is enabled
3. **Cursor not responding**: Verify the cursor is registered and has appropriate priority

### Debug Tools

```typescript
import { CursorManager } from './components/CursorManager';

// Get all registered cursors
console.log(CursorManager.getAllCursors());

// Get active cursor
console.log(CursorManager.getActiveCursor());

// Check physics state
const physics = // ... your physics instance
console.log(physics.getPhysicsState());
```

## 🤝 Contributing

When extending the system:

1. Maintain the singleton pattern
2. Use physics-based animations
3. Follow the priority system
4. Add comprehensive tests
5. Update documentation

## 📄 License

This SingletonCursor system is part of the Rust Terminal Forge project and follows the same license terms.

---

## 🎯 Summary

The SingletonCursor system successfully eliminates dual cursor chaos while providing:

- ✅ **Single cursor guarantee** across the entire application
- ⚡ **Physics-based animations** with spring dynamics
- 🎨 **Perfect blink synchronization** with typing pause logic
- 📐 **Sub-pixel positioning accuracy** for crisp visuals
- 🔧 **Seamless FluidAnimator integration** for enhanced animations
- 🧪 **Comprehensive testing** for reliability
- ♿ **Full accessibility support** with reduced motion compliance

The system provides a clean, performant, and user-friendly cursor experience that scales across complex multi-component applications.