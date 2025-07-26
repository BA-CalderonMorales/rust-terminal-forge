# 🔧 Troubleshooting & FAQ

> **Quick Help**: Common issues and their solutions for Rust Terminal Forge development and usage.

## 🚑 Quick Fixes (Most Common Issues)

### 🚫 Terminal Won't Start

**Symptoms**: Browser shows loading screen indefinitely or connection errors

**🔄 Solution 1**: Check all services are running
```bash
# Stop any existing processes
pkill -f "cargo run"
pkill -f "vite"

# Start fresh
npm run dev

# Or start individually:
npm run server      # HTTP API (port 3001)
npm run pty-server  # PTY WebSocket (port 8081)
npm run dev:frontend # Frontend (port 8080)
```

**🔄 Solution 2**: Check port conflicts
```bash
# Check if ports are in use
lsof -i :3001  # HTTP API
lsof -i :8081  # PTY server
lsof -i :8080  # Frontend

# Kill conflicting processes
sudo kill -9 <PID>
```

**🔄 Solution 3**: Clear cache and restart
```bash
# Clear npm cache
npm cache clean --force

# Clear Cargo cache
cargo clean

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild Rust binaries
cargo build
```

### 📱 Mobile Gestures Not Working

**Symptoms**: Swipe gestures don't navigate between tabs

**🔄 Quick Fix**:
1. **Enable touch simulation** in Chrome DevTools
2. **Check Device Mode** is active (Ctrl+Shift+M)
3. **Try different device profiles** (iPhone, iPad, Android)
4. **Refresh page** after enabling device mode

**🔧 Advanced Fix**:
```typescript
// Check if touch events are supported
if ('ontouchstart' in window) {
  console.log('Touch events supported');
} else {
  console.log('Touch events NOT supported - gestures will not work');
}

// Debug gesture handler
console.log('Gesture handler initialized:', gestureHandler);
```

### 🤖 AI Commands Not Responding

**Symptoms**: `ai` command returns "Provider not available" or times out

**🔄 Solution**:
```bash
# Check provider status
ai providers

# Test individual providers
ai chat --provider claude "test"
ai chat --provider gemini "test"
ai chat --provider qwen "test"

# Refresh provider health
ai config refresh
```

**🔑 Environment Variables**:
```bash
# Ensure API keys are set (optional for basic functionality)
export ANTHROPIC_API_KEY="your-key-here"
export GEMINI_API_KEY="your-key-here"
export QWEN_API_KEY="your-key-here"

# Verify
echo $ANTHROPIC_API_KEY
```

---

## 🔍 Development Issues

### 🧪 Build & Compilation Problems

#### Rust Compilation Errors

**Error**: `error: linking with cc failed: exit status: 1`
```bash
# Solution: Install build essentials
# Ubuntu/Debian:
sudo apt update
sudo apt install build-essential

# macOS:
xcode-select --install

# Windows: Install Visual Studio Build Tools
```

**Error**: `error[E0554]: #[cfg(..)] is experimental`
```bash
# Solution: Update Rust toolchain
rustup update stable
rustup default stable

# Clean and rebuild
cargo clean
cargo build
```

**Error**: `failed to resolve: use of undeclared crate`
```bash
# Solution: Add missing dependencies to Cargo.toml
[dependencies]
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }

# Then rebuild
cargo build
```

#### TypeScript/Node.js Issues

**Error**: `Module not found: Can't resolve '@/components'`
```bash
# Solution: Check tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

# Restart TypeScript server in VS Code
# Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

**Error**: `Cannot find module 'react' or its corresponding type declarations`
```bash
# Solution: Install missing types
npm install --save-dev @types/react @types/react-dom

# Or reinstall everything
rm -rf node_modules package-lock.json
npm install
```

**Error**: `Vite build fails with memory error`
```bash
# Solution: Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Or use alternative build command
npm run build:dev
```

### 🧪 Testing Issues

#### Tests Failing

**Error**: `TypeError: Cannot read property 'addEventListener' of null`
```typescript
// Solution: Mock DOM elements in tests
import { render, screen } from '@testing-library/react';

// Setup proper test environment
beforeEach(() => {
  // Mock missing browser APIs
  Object.defineProperty(navigator, 'vibrate', {
    value: jest.fn(),
    writable: true
  });
});
```

**Error**: `Test timeout: WebSocket connection failed`
```bash
# Solution: Use mock WebSocket in tests
# In vitest.config.ts:
export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'],
    environment: 'jsdom'
  }
});

# In setup.ts:
class MockWebSocket {
  constructor() { /* mock implementation */ }
}

global.WebSocket = MockWebSocket;
```

#### Test Coverage Issues

**Issue**: Coverage reports showing 0%
```bash
# Solution: Configure Vitest coverage
npm install --save-dev @vitest/coverage-v8

# In vitest.config.ts:
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['node_modules/', 'src/test/']
    }
  }
});

# Run with coverage
npm run test -- --coverage
```

---

## 📱 Mobile-Specific Issues

### 🔋 iOS Safari Problems

#### Virtual Keyboard Issues

**Problem**: Keyboard covers terminal input
```typescript
// Solution: Adjust viewport on keyboard show/hide
import { useVisualViewport } from '@/hooks/useVisualViewport';

const TerminalComponent = () => {
  const { height: viewportHeight } = useVisualViewport();
  
  return (
    <div 
      style={{ 
        height: viewportHeight,
        paddingBottom: 'env(keyboard-inset-height)' 
      }}
    >
      {/* Terminal content */}
    </div>
  );
};
```

**Problem**: Input focus lost when keyboard appears
```typescript
// Solution: Force focus retention
const handleFocus = useCallback(() => {
  // Delay to allow keyboard animation
  setTimeout(() => {
    inputRef.current?.focus();
  }, 300);
}, []);

useEffect(() => {
  window.addEventListener('resize', handleFocus);
  return () => window.removeEventListener('resize', handleFocus);
}, [handleFocus]);
```

#### Touch Event Problems

**Problem**: Scrolling interferes with swipe gestures
```css
/* Solution: Precise touch-action control */
.terminal-container {
  touch-action: pan-y; /* Allow vertical scroll only */
  -webkit-overflow-scrolling: touch;
}

.tab-bar {
  touch-action: pan-x; /* Allow horizontal swipe only */
  overflow-x: auto;
  overflow-y: hidden;
}
```

**Problem**: Double-tap zoom on text
```css
/* Solution: Disable zooming */
.terminal-output {
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* In index.html meta tag: */
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

### 🤖 Android Chrome Issues

#### Performance Problems

**Problem**: Slow rendering on older Android devices
```typescript
// Solution: Reduce rendering complexity
const MobileOptimizedTerminal = () => {
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  
  useEffect(() => {
    // Detect low-end devices
    const memory = (navigator as any).deviceMemory;
    const cpu = (navigator as any).hardwareConcurrency;
    
    if (memory && memory < 4 || cpu && cpu < 4) {
      setIsLowEndDevice(true);
    }
  }, []);
  
  return (
    <Terminal 
      maxOutputLines={isLowEndDevice ? 100 : 1000}
      enableAnimations={!isLowEndDevice}
      useVirtualScrolling={true}
    />
  );
};
```

**Problem**: High battery usage
```typescript
// Solution: Optimize refresh rates
const useThrottledUpdates = () => {
  const [isBackgroundTab, setIsBackgroundTab] = useState(false);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsBackgroundTab(document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // Reduce update frequency when in background
  return isBackgroundTab ? 1000 : 16; // 1fps vs 60fps
};
```

---

## 🌐 Browser Compatibility

### 📊 Supported Browsers

| Browser | Version | Support Level | Notes |
|---------|---------|---------------|-------|
| Chrome | 90+ | ✅ Full | Recommended |
| Firefox | 88+ | ✅ Full | WebRTC issues on mobile |
| Safari | 14+ | 🟡 Partial | iOS gesture limitations |
| Edge | 90+ | ✅ Full | Same as Chrome |
| Samsung Internet | 14+ | 🟡 Partial | Touch events vary |

### 🚫 Unsupported Features by Browser

#### Safari Limitations
- **WebRTC DataChannels**: Limited support for P2P features
- **Service Workers**: Restricted in private browsing
- **Push Notifications**: Requires user gesture
- **Fullscreen API**: Limited on mobile

**Workarounds**:
```typescript
// Feature detection and fallbacks
const hasWebRTC = 'RTCPeerConnection' in window;
const hasServiceWorker = 'serviceWorker' in navigator;
const hasNotifications = 'Notification' in window;

if (!hasWebRTC) {
  // Fall back to WebSocket for real-time features
  useWebSocketFallback();
}

if (!hasServiceWorker) {
  // Use localStorage instead of cache API
  useLocalStorageFallback();
}
```

#### Firefox Issues
- **CSS Grid**: Older versions have layout bugs
- **Touch Events**: Different event ordering on mobile
- **WebGL**: Performance varies significantly

**Solutions**:
```css
/* Firefox-specific fixes */
@-moz-document url-prefix() {
  .terminal-grid {
    display: flex; /* Fallback for old grid support */
    flex-direction: column;
  }
}
```

---

## 🔒 Security & Privacy

### 🚫 Command Execution Security

#### Blocked Commands

The following commands are automatically blocked for security:

```bash
# Destructive operations
rm -rf /
sudo rm -rf
format C:

# Network security risks
curl ... | sh
wget ... | bash

# Privilege escalation
sudo su
su root

# System modification
chmod 777 /
chown root
```

**If you need these commands**:
1. **Development**: Use in safe containers or VMs
2. **Testing**: Mock the commands in test environment
3. **Production**: Consider if the command is actually necessary

#### Safe Alternatives

```bash
# Instead of dangerous rm
rm file.txt              # ✅ Safe: specific file
rm *.tmp                 # ✅ Safe: specific pattern
find . -name "*.tmp" -delete  # ✅ Safe: controlled deletion

# Instead of curl | sh
curl -o script.sh url    # ✅ Safe: download first
cat script.sh            # ✅ Safe: inspect content
chmod +x script.sh       # ✅ Safe: make executable
./script.sh              # ✅ Safe: run after inspection
```

### 💰 Privacy Considerations

#### Data Storage
- **Local Storage**: Terminal history, user preferences
- **Session Storage**: Temporary command state
- **IndexedDB**: Large output logs (cleared on session end)
- **Memory**: Active session data only

**What's NOT stored**:
- API keys or credentials
- File contents outside terminal
- Personal browsing data
- Cross-site information

#### AI Provider Privacy

When using AI features:
- **Commands sent**: Only terminal commands you explicitly send
- **API keys**: Stored locally, never transmitted to our servers
- **Conversations**: Managed by respective AI providers
- **Usage analytics**: Anonymized performance metrics only

**To disable AI features**:
```bash
# Remove API keys
unset ANTHROPIC_API_KEY
unset GEMINI_API_KEY
unset QWEN_API_KEY

# Disable in configuration
echo '{ "aiEnabled": false }' > ~/.config/rust-terminal-forge/config.json
```

---

## 🚑 Emergency Fixes

### 🖥️ Terminal Completely Broken

**Nuclear Option**: Complete reset
```bash
# 1. Stop all processes
pkill -f "rust-terminal-forge"
pkill -f "cargo"
pkill -f "vite"

# 2. Clear all data
rm -rf node_modules/
rm -rf target/
rm -rf dist/
rm package-lock.json
rm Cargo.lock

# 3. Fresh installation
git clean -fdx
git reset --hard HEAD
npm install
cargo build

# 4. Start fresh
npm run dev
```

### 📺 Browser Cache Issues

**Complete browser reset**:
1. **Chrome**: Settings → Privacy → Clear browsing data → "All time"
2. **Firefox**: Settings → Privacy → Clear Data → Check all boxes
3. **Safari**: Develop → Empty Caches (enable Develop menu first)

**Hard refresh shortcuts**:
- **Windows/Linux**: Ctrl + Shift + R
- **macOS**: Cmd + Shift + R
- **Mobile**: Pull down to refresh

### 🔧 System Resource Issues

**High CPU/Memory usage**:
```bash
# Find resource-heavy processes
top -p $(pgrep -d',' rust-terminal-forge)

# Kill specific processes
pkill -f "pty-server"
pkill -f "vite"

# Monitor resource usage
watch -n 1 'ps aux | grep rust-terminal-forge'
```

**Disk space issues**:
```bash
# Clean build artifacts
cargo clean
npm cache clean --force

# Clear logs
rm -rf ~/.cache/rust-terminal-forge/

# Check disk usage
du -sh target/ node_modules/ dist/
```

---

## ❓ Frequently Asked Questions

### 🎨 General Usage

#### Q: Can I use this as my main terminal?
**A**: Rust Terminal Forge is designed for development workflows and learning. For system administration or production work, use dedicated terminal applications like iTerm2, Windows Terminal, or GNOME Terminal.

#### Q: Does it work offline?
**A**: Basic terminal functionality works offline. AI features require internet connection. We're working on offline AI models for future releases.

#### Q: Can I customize the appearance?
**A**: Yes! The terminal supports:
- Custom themes and color schemes
- Font selection and sizing  
- Layout customization
- Mobile gesture configuration

See `src/theme.ts` for customization options.

#### Q: How do I save terminal sessions?
**A**: Sessions are automatically saved to localStorage. For permanent storage:
```bash
# Export session
history > my-session.txt

# Import session (manually copy commands)
cat my-session.txt
```

### 📱 Mobile Development

#### Q: Can I code on my phone?
**A**: Yes! Rust Terminal Forge is optimized for mobile development:
- Touch-friendly command interface
- Gesture navigation between tabs
- Virtual keyboard optimization
- Responsive design for all screen sizes

#### Q: Which mobile browsers work best?
**A**: **Chrome on Android** and **Safari on iOS** provide the best experience. Samsung Internet and Firefox Mobile have partial support.

#### Q: How do I handle keyboard shortcuts on mobile?
**A**: Use the gesture system:
- **Swipe left/right**: Switch tabs
- **Long press**: Context menu
- **Two-finger tap**: Command suggestions
- **Voice commands**: "Terminal, run ls" (experimental)

### 🤖 AI Integration

#### Q: Which AI provider should I use?
**A**: Depends on your use case:
- **Claude**: Complex reasoning, architecture design
- **Gemini**: Documentation, image analysis
- **Qwen**: Multilingual support, Chinese development

The system automatically selects the best available provider.

#### Q: Are my commands sent to AI providers?
**A**: Only when you explicitly use `ai` commands. Regular terminal commands stay local. You can disable AI features entirely if preferred.

#### Q: Can AI help with debugging?
**A**: Absolutely! Try:
```bash
ai "This command failed: npm test. Here's the error: [paste error]"
ai "How do I fix TypeScript error TS2345?"
ai "Optimize this slow database query: [paste query]"
```

### 🔧 Development & Contributing

#### Q: How do I contribute to the project?
**A**: See our [Developer Onboarding Guide](./DEVELOPER_ONBOARDING.md)! Start with:
1. Fork the repository
2. Choose a "good first issue" from GitHub
3. Follow the contribution guidelines
4. Submit a pull request

#### Q: What skills do I need to contribute?
**A**: We welcome all skill levels:
- **Beginners**: Documentation, testing, bug reports
- **Intermediate**: Frontend features, mobile optimizations
- **Advanced**: Architecture, AI integration, performance

#### Q: How do I test mobile features?
**A**: 
1. **Chrome DevTools**: Device simulation mode
2. **Real devices**: Use `npm run dev` and access via network IP
3. **Browser testing**: Multiple mobile browsers
4. **Automated testing**: Puppeteer mobile emulation

### 🔒 Security & Privacy

#### Q: Is it safe to use with sensitive projects?
**A**: For local development, yes. For production or sensitive data:
- Review command validation in `src/core/commands/`
- Audit AI provider integrations
- Consider running in isolated environments
- Don't store sensitive credentials in terminal history

#### Q: How do I report security issues?
**A**: **Do NOT create public GitHub issues for security vulnerabilities.**
Email security@rust-terminal-forge.dev with:
- Detailed vulnerability description
- Steps to reproduce
- Potential impact assessment
- Suggested fixes (if any)

---

## 📈 Performance Optimization

### 📊 Improving Terminal Performance

#### Large Output Handling
```typescript
// Optimize for large command output
const optimizeTerminalOutput = {
  // Limit visible lines
  maxVisibleLines: 1000,
  
  // Enable virtual scrolling
  useVirtualScrolling: true,
  
  // Throttle updates
  updateThrottleMs: 16, // 60fps
  
  // Lazy load history
  loadHistoryOnDemand: true
};
```

#### Memory Usage
```typescript
// Monitor and optimize memory
const monitorMemory = () => {
  const memory = (performance as any).memory;
  if (memory) {
    console.log({
      used: Math.round(memory.usedJSHeapSize / 1048576) + 'MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + 'MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + 'MB'
    });
  }
};

// Call periodically
setInterval(monitorMemory, 30000);
```

#### Network Optimization
```typescript
// Optimize WebSocket messages
const optimizeWebSocket = {
  // Batch small messages
  batchSize: 10,
  batchTimeout: 50,
  
  // Compress large messages
  compressionThreshold: 1024,
  
  // Heartbeat for connection health
  heartbeatInterval: 30000
};
```

### 📱 Mobile Performance

#### Touch Response Optimization
```css
/* Optimize touch responsiveness */
.touch-target {
  /* Minimum 44px touch targets */
  min-width: 44px;
  min-height: 44px;
  
  /* Reduce touch delay */
  touch-action: manipulation;
  
  /* Prevent scrolling interference */
  -webkit-touch-callout: none;
  
  /* Hardware acceleration */
  transform: translateZ(0);
  will-change: transform;
}
```

#### Battery Usage
```typescript
// Optimize for battery life
const batteryOptimization = {
  // Reduce animation frame rate when on battery
  adaptiveFrameRate: true,
  
  // Pause non-critical updates in background
  pauseInBackground: true,
  
  // Reduce polling frequency
  lowPowerPollingMs: 1000,
  normalPollingMs: 100
};
```

---

## 📞 Getting More Help

### 🆘 Support Channels

#### Immediate Help (Response within hours)
- **Discord**: [Live chat support](https://discord.gg/rust-terminal-forge)
- **GitHub Discussions**: [Q&A forum](https://github.com/rust-terminal-forge/discussions)

#### Detailed Help (Response within 1-2 days)
- **GitHub Issues**: [Bug reports and features](https://github.com/rust-terminal-forge/issues)
- **Email Support**: support@rust-terminal-forge.dev

#### Community Resources
- **Wiki**: [Comprehensive guides](https://github.com/rust-terminal-forge/wiki)
- **Blog**: [Technical deep-dives](https://blog.rust-terminal-forge.dev)
- **YouTube**: [Video tutorials](https://youtube.com/rust-terminal-forge)

### 📝 When Reporting Issues

**Include this information**:
```bash
# System information
uname -a                    # OS details
node --version             # Node.js version
npm --version              # npm version
rustc --version            # Rust version

# Browser information
# In browser console:
navigator.userAgent
navigator.platform
screen.width + 'x' + screen.height

# Application logs
# Check browser console for errors
# Check terminal output for warnings

# Steps to reproduce
# Exact commands that cause the issue
# Expected vs actual behavior
# Screenshots or screen recordings
```

**Issue Template**:
```markdown
## Bug Description
Clear description of what's wrong

## Steps to Reproduce
1. Start the application
2. Navigate to terminal
3. Run command: `ls`
4. Error occurs

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: macOS 14.1
- Browser: Chrome 119
- Node: 18.17.0
- Rust: 1.75.0

## Additional Context
Any other relevant information
```

---

**Remember**: Every issue helps improve Rust Terminal Forge for everyone! Don't hesitate to ask questions or report problems – our community is here to help. 🚀

---

**Last Updated**: 2025-07-25  
**Next Review**: 2025-08-25  
**Document Owner**: Support Team  
**Contributors**: Development team, Community members

*Found an issue with this guide? [Submit a fix!](https://github.com/rust-terminal-forge/issues/new)*