#!/usr/bin/env node

/**
 * Console Error Detection Test
 * Automated testing for console errors using Puppeteer
 * Designed to detect JavaScript errors, warnings, and issues
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const APP_URL = 'http://localhost:8081';
const TEST_TIMEOUT = 30000;

class ConsoleErrorDetector {
  constructor() {
    this.browser = null;
    this.page = null;
    this.consoleMessages = [];
    this.errors = [];
    this.warnings = [];
  }

  async initialize() {
    console.log('🚀 Launching Puppeteer browser...');
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set viewport for testing
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Configure console listener
    this.setupConsoleListener();
    
    // Configure error handlers
    this.setupErrorHandlers();
    
    console.log('✅ Puppeteer initialized successfully');
  }

  setupConsoleListener() {
    this.page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();
      
      const logEntry = {
        type,
        text,
        location,
        timestamp: new Date().toISOString()
      };
      
      this.consoleMessages.push(logEntry);
      
      if (type === 'error') {
        this.errors.push(logEntry);
        console.log(`❌ Console Error: ${text}`);
        if (location.url) {
          console.log(`   Location: ${location.url}:${location.lineNumber}:${location.columnNumber}`);
        }
      } else if (type === 'warning') {
        this.warnings.push(logEntry);
        console.log(`⚠️ Console Warning: ${text}`);
      } else if (type === 'log' && text.includes('error')) {
        console.log(`📝 Console Log (potential error): ${text}`);
      }
    });
  }

  setupErrorHandlers() {
    // Handle uncaught exceptions
    this.page.on('pageerror', (error) => {
      const errorEntry = {
        type: 'pageerror',
        text: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      
      this.errors.push(errorEntry);
      console.log(`💥 Page Error: ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
    });

    // Handle failed requests
    this.page.on('requestfailed', (request) => {
      const errorEntry = {
        type: 'requestfailed',
        text: `Failed to load: ${request.url()}`,
        failure: request.failure(),
        timestamp: new Date().toISOString()
      };
      
      this.errors.push(errorEntry);
      console.log(`🌐 Request Failed: ${request.url()}`);
      console.log(`   Reason: ${request.failure().errorText}`);
    });

    // Handle response errors
    this.page.on('response', (response) => {
      if (response.status() >= 400) {
        const errorEntry = {
          type: 'responseerror',
          text: `HTTP ${response.status()}: ${response.url()}`,
          status: response.status(),
          url: response.url(),
          timestamp: new Date().toISOString()
        };
        
        this.errors.push(errorEntry);
        console.log(`🔥 HTTP Error: ${response.status()} ${response.url()}`);
      }
    });
  }

  async navigateToApp() {
    console.log(`🌐 Navigating to ${APP_URL}...`);
    
    try {
      const response = await this.page.goto(APP_URL, {
        waitUntil: 'networkidle0',
        timeout: TEST_TIMEOUT
      });
      
      if (response.status() >= 400) {
        throw new Error(`HTTP ${response.status()}: Failed to load application`);
      }
      
      console.log('✅ Application loaded successfully');
      return response;
    } catch (error) {
      console.error(`❌ Failed to navigate to application: ${error.message}`);
      throw error;
    }
  }

  async waitForAppInitialization() {
    console.log('⏳ Waiting for application initialization...');
    
    try {
      // Wait for React root to be mounted
      await this.page.waitForSelector('#root', { timeout: 10000 });
      
      // Wait for main app components
      await this.page.waitForSelector('[class*="terminal"]', { timeout: 10000 });
      
      // Give time for any async operations
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('✅ Application initialized');
    } catch (error) {
      console.error(`❌ Application initialization failed: ${error.message}`);
      throw error;
    }
  }

  async checkTerminalFunctionality() {
    console.log('🖥️ Testing terminal functionality...');
    
    try {
      // Check if terminal is visible
      const terminalVisible = await this.page.$('[class*="terminal"]') !== null;
      if (!terminalVisible) {
        this.errors.push({
          type: 'functional',
          text: 'Terminal component not found',
          timestamp: new Date().toISOString()
        });
      }
      
      // Check for connection status
      const connectionStatus = await this.page.evaluate(() => {
        const statusElements = document.querySelectorAll('[class*="status"], [aria-live], [role="status"]');
        return Array.from(statusElements).map(el => el.textContent).join(' ');
      });
      
      console.log(`📊 Connection Status: ${connectionStatus}`);
      
      // Test basic interaction
      await this.page.click('[class*="terminal"]');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Terminal functionality check completed');
    } catch (error) {
      console.error(`❌ Terminal functionality check failed: ${error.message}`);
      this.errors.push({
        type: 'functional',
        text: `Terminal test error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  async performInteractionTests() {
    console.log('🎯 Performing interaction tests...');
    
    try {
      // Test mobile detection
      await this.page.evaluate(() => {
        if (typeof window !== 'undefined' && window.navigator) {
          console.log('Mobile detection test:', {
            userAgent: navigator.userAgent,
            touchSupport: 'ontouchstart' in window,
            maxTouchPoints: navigator.maxTouchPoints
          });
        }
      });
      
      // Test theme switching if available
      const themeButton = await this.page.$('[class*="theme"], button[title*="theme"]');
      if (themeButton) {
        await themeButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✅ Theme switcher test completed');
      }
      
      // Test scrolling behavior
      const terminal = await this.page.$('[class*="terminal-output"]');
      if (terminal) {
        await this.page.evaluate((element) => {
          element.scrollTop = element.scrollHeight;
        }, terminal);
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✅ Scroll behavior test completed');
      }
      
    } catch (error) {
      console.error(`❌ Interaction tests failed: ${error.message}`);
      this.errors.push({
        type: 'interaction',
        text: `Interaction test error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: APP_URL,
      summary: {
        totalMessages: this.consoleMessages.length,
        errors: this.errors.length,
        warnings: this.warnings.length,
        hasErrors: this.errors.length > 0,
        hasWarnings: this.warnings.length > 0
      },
      errors: this.errors,
      warnings: this.warnings,
      allMessages: this.consoleMessages
    };

    console.log('\n📊 === CONSOLE ERROR REPORT ===');
    console.log(`🕒 Generated: ${report.timestamp}`);
    console.log(`🌐 URL: ${report.url}`);
    console.log(`📝 Total Console Messages: ${report.summary.totalMessages}`);
    console.log(`❌ Errors Found: ${report.summary.errors}`);
    console.log(`⚠️ Warnings Found: ${report.summary.warnings}`);
    
    if (report.summary.errors > 0) {
      console.log('\n🔍 ERROR DETAILS:');
      report.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.type.toUpperCase()}: ${error.text}`);
        if (error.location) {
          console.log(`   📍 Location: ${error.location.url || 'N/A'}:${error.location.lineNumber || '?'}:${error.location.columnNumber || '?'}`);
        }
        if (error.stack) {
          console.log(`   📚 Stack: ${error.stack.split('\n')[0]}`);
        }
        console.log(`   🕒 Time: ${error.timestamp}`);
      });
    }
    
    if (report.summary.warnings > 0) {
      console.log('\n⚠️ WARNING DETAILS:');
      report.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.text}`);
        if (warning.location) {
          console.log(`   📍 Location: ${warning.location.url || 'N/A'}:${warning.location.lineNumber || '?'}`);
        }
        console.log(`   🕒 Time: ${warning.timestamp}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.navigateToApp();
      await this.waitForAppInitialization();
      await this.checkTerminalFunctionality();
      await this.performInteractionTests();
      
      // Wait a bit more to catch any delayed errors
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const report = await this.generateReport();
      
      return report;
    } catch (error) {
      console.error(`❌ Test execution failed: ${error.message}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  console.log('🧪 Starting Console Error Detection Test');
  console.log('=' .repeat(50));
  
  const detector = new ConsoleErrorDetector();
  
  try {
    const report = await detector.run();
    
    // Write report to file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const reportPath = path.join(__dirname, 'console-error-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(report.summary.hasErrors ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    process.exit(2);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ConsoleErrorDetector;