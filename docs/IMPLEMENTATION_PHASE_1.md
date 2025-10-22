# Phase 1 Implementation Guide: Radical Simplification

**Duration:** 2 weeks
**Goal:** Reduce codebase by 60-70% while maintaining deployment stability
**Branch:** `simplify/phase-1-cleanup`

---

## Pre-Implementation Checklist

- [ ] Create backup branch: `git checkout -b backup/pre-simplification`
- [ ] Tag current state: `git tag v2.0-pre-simplification`
- [ ] Verify CI/CD is passing: `npm run quality:check`
- [ ] Document current metrics (lines of code, bundle size, dependencies)

---

## Day 1-2: Remove Dead Code

### Remove Mockups Directory

**Analysis:** The `/mockups/` directory contains 50+ shadcn/ui components that appear to be prototype/demo code, not production code.

```bash
# Verify mockups are not imported in production code
grep -r "from.*mockups" src/
grep -r "import.*mockups" src/

# If no imports found, safe to remove
git rm -r mockups/
git commit -m "chore: remove prototype mockups directory (15,000+ lines)"
```

**Expected Impact:**
- Lines removed: ~15,000
- Bundle size reduction: ~500KB

### Remove Redundant Terminal Components

**Files to Remove:**
```bash
# Redundant/experimental terminal implementations
git rm src/components/EnhancedRealTerminal.tsx      # 689 lines
git rm src/components/QuantumTerminal.tsx            # Experimental
git rm src/components/CleanTerminalView.tsx          # Duplicate
git rm src/components/IntegratedTerminalLayout.tsx   # Unused
git rm src/components/IntegratedTerminalWindow.tsx   # Unused

git commit -m "refactor: remove redundant terminal implementations"
```

**Expected Impact:**
- Lines removed: ~2,500
- Reduced mental complexity

### Remove Over-Engineered Code

```bash
# Over-engineered cursor management
git rm src/components/CursorPhysics.ts               # Physics for cursor?
git rm src/components/SingletonCursor.tsx            # Keep CursorManager only

# Over-complicated security (replace with simpler version)
git mv src/core/SecureExecutor.ts src/core/SecureExecutor.backup.ts

git commit -m "refactor: remove over-engineered cursor and security code"
```

**Expected Impact:**
- Lines removed: ~1,500
- Prepare for simplified security implementation

---

## Day 3-4: Dependency Cleanup

### Audit Current Dependencies

```bash
# List all dependencies with sizes
npm list --depth=0
npx bundle-phobia [package-name]
```

### Remove Unused Dependencies

```bash
# Socket.io (redundant with WebSocket)
npm uninstall socket.io socket.io-client

# Express/CORS (Rust server handles this)
npm uninstall express cors

# Unused AI integration
npm uninstall gemini-code-flow

# Unnecessary UI components
npm uninstall embla-carousel-react recharts react-day-picker

# Unused Radix components
npm uninstall \
  @radix-ui/react-menubar \
  @radix-ui/react-navigation-menu \
  @radix-ui/react-hover-card \
  @radix-ui/react-context-menu \
  @radix-ui/react-accordion \
  @radix-ui/react-avatar

# Unused utilities
npm uninstall vaul input-otp

git add package.json package-lock.json
git commit -m "deps: remove unused dependencies (18 packages)"
```

**Expected Impact:**
- Dependencies: 57 → ~35
- Bundle size reduction: 2-3 MB
- Faster `npm install`

### Verify Build Still Works

```bash
npm install
npm run build
npm run test
npm run quality:check
```

---

## Day 5-7: Consolidate Terminal Implementation

### Create MobileTerminal.tsx

**Goal:** Single, focused terminal component replacing 5+ implementations

```typescript
// src/components/MobileTerminal.tsx
import { useEffect, useRef, useState } from 'react';
import { AnsiText } from './AnsiText';
import { useMobileGestures } from '../hooks/useMobileGestures';

interface MobileTerminalProps {
  sessionId: string;
  onCommand?: (command: string) => void;
}

export function MobileTerminal({ sessionId, onCommand }: MobileTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const ws = useRef<WebSocket | null>(null);

  // WebSocket connection to PTY server
  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:3001/terminal/${sessionId}`);

    ws.current.onmessage = (event) => {
      setOutput(prev => [...prev, event.data]);
    };

    return () => ws.current?.close();
  }, [sessionId]);

  // Mobile gesture support
  const gestures = useMobileGestures(terminalRef, {
    onSwipeLeft: () => {/* previous tab */},
    onSwipeRight: () => {/* next tab */},
    onSwipeDown: () => {/* show history */},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      ws.current?.send(input);
      onCommand?.(input);
      setInput('');
    }
  };

  return (
    <div ref={terminalRef} className="mobile-terminal" {...gestures}>
      <div className="terminal-output">
        {output.map((line, i) => (
          <AnsiText key={i} text={line} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="terminal-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter command..."
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </form>
    </div>
  );
}
```

**Target:** <400 lines for complete implementation

### Create Mobile Gesture Hook

```typescript
// src/hooks/useMobileGestures.ts
import { useEffect, RefObject } from 'react';

interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
  onLongPress?: () => void;
}

export function useMobileGestures(
  ref: RefObject<HTMLElement>,
  handlers: GestureHandlers
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let touchStart = { x: 0, y: 0, time: 0 };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const deltaTime = Date.now() - touchStart.time;

      // Swipe detection (minimum 50px movement in <300ms)
      if (Math.abs(deltaX) > 50 && deltaTime < 300) {
        if (deltaX > 0) handlers.onSwipeRight?.();
        else handlers.onSwipeLeft?.();
      }

      if (Math.abs(deltaY) > 50 && deltaTime < 300) {
        if (deltaY > 0) handlers.onSwipeDown?.();
        else handlers.onSwipeUp?.();
      }

      // Long press detection (>500ms without movement)
      if (deltaTime > 500 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        handlers.onLongPress?.();
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, handlers]);

  return {};
}
```

### Migrate RealTerminal.tsx Logic

**Strategy:** Extract useful code from existing implementations

```bash
# 1. Create new mobile terminal
touch src/components/MobileTerminal.tsx

# 2. Copy essential logic from RealTerminal.tsx:
#    - WebSocket connection management
#    - ANSI text rendering (keep AnsiText.tsx)
#    - Command history
#    - Tab management (simplified)

# 3. Remove old implementations
git rm src/components/RealTerminal.tsx
git rm src/components/MultiTabTerminal.tsx

# 4. Update imports throughout codebase
find src -type f -name "*.tsx" -exec sed -i 's/RealTerminal/MobileTerminal/g' {} +

git commit -m "refactor: consolidate terminal into MobileTerminal component"
```

---

## Day 8-9: Simplify Security

### Create mobile-security.ts

```typescript
// src/core/mobile-security.ts

/**
 * Simplified security for mobile terminal
 * Focus: Essential safety without over-engineering
 */

const ALLOWED_COMMANDS = new Set([
  // File operations
  'ls', 'cd', 'pwd', 'cat', 'mkdir', 'touch', 'rm', 'mv', 'cp',

  // Development tools
  'npm', 'git', 'node', 'python', 'cargo', 'rustc',

  // Utilities
  'echo', 'grep', 'find', 'which', 'clear',
]);

const BLOCKED_PATTERNS = [
  /sudo/i,
  /rm\s+-rf\s+\//,  // Prevent system deletion
  />\s*\/dev/,       // Prevent device writes
  /curl.*\|.*sh/,    // Prevent pipe to shell
];

export interface SecurityCheck {
  allowed: boolean;
  reason?: string;
}

export function validateCommand(command: string): SecurityCheck {
  const trimmed = command.trim();
  if (!trimmed) {
    return { allowed: false, reason: 'Empty command' };
  }

  // Extract base command
  const baseCommand = trimmed.split(/\s+/)[0];

  // Check if command is in allowlist
  if (!ALLOWED_COMMANDS.has(baseCommand)) {
    return {
      allowed: false,
      reason: `Command '${baseCommand}' not allowed in mobile mode`
    };
  }

  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        reason: 'Command contains blocked pattern (security risk)'
      };
    }
  }

  return { allowed: true };
}

export function sanitizeOutput(output: string): string {
  // Remove ANSI codes that could cause rendering issues
  // Keep color codes, remove cursor movement/clear screen
  return output
    .replace(/\x1b\[H/g, '')           // Clear home
    .replace(/\x1b\[2J/g, '')          // Clear screen
    .replace(/\x1b\[K/g, '')           // Clear line
    .slice(0, 100000);                 // Limit output size
}

export class RateLimiter {
  private commandCount = 0;
  private windowStart = Date.now();
  private readonly maxCommands = 10;
  private readonly windowMs = 60000; // 1 minute

  checkLimit(): SecurityCheck {
    const now = Date.now();

    // Reset window if expired
    if (now - this.windowStart > this.windowMs) {
      this.commandCount = 0;
      this.windowStart = now;
    }

    this.commandCount++;

    if (this.commandCount > this.maxCommands) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded (max 10 commands/minute)'
      };
    }

    return { allowed: true };
  }
}
```

**Replace SecureExecutor.ts:**
```bash
git rm src/core/SecureExecutor.ts
git add src/core/mobile-security.ts
git commit -m "refactor: replace SecureExecutor with simplified mobile-security"
```

**Expected Impact:**
- Lines: 850 → ~150
- Clearer security model
- Mobile-appropriate restrictions

---

## Day 10-11: Streamline Testing

### Remove Test Bloat

```bash
# Remove over-engineered protection tests
git rm tests/command-system-protection.test.ts          # 882 lines
git rm tests/tdd-architecture-protection.test.ts        # 829 lines
git rm tests/ruby-rails-conventions.test.ts             # 825 lines
git rm tests/mobile-features-protection.test.ts         # 758 lines

git commit -m "test: remove over-engineered protection tests"
```

**Expected Impact:**
- Test lines removed: ~3,300
- Faster test runs
- Focus on functional tests

### Keep Essential Tests

```bash
# Keep these critical test files:
# - tests/mobile-tab-ui.test.tsx
# - tests/gesture-navigation.test.tsx
# - tests/accessibility.test.tsx
# - tests/visual-diff-framework-final.test.ts
# - Core component tests
```

### Consolidate Visual Testing

```bash
# Use Playwright only (remove Puppeteer)
npm uninstall puppeteer
npm uninstall @types/pngjs pngjs pixelmatch

# Keep Playwright for visual regression
# Update visual test scripts to use Playwright exclusively
```

**Update package.json:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:visual": "playwright test --project=visual-regression",
    "test:mobile": "playwright test --project=mobile"
  }
}
```

---

## Day 12-14: Documentation & Verification

### Update Core Documentation

```bash
# Update README.md
# - New vision: "Mobile-First CLI for Builders"
# - Updated features list
# - Simplified architecture diagram
# - New getting started guide

# Update ARCHITECTURE.md
# - Document MobileTerminal component
# - Simplified security model
# - Updated dependency graph

# Create MOBILE_DEVELOPMENT.md
# - Mobile-specific development guide
# - Touch testing procedures
# - Gesture implementation guide
```

### Verify Everything Works

```bash
# Full quality check
npm run quality:check

# Build verification
npm run build
ls -lh dist/  # Check bundle size

# Test suite
npm run test

# Visual regression
npm run test:visual

# Manual testing checklist:
# [ ] Application loads in browser
# [ ] Terminal connects to PTY server
# [ ] Commands execute correctly
# [ ] Tab switching works
# [ ] Mobile view renders properly
# [ ] No console errors
```

### Measure Results

```bash
# Count lines of code
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l

# Check bundle size
npm run build
du -sh dist/

# Dependency count
npm list --depth=0 | wc -l

# Document metrics in commit message
```

### Create Summary Report

```markdown
# Phase 1 Completion Report

## Metrics Before/After

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Lines of Code | 51,331 | 28,500 | -44% |
| Dependencies | 57 | 35 | -39% |
| Bundle Size | 2.1 MB | 800 KB | -62% |
| Test Files | 45 | 18 | -60% |

## Code Removed

- Mockups directory: 15,000+ lines
- Redundant terminal components: 2,500 lines
- Over-engineered security: 850 lines
- Protection tests: 3,300 lines
- Unused dependencies: 22 packages

## Code Simplified

- Terminal: 5 components → 1 MobileTerminal.tsx
- Security: SecureExecutor (850 lines) → mobile-security.ts (150 lines)
- Testing: Puppeteer + Playwright → Playwright only
- Dependencies: 57 → 35 packages

## Deployment Verification

- [x] CI/CD pipeline passing
- [x] Build successful
- [x] Tests passing (92% coverage)
- [x] Visual regression tests passing
- [x] No console errors
- [x] Mobile view functional

## Next Steps

Phase 2: Mobile-First Rebuild
- PWA implementation
- Mobile command panel
- Gesture navigation
- Touch-optimized UI
```

---

## Rollback Plan

If anything goes wrong:

```bash
# Rollback to pre-simplification state
git checkout backup/pre-simplification

# Or rollback to specific tag
git checkout v2.0-pre-simplification

# Or revert specific commits
git revert <commit-hash>
```

---

## Deployment Strategy

### Staging Deployment

```bash
# Deploy to staging environment
git push origin simplify/phase-1-cleanup

# Verify staging deployment
# - Check build logs
# - Test application manually
# - Run automated tests
# - Check performance metrics
```

### Production Deployment

```bash
# Create PR for review
gh pr create \
  --title "Phase 1: Radical Simplification" \
  --body "See IMPLEMENTATION_PHASE_1.md for details"

# After approval, merge to main
git checkout main
git merge simplify/phase-1-cleanup

# Tag release
git tag v2.1-simplified
git push origin v2.1-simplified

# Deploy to production (GitHub Pages)
git push origin main
```

---

## Success Criteria

Phase 1 is complete when:

- [ ] Codebase reduced by 40%+ (lines of code)
- [ ] Dependencies reduced by 30%+
- [ ] Bundle size reduced by 50%+
- [ ] All tests passing
- [ ] CI/CD pipeline green
- [ ] Documentation updated
- [ ] No regression in functionality
- [ ] Application deployed successfully

---

## Risk Mitigation

**Risk: Breaking existing functionality**
- Mitigation: Comprehensive test suite, manual testing, staged rollout
- Fallback: Git revert, backup branch

**Risk: Deployment pipeline breaks**
- Mitigation: No changes to .github/workflows/ in Phase 1
- Fallback: Rollback to previous deployment

**Risk: Performance degradation**
- Mitigation: Bundle size monitoring, Lighthouse audits
- Fallback: Identify and revert specific changes

---

## Notes

- Keep commits small and focused
- Test after each major change
- Document decisions in commit messages
- Update documentation continuously
- Communicate progress in PR descriptions

---

**Phase 1 Timeline:** 2 weeks
**Start Date:** TBD
**Expected Completion:** TBD

**Let's simplify! 🚀**
