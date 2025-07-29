# Rick's Terminal Forge - Mad Science Documentation
*"This isn't just a terminal, Morty - it's the most scientifically advanced command interface in any dimension!"*

## What This Actually Is

A web-based terminal application that doesn't suck. Built with Rust backends and React frontends, designed to be fast, responsive, and actually usable across all devices - including mobile.

## Local Setup (No Nonsense)

### Prerequisites
- Node.js 18+
- Rust 1.75+
- Git

### Get It Running
```bash
# Clone and enter
git clone https://github.com/rust-terminal-forge/rust-terminal-forge.git
cd rust-terminal-forge

# Install and build everything
npm install
npm run dev

# Open http://localhost:8081 (frontend will be there)
# Backend API: http://localhost:3001
# PTY Server: http://localhost:3002
```

### If Something Breaks
```bash
# Clean slate
npm run clean
npm install
npm run build
npm run dev

# Still broken? Check ports
netstat -an | grep -E ":(3001|3002|8081)"

# Kill conflicting processes
pkill -f "rust-terminal-forge"
```

## Core Concepts

### 1. Quantum Layout System
Mathematical precision layout that prevents UI chaos. No more overlapping elements, no more visual artifacts. Elements position themselves using collision detection and grid-based calculations.

### 2. Singleton Cursor Management
One cursor across the entire application. No dual cursor nonsense. Physics-based movement with proper animation curves that actually look natural.

### 3. ASCII Renderer Engine
Canvas-based text rendering with pixel-perfect accuracy. Handles all DPI scales, font metrics calculation, and Unicode/ASCII alignment issues that make other terminals look amateur.

### 4. Fluid Animation Physics
Animations that understand momentum and easing. Not just CSS transitions that look robotic, but actual physics calculations that make movements feel organic.

### 5. Multi-LLM Integration
Clean integration with Claude, Gemini, OpenCode, and Qwen. Output rendering that doesn't break with code blocks, maintains formatting, and handles streaming responses properly.

## Mad Science Design Philosophy

### Problem: Every Terminal Sucks
- Cursor positioning is broken across browsers
- ASCII alignment falls apart with different fonts and DPIs  
- Mobile terminals are unusable garbage
- LLM integrations render poorly
- Performance is trash
- UI elements overlap and fight each other

### Solution: Scientific Engineering
Instead of hacking together CSS and hoping it works, we built:

1. **Mathematical Layout Engine** - Collision detection prevents overlapping
2. **Canvas-Based Rendering** - Direct pixel control for perfect text
3. **Physics Animation System** - Proper easing and momentum  
4. **Singleton Architecture** - One cursor, one source of truth
5. **Performance-First Design** - Sub-16ms render times, 60fps guarantee
6. **Mobile-Native Approach** - Touch targets, gestures, responsive behavior

### Why This Approach Works
- **Predictable**: Mathematical precision eliminates guesswork
- **Scalable**: Component architecture with clear boundaries
- **Fast**: Hardware acceleration and efficient algorithms
- **Maintainable**: TypeScript, comprehensive testing, documented APIs
- **Universal**: Works identically across devices and browsers

## Architecture Overview

```
Frontend (React + TypeScript)
├── QuantumLayout.ts        # Mathematical layout engine
├── SingletonCursor.tsx     # One cursor system
├── ASCIIRenderer.ts        # Canvas text rendering
├── FluidAnimator.ts        # Physics animations
├── LLMIntegrationHub.tsx   # Multi-provider AI interface
└── QuantumTerminal.tsx     # Main terminal component

Backend (Rust)
├── HTTP Server (port 3001) # REST API and static files
├── PTY Server (port 3002)  # WebSocket terminal sessions
└── Shared utilities       # Common Rust code

Testing Framework
├── Visual diff tests       # Pixel-perfect UI validation
├── Performance tests       # 60fps and memory requirements
├── Integration tests       # End-to-end workflows
└── Unit tests             # Component functionality
```

## Development Workflow

### Running Tests
```bash
# All tests
npm test

# Visual diff tests (requires running dev server)
npm run test:visual

# Performance tests
npm run test:perf

# Individual test file
npm test -- cursor-positioning
```

### Building for Production
```bash
# Build everything
npm run build

# Test production build locally
npm run preview

# Deploy (if configured)
npm run deploy
```

### Debugging Common Issues

**Dual Cursors Appearing:**
- Check SingletonCursor.tsx initialization
- Verify only one CursorManager instance exists
- Look for rogue cursor CSS classes

**ASCII Misalignment:**
- Verify font metrics calculation in ASCIIRenderer.ts
- Check canvas DPI scaling
- Validate monospace font loading

**Layout Overlapping:**
- Run QuantumLayout collision detection
- Check z-index management
- Verify element positioning calculations

**Poor Performance:**
- Profile with browser DevTools
- Check FluidAnimator frame rates
- Monitor memory usage in dev console

## File Structure That Matters

```
src/
├── engine/                 # Core engines (layout, rendering, animation)
├── components/             # React UI components  
├── styles/                 # Design tokens and CSS
├── hooks/                  # Custom React hooks
└── testing/               # Test utilities

tests/                     # All test files
├── visual-diff/           # Screenshot comparison tests
├── performance/           # Speed and memory tests
├── integration/           # End-to-end tests
└── unit/                  # Component tests

docs/                      # Documentation
├── ARCHITECTURE.md        # Technical deep dive
├── COMPONENT_API.md       # Component usage guides
└── PERFORMANCE.md         # Optimization guidelines
```

## Performance Targets

- **Startup**: <1 second initial load
- **Rendering**: <16ms per frame (60fps)
- **Memory**: <100MB sustained usage
- **Input Latency**: <10ms keystroke response
- **Bundle Size**: <500KB gzipped

## Browser Support

Works on anything that supports:
- Canvas 2D API
- WebSocket
- ES2020 features
- CSS Grid and Flexbox

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes with tests
4. Run quality checks: `npm run test && npm run lint && npm run typecheck`
5. Submit PR

No emoji commits. No "fix stuff" commit messages. Write tests for everything. Use TypeScript properly.

## What's Actually Implemented

- ✅ Professional UI without emojis or overlapping elements
- ✅ Responsive design across all screen sizes
- ✅ SingletonCursor system with physics animations
- ✅ QuantumLayout engine for mathematical positioning
- ✅ ASCIIRenderer for pixel-perfect text
- ✅ LLMIntegrationHub for multi-provider AI
- ✅ Comprehensive visual diff testing framework
- ✅ Performance monitoring and optimization
- ✅ TypeScript throughout with proper types

## What's Not Implemented (Yet)

- Real-time collaboration
- Plugin system
- Custom themes beyond built-ins
- Advanced vim mode
- SSH integration
- File transfer

This is production-quality code for terminal functionality. Everything else is future enhancement.