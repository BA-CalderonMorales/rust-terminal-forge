#!/usr/bin/env node
/**
 * Cross-Platform Testing Suite
 * Comprehensive testing across browsers, devices, and operating systems
 */

const { chromium, webkit, firefox } = require('playwright');
const fs = require('fs');
const path = require('path');

class CrossPlatformTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:8080';
    this.outputDir = options.outputDir || './cross-platform-reports';
    this.screenshotDir = path.join(this.outputDir, 'screenshots');
    
    // Comprehensive test matrix
    this.testMatrix = {
      browsers: [
        { name: 'chromium', engine: 'chromium' },
        { name: 'firefox', engine: 'firefox' },
        { name: 'webkit', engine: 'webkit' }
      ],
      
      devices: [
        // Mobile devices
        { name: 'iPhone SE', width: 375, height: 667, mobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
        { name: 'iPhone 12', width: 390, height: 844, mobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)' },
        { name: 'iPhone 12 Pro Max', width: 428, height: 926, mobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)' },
        { name: 'Samsung Galaxy S21', width: 360, height: 800, mobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B)' },
        { name: 'Google Pixel 5', width: 393, height: 851, mobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5)' },
        
        // Tablets
        { name: 'iPad', width: 768, height: 1024, mobile: true, userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)' },
        { name: 'iPad Pro', width: 1024, height: 1366, mobile: true, userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)' },
        { name: 'Surface Pro', width: 912, height: 1368, mobile: false, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        
        // Desktop
        { name: 'Desktop HD', width: 1366, height: 768, mobile: false },
        { name: 'Desktop FHD', width: 1920, height: 1080, mobile: false },
        { name: 'Desktop 4K', width: 3840, height: 2160, mobile: false },
        { name: 'Ultrawide', width: 3440, height: 1440, mobile: false }
      ],
      
      colorSchemes: ['light', 'dark'],
      
      networkConditions: [
        { name: 'Fast 3G', download: 1.6 * 1024, upload: 0.75 * 1024, latency: 150 },
        { name: '4G', download: 4 * 1024, upload: 3 * 1024, latency: 20 },
        { name: 'WiFi', download: 30 * 1024, upload: 15 * 1024, latency: 2 }
      ]
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        compatibility: {}
      },
      detailed: [],
      issues: [],
      recommendations: []
    };
  }

  async initialize() {
    // Create output directories
    [this.outputDir, this.screenshotDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    console.log('🌐 Initializing Cross-Platform Testing Suite');
    console.log(`📊 Testing URL: ${this.baseUrl}`);
    console.log(`🧪 Test Matrix: ${this.testMatrix.browsers.length} browsers × ${this.testMatrix.devices.length} devices`);
  }

  async runAllTests() {
    await this.initialize();
    
    let testCount = 0;
    const totalTests = this.testMatrix.browsers.length * this.testMatrix.devices.length * this.testMatrix.colorSchemes.length;
    
    console.log(`\n🚀 Starting ${totalTests} cross-platform tests...\n`);
    
    for (const browser of this.testMatrix.browsers) {
      console.log(`🌐 Testing with ${browser.name}...`);
      
      const browserInstance = await this.launchBrowser(browser.engine);
      
      for (const device of this.testMatrix.devices) {
        for (const colorScheme of this.testMatrix.colorSchemes) {
          testCount++;
          console.log(`  📱 [${testCount}/${totalTests}] ${device.name} (${colorScheme})`);
          
          try {
            const result = await this.runSingleTest(browserInstance, browser, device, colorScheme);
            this.results.detailed.push(result);
            
            if (result.passed) {
              this.results.summary.passedTests++;
            } else {
              this.results.summary.failedTests++;
              this.results.issues.push(...result.issues);
            }
            
          } catch (error) {
            console.error(`    ❌ Test failed: ${error.message}`);
            this.results.summary.failedTests++;
            this.results.issues.push({
              browser: browser.name,
              device: device.name,
              colorScheme,
              type: 'test_failure',
              message: error.message,
              severity: 'high'
            });
          }
        }
      }
      
      await browserInstance.close();
    }
    
    this.results.summary.totalTests = totalTests;
    this.calculateCompatibility();
    this.generateRecommendations();
    await this.saveResults();
    
    console.log('\n✅ Cross-platform testing completed');
    console.log(`📊 Results: ${this.results.summary.passedTests}/${totalTests} tests passed`);
  }

  async launchBrowser(engine) {
    const config = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    };

    switch (engine) {
      case 'chromium':
        return await chromium.launch(config);
      case 'webkit':
        return await webkit.launch(config);
      case 'firefox':
        return await firefox.launch(config);
      default:
        throw new Error(`Unsupported browser engine: ${engine}`);
    }
  }

  async runSingleTest(browser, browserInfo, device, colorScheme) {
    const testId = `${browserInfo.name}-${device.name.replace(/\s+/g, '_')}-${colorScheme}`;
    
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.mobile ? 2 : 1,
      userAgent: device.userAgent,
      colorScheme: colorScheme,
      permissions: ['clipboard-read', 'clipboard-write'],
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    const page = await context.newPage();
    const issues = [];
    const startTime = Date.now();
    
    try {
      // Set network conditions for mobile devices
      if (device.mobile) {
        const networkCondition = this.testMatrix.networkConditions[0]; // Fast 3G for mobile
        await page.route('**/*', async route => {
          await new Promise(resolve => setTimeout(resolve, networkCondition.latency));
          await route.continue();
        });
      }
      
      // Navigate to the application
      await page.goto(this.baseUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      const loadTime = Date.now() - startTime;
      
      // Core functionality tests
      const functionalityResults = await this.testCoreFunctionality(page, device);
      issues.push(...functionalityResults.issues);
      
      // Layout and responsiveness tests
      const layoutResults = await this.testLayoutResponsiveness(page, device);
      issues.push(...layoutResults.issues);
      
      // Terminal-specific tests
      const terminalResults = await this.testTerminalFunctionality(page, device);
      issues.push(...terminalResults.issues);
      
      // Accessibility tests
      const a11yResults = await this.testAccessibility(page, device);
      issues.push(...a11yResults.issues);
      
      // Performance tests
      const performanceResults = await this.testPerformance(page, device);
      issues.push(...performanceResults.issues);
      
      // Visual validation
      await this.captureScreenshots(page, testId);
      
      await context.close();
      
      return {
        id: testId,
        browser: browserInfo.name,
        device: device.name,
        colorScheme,
        mobile: device.mobile,
        viewport: { width: device.width, height: device.height },
        loadTime,
        passed: issues.filter(i => i.severity === 'high').length === 0,
        issues,
        results: {
          functionality: functionalityResults,
          layout: layoutResults,
          terminal: terminalResults,
          accessibility: a11yResults,
          performance: performanceResults
        }
      };
      
    } catch (error) {
      await context.close();
      throw error;
    }
  }

  async testCoreFunctionality(page, device) {
    const issues = [];
    const results = {};
    
    try {
      // Test page load and basic elements
      const title = await page.title();
      if (!title || title.includes('Error')) {
        issues.push({
          type: 'functionality',
          message: 'Page title missing or indicates error',
          severity: 'high'
        });
      }
      
      // Test main navigation
      const navigation = await page.locator('nav, [role="navigation"]').count();
      results.hasNavigation = navigation > 0;
      
      // Test terminal container
      const terminalContainer = await page.locator('.terminal-container, .real-terminal, .enhanced-terminal').count();
      results.hasTerminal = terminalContainer > 0;
      
      if (!results.hasTerminal) {
        issues.push({
          type: 'functionality',
          message: 'Terminal container not found',
          severity: 'high'
        });
      }
      
      // Test theme switching if available
      const themeToggle = await page.locator('[data-theme-toggle], .theme-switcher').count();
      if (themeToggle > 0) {
        try {
          await page.locator('[data-theme-toggle], .theme-switcher').first().click();
          await page.waitForTimeout(500);
          results.themeToggleWorks = true;
        } catch {
          results.themeToggleWorks = false;
          issues.push({
            type: 'functionality',
            message: 'Theme toggle not working',
            severity: 'medium'
          });
        }
      }
      
      // Test mobile-specific features
      if (device.mobile) {
        const mobileMenu = await page.locator('[data-mobile-menu], .mobile-menu').count();
        results.hasMobileMenu = mobileMenu > 0;
        
        if (mobileMenu > 0) {
          try {
            await page.locator('[data-mobile-menu], .mobile-menu').first().click();
            await page.waitForTimeout(300);
            results.mobileMenuWorks = true;
          } catch {
            results.mobileMenuWorks = false;
            issues.push({
              type: 'functionality',
              message: 'Mobile menu not working properly',
              severity: 'medium'
            });
          }
        }
      }
      
    } catch (error) {
      issues.push({
        type: 'functionality',
        message: `Core functionality test failed: ${error.message}`,
        severity: 'high'
      });
    }
    
    return { results, issues };
  }

  async testLayoutResponsiveness(page, device) {
    const issues = [];
    const results = {};
    
    try {
      // Test viewport overflow
      const bodyOverflow = await page.evaluate(() => {
        const body = document.body;
        const rect = body.getBoundingClientRect();
        return {
          hasHorizontalOverflow: rect.width > window.innerWidth,
          hasVerticalOverflow: rect.height > window.innerHeight
        };
      });
      
      if (bodyOverflow.hasHorizontalOverflow) {
        issues.push({
          type: 'layout',
          message: 'Horizontal overflow detected',
          severity: 'high'
        });
      }
      
      results.overflow = bodyOverflow;
      
      // Test element visibility and positioning
      const layoutMetrics = await page.evaluate(() => {
        const metrics = {};
        
        // Check main container
        const mainContainer = document.querySelector('main, .main-container, #root > div');
        if (mainContainer) {
          const rect = mainContainer.getBoundingClientRect();
          metrics.mainContainer = {
            visible: rect.width > 0 && rect.height > 0,
            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          };
        }
        
        // Check terminal container
        const terminal = document.querySelector('.terminal-container, .real-terminal, .enhanced-terminal');
        if (terminal) {
          const rect = terminal.getBoundingClientRect();
          metrics.terminal = {
            visible: rect.width > 0 && rect.height > 0,
            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          };
        }
        
        // Check for overlapping elements
        const allElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.position === 'fixed' || style.position === 'absolute';
        });
        
        metrics.overlappingElements = allElements.length;
        
        return metrics;
      });
      
      results.layoutMetrics = layoutMetrics;
      
      // Validate terminal visibility
      if (layoutMetrics.terminal && !layoutMetrics.terminal.visible) {
        issues.push({
          type: 'layout',
          message: 'Terminal not visible in viewport',
          severity: 'high'
        });
      }
      
      // Test touch targets for mobile
      if (device.mobile) {
        const touchTargets = await page.evaluate(() => {
          const clickableElements = document.querySelectorAll('button, a, input, [role="button"]');
          const smallTargets = [];
          
          clickableElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const size = Math.min(rect.width, rect.height);
            if (size < 44) { // iOS Human Interface Guidelines minimum
              smallTargets.push({
                tagName: el.tagName,
                size: size,
                text: el.textContent?.slice(0, 20) || 'no text'
              });
            }
          });
          
          return smallTargets;
        });
        
        if (touchTargets.length > 0) {
          issues.push({
            type: 'layout',
            message: `${touchTargets.length} touch targets smaller than 44px`,
            severity: 'medium',
            details: touchTargets
          });
        }
        
        results.touchTargets = touchTargets;
      }
      
    } catch (error) {
      issues.push({
        type: 'layout',
        message: `Layout test failed: ${error.message}`,
        severity: 'medium'
      });
    }
    
    return { results, issues };
  }

  async testTerminalFunctionality(page, device) {
    const issues = [];
    const results = {};
    
    try {
      // Find terminal elements
      const terminalElements = await page.evaluate(() => {
        const terminals = document.querySelectorAll('.terminal-container, .real-terminal, .enhanced-terminal, .xterm');
        return Array.from(terminals).map(el => ({
          tagName: el.tagName,
          className: el.className,
          visible: el.offsetWidth > 0 && el.offsetHeight > 0,
          dimensions: { width: el.offsetWidth, height: el.offsetHeight }
        }));
      });
      
      results.terminalElements = terminalElements;
      
      if (terminalElements.length === 0) {
        issues.push({
          type: 'terminal',
          message: 'No terminal elements found',
          severity: 'high'
        });
        return { results, issues };
      }
      
      // Test terminal input
      const inputElements = await page.locator('input[type="text"], .terminal-input, .xterm-screen').count();
      results.hasInput = inputElements > 0;
      
      if (inputElements > 0) {
        try {
          const inputElement = page.locator('input[type="text"], .terminal-input, .xterm-screen').first();
          
          // Test focus
          await inputElement.click();
          const isFocused = await inputElement.evaluate(el => document.activeElement === el);
          results.inputFocusable = isFocused;
          
          if (!isFocused) {
            issues.push({
              type: 'terminal',
              message: 'Terminal input not focusable',
              severity: 'medium'
            });
          }
          
          // Test typing (if input element)
          if (await inputElement.evaluate(el => el.tagName === 'INPUT')) {
            await inputElement.fill('test command');
            const value = await inputElement.inputValue();
            results.inputWorks = value.includes('test');
            
            if (!results.inputWorks) {
              issues.push({
                type: 'terminal',
                message: 'Terminal input not accepting text',
                severity: 'high'
              });
            }
          }
          
        } catch (error) {
          issues.push({
            type: 'terminal',
            message: `Terminal input test failed: ${error.message}`,
            severity: 'medium'
          });
        }
      }
      
      // Test terminal scrolling
      try {
        const scrollableElement = page.locator('.terminal-container, .xterm-viewport').first();
        if (await scrollableElement.count() > 0) {
          const initialScrollTop = await scrollableElement.evaluate(el => el.scrollTop);
          await scrollableElement.evaluate(el => el.scrollTop += 100);
          const newScrollTop = await scrollableElement.evaluate(el => el.scrollTop);
          
          results.scrollWorks = newScrollTop > initialScrollTop;
          
          if (!results.scrollWorks) {
            issues.push({
              type: 'terminal',
              message: 'Terminal scroll not working',
              severity: 'medium'
            });
          }
        }
      } catch (error) {
        // Scrolling test is optional
        results.scrollWorks = false;
      }
      
      // Test text rendering
      const textContent = await page.evaluate(() => {
        const terminal = document.querySelector('.terminal-container, .real-terminal, .enhanced-terminal, .xterm');
        return terminal ? terminal.textContent || terminal.innerText : '';
      });
      
      results.hasTextContent = textContent.length > 0;
      results.terminalReady = textContent.includes('$') || textContent.includes('>') || textContent.includes('~');
      
      if (!results.terminalReady && results.hasTextContent) {
        issues.push({
          type: 'terminal',
          message: 'Terminal appears to be not ready (no prompt visible)',
          severity: 'low'
        });
      }
      
    } catch (error) {
      issues.push({
        type: 'terminal',
        message: `Terminal functionality test failed: ${error.message}`,
        severity: 'high'
      });
    }
    
    return { results, issues };
  }

  async testAccessibility(page, device) {
    const issues = [];
    const results = {};
    
    try {
      // Test basic accessibility features
      const a11yChecks = await page.evaluate(() => {
        const checks = {
          hasTitle: !!document.title,
          hasLang: !!document.documentElement.lang,
          focusableElements: 0,
          ariaLabels: 0,
          headingStructure: [],
          colorContrast: { passed: 0, failed: 0 }
        };
        
        // Count focusable elements
        const focusable = document.querySelectorAll(
          'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        checks.focusableElements = focusable.length;
        
        // Count ARIA labels
        const ariaLabeled = document.querySelectorAll('[aria-label], [aria-labelledby]');
        checks.ariaLabels = ariaLabeled.length;
        
        // Check heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        checks.headingStructure = Array.from(headings).map(h => ({
          level: parseInt(h.tagName.charAt(1)),
          text: h.textContent.slice(0, 50)
        }));
        
        return checks;
      });
      
      results.accessibility = a11yChecks;
      
      // Validate results
      if (!a11yChecks.hasTitle) {
        issues.push({
          type: 'accessibility',
          message: 'Page missing title element',
          severity: 'medium'
        });
      }
      
      if (!a11yChecks.hasLang) {
        issues.push({
          type: 'accessibility',
          message: 'HTML element missing lang attribute',
          severity: 'medium'
        });
      }
      
      if (a11yChecks.focusableElements === 0) {
        issues.push({
          type: 'accessibility',
          message: 'No focusable elements found',
          severity: 'high'
        });
      }
      
      // Test keyboard navigation
      if (a11yChecks.focusableElements > 0) {
        try {
          await page.keyboard.press('Tab');
          const focusedElement = await page.evaluate(() => document.activeElement.tagName);
          results.keyboardNavigation = focusedElement !== 'BODY';
          
          if (!results.keyboardNavigation) {
            issues.push({
              type: 'accessibility',
              message: 'Keyboard navigation not working',
              severity: 'high'
            });
          }
        } catch (error) {
          results.keyboardNavigation = false;
          issues.push({
            type: 'accessibility',
            message: 'Keyboard navigation test failed',
            severity: 'medium'
          });
        }
      }
      
    } catch (error) {
      issues.push({
        type: 'accessibility',
        message: `Accessibility test failed: ${error.message}`,
        severity: 'medium'
      });
    }
    
    return { results, issues };
  }

  async testPerformance(page, device) {
    const issues = [];
    const results = {};
    
    try {
      // Get performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        const paintEntries = performance.getEntriesByType('paint');
        
        return {
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
          transferSize: perfData.transferSize,
          resourceCount: performance.getEntriesByType('resource').length
        };
      });
      
      results.performance = performanceMetrics;
      
      // Performance budgets based on device type
      const budgets = device.mobile ? {
        loadTime: 4000,
        firstContentfulPaint: 2000,
        transferSize: 1000000 // 1MB
      } : {
        loadTime: 3000,
        firstContentfulPaint: 1500,
        transferSize: 2000000 // 2MB
      };
      
      // Check against budgets
      if (performanceMetrics.loadTime > budgets.loadTime) {
        issues.push({
          type: 'performance',
          message: `Load time ${performanceMetrics.loadTime}ms exceeds budget ${budgets.loadTime}ms`,
          severity: 'medium'
        });
      }
      
      if (performanceMetrics.firstContentfulPaint > budgets.firstContentfulPaint) {
        issues.push({
          type: 'performance',
          message: `FCP ${performanceMetrics.firstContentfulPaint}ms exceeds budget ${budgets.firstContentfulPaint}ms`,
          severity: 'medium'
        });
      }
      
      if (performanceMetrics.transferSize > budgets.transferSize) {
        issues.push({
          type: 'performance',
          message: `Transfer size ${performanceMetrics.transferSize} bytes exceeds budget ${budgets.transferSize} bytes`,
          severity: 'low'
        });
      }
      
    } catch (error) {
      issues.push({
        type: 'performance',
        message: `Performance test failed: ${error.message}`,
        severity: 'low'
      });
    }
    
    return { results, issues };
  }

  async captureScreenshots(page, testId) {
    try {
      // Full page screenshot
      await page.screenshot({
        path: path.join(this.screenshotDir, `${testId}-full.png`),
        fullPage: true
      });
      
      // Viewport screenshot
      await page.screenshot({
        path: path.join(this.screenshotDir, `${testId}-viewport.png`),
        fullPage: false
      });
      
      // Terminal-specific screenshot if available
      const terminalElement = page.locator('.terminal-container, .real-terminal, .enhanced-terminal').first();
      if (await terminalElement.count() > 0) {
        await terminalElement.screenshot({
          path: path.join(this.screenshotDir, `${testId}-terminal.png`)
        });
      }
      
    } catch (error) {
      console.warn(`Screenshot capture failed for ${testId}: ${error.message}`);
    }
  }

  calculateCompatibility() {
    const compatibility = {};
    
    // Browser compatibility
    this.testMatrix.browsers.forEach(browser => {
      const browserTests = this.results.detailed.filter(test => test.browser === browser.name);
      const passed = browserTests.filter(test => test.passed).length;
      compatibility[browser.name] = {
        total: browserTests.length,
        passed: passed,
        percentage: browserTests.length > 0 ? Math.round((passed / browserTests.length) * 100) : 0
      };
    });
    
    // Device category compatibility
    const mobileTests = this.results.detailed.filter(test => test.mobile);
    const desktopTests = this.results.detailed.filter(test => !test.mobile);
    
    compatibility.mobile = {
      total: mobileTests.length,
      passed: mobileTests.filter(test => test.passed).length,
      percentage: mobileTests.length > 0 ? Math.round((mobileTests.filter(test => test.passed).length / mobileTests.length) * 100) : 0
    };
    
    compatibility.desktop = {
      total: desktopTests.length,
      passed: desktopTests.filter(test => test.passed).length,
      percentage: desktopTests.length > 0 ? Math.round((desktopTests.filter(test => test.passed).length / desktopTests.length) * 100) : 0
    };
    
    this.results.summary.compatibility = compatibility;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Analyze common issues
    const issueTypes = {};
    this.results.issues.forEach(issue => {
      issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
    });
    
    // Generate recommendations based on common issues
    Object.entries(issueTypes).forEach(([type, count]) => {
      switch (type) {
        case 'layout':
          recommendations.push({
            type: 'layout',
            priority: 'high',
            message: `${count} layout issues found`,
            suggestion: 'Review responsive design implementation, test with CSS Grid/Flexbox, validate viewport meta tag'
          });
          break;
        case 'terminal':
          recommendations.push({
            type: 'terminal',
            priority: 'high',
            message: `${count} terminal functionality issues`,
            suggestion: 'Ensure terminal components are properly initialized, test input/output functionality, validate ANSI parsing'
          });
          break;
        case 'accessibility':
          recommendations.push({
            type: 'accessibility',
            priority: 'medium',
            message: `${count} accessibility issues`,
            suggestion: 'Add proper ARIA labels, ensure keyboard navigation, improve semantic HTML structure'
          });
          break;
        case 'performance':
          recommendations.push({
            type: 'performance',
            priority: 'medium',
            message: `${count} performance issues`,
            suggestion: 'Optimize bundle size, implement code splitting, compress images, enable caching'
          });
          break;
      }
    });
    
    // Browser-specific recommendations
    Object.entries(this.results.summary.compatibility).forEach(([browser, stats]) => {
      if (stats.percentage < 90) {
        recommendations.push({
          type: 'compatibility',
          priority: 'high',
          message: `${browser} compatibility at ${stats.percentage}%`,
          suggestion: `Review ${browser}-specific issues, test vendor prefixes, validate feature support`
        });
      }
    });
    
    this.results.recommendations = recommendations;
  }

  async saveResults() {
    const reportPath = path.join(this.outputDir, 'cross-platform-report.json');
    const htmlReportPath = path.join(this.outputDir, 'cross-platform-report.html');
    
    // Save JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    // Console summary
    this.printSummary();
  }

  generateHTMLReport() {
    const { summary, recommendations } = this.results;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Cross-Platform Compatibility Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #007acc; padding-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007acc; }
        .metric.good { border-left-color: #4caf50; background: #e8f5e8; }
        .metric.warning { border-left-color: #ffa500; background: #fff8e1; }
        .metric.error { border-left-color: #ff4444; background: #ffebee; }
        .compatibility-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .compat-item { text-align: center; padding: 15px; background: #f0f0f0; border-radius: 6px; }
        .percentage { font-size: 2em; font-weight: bold; }
        .percentage.good { color: #4caf50; }
        .percentage.warning { color: #ffa500; }
        .percentage.error { color: #ff4444; }
        .recommendations { margin: 20px 0; }
        .recommendation { margin: 10px 0; padding: 15px; border-radius: 6px; border-left: 4px solid #2196f3; background: #e3f2fd; }
        .recommendation.high { border-left-color: #ff4444; background: #ffebee; }
        .recommendation.medium { border-left-color: #ffa500; background: #fff8e1; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 Cross-Platform Compatibility Report</h1>
        <p><strong>Generated:</strong> ${this.results.timestamp}</p>
        
        <div class="summary">
            <div class="metric ${summary.passedTests === summary.totalTests ? 'good' : 'warning'}">
                <h3>Overall Results</h3>
                <p><strong>${summary.passedTests}/${summary.totalTests}</strong> tests passed</p>
                <p>${Math.round((summary.passedTests / summary.totalTests) * 100)}% success rate</p>
            </div>
            <div class="metric ${summary.failedTests === 0 ? 'good' : 'error'}">
                <h3>Failed Tests</h3>
                <p><strong>${summary.failedTests}</strong> failures</p>
                <p>${this.results.issues.length} total issues</p>
            </div>
        </div>
        
        <h2>📊 Browser Compatibility</h2>
        <div class="compatibility-grid">
            ${Object.entries(summary.compatibility).filter(([key]) => 
              this.testMatrix.browsers.some(b => b.name === key)
            ).map(([browser, stats]) => `
                <div class="compat-item">
                    <h4>${browser}</h4>
                    <div class="percentage ${stats.percentage >= 90 ? 'good' : stats.percentage >= 70 ? 'warning' : 'error'}">
                        ${stats.percentage}%
                    </div>
                    <p>${stats.passed}/${stats.total} passed</p>
                </div>
            `).join('')}
        </div>
        
        <h2>📱 Device Compatibility</h2>
        <div class="compatibility-grid">
            <div class="compat-item">
                <h4>Mobile</h4>
                <div class="percentage ${summary.compatibility.mobile.percentage >= 90 ? 'good' : summary.compatibility.mobile.percentage >= 70 ? 'warning' : 'error'}">
                    ${summary.compatibility.mobile.percentage}%
                </div>
                <p>${summary.compatibility.mobile.passed}/${summary.compatibility.mobile.total} passed</p>
            </div>
            <div class="compat-item">
                <h4>Desktop</h4>
                <div class="percentage ${summary.compatibility.desktop.percentage >= 90 ? 'good' : summary.compatibility.desktop.percentage >= 70 ? 'warning' : 'error'}">
                    ${summary.compatibility.desktop.percentage}%
                </div>
                <p>${summary.compatibility.desktop.passed}/${summary.compatibility.desktop.total} passed</p>
            </div>
        </div>
        
        <h2>💡 Recommendations</h2>
        <div class="recommendations">
            ${recommendations.map(rec => `
                <div class="recommendation ${rec.priority}">
                    <strong>${rec.message}</strong><br>
                    <em>${rec.suggestion}</em>
                </div>
            `).join('')}
        </div>
        
        <h2>🔍 Test Details</h2>
        <table>
            <thead>
                <tr>
                    <th>Browser</th>
                    <th>Device</th>
                    <th>Color Scheme</th>
                    <th>Status</th>
                    <th>Load Time</th>
                    <th>Issues</th>
                </tr>
            </thead>
            <tbody>
                ${this.results.detailed.map(test => `
                    <tr>
                        <td>${test.browser}</td>
                        <td>${test.device}</td>
                        <td>${test.colorScheme}</td>
                        <td style="color: ${test.passed ? '#4caf50' : '#ff4444'}">${test.passed ? '✅ Pass' : '❌ Fail'}</td>
                        <td>${test.loadTime}ms</td>
                        <td>${test.issues.length}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>
    `;
  }

  printSummary() {
    const { summary } = this.results;
    
    console.log('\n🌐 Cross-Platform Testing Summary');
    console.log('================================');
    console.log(`Tests: ${summary.passedTests}/${summary.totalTests} passed (${Math.round((summary.passedTests / summary.totalTests) * 100)}%)`);
    console.log(`Failures: ${summary.failedTests}`);
    console.log(`Issues: ${this.results.issues.length}`);
    
    console.log('\n📊 Browser Compatibility:');
    Object.entries(summary.compatibility).forEach(([browser, stats]) => {
      if (this.testMatrix.browsers.some(b => b.name === browser)) {
        console.log(`  ${browser}: ${stats.percentage}% (${stats.passed}/${stats.total})`);
      }
    });
    
    console.log('\n📱 Device Categories:');
    console.log(`  Mobile: ${summary.compatibility.mobile.percentage}% (${summary.compatibility.mobile.passed}/${summary.compatibility.mobile.total})`);
    console.log(`  Desktop: ${summary.compatibility.desktop.percentage}% (${summary.compatibility.desktop.passed}/${summary.compatibility.desktop.total})`);
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      this.results.recommendations.slice(0, 3).forEach(rec => {
        console.log(`  • ${rec.message}: ${rec.suggestion.slice(0, 80)}...`);
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
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key && value) {
      switch (key) {
        case 'url':
          options.baseUrl = value;
          break;
        case 'output':
          options.outputDir = value;
          break;
      }
    }
  }
  
  const tester = new CrossPlatformTester(options);
  
  tester.runAllTests()
    .then(() => {
      console.log('\n✅ Cross-platform testing completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Cross-platform testing failed:', error);
      process.exit(1);
    });
}

module.exports = CrossPlatformTester;