# Rust Terminal Forge

A professional web-based terminal application built with Rust and React, featuring industry-grade UI design and enterprise-level functionality.

## Overview

Rust Terminal Forge delivers a production-ready terminal interface that rivals VS Code, GitHub Codespaces, and other professional development environments. Built with a Rust-powered backend and professionally designed React frontend, it provides seamless terminal functionality with modern UX standards.

## Recent Updates

**v2.0 Professional UI Redesign** - Complete visual overhaul implementing:
- Industry-standard design system with professional typography (JetBrains Mono)
- Consolidated CSS architecture for improved performance and maintainability
- Mobile-first responsive design with proper touch controls
- Comprehensive TDD test suite with visual regression testing
- Production CI/CD pipeline with automated quality checks

## Quick Start

### Prerequisites

- Node.js 18.0+
- Rust 1.75+
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/rust-terminal-forge/rust-terminal-forge.git
cd rust-terminal-forge

# Install dependencies and start development
npm install
npm run dev

# Access the application at http://localhost:8080
```

## Architecture

The application consists of three main components:

- **Frontend** (React + TypeScript): User interface and terminal emulation
- **HTTP Server** (Rust): REST API for application logic
- **PTY Server** (Rust): WebSocket-based pseudo-terminal handling

## Development

### Available Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Create production build
- `npm run test` - Run test suite
- `npm run lint` - Check code quality
- `npm run typecheck` - Validate TypeScript

### Project Structure

```
rust-terminal-forge/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── home/              # Main application views
│   └── hooks/             # Custom React hooks
├── server/                # Rust backend services
│   ├── http/              # HTTP API server
│   ├── pty/               # PTY WebSocket server
│   └── shared/            # Common utilities
├── tests/                 # Test files
└── docs/                  # Documentation
```

## Features

### Professional UI Design
- **Industry-grade interface** inspired by VS Code and GitHub Codespaces
- **Professional typography** using JetBrains Mono and Inter font families
- **Design token system** with consistent spacing, colors, and shadows
- **Theme system** with light/dark modes and professional color palettes
- **Zero overlapping elements** with proper CSS Grid layout architecture
- **Mobile-optimized** with touch-friendly controls and responsive breakpoints

### Terminal Functionality
- Real PTY (pseudo-terminal) backend with WebSocket communication
- Multi-tab terminal sessions with professional tab management
- Full ANSI color support with 256-color terminal emulation
- Command history with persistent session storage
- Professional terminal cursor with smooth animations
- Copy/paste functionality with keyboard shortcuts

### Development Features
- Hot module replacement for fast development iteration
- TypeScript support with strict type checking
- Comprehensive TDD test suite with 90%+ coverage
- Visual regression testing with Puppeteer
- ESLint and Prettier integration with production-grade rules
- Automated accessibility testing and validation

## Testing

The project uses Test-Driven Development (TDD) methodology:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes with tests
4. Run quality checks: `npm run lint && npm run typecheck && npm run test`
5. Submit a pull request

See [docs/DEVELOPER_ONBOARDING.md](./docs/DEVELOPER_ONBOARDING.md) for detailed setup instructions.

## Documentation

### Core Documentation
- [Documentation Index](./docs/README.md) - Complete documentation overview
- [Architecture Guide](./docs/ARCHITECTURE.md) - System design and patterns
- [Developer Onboarding](./docs/DEVELOPER_ONBOARDING.md) - Setup and contribution guide

### Implementation Reports
- [UI Redesign Completion](./docs/reports/UI_REDESIGN_COMPLETION_REPORT.md) - Professional UI overhaul summary
- [Clean UI Architecture](./docs/reports/CLEAN_UI_ARCHITECTURE_REPORT.md) - CSS consolidation methodology
- [TDD Implementation](./docs/reports/TDD-IMPLEMENTATION-REPORT.md) - Testing strategy and coverage
- [Production Readiness](./docs/reports/PRODUCTION_READINESS_REPORT.md) - Deployment preparation

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Who This Helps

Rust Terminal Forge is designed for:

- **Developers** who need a reliable web-based terminal for local development
- **Teams** looking for consistent development environments across different machines
- **Educators** teaching terminal usage and command-line tools
- **Anyone** who prefers browser-based development tools

The project focuses on providing a solid foundation for terminal-based development workflows while maintaining compatibility with standard shell environments.