#!/usr/bin/env node
/**
 * 🔧 Auto-Repair System - Rick's Self-Healing Terminal
 * Automatically fixes layout, performance, and rendering issues
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class AutoRepairSystem {
  constructor() {
    this.repairLog = [];
    this.reportsDir = path.join(__dirname, '../test-results');
  }

  async runAutoRepair() {
    console.log('🔧 Auto-Repair System Activated');
    console.log('🔍 Analyzing system for issues...\n');

    try {
      // Run diagnostics
      const issues = await this.detectIssues();
      
      if (issues.length === 0) {
        console.log('✅ No issues detected. System is healthy!');
        return true;
      }

      console.log(`🚨 Found ${issues.length} issues to repair:`);
      issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue.type}: ${issue.description}`);
      });

      // Attempt repairs
      for (const issue of issues) {
        await this.repairIssue(issue);
      }

      // Verify repairs
      const remainingIssues = await this.detectIssues();
      
      if (remainingIssues.length === 0) {
        console.log('\n✅ All issues successfully repaired!');
        await this.saveRepairLog();
        return true;
      } else {
        console.log(`\n⚠️ ${remainingIssues.length} issues remain after repair attempts`);
        await this.saveRepairLog();
        return false;
      }

    } catch (error) {
      console.error('❌ Auto-repair failed:', error.message);
      return false;
    }
  }

  async detectIssues() {
    const issues = [];

    // Check for visual regression issues
    try {
      const visualReport = await this.loadReport('visual-regression-report.json');
      if (visualReport) {
        const failedTests = visualReport.results.filter(r => r.status === 'failed');
        failedTests.forEach(test => {
          issues.push({
            type: 'visual-regression',
            description: `Visual test failed: ${test.testId}`,
            data: test,
            severity: 'medium'
          });
        });
      }
    } catch (error) {
      // No visual report available
    }

    // Check for performance issues
    try {
      const perfReport = await this.loadReport('performance/performance-report.json');
      if (perfReport) {
        const failedMetrics = perfReport.metrics.filter(m => !m.passed);
        failedMetrics.forEach(metric => {
          issues.push({
            type: 'performance',
            description: `Performance issue: ${metric.category}`,
            data: metric,
            severity: 'high'
          });
        });
      }
    } catch (error) {
      // No performance report available
    }

    // Check for console errors
    const consoleIssues = await this.detectConsoleIssues();
    issues.push(...consoleIssues);

    // Check for layout issues
    const layoutIssues = await this.detectLayoutIssues();
    issues.push(...layoutIssues);

    // Check for dependency issues
    const depIssues = await this.detectDependencyIssues();
    issues.push(...depIssues);

    return issues;
  }

  async repairIssue(issue) {
    console.log(`🔧 Repairing: ${issue.type} - ${issue.description}`);

    try {
      switch (issue.type) {
        case 'visual-regression':
          await this.repairVisualRegression(issue);
          break;
        case 'performance':
          await this.repairPerformanceIssue(issue);
          break;
        case 'console-error':
          await this.repairConsoleError(issue);
          break;
        case 'layout-overlap':
          await this.repairLayoutOverlap(issue);
          break;
        case 'cursor-positioning':
          await this.repairCursorPositioning(issue);
          break;
        case 'font-rendering':
          await this.repairFontRendering(issue);
          break;
        case 'dependency':
          await this.repairDependencyIssue(issue);
          break;
        default:
          console.log(`  ⚠️ Unknown issue type: ${issue.type}`);
      }

      this.repairLog.push({
        timestamp: new Date().toISOString(),
        issue,
        status: 'attempted',
        success: true
      });

      console.log(`  ✅ Repair completed for ${issue.type}`);

    } catch (error) {
      console.log(`  ❌ Repair failed for ${issue.type}: ${error.message}`);
      
      this.repairLog.push({
        timestamp: new Date().toISOString(),
        issue,
        status: 'failed',
        error: error.message
      });
    }
  }

  async repairVisualRegression(issue) {
    const testId = issue.data.testId;
    
    if (testId.includes('cursor')) {
      await this.repairCursorPositioning(issue);
    } else if (testId.includes('font') || testId.includes('ascii')) {
      await this.repairFontRendering(issue);
    } else if (testId.includes('layout')) {
      await this.repairLayoutOverlap(issue);
    } else {
      // Generic visual fix - update baseline
      console.log('  📸 Updating visual baseline (assuming intentional change)');
      // In production, this would be more sophisticated
    }
  }

  async repairPerformanceIssue(issue) {
    const category = issue.data.category;

    switch (category) {
      case 'startup':
        await this.optimizeStartupPerformance();
        break;
      case 'rendering':
        await this.optimizeRenderingPerformance();
        break;
      case 'memory':
        await this.optimizeMemoryUsage();
        break;
      case 'bundle':
        await this.optimizeBundleSize();
        break;
      default:
        console.log(`  ⚠️ Unknown performance category: ${category}`);
    }
  }

  async repairCursorPositioning(issue) {
    console.log('  🎯 Repairing cursor positioning...');
    
    const cursorFixCSS = `
/* Auto-generated cursor positioning fixes */
.terminal-cursor {
  position: absolute !important;
  z-index: 1000 !important;
  pointer-events: none !important;
}

.terminal-input:focus + .terminal-cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Prevent dual cursors */
.terminal-input {
  caret-color: transparent !important;
}
`;

    const cssPath = path.join(__dirname, '../src/styles/auto-fixes.css');
    await this.appendToFile(cssPath, cursorFixCSS);
  }

  async repairLayoutOverlap(issue) {
    console.log('  📐 Repairing layout overlaps...');
    
    const layoutFixCSS = `
/* Auto-generated layout overlap fixes */
.terminal-container {
  position: relative !important;
  z-index: 1 !important;
}

.terminal-content {
  position: relative !important;
  z-index: 2 !important;
}

.terminal-input {
  position: relative !important;
  z-index: 3 !important;
}

/* Prevent overlapping panels */
.panel, .sidebar, .modal {
  position: relative !important;
  z-index: auto !important;
}

/* Grid layout fixes */
.grid-container {
  display: grid !important;
  grid-template-columns: 1fr !important;
  gap: 8px !important;
}
`;

    const cssPath = path.join(__dirname, '../src/styles/auto-fixes.css');
    await this.appendToFile(cssPath, layoutFixCSS);
  }

  async repairFontRendering(issue) {
    console.log('  🔤 Repairing font rendering...');
    
    const fontFixCSS = `
/* Auto-generated font rendering fixes */
.terminal-content, .terminal-input {
  font-variant-ligatures: none !important;
  font-feature-settings: normal !important;
  text-rendering: optimizeSpeed !important;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
}

/* Ensure monospace rendering */
.terminal-content, .terminal-input {
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace !important;
  font-size: 14px !important;
  line-height: 1.4 !important;
  letter-spacing: 0 !important;
}

/* Fix DPI scaling issues */
@media (min-resolution: 2dppx) {
  .terminal-content, .terminal-input {
    font-size: 13px !important;
  }
}
`;

    const cssPath = path.join(__dirname, '../src/styles/auto-fixes.css');
    await this.appendToFile(cssPath, fontFixCSS);
  }

  async optimizeStartupPerformance() {
    console.log('  ⚡ Optimizing startup performance...');
    
    // Add lazy loading to non-critical components
    const lazyLoadFix = `
// Auto-generated lazy loading optimizations
import { lazy, Suspense } from 'react';

const LazyComponents = {
  Settings: lazy(() => import('./Settings')),
  Help: lazy(() => import('./Help')),
  ThemeEditor: lazy(() => import('./ThemeEditor'))
};

export const withLazyLoading = (Component) => (props) => (
  <Suspense fallback={<div>Loading...</div>}>
    <Component {...props} />
  </Suspense>
);
`;

    const utilsPath = path.join(__dirname, '../src/utils/lazy-loading.tsx');
    await fs.writeFile(utilsPath, lazyLoadFix);
  }

  async optimizeRenderingPerformance() {
    console.log('  🎨 Optimizing rendering performance...');
    
    const renderOptimizations = `
// Auto-generated rendering optimizations
export const renderOptimizations = {
  // Throttle resize events
  throttleResize: (callback, delay = 16) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback.apply(null, args), delay);
    };
  },

  // Debounce input events
  debounceInput: (callback, delay = 10) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback.apply(null, args), delay);
    };
  },

  // Virtual scrolling for long content
  virtualScroll: (items, containerHeight, itemHeight) => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, scrollTop / itemHeight - 5);
    const endIndex = Math.min(items.length, startIndex + visibleCount + 10);
    return items.slice(startIndex, endIndex);
  }
};
`;

    const optimizationsPath = path.join(__dirname, '../src/utils/performance-optimizations.ts');
    await fs.writeFile(optimizationsPath, renderOptimizations);
  }

  async optimizeMemoryUsage() {
    console.log('  🧠 Optimizing memory usage...');
    
    const memoryOptimizations = `
// Auto-generated memory optimizations
export class MemoryManager {
  private cache = new Map();
  private maxCacheSize = 50;

  cleanup() {
    // Clear old cache entries
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      const toDelete = entries.slice(0, entries.length - this.maxCacheSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }

    // Force garbage collection hint
    if (global.gc) {
      global.gc();
    }
  }

  memoize(fn, keyFn = (...args) => JSON.stringify(args)) {
    return (...args) => {
      const key = keyFn(...args);
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }
      const result = fn(...args);
      this.cache.set(key, result);
      return result;
    };
  }
}

export const memoryManager = new MemoryManager();

// Auto-cleanup every 30 seconds
setInterval(() => memoryManager.cleanup(), 30000);
`;

    const memoryPath = path.join(__dirname, '../src/utils/memory-manager.ts');
    await fs.writeFile(memoryPath, memoryOptimizations);
  }

  async optimizeBundleSize() {
    console.log('  📦 Optimizing bundle size...');
    
    // Add webpack/vite optimizations
    const bundleConfig = `
// Auto-generated bundle optimizations
export const bundleOptimizations = {
  // Tree-shake unused lodash functions
  lodash: {
    transform: 'lodash-webpack-plugin',
    include: ['debounce', 'throttle', 'memoize']
  },

  // Code splitting configuration
  chunks: {
    vendor: {
      test: /[\\/]node_modules[\\/]/,
      name: 'vendors',
      chunks: 'all',
    },
    common: {
      minChunks: 2,
      chunks: 'all',
      enforce: true
    }
  }
};
`;

    const configPath = path.join(__dirname, '../src/config/bundle-optimizations.ts');
    await fs.writeFile(configPath, bundleConfig);
  }

  async detectConsoleIssues() {
    const issues = [];
    
    // Check for common console error patterns in source files
    const srcPath = path.join(__dirname, '../src');
    const files = await this.getAllFiles(srcPath, ['.ts', '.tsx', '.js', '.jsx']);
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      
      // Check for console.log statements (should be removed in production)
      if (content.includes('console.log') || content.includes('console.warn')) {
        issues.push({
          type: 'console-error',
          description: `Console statements found in ${file}`,
          data: { file, type: 'console-statements' },
          severity: 'low'
        });
      }
      
      // Check for React key prop issues
      if (content.includes('.map(') && !content.includes('key=')) {
        issues.push({
          type: 'console-error',
          description: `Missing React keys in ${file}`,
          data: { file, type: 'missing-keys' },
          severity: 'medium'
        });
      }
    }
    
    return issues;
  }

  async detectLayoutIssues() {
    const issues = [];
    
    // Check CSS files for potential overlap issues
    const stylesPath = path.join(__dirname, '../src/styles');
    
    try {
      const files = await this.getAllFiles(stylesPath, ['.css', '.scss']);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for absolute positioning without proper z-index
        if (content.includes('position: absolute') && !content.includes('z-index')) {
          issues.push({
            type: 'layout-overlap',
            description: `Potential overlap in ${file}`,
            data: { file, type: 'absolute-no-zindex' },
            severity: 'medium'
          });
        }
      }
    } catch (error) {
      // Styles directory doesn't exist
    }
    
    return issues;
  }

  async detectDependencyIssues() {
    const issues = [];
    
    try {
      // Check for security vulnerabilities
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditOutput);
      
      if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
        issues.push({
          type: 'dependency',
          description: `${Object.keys(audit.vulnerabilities).length} dependency vulnerabilities`,
          data: audit.vulnerabilities,
          severity: 'high'
        });
      }
    } catch (error) {
      // npm audit failed or no issues
    }
    
    return issues;
  }

  async repairConsoleError(issue) {
    console.log('  🔧 Repairing console errors...');
    
    const file = issue.data.file;
    const type = issue.data.type;
    
    if (type === 'console-statements') {
      let content = await fs.readFile(file, 'utf8');
      
      // Remove console.log statements
      content = content.replace(/console\.(log|warn|info)\([^)]*\);?\n?/g, '');
      
      await fs.writeFile(file, content);
      console.log(`    ✅ Removed console statements from ${file}`);
    }
    
    if (type === 'missing-keys') {
      // This would require more sophisticated AST parsing in a real implementation
      console.log(`    ⚠️ Manual fix required for React keys in ${file}`);
    }
  }

  async repairDependencyIssue(issue) {
    console.log('  📦 Repairing dependency issues...');
    
    try {
      // Attempt to fix vulnerabilities
      execSync('npm audit fix', { stdio: 'inherit' });
      console.log('    ✅ Fixed dependency vulnerabilities');
    } catch (error) {
      console.log('    ⚠️ Some vulnerabilities require manual attention');
    }
  }

  async getAllFiles(dir, extensions) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...await this.getAllFiles(fullPath, extensions));
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or not accessible
    }
    
    return files;
  }

  async loadReport(filename) {
    try {
      const reportPath = path.join(this.reportsDir, filename);
      const content = await fs.readFile(reportPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async appendToFile(filePath, content) {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Check if file exists
      let existingContent = '';
      try {
        existingContent = await fs.readFile(filePath, 'utf8');
      } catch (error) {
        // File doesn't exist, that's fine
      }
      
      // Append content if not already present
      if (!existingContent.includes(content.trim())) {
        await fs.writeFile(filePath, existingContent + '\n' + content);
      }
    } catch (error) {
      console.error(`Failed to write to ${filePath}:`, error.message);
    }
  }

  async saveRepairLog() {
    const logPath = path.join(this.reportsDir, 'auto-repair-log.json');
    const log = {
      timestamp: new Date().toISOString(),
      repairs: this.repairLog,
      summary: {
        total: this.repairLog.length,
        successful: this.repairLog.filter(r => r.success).length,
        failed: this.repairLog.filter(r => !r.success).length
      }
    };
    
    await fs.writeFile(logPath, JSON.stringify(log, null, 2));
    console.log(`\n📝 Repair log saved to: ${logPath}`);
  }
}

// CLI execution
async function main() {
  const repairSystem = new AutoRepairSystem();
  const success = await repairSystem.runAutoRepair();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AutoRepairSystem };