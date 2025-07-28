#!/usr/bin/env node
/**
 * ⚡ Performance Monitor - Rick's Scientific Performance Analysis
 * Monitors render times, memory usage, and frame rates
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const PERFORMANCE_TARGETS = {
  renderTime: 16, // <16ms for 60fps
  startupTime: 1000, // <1s startup
  memoryUsage: 100 * 1024 * 1024, // <100MB
  inputLatency: 10, // <10ms keystroke response
  bundleSize: 500 * 1024, // <500KB gzipped
  fps: 60, // 60fps minimum
  layoutShifts: 0.1 // <0.1 CLS score
};

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.resultsDir = path.join(__dirname, '../test-results/performance');
  }

  async initialize() {
    await this.ensureDir(this.resultsDir);
    console.log('⚡ Performance Monitor Initialized');
  }

  async runBenchmarks() {
    console.log('\n🚀 Starting Performance Benchmarks...');
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-web-security']
    });

    try {
      await this.testStartupPerformance(browser);
      await this.testRenderingPerformance(browser);
      await this.testInteractionPerformance(browser);
      await this.testMemoryUsage(browser);
      await this.testBundleSize();
      
      await this.generateReport();
      return this.validateTargets();
      
    } finally {
      await browser.close();
    }
  }

  async testStartupPerformance(browser) {
    console.log('📊 Testing startup performance...');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performanceMetrics = {
        startTime: performance.now(),
        loadEvents: []
      };
      
      window.addEventListener('load', () => {
        window.performanceMetrics.loadEvents.push({
          type: 'load',
          timestamp: performance.now()
        });
      });
    });

    const startTime = Date.now();
    
    try {
      await page.goto('http://localhost:8080', { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
      
      // Wait for terminal to be interactive
      await page.waitForSelector('.terminal-container', { timeout: 5000 });
      
      const endTime = Date.now();
      const startupTime = endTime - startTime;
      
      // Get browser performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });
      
      this.metrics.push({
        category: 'startup',
        startupTime,
        target: PERFORMANCE_TARGETS.startupTime,
        passed: startupTime < PERFORMANCE_TARGETS.startupTime,
        details: metrics
      });
      
      console.log(`  ⏱️ Startup time: ${startupTime}ms (target: <${PERFORMANCE_TARGETS.startupTime}ms)`);
      
    } finally {
      await context.close();
    }
  }

  async testRenderingPerformance(browser) {
    console.log('🎨 Testing rendering performance...');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.waitForSelector('.terminal-container');
    
    // Test frame rate during animation
    const frameMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const frames = [];
        let frameCount = 0;
        let startTime = performance.now();
        
        function measureFrame() {
          const currentTime = performance.now();
          frames.push(currentTime);
          frameCount++;
          
          if (frameCount < 120) { // Measure for ~2 seconds at 60fps
            requestAnimationFrame(measureFrame);
          } else {
            const totalTime = currentTime - startTime;
            const avgFrameTime = totalTime / frameCount;
            const fps = 1000 / avgFrameTime;
            
            resolve({
              frameCount,
              totalTime,
              avgFrameTime,
              fps,
              frames
            });
          }
        }
        
        // Trigger animation
        const terminal = document.querySelector('.terminal-input');
        if (terminal) {
          terminal.focus();
          terminal.value = 'testing animation performance';
        }
        
        requestAnimationFrame(measureFrame);
      });
    });
    
    // Test layout shift
    const layoutShiftScore = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => resolve(clsValue), 2000);
      });
    });
    
    this.metrics.push({
      category: 'rendering',
      avgFrameTime: frameMetrics.avgFrameTime,
      fps: frameMetrics.fps,
      layoutShiftScore,
      passed: frameMetrics.avgFrameTime < PERFORMANCE_TARGETS.renderTime && 
              frameMetrics.fps >= PERFORMANCE_TARGETS.fps &&
              layoutShiftScore < PERFORMANCE_TARGETS.layoutShifts,
      targets: {
        frameTime: PERFORMANCE_TARGETS.renderTime,
        fps: PERFORMANCE_TARGETS.fps,
        layoutShifts: PERFORMANCE_TARGETS.layoutShifts
      }
    });
    
    console.log(`  🎯 Frame time: ${frameMetrics.avgFrameTime.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.renderTime}ms)`);
    console.log(`  📊 FPS: ${frameMetrics.fps.toFixed(1)} (target: >${PERFORMANCE_TARGETS.fps})`);
    console.log(`  📐 Layout shift: ${layoutShiftScore.toFixed(3)} (target: <${PERFORMANCE_TARGETS.layoutShifts})`);
    
    await context.close();
  }

  async testInteractionPerformance(browser) {
    console.log('⌨️ Testing interaction performance...');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.waitForSelector('.terminal-container');
    
    // Test keystroke latency
    const inputLatencies = [];
    
    for (let i = 0; i < 10; i++) {
      const latency = await page.evaluate(() => {
        return new Promise((resolve) => {
          const input = document.querySelector('.terminal-input') || 
                       document.querySelector('input') ||
                       document.querySelector('textarea');
          
          if (!input) {
            resolve(0);
            return;
          }
          
          const startTime = performance.now();
          
          const handleInput = () => {
            const endTime = performance.now();
            const latency = endTime - startTime;
            input.removeEventListener('input', handleInput);
            resolve(latency);
          };
          
          input.addEventListener('input', handleInput);
          input.focus();
          input.value += 'x';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });
      });
      
      inputLatencies.push(latency);
      await page.waitForTimeout(100);
    }
    
    const avgInputLatency = inputLatencies.reduce((a, b) => a + b, 0) / inputLatencies.length;
    
    this.metrics.push({
      category: 'interaction',
      avgInputLatency,
      inputLatencies,
      target: PERFORMANCE_TARGETS.inputLatency,
      passed: avgInputLatency < PERFORMANCE_TARGETS.inputLatency
    });
    
    console.log(`  ⌨️ Input latency: ${avgInputLatency.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.inputLatency}ms)`);
    
    await context.close();
  }

  async testMemoryUsage(browser) {
    console.log('🧠 Testing memory usage...');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.waitForSelector('.terminal-container');
    
    // Simulate heavy usage
    await page.evaluate(() => {
      const terminal = document.querySelector('.terminal-input');
      if (terminal) {
        // Add a lot of content to stress test memory
        for (let i = 0; i < 100; i++) {
          terminal.value += `Line ${i}: Lorem ipsum dolor sit amet\n`;
        }
      }
    });
    
    // Wait for garbage collection
    await page.waitForTimeout(1000);
    
    const memoryMetrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (memoryMetrics) {
      this.metrics.push({
        category: 'memory',
        usedMemory: memoryMetrics.usedJSHeapSize,
        totalMemory: memoryMetrics.totalJSHeapSize,
        target: PERFORMANCE_TARGETS.memoryUsage,
        passed: memoryMetrics.usedJSHeapSize < PERFORMANCE_TARGETS.memoryUsage
      });
      
      const usedMB = Math.round(memoryMetrics.usedJSHeapSize / 1024 / 1024);
      const targetMB = Math.round(PERFORMANCE_TARGETS.memoryUsage / 1024 / 1024);
      
      console.log(`  🧠 Memory usage: ${usedMB}MB (target: <${targetMB}MB)`);
    }
    
    await context.close();
  }

  async testBundleSize() {
    console.log('📦 Testing bundle size...');
    
    try {
      const distPath = path.join(__dirname, '../dist');
      const bundleSize = await this.getDirectorySize(distPath);
      
      this.metrics.push({
        category: 'bundle',
        size: bundleSize,
        target: PERFORMANCE_TARGETS.bundleSize,
        passed: bundleSize < PERFORMANCE_TARGETS.bundleSize
      });
      
      const sizeMB = Math.round(bundleSize / 1024);
      const targetKB = Math.round(PERFORMANCE_TARGETS.bundleSize / 1024);
      
      console.log(`  📦 Bundle size: ${sizeMB}KB (target: <${targetKB}KB)`);
      
    } catch (error) {
      console.log(`  ❌ Could not measure bundle size: ${error.message}`);
    }
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Directory doesn't exist or is not accessible
    }
    
    return totalSize;
  }

  validateTargets() {
    const failedMetrics = this.metrics.filter(m => !m.passed);
    
    if (failedMetrics.length === 0) {
      console.log('\n✅ All performance targets met!');
      return true;
    } else {
      console.log('\n❌ Performance targets failed:');
      failedMetrics.forEach(metric => {
        console.log(`  - ${metric.category}: Failed performance requirements`);
      });
      return false;
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      targets: PERFORMANCE_TARGETS,
      metrics: this.metrics,
      summary: {
        total: this.metrics.length,
        passed: this.metrics.filter(m => m.passed).length,
        failed: this.metrics.filter(m => !m.passed).length
      }
    };
    
    const reportPath = path.join(this.resultsDir, 'performance-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(this.resultsDir, 'performance-report.html');
    await fs.writeFile(htmlPath, htmlReport);
    
    console.log(`\n📊 Performance report saved to: ${reportPath}`);
    return report;
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Report - Terminal Forge</title>
    <style>
        body { font-family: 'JetBrains Mono', monospace; margin: 20px; background: #1a1a1a; color: #fff; }
        .metric { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .passed { background: #1e3a2e; border-left: 4px solid #4ade80; }
        .failed { background: #3a1e1e; border-left: 4px solid #ef4444; }
        .summary { margin: 20px 0; padding: 15px; background: #2a2a2a; border-radius: 5px; }
        h1, h2 { color: #4ade80; }
        .target { color: #94a3b8; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>🚀 Performance Report - Terminal Forge</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Generated: ${report.timestamp}</p>
        <p>Total tests: ${report.summary.total}</p>
        <p>✅ Passed: ${report.summary.passed}</p>
        <p>❌ Failed: ${report.summary.failed}</p>
        <p>Success rate: ${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%</p>
    </div>
    
    <h2>Metrics</h2>
    ${report.metrics.map(metric => `
        <div class="metric ${metric.passed ? 'passed' : 'failed'}">
            <strong>${metric.category.toUpperCase()}</strong>
            ${metric.passed ? '✅' : '❌'}
            <div class="target">Target: ${JSON.stringify(metric.target || metric.targets)}</div>
            <pre>${JSON.stringify(metric, null, 2)}</pre>
        </div>
    `).join('')}
</body>
</html>
    `;
  }

  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

// CLI execution
async function main() {
  const monitor = new PerformanceMonitor();
  await monitor.initialize();
  
  const success = await monitor.runBenchmarks();
  
  // Exit with error code if performance targets not met
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PerformanceMonitor, PERFORMANCE_TARGETS };