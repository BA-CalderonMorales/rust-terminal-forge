# Rust Terminal Forge

A modern web-based terminal application built with Rust and React, designed for local development environments.

## Overview

Rust Terminal Forge provides a professional terminal interface accessible through your web browser. It combines a Rust-powered backend with a responsive React frontend to deliver real-time terminal functionality.

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

### Terminal Functionality
- Real PTY (pseudo-terminal) backend
- Multi-tab terminal sessions
- ANSI color support
- Command history
- Responsive design for mobile and desktop

### Development Features
- Hot module replacement
- TypeScript support
- Comprehensive test coverage
- ESLint and Prettier integration

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

- [Architecture Guide](./docs/ARCHITECTURE.md) - System design and patterns
- [Developer Onboarding](./docs/DEVELOPER_ONBOARDING.md) - Setup and contribution guide
- [API Reference](./docs/API.md) - Backend API documentation

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