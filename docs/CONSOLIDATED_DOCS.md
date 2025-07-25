# 📚 Rust Terminal Forge - Consolidated Documentation

> **Note**: This file consolidates information from multiple scattered markdown files to reduce project root clutter.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Rust 1.70+ and Cargo
- Python 3.10+ (for swarms integration)

### Installation & Setup
```bash
# Clone and install dependencies
npm install

# Start the development server
./start.sh

# Access the application
# Frontend: http://localhost:8080
# API: http://localhost:3001
# PTY Server: http://localhost:3002
```

## 🏗️ Architecture Overview

### Core Components
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend API**: Rust + Warp framework 
- **PTY Server**: Node.js + Socket.io for real terminal sessions
- **Terminal UI**: Multi-tab terminal with mobile optimization
- **Theme System**: NvChad-inspired themes with real-time switching

### Directory Structure
```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── MultiTabTerminal.tsx
│   ├── ThemeSwitcher.tsx
│   └── NvChadStatusLine.tsx
├── core/               # Core business logic
│   ├── tabManager.ts   # Tab management system
│   ├── types.ts        # TypeScript definitions
│   └── commands/       # Command processors
├── home/               # Main application views
├── theme.ts            # Theme management system
└── utils/              # Utility functions
```

## 🎨 Theme System

### Available Themes
- **Cyberpunk Neon**: Electric green and blue cyberpunk aesthetic
- **Matrix Green**: Classic Matrix-inspired green monochrome
- **Synthwave Sunset**: Purple and pink retro synthwave colors

### Theme Switching
Themes can be switched via:
- Theme switcher button in the UI (top-right, repositioned to avoid button conflicts)
- Programmatic API: `themeManager.setTheme('themeName')`
- Persistent across sessions via localStorage

### Custom Theme Development
```typescript
// Add new theme to src/theme.ts
const newTheme = {
  name: 'Custom Theme',
  colors: {
    background: '#...',
    foreground: '#...',
    // ... other color definitions
  },
  gradients: {
    backgroundMain: 'linear-gradient(...)',
    // ... gradient definitions
  }
}
```

## 🖥️ Terminal Features

### Multi-Tab Support
- Create unlimited terminal sessions
- Drag & drop tab reordering
- Session persistence across app restarts
- Mobile-optimized tab bar with swipe gestures

### Real PTY Integration
- Full PTY (pseudo-terminal) support via Node.js
- Real command execution with proper process management
- WebSocket-based communication for real-time updates
- Support for interactive commands and TUI applications

### Mobile Optimization
- Touch-friendly interface with proper target sizes
- Virtual keyboard detection and handling
- Gesture navigation (swipe between tabs)
- Responsive design for various screen sizes

## 🧪 Testing Strategy

### TDD Implementation
Following Test-Driven Development (RED-GREEN-REFACTOR):

1. **RED Phase**: Write failing tests that define expected behavior
2. **GREEN Phase**: Write minimal code to make tests pass
3. **REFACTOR Phase**: Improve code quality while maintaining functionality

### Test Categories
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Full user workflow testing with Puppeteer
- **CLI Tools Tests**: Claude Code, Gemini CLI, Qwen Code integration

### Test Commands
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test -- <pattern>  # Run specific tests
```

## 🤖 AI Tools Integration

### Supported CLI Tools
- **Claude Code**: AI-powered code analysis and generation
- **Gemini CLI**: Google's Gemini AI for code assistance  
- **Qwen Code**: Alibaba's Qwen model for code completion

### Usage Examples
```bash
# Claude Code
claude-code analyze src/
claude-code commit
claude-code review

# Gemini CLI
gemini generate --prompt "Create React component"
gemini chat
gemini code-review

# Qwen Code
qwen-code complete --file src/main.tsx
qwen-code explain function
qwen-code refactor
```

## 🐝 Swarms Integration

### Python Swarms Library
Integrated with the Python `swarms` library for coordinated AI debugging:

```python
# Specialized debugging agents
- FrontendDebugger: React/TypeScript, UI rendering
- BackendDebugger: Rust core, command processing  
- SystemIntegrator: Build systems, dependencies
- TestCoordinator: TDD workflows, test coverage
- PerformanceAnalyzer: Memory, CPU, optimization
```

### Claude Flow MCP Integration
- Swarm orchestration via MCP (Model Context Protocol)
- Persistent memory across sessions
- Coordinated multi-agent debugging
- Performance tracking and optimization

## 🚀 Deployment

### Development
```bash
./start.sh  # Starts all services in development mode
```

### Production Build
```bash
npm run build              # Build frontend
cargo build --release     # Build Rust binaries
```

### Docker Support
```bash
docker-compose up          # Full stack deployment
```

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=development
RUST_LOG=debug
PORT=8080
API_PORT=3001
PTY_PORT=3002
```

### Theme Configuration
Themes are configured in `src/theme.ts` and automatically applied via CSS custom properties.

### Tab Management Settings
```typescript
// Configurable in tabManager
settings: {
  closeConfirmation: true,    # Confirm before closing dirty tabs
  tabScrollable: true,        # Enable horizontal scrolling
  showTabNumbers: true,       # Show tab numbers
  showCloseButtons: true,     # Show close buttons on tabs
  enableDragDrop: true,       # Enable drag & drop reordering
  autoSave: true,            # Auto-save session state
  maxTabs: 20                # Maximum number of tabs
}
```

## 🐛 Troubleshooting

### Common Issues

**Console Errors: "process is not defined"**
- Fixed via browserEnv utility providing safe process substitutes
- Error boundary components catch and handle gracefully

**Theme Switching Not Working**
- Ensure theme CSS variables are properly updated
- Check browser console for theme loading errors

**Terminal Not Connecting**
- Verify PTY server is running on port 3002
- Check WebSocket connection in browser dev tools

**Build Failures**
- Ensure all dependencies are installed: `npm install`
- Check Rust toolchain: `rustc --version`
- Verify Node.js version: `node --version`

### Debug Mode
Enable debug logging:
```bash
RUST_LOG=debug ./start.sh
```

## 📝 Contributing

### Code Style
- TypeScript for frontend code
- Rust for backend services
- Follow existing patterns and conventions
- Use TDD approach for new features

### Adding New Features
1. Write failing tests first (RED phase)
2. Implement minimal functionality (GREEN phase)
3. Refactor and optimize (REFACTOR phase)
4. Update documentation

### Pull Request Process
1. Create feature branch from main
2. Follow TDD workflow
3. Ensure all tests pass
4. Update relevant documentation
5. Submit PR with clear description

## 📜 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **NvChad**: Inspiration for modern terminal UI design
- **Claude Flow**: Swarm coordination and MCP integration
- **Python Swarms**: Multi-agent debugging capabilities
- **Rust Community**: Amazing terminal and system tools

---

*This consolidated documentation replaces multiple scattered markdown files to keep the project root clean and organized.*