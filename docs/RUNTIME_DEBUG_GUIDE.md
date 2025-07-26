# Runtime Debug Guide for Rust Terminal Forge

## 🚨 Critical Runtime Issues Identified

### 1. ES Module Configuration Conflicts

**Primary Issue**: The project has mixed CommonJS/ES Module configurations causing multiple startup failures.

#### Problems Detected:
- `package.json` sets `"type": "commonjs"` but files use ES import syntax
- `pty-server.js` uses ES imports but can't run as CommonJS module  
- `eslint.config.js` uses ES imports but fails in CommonJS context
- `vite.config.ts` fails due to `lovable-tagger` ESM-only dependency
- `postcss.config.js` uses ES export syntax

#### Root Cause Analysis:
```bash
SyntaxError: Cannot use import statement outside a module
```
This occurs because:
1. Node.js defaults to CommonJS when `"type": "module"` is not set
2. ES import/export statements require either:
   - `"type": "module"` in package.json
   - `.mjs` file extensions
   - Dynamic imports for ESM in CommonJS context

### 2. Startup Service Failures

**PTY Server Failure**: Node.js PTY server fails immediately on startup
```
[1] node pty-server.js exited with code 1
```

**Vite Development Server Failure**: Frontend build system cannot start
```
failed to load config from /workspaces/rust-terminal-forge/vite.config.ts
```

**Impact**: Only the Rust backend server (port 3001) starts successfully.

### 3. Dependency Issues

- `lovable-tagger` is ESM-only but project is configured for CommonJS
- Various development tools fail due to module system conflicts

## 🛠️ Debug Procedures

### Quick Health Check Commands

```bash
# Check all service ports
netstat -tulpn | grep -E ":300[012]|:8080"

# Verify running processes  
ps aux | grep -E "(node|cargo|vite)" | grep -v grep

# Test backend health
curl http://localhost:3001/api/health

# Check TypeScript compilation
npm run typecheck

# Run tests (currently failing)
npm run test
```

### Service-by-Service Debugging

#### 1. Rust Backend Server (✅ Working)
- **Status**: Healthy
- **Port**: 3001
- **Health Check**: `curl http://localhost:3001/api/health`
- **Logs**: Check cargo output for warp server messages

#### 2. PTY Terminal Server (❌ Failing)
- **Status**: Fails on startup
- **Expected Port**: 3002
- **Issue**: ES module syntax in CommonJS context
- **Debug Steps**:
  ```bash
  # Test direct execution
  node pty-server.js
  
  # Check Node.js version compatibility
  node --version
  
  # Verify node-pty installation
  npm list node-pty
  ```

#### 3. Vite Frontend Server (❌ Failing)
- **Status**: Fails on startup
- **Expected Port**: 8080
- **Issue**: lovable-tagger ESM dependency conflict
- **Debug Steps**:
  ```bash
  # Test vite config loading
  npx vite --config vite.config.ts
  
  # Check lovable-tagger installation
  npm list lovable-tagger
  ```

### Memory Leak Detection

```bash
# Monitor Node.js processes
top -p $(pgrep node)

# Check memory usage patterns
ps aux --sort=-%mem | grep node

# Use Node.js built-in profiling
node --inspect pty-server.js
```

### Mobile Responsiveness Testing

The terminal includes comprehensive mobile detection:
- Touch capability detection
- Virtual keyboard handling  
- Viewport height monitoring
- Gesture navigation

**Test Commands**:
```bash
# Mobile user agent simulation
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)" http://localhost:8080

# Check touch events in browser dev tools
# Enable device simulation mode
# Monitor touch/gesture handlers
```

## 🔧 Fix Strategies

### Strategy 1: Convert to Full ES Modules (Recommended)

```json
// package.json
{
  "type": "module",
  "scripts": {
    "dev:with-node-pty": "concurrently \"npm run server\" \"node pty-server.js\" \"vite\""
  }
}
```

**Required Changes**:
- Update `package.json` to `"type": "module"`
- Convert CommonJS require() calls to ES imports
- Update file extensions or dynamic imports where needed

### Strategy 2: Fix Individual File Imports

```javascript
// pty-server.js - Convert to CommonJS
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');
```

### Strategy 3: Replace Problematic Dependencies

```bash
# Remove lovable-tagger if not essential
npm uninstall lovable-tagger

# Update vite.config.ts
// Remove the componentTagger import and usage
```

## 🧪 Testing and Validation

### WebSocket Connection Testing

```javascript
// Browser console test
const socket = io('http://localhost:3002');
socket.on('connect', () => console.log('Connected to PTY server'));
socket.on('disconnect', () => console.log('Disconnected'));
```

### AI Provider Integration Testing

The project includes multiple AI providers (Claude, Gemini, Qwen):

```bash
# Test provider registry
npm run test -- --grep "AIProviderRegistry"

# Check environment variables
echo $ANTHROPIC_API_KEY
echo $GEMINI_API_KEY  
echo $QWEN_API_KEY
```

### Performance Benchmarking

```bash
# Run comprehensive test suite
npm run quality:check

# Measure startup time
time ./start.sh

# Profile memory usage
node --trace-gc pty-server.js
```

## 📊 Current System Status

### ✅ Working Components
- Rust backend server (port 3001)
- TypeScript compilation 
- React component structure
- Mobile-responsive terminal UI
- Comprehensive AI provider architecture

### ❌ Failing Components  
- Node.js PTY server (port 3002)
- Vite development server (port 8080)
- ESLint configuration
- Test suite execution
- WebSocket terminal connections

### ⚠️ Warnings Detected
- Unused Rust struct field: `active` in TerminalSession
- Deprecated Vite CJS Node API usage
- ES module loading warnings across configuration files

## 🚀 Recommended Immediate Actions

1. **Fix Module System**: Convert to full ES modules or fix imports
2. **Update Dependencies**: Replace or update incompatible packages
3. **Test WebSocket**: Verify terminal connectivity after fixes
4. **Mobile Testing**: Validate touch/gesture functionality
5. **AI Integration**: Test provider switching and authentication

## 📝 Monitoring and Logs

### Log Locations
- Rust backend: stdout/stderr from cargo
- PTY server: Console output (when working)
- Vite: Development server logs
- Browser: Network/Console dev tools

### Key Metrics to Monitor
- Memory usage across Node.js processes
- WebSocket connection stability  
- Terminal session lifecycle
- AI provider response times
- Mobile touch event handling

## 🔍 Advanced Debugging

### Browser DevTools Checklist
- [ ] Network tab: Check WebSocket connections
- [ ] Console: Monitor for JavaScript errors
- [ ] Application: Inspect local storage/session data
- [ ] Performance: Profile rendering and memory
- [ ] Mobile: Test touch events and responsiveness

### Server-Side Debugging
- [ ] Enable verbose logging in PTY server
- [ ] Monitor process memory with `htop`
- [ ] Check file descriptor limits with `ulimit -n`
- [ ] Verify network connectivity between services

This debug guide should help identify and resolve the critical runtime issues preventing the application from starting properly.