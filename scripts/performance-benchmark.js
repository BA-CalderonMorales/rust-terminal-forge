#!/usr/bin/env node
/**
 * Advanced Performance Benchmarking Suite
 * Comprehensive performance monitoring for Rust Terminal Forge
 */

const { chromium, webkit, firefox } = require('playwright');
const fs = require('fs');
const path = require('path');

class PerformanceBenchmark {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:8080';
    this.outputDir = options.outputDir || './performance-reports';
    this.browsers = options.browsers || ['chromium'];
    this.scenarios = options.scenarios || ['desktop', 'mobile'];
    this.iterations = options.iterations || 3;
    
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {},
      detailed: [],
      recommendations: []
    };
    
    // Performance budgets
    this.budgets = {
      desktop: {
        fcp: 1500,    // First Contentful Paint
        lcp: 2500,    // Largest Contentful Paint
        fid: 100,     // First Input Delay
        cls: 0.1,     // Cumulative Layout Shift
        ttfb: 600,    // Time to First Byte
        loadTime: 3000
      },
      mobile: {
        fcp: 2000,
        lcp: 3000,
        fid: 100,
        cls: 0.1,
        ttfb: 800,
        loadTime: 4000
      }
    };
  }

  async initialize() {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    console.log('🚀 Initializing Performance Benchmark Suite');
    console.log(`📊 Testing against: ${this.baseUrl}`);
    console.log(`🌐 Browsers: ${this.browsers.join(', ')}`);
    console.log(`📱 Scenarios: ${this.scenarios.join(', ')}`);
  }

  async runBenchmarks() {
    await this.initialize();
    
    for (const browserName of this.browsers) {
      console.log(`\n🌐 Testing with ${browserName}...`);
      
      const browser = await this.launchBrowser(browserName);
      
      for (const scenario of this.scenarios) {
        console.log(`  📱 Running ${scenario} tests...`);
        
        const scenarioResults = [];
        
        for (let i = 0; i < this.iterations; i++) {
          console.log(`    🔄 Iteration ${i + 1}/${this.iterations}`);
          
          const result = await this.runSingleTest(browser, scenario, i + 1);
          scenarioResults.push(result);
        }
        
        const averageResult = this.calculateAverage(scenarioResults);
        this.results.detailed.push({
          browser: browserName,
          scenario,
          average: averageResult,
          iterations: scenarioResults
        });
      }
      
      await browser.close();
    }
    
    this.generateSummary();
    this.generateRecommendations();
    await this.saveResults();
    
    console.log('\n✅ Performance benchmarking completed');
    console.log(`📊 Results saved to: ${this.outputDir}/performance-report.json`);
  }

  async launchBrowser(browserName) {
    const browserConfig = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    };

    switch (browserName) {
      case 'chromium':
        return await chromium.launch(browserConfig);
      case 'webkit':
        return await webkit.launch(browserConfig);
      case 'firefox':
        return await firefox.launch(browserConfig);
      default:
        throw new Error(`Unsupported browser: ${browserName}`);
    }
  }

  async runSingleTest(browser, scenario, iteration) {
    const viewport = scenario === 'mobile' 
      ? { width: 375, height: 667 }
      : { width: 1920, height: 1080 };
    
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: scenario === 'mobile' ? 2 : 1,
      userAgent: scenario === 'mobile' 
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        : undefined
    });
    
    const page = await context.newPage();
    
    // Enable performance monitoring
    await page.coverage.startJSCoverage();
    await page.coverage.startCSSCoverage();
    
    // Performance measurement
    const startTime = Date.now();
    const navigationStart = await page.evaluate(() => performance.now());
    
    try {
      // Navigate to the application
      await page.goto(this.baseUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      const endTime = Date.now();
      
      // Collect performance metrics
      const metrics = await this.collectMetrics(page, startTime, endTime, navigationStart);
      
      // Test terminal-specific interactions
      const terminalMetrics = await this.testTerminalPerformance(page);
      
      // Get coverage data
      const [jsCoverage, cssCoverage] = await Promise.all([
        page.coverage.stopJSCoverage(),
        page.coverage.stopCSSCoverage()
      ]);
      
      const coverageData = this.analyzeCoverage(jsCoverage, cssCoverage);
      
      // Take screenshot for visual validation
      await page.screenshot({
        path: path.join(this.outputDir, `screenshot-${scenario}-${iteration}.png`),
        fullPage: false
      });
      
      await context.close();
      
      return {
        iteration,
        scenario,
        timestamp: new Date().toISOString(),
        metrics,
        terminalMetrics,
        coverage: coverageData,
        passed: this.validateBudgets(metrics, scenario)
      };
      
    } catch (error) {
      await context.close();
      throw new Error(`Test failed: ${error.message}`);
    }
  }

  async collectMetrics(page, startTime, endTime, navigationStart) {
    const performanceMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      const paintEntries = performance.getEntriesByType('paint');
      
      return {
        // Navigation timing
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        
        // Paint timing
        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        
        // Resource timing
        transferSize: perfData.transferSize,
        encodedBodySize: perfData.encodedBodySize,
        decodedBodySize: perfData.decodedBodySize,
        
        // Network timing
        dnsLookup: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcpConnect: perfData.connectEnd - perfData.connectStart,
        ttfb: perfData.responseStart - perfData.requestStart,
        
        // Critical rendering path
        domInteractive: perfData.domInteractive - perfData.navigationStart,
        domComplete: perfData.domComplete - perfData.navigationStart
      };
    });
    
    // Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            vitals.lcp = entries[entries.length - 1].startTime;
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // First Input Delay (simulated)
        vitals.fid = 0; // Would need real user interaction
        
        setTimeout(() => resolve(vitals), 2000);
      });
    });
    
    return {
      ...performanceMetrics,
      ...webVitals,
      totalLoadTime: endTime - startTime,
      pageLoadTime: performanceMetrics.loadComplete
    };
  }

  async testTerminalPerformance(page) {
    const terminalMetrics = {
      renderTime: 0,
      interactionDelay: 0,
      scrollPerformance: 0,
      memoryUsage: 0
    };
    
    try {
      // Test terminal rendering
      const terminalSelector = '.terminal-container, .real-terminal, .enhanced-terminal';
      const terminal = page.locator(terminalSelector).first();
      
      if (await terminal.count() > 0) {
        // Measure terminal render time
        const renderStart = Date.now();
        await terminal.waitFor({ state: 'visible', timeout: 5000 });
        terminalMetrics.renderTime = Date.now() - renderStart;
        
        // Test input interaction if terminal input exists
        const terminalInput = page.locator('input[type="text"], .terminal-input, .xterm-screen').first();
        if (await terminalInput.count() > 0) {
          const interactionStart = Date.now();
          await terminalInput.click();
          await page.keyboard.type('echo "performance test"');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(100);
          terminalMetrics.interactionDelay = Date.now() - interactionStart;
        }
        
        // Test scroll performance
        const scrollStart = Date.now();
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(100);
        terminalMetrics.scrollPerformance = Date.now() - scrollStart;
      }
      
      // Memory usage
      const memoryInfo = await page.evaluate(() => {
        return performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null;
      });
      
      if (memoryInfo) {
        terminalMetrics.memoryUsage = memoryInfo.usedJSHeapSize;
      }
      
    } catch (error) {
      console.warn(`Terminal performance test warning: ${error.message}`);
    }
    
    return terminalMetrics;
  }

  analyzeCoverage(jsCoverage, cssCoverage) {
    const jsUsedBytes = jsCoverage.reduce((acc, entry) => acc + entry.usedBytes, 0);
    const jsTotalBytes = jsCoverage.reduce((acc, entry) => acc + entry.totalBytes, 0);
    
    const cssUsedBytes = cssCoverage.reduce((acc, entry) => acc + entry.usedBytes, 0);
    const cssTotalBytes = cssCoverage.reduce((acc, entry) => acc + entry.totalBytes, 0);
    
    return {
      javascript: {
        usedBytes: jsUsedBytes,
        totalBytes: jsTotalBytes,
        usagePercent: jsTotalBytes > 0 ? (jsUsedBytes / jsTotalBytes) * 100 : 0
      },
      css: {
        usedBytes: cssUsedBytes,
        totalBytes: cssTotalBytes,
        usagePercent: cssTotalBytes > 0 ? (cssUsedBytes / cssTotalBytes) * 100 : 0
      }
    };
  }

  calculateAverage(results) {
    const metrics = results[0].metrics;
    const averages = {};
    
    // Calculate average for each metric
    Object.keys(metrics).forEach(key => {
      const values = results.map(r => r.metrics[key]).filter(v => typeof v === 'number');
      averages[key] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    });
    
    // Calculate average terminal metrics
    const terminalMetrics = {};
    Object.keys(results[0].terminalMetrics).forEach(key => {
      const values = results.map(r => r.terminalMetrics[key]).filter(v => typeof v === 'number');
      terminalMetrics[key] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    });
    
    return {
      metrics: averages,
      terminalMetrics,
      passRate: results.filter(r => r.passed).length / results.length
    };
  }

  validateBudgets(metrics, scenario) {
    const budget = this.budgets[scenario];
    const violations = [];
    
    if (metrics.firstContentfulPaint > budget.fcp) {
      violations.push(`FCP: ${metrics.firstContentfulPaint}ms > ${budget.fcp}ms`);
    }
    if (metrics.lcp > budget.lcp) {
      violations.push(`LCP: ${metrics.lcp}ms > ${budget.lcp}ms`);
    }
    if (metrics.cls > budget.cls) {
      violations.push(`CLS: ${metrics.cls} > ${budget.cls}`);
    }
    if (metrics.ttfb > budget.ttfb) {
      violations.push(`TTFB: ${metrics.ttfb}ms > ${budget.ttfb}ms`);
    }
    if (metrics.totalLoadTime > budget.loadTime) {
      violations.push(`Load Time: ${metrics.totalLoadTime}ms > ${budget.loadTime}ms`);
    }
    
    return {
      passed: violations.length === 0,
      violations
    };
  }

  generateSummary() {
    const allResults = this.results.detailed;
    
    this.results.summary = {
      totalTests: allResults.length,
      passedTests: allResults.filter(r => r.average.passRate === 1).length,
      averagePerformance: {},
      budgetViolations: []
    };
    
    // Calculate overall averages
    allResults.forEach(result => {
      const scenario = result.scenario;
      const browser = result.browser;
      
      if (!this.results.summary.averagePerformance[scenario]) {
        this.results.summary.averagePerformance[scenario] = {};
      }
      
      this.results.summary.averagePerformance[scenario][browser] = {
        fcp: Math.round(result.average.metrics.firstContentfulPaint),
        lcp: Math.round(result.average.metrics.lcp || 0),
        cls: Math.round((result.average.metrics.cls || 0) * 1000) / 1000,
        loadTime: Math.round(result.average.metrics.totalLoadTime),
        terminalRender: Math.round(result.average.terminalMetrics.renderTime),
        jsUsage: Math.round(result.average.metrics.javascript?.usagePercent || 0)
      };
    });
  }

  generateRecommendations() {
    const recommendations = [];
    
    this.results.detailed.forEach(result => {
      const metrics = result.average.metrics;
      const budget = this.budgets[result.scenario];
      
      if (metrics.firstContentfulPaint > budget.fcp) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          metric: 'First Contentful Paint',
          current: `${Math.round(metrics.firstContentfulPaint)}ms`,
          target: `${budget.fcp}ms`,
          suggestion: 'Optimize CSS delivery, reduce render-blocking resources, implement code splitting'
        });
      }
      
      if (metrics.lcp > budget.lcp) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          metric: 'Largest Contentful Paint',
          current: `${Math.round(metrics.lcp)}ms`,
          target: `${budget.lcp}ms`,
          suggestion: 'Optimize images, preload key resources, improve server response times'
        });
      }
      
      if (metrics.totalLoadTime > budget.loadTime) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          metric: 'Total Load Time',
          current: `${Math.round(metrics.totalLoadTime)}ms`,
          target: `${budget.loadTime}ms`,
          suggestion: 'Enable compression, implement service worker caching, optimize bundle size'
        });
      }
      
      if (result.average.terminalMetrics.renderTime > 1000) {
        recommendations.push({
          type: 'terminal',
          priority: 'medium',
          metric: 'Terminal Render Time',
          current: `${Math.round(result.average.terminalMetrics.renderTime)}ms`,
          target: '< 500ms',
          suggestion: 'Implement virtual scrolling, optimize ANSI parsing, reduce DOM complexity'
        });
      }
    });
    
    this.results.recommendations = recommendations;
  }

  async saveResults() {
    const reportPath = path.join(this.outputDir, 'performance-report.json');
    const htmlReportPath = path.join(this.outputDir, 'performance-report.html');
    
    // Save JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    // Console summary
    this.printSummary();
  }

  generateHTMLReport() {
    const summary = this.results.summary;
    const recommendations = this.results.recommendations;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Benchmark Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #007acc; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #007acc; }
        .metric.warning { border-left-color: #ffa500; background: #fff8e1; }
        .metric.error { border-left-color: #ff4444; background: #ffebee; }
        .recommendation { margin: 10px 0; padding: 15px; background: #e3f2fd; border-radius: 6px; border-left: 4px solid #2196f3; }
        .recommendation.high { border-left-color: #ff4444; background: #ffebee; }
        .recommendation.medium { border-left-color: #ffa500; background: #fff8e1; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .pass { color: #4caf50; font-weight: bold; }
        .fail { color: #f44336; font-weight: bold; }
        .chart { margin: 20px 0; height: 200px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Performance Benchmark Report</h1>
        <p><strong>Generated:</strong> ${this.results.timestamp}</p>
        
        <h2>📊 Summary</h2>
        <div class="metric">
            <strong>Total Tests:</strong> ${summary.totalTests}
        </div>
        <div class="metric ${summary.passedTests === summary.totalTests ? '' : 'warning'}">
            <strong>Passed:</strong> ${summary.passedTests}/${summary.totalTests}
        </div>
        
        <h2>📈 Performance Metrics</h2>
        <table>
            <thead>
                <tr>
                    <th>Scenario</th>
                    <th>Browser</th>
                    <th>FCP (ms)</th>
                    <th>LCP (ms)</th>
                    <th>CLS</th>
                    <th>Load Time (ms)</th>
                    <th>Terminal Render (ms)</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(summary.averagePerformance).map(([scenario, browsers]) =>
                  Object.entries(browsers).map(([browser, metrics]) => `
                    <tr>
                        <td>${scenario}</td>
                        <td>${browser}</td>
                        <td class="${metrics.fcp > this.budgets[scenario].fcp ? 'fail' : 'pass'}">${metrics.fcp}</td>
                        <td class="${metrics.lcp > this.budgets[scenario].lcp ? 'fail' : 'pass'}">${metrics.lcp}</td>
                        <td class="${metrics.cls > this.budgets[scenario].cls ? 'fail' : 'pass'}">${metrics.cls}</td>
                        <td class="${metrics.loadTime > this.budgets[scenario].loadTime ? 'fail' : 'pass'}">${metrics.loadTime}</td>
                        <td>${metrics.terminalRender}</td>
                    </tr>
                  `).join('')
                ).join('')}
            </tbody>
        </table>
        
        <h2>💡 Recommendations</h2>
        ${recommendations.map(rec => `
            <div class="recommendation ${rec.priority}">
                <strong>${rec.metric}:</strong> ${rec.current} (target: ${rec.target})<br>
                <em>${rec.suggestion}</em>
            </div>
        `).join('')}
        
        <h2>🎯 Performance Budgets</h2>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Desktop Budget</th>
                    <th>Mobile Budget</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>First Contentful Paint</td><td>${this.budgets.desktop.fcp}ms</td><td>${this.budgets.mobile.fcp}ms</td></tr>
                <tr><td>Largest Contentful Paint</td><td>${this.budgets.desktop.lcp}ms</td><td>${this.budgets.mobile.lcp}ms</td></tr>
                <tr><td>Cumulative Layout Shift</td><td>${this.budgets.desktop.cls}</td><td>${this.budgets.mobile.cls}</td></tr>
                <tr><td>Time to First Byte</td><td>${this.budgets.desktop.ttfb}ms</td><td>${this.budgets.mobile.ttfb}ms</td></tr>
                <tr><td>Total Load Time</td><td>${this.budgets.desktop.loadTime}ms</td><td>${this.budgets.mobile.loadTime}ms</td></tr>
            </tbody>
        </table>
    </div>
</body>
</html>
    `;
  }

  printSummary() {
    console.log('\n📊 Performance Benchmark Summary');
    console.log('================================');
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passedTests}/${this.results.summary.totalTests}`);
    
    console.log('\n📈 Average Performance:');
    Object.entries(this.results.summary.averagePerformance).forEach(([scenario, browsers]) => {
      console.log(`\n  ${scenario.toUpperCase()}:`);
      Object.entries(browsers).forEach(([browser, metrics]) => {
        console.log(`    ${browser}: FCP ${metrics.fcp}ms, LCP ${metrics.lcp}ms, Load ${metrics.loadTime}ms`);
      });
    });
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      this.results.recommendations.slice(0, 3).forEach(rec => {
        console.log(`  • ${rec.metric}: ${rec.suggestion}`);
      });
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse CLI arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    switch (key) {
      case 'url':
        options.baseUrl = value;
        break;
      case 'browsers':
        options.browsers = value.split(',');
        break;
      case 'scenarios':
        options.scenarios = value.split(',');
        break;
      case 'iterations':
        options.iterations = parseInt(value);
        break;
      case 'output':
        options.outputDir = value;
        break;
    }
  }
  
  const benchmark = new PerformanceBenchmark(options);
  
  benchmark.runBenchmarks()
    .then(() => {
      console.log('\n✅ Performance benchmarking completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Performance benchmarking failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceBenchmark;