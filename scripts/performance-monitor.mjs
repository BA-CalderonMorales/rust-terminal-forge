#!/usr/bin/env node
/**
 * Performance Monitoring Script
 * Validates performance targets and mobile optimization
 */

import { chromium } from 'playwright';
import fs from 'fs';

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.thresholds = {
      fcp: 1500, // First Contentful Paint
      lcp: 2500, // Largest Contentful Paint
      cls: 0.1,  // Cumulative Layout Shift
      fid: 100,  // First Input Delay
      loadTime: 3000 // Page Load Time
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    
    const prefix = {
      info: '📊',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };

    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
  }

  async measurePerformance(url = 'http://localhost:4173') {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Start performance monitoring
      await page.coverage.startJSCoverage();
      await page.coverage.startCSSCoverage();
      
      const startTime = Date.now();
      await page.goto(url, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Get Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {};
          
          // First Contentful Paint
          const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
          vitals.fcp = fcpEntry?.startTime || 0;
          
          // Largest Contentful Paint
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              vitals.lcp = entries[entries.length - 1].startTime;
            }
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          
          // Layout shifts
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            vitals.cls = clsValue;
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });
          
          setTimeout(() => {
            observer.disconnect();
            clsObserver.disconnect();
            resolve(vitals);
          }, 3000);
        });
      });
      
      // Stop coverage and calculate usage
      const [jsCoverage, cssCoverage] = await Promise.all([
        page.coverage.stopJSCoverage(),
        page.coverage.stopCSSCoverage()
      ]);
      
      const jsUsed = jsCoverage.reduce((acc, entry) => acc + entry.usedBytes, 0);
      const jsTotal = jsCoverage.reduce((acc, entry) => acc + entry.totalBytes, 0);
      const cssUsed = cssCoverage.reduce((acc, entry) => acc + entry.usedBytes, 0);
      const cssTotal = cssCoverage.reduce((acc, entry) => acc + entry.totalBytes, 0);
      
      this.metrics = {
        loadTime,
        fcp: webVitals.fcp,
        lcp: webVitals.lcp,
        cls: webVitals.cls,
        jsUsage: (jsUsed / jsTotal) * 100,
        cssUsage: (cssUsed / cssTotal) * 100,
        jsTotal: jsTotal / 1024, // KB
        cssTotal: cssTotal / 1024 // KB
      };
      
      await browser.close();
      return this.metrics;
      
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async testMobilePerformance() {
    const browser = await chromium.launch({ headless: true });
    
    const devices = [
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'Galaxy S21', width: 360, height: 800 },
      { name: 'iPad', width: 768, height: 1024 }
    ];
    
    const results = {};
    
    for (const device of devices) {
      const context = await browser.newContext({
        viewport: device,
        deviceScaleFactor: 2
      });
      
      const page = await context.newPage();
      
      try {
        const startTime = Date.now();
        await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
        const loadTime = Date.now() - startTime;
        
        // Test terminal interaction
        const terminalVisible = await page.isVisible('.terminal');
        const interactionTime = await this.measureInteractionDelay(page);
        
        results[device.name] = {
          loadTime,
          terminalVisible,
          interactionTime,
          passed: loadTime < this.thresholds.loadTime && terminalVisible
        };
        
      } catch (error) {
        results[device.name] = { error: error.message, passed: false };
      }
      
      await context.close();
    }
    
    await browser.close();
    return results;
  }

  async measureInteractionDelay(page) {
    try {
      const startTime = Date.now();
      await page.click('.terminal', { timeout: 5000 });
      return Date.now() - startTime;
    } catch {
      return -1; // Interaction failed
    }
  }

  validateThresholds() {
    const results = {
      passed: 0,
      failed: 0,
      warnings: []
    };
    
    // Check Core Web Vitals
    if (this.metrics.fcp > this.thresholds.fcp) {
      results.failed++;
      this.log(`FCP ${this.metrics.fcp.toFixed(0)}ms exceeds ${this.thresholds.fcp}ms threshold`, 'error');
    } else {
      results.passed++;
      this.log(`FCP: ${this.metrics.fcp.toFixed(0)}ms ✓`, 'success');
    }
    
    if (this.metrics.lcp > this.thresholds.lcp) {
      results.failed++;
      this.log(`LCP ${this.metrics.lcp.toFixed(0)}ms exceeds ${this.thresholds.lcp}ms threshold`, 'error');
    } else {
      results.passed++;
      this.log(`LCP: ${this.metrics.lcp.toFixed(0)}ms ✓`, 'success');
    }
    
    if (this.metrics.cls > this.thresholds.cls) {
      results.failed++;
      this.log(`CLS ${this.metrics.cls.toFixed(3)} exceeds ${this.thresholds.cls} threshold`, 'error');
    } else {
      results.passed++;
      this.log(`CLS: ${this.metrics.cls.toFixed(3)} ✓`, 'success');
    }
    
    if (this.metrics.loadTime > this.thresholds.loadTime) {
      results.failed++;
      this.log(`Load time ${this.metrics.loadTime}ms exceeds ${this.thresholds.loadTime}ms threshold`, 'error');
    } else {
      results.passed++;
      this.log(`Load time: ${this.metrics.loadTime}ms ✓`, 'success');
    }
    
    // Check resource efficiency
    if (this.metrics.jsUsage < 50) {
      results.warnings.push(`JS usage ${this.metrics.jsUsage.toFixed(1)}% is low - may indicate dead code`);
    }
    
    if (this.metrics.cssUsage < 50) {
      results.warnings.push(`CSS usage ${this.metrics.cssUsage.toFixed(1)}% is low - may indicate unused styles`);
    }
    
    return results;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      thresholds: this.thresholds,
      summary: {
        fcp: { value: this.metrics.fcp, passed: this.metrics.fcp <= this.thresholds.fcp },
        lcp: { value: this.metrics.lcp, passed: this.metrics.lcp <= this.thresholds.lcp },
        cls: { value: this.metrics.cls, passed: this.metrics.cls <= this.thresholds.cls },
        loadTime: { value: this.metrics.loadTime, passed: this.metrics.loadTime <= this.thresholds.loadTime }
      },
      recommendations: []
    };
    
    // Generate recommendations
    if (this.metrics.fcp > this.thresholds.fcp) {
      report.recommendations.push('Optimize critical rendering path to improve FCP');
    }
    
    if (this.metrics.lcp > this.thresholds.lcp) {
      report.recommendations.push('Optimize largest contentful element loading');
    }
    
    if (this.metrics.cls > this.thresholds.cls) {
      report.recommendations.push('Stabilize layout to reduce cumulative layout shift');
    }
    
    if (this.metrics.jsUsage < 50) {
      report.recommendations.push('Remove unused JavaScript to reduce bundle size');
    }
    
    if (this.metrics.cssUsage < 50) {
      report.recommendations.push('Remove unused CSS to reduce bundle size');
    }
    
    return report;
  }

  async run() {
    this.log('🚀 Starting Performance Monitoring', 'info');
    
    try {
      // Test desktop performance
      this.log('Testing desktop performance...', 'info');
      await this.measurePerformance();
      
      const validation = this.validateThresholds();
      
      // Display metrics
      console.log('\n📊 Performance Metrics:');
      console.log(`  Load Time: ${this.metrics.loadTime}ms`);
      console.log(`  First Contentful Paint: ${this.metrics.fcp.toFixed(0)}ms`);
      console.log(`  Largest Contentful Paint: ${this.metrics.lcp.toFixed(0)}ms`);
      console.log(`  Cumulative Layout Shift: ${this.metrics.cls.toFixed(3)}`);
      console.log(`  JavaScript Usage: ${this.metrics.jsUsage.toFixed(1)}%`);
      console.log(`  CSS Usage: ${this.metrics.cssUsage.toFixed(1)}%`);
      
      // Test mobile performance
      this.log('\nTesting mobile performance...', 'info');
      const mobileResults = await this.testMobilePerformance();
      
      console.log('\n📱 Mobile Performance:');
      for (const [device, result] of Object.entries(mobileResults)) {
        if (result.error) {
          this.log(`${device}: ERROR - ${result.error}`, 'error');
        } else {
          const status = result.passed ? '✅' : '❌';
          console.log(`  ${device}: ${result.loadTime}ms ${status}`);
        }
      }
      
      // Generate report
      const report = this.generateReport();
      fs.writeFileSync('performance-report.json', JSON.stringify(report, null, 2));
      
      // Final summary
      console.log('\n' + '='.repeat(50));
      if (validation.failed === 0) {
        this.log('🎉 All performance targets met!', 'success');
      } else {
        this.log(`❌ ${validation.failed} performance targets failed`, 'error');
        process.exit(1);
      }
      
      if (validation.warnings.length > 0) {
        this.log(`⚠️ ${validation.warnings.length} optimization opportunities`, 'warning');
        validation.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
    } catch (error) {
      this.log(`Performance testing failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new PerformanceMonitor();
  monitor.run().catch(console.error);
}

export default PerformanceMonitor;