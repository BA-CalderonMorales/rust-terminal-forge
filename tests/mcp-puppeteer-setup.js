#!/usr/bin/env node

/**
 * MCP Puppeteer Testing Framework Setup
 * Provides comprehensive testing capabilities for terminal UI components
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPPuppeteerFramework {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.serverProcess = null;
    this.config = {
      headless: options.headless !== false,
      viewport: { width: 1920, height: 1080 },
      serverPort: options.serverPort || 8082,
      timeout: options.timeout || 30000,
      ...options
    };
    
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      errors: [],
      performance: {}
    };
  }

  async initialize() {
    console.log('🚀 Initializing MCP Puppeteer Framework...');
    
    try {
      // Start development server if not running
      await this.startDevServer();
      
      // Launch browser
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ],
        devtools: !this.config.headless
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport(this.config.viewport);
      
      // Setup console logging
      this.page.on('console', (msg) => {
        const type = msg.type();
        const text = msg.text();
        
        if (type === 'error') {
          this.testResults.errors.push({
            type: 'console',
            message: text,
            timestamp: new Date().toISOString()
          });
          console.log(`🔴 Console Error: ${text}`);
        } else if (type === 'warn') {
          console.log(`🟡 Console Warning: ${text}`);
        }
      });

      // Setup request/response monitoring
      this.page.on('response', (response) => {
        const url = response.url();
        const status = response.status();
        
        if (status >= 400) {
          console.log(`🔴 HTTP Error: ${status} - ${url}`);
          this.testResults.errors.push({
            type: 'http',
            status,
            url,
            timestamp: new Date().toISOString()
          });
        }
      });

      console.log('✅ MCP Puppeteer Framework initialized');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize framework:', error.message);
      throw error;
    }
  }

  async startDevServer() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Starting development server...');
      
      const serverCommand = 'npm';
      const serverArgs = ['run', 'dev'];
      
      this.serverProcess = spawn(serverCommand, serverArgs, {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe'
      });

      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Development server failed to start within timeout'));
        }
      }, 30000);

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`📊 Server: ${output.trim()}`);
        
        if (output.includes('Local:') || output.includes(`localhost:${this.config.serverPort}`)) {
          serverReady = true;
          clearTimeout(timeout);
          setTimeout(resolve, 2000); // Wait 2s for server to be fully ready
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.log(`🔴 Server Error: ${error.trim()}`);
        
        if (error.includes('EADDRINUSE')) {
          console.log('✅ Server already running, continuing...');
          serverReady = true;
          clearTimeout(timeout);
          resolve();
        }
      });

      this.serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async navigateToApp(path = '') {
    const url = `http://localhost:${this.config.serverPort}${path}`;
    console.log(`🌐 Navigating to: ${url}`);
    
    try {
      await this.page.goto(url, { 
        waitUntil: 'networkidle0', 
        timeout: this.config.timeout 
      });
      
      // Wait for React app to mount
      await this.page.waitForSelector('#root', { timeout: 10000 });
      
      // Wait for terminal to initialize
      await this.page.waitForSelector('[data-testid="terminal-container"], [class*="terminal"]', { 
        timeout: 10000 
      });
      
      console.log('✅ Application loaded successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to navigate to application:', error.message);
      throw error;
    }
  }

  async injectTestHelpers() {
    console.log('🔧 Injecting test helpers...');
    
    await this.page.evaluate(() => {
      // Global test utilities
      window.testUtils = {
        // Wait for element with timeout
        waitForElement: (selector, timeout = 5000) => {
          return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
              resolve(element);
              return;
            }
            
            const observer = new MutationObserver(() => {
              const element = document.querySelector(selector);
              if (element) {
                observer.disconnect();
                resolve(element);
              }
            });
            
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
            
            setTimeout(() => {
              observer.disconnect();
              reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
          });
        },

        // Simulate realistic typing
        typeRealistic: async (element, text, delay = 50) => {
          element.focus();
          for (const char of text) {
            element.value += char;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 50));
          }
          element.dispatchEvent(new Event('change', { bubbles: true }));
        },

        // Get computed style safely
        getStyle: (element, property) => {
          return window.getComputedStyle(element).getPropertyValue(property);
        },

        // Check if element is visible
        isVisible: (element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && 
                 style.visibility !== 'hidden' && 
                 style.display !== 'none' &&
                 style.opacity !== '0';
        },

        // Performance measurement
        measurePerformance: (name, fn) => {
          const start = performance.now();
          const result = fn();
          const end = performance.now();
          
          console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
          return { result, duration: end - start };
        },

        // Theme switching utility
        switchTheme: async (themeName) => {
          if (window.themeManager) {
            window.themeManager.setTheme(themeName);
            await new Promise(resolve => setTimeout(resolve, 200));
            return window.themeManager.getCurrentTheme();
          }
          throw new Error('Theme manager not available');
        },

        // Terminal automation utilities
        terminal: {
          executeCommand: async (command) => {
            const input = document.querySelector('[data-testid="terminal-input"], input[type="text"]');
            if (input) {
              await window.testUtils.typeRealistic(input, command);
              input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
              await new Promise(resolve => setTimeout(resolve, 500));
              return true;
            }
            return false;
          },

          getCursor: () => {
            return document.querySelector('[data-testid="terminal-cursor"], [class*="cursor"]');
          },

          getOutput: () => {
            const output = document.querySelector('[data-testid="terminal-output"], [class*="output"]');
            return output ? output.textContent : '';
          }
        },

        // Tool interface utilities
        tools: {
          openTool: async (toolName) => {
            const toolButton = document.querySelector(`[data-tool="${toolName}"], [data-testid="${toolName}-button"]`);
            if (toolButton) {
              toolButton.click();
              await window.testUtils.waitForElement(`[data-testid="${toolName}-interface"]`);
              return true;
            }
            return false;
          },

          isToolActive: (toolName) => {
            const toolInterface = document.querySelector(`[data-testid="${toolName}-interface"]`);
            return toolInterface && window.testUtils.isVisible(toolInterface);
          },

          closeTool: async (toolName) => {
            const closeButton = document.querySelector(`[data-testid="${toolName}-interface"] [data-testid="close"], [data-testid="${toolName}-close"]`);
            if (closeButton) {
              closeButton.click();
              await new Promise(resolve => setTimeout(resolve, 200));
              return true;
            }
            return false;
          }
        },

        // Animation and transition utilities
        animations: {
          waitForAnimation: (element, property = 'opacity', timeout = 3000) => {
            return new Promise((resolve, reject) => {
              const startValue = window.getComputedStyle(element).getPropertyValue(property);
              let animationDetected = false;
              
              const checkAnimation = () => {
                const currentValue = window.getComputedStyle(element).getPropertyValue(property);
                if (currentValue !== startValue) {
                  animationDetected = true;
                }
              };
              
              const interval = setInterval(checkAnimation, 16); // 60fps
              
              setTimeout(() => {
                clearInterval(interval);
                if (animationDetected) {
                  // Wait for animation to complete
                  setTimeout(resolve, 500);
                } else {
                  reject(new Error('No animation detected'));
                }
              }, timeout);
            });
          },

          disableAnimations: () => {
            const style = document.createElement('style');
            style.textContent = `
              *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-delay: 0.01ms !important;
                transition-duration: 0.01ms !important;
                transition-delay: 0.01ms !important;
              }
            `;
            document.head.appendChild(style);
            return style;
          }
        }
      };

      console.log('✅ Test helpers injected');
    });
  }

  async runCursorTests() {
    console.log('🖱️ Running cursor placement tests...');
    
    const tests = [
      {
        name: 'Cursor visibility and blinking',
        test: async () => {
          const cursor = await this.page.evaluate(() => {
            return window.testUtils.terminal.getCursor();
          });
          
          expect(cursor).toBeTruthy();
          
          // Check blinking animation
          const hasAnimation = await this.page.evaluate((cursor) => {
            const style = window.getComputedStyle(cursor);
            return style.animationName !== 'none' && style.animationDuration !== '0s';
          }, cursor);
          
          expect(hasAnimation).toBe(true);
        }
      },
      {
        name: 'Cursor position with typing',
        test: async () => {
          const testText = 'hello world';
          
          await this.page.evaluate(async (text) => {
            await window.testUtils.terminal.executeCommand(text);
          }, testText);
          
          const cursorPosition = await this.page.evaluate(() => {
            const cursor = window.testUtils.terminal.getCursor();
            const input = document.querySelector('[data-testid="terminal-input"], input');
            
            if (cursor && input) {
              const cursorRect = cursor.getBoundingClientRect();
              const inputRect = input.getBoundingClientRect();
              
              return {
                cursorLeft: cursorRect.left,
                inputLeft: inputRect.left,
                isVisible: window.testUtils.isVisible(cursor)
              };
            }
            return null;
          });
          
          expect(cursorPosition).toBeTruthy();
          expect(cursorPosition.isVisible).toBe(true);
        }
      }
    ];

    return this.runTestSuite('Cursor Tests', tests);
  }

  async runUIOptimizationTests() {
    console.log('🎨 Running UI optimization tests...');
    
    const tests = [
      {
        name: 'Single integrated header',
        test: async () => {
          const headerCount = await this.page.evaluate(() => {
            const headers = document.querySelectorAll('[class*="header"], [class*="bar"], [class*="tab-bar"]');
            return headers.length;
          });
          
          // Should have minimal headers for clean UI
          expect(headerCount).toBeLessThanOrEqual(2);
        }
      },
      {
        name: 'Responsive layout adaptation',
        test: async () => {
          const deviceSizes = [
            { width: 375, height: 667, name: 'mobile' },
            { width: 1920, height: 1080, name: 'desktop' }
          ];
          
          for (const device of deviceSizes) {
            await this.page.setViewport(device);
            await this.page.waitForTimeout(500);
            
            const isResponsive = await this.page.evaluate((deviceName) => {
              const container = document.querySelector('[data-testid="terminal-container"]');
              if (!container) return false;
              
              const rect = container.getBoundingClientRect();
              const viewport = { width: window.innerWidth, height: window.innerHeight };
              
              // Should not overflow viewport
              return rect.width <= viewport.width && rect.height <= viewport.height;
            }, device.name);
            
            expect(isResponsive).toBe(true);
          }
        }
      }
    ];

    return this.runTestSuite('UI Optimization Tests', tests);
  }

  async runTerminalBehaviorTests() {
    console.log('⚡ Running terminal behavior tests...');
    
    const tools = ['vim', 'code', 'gemini', 'qwen'];
    const tests = [];
    
    for (const toolName of tools) {
      tests.push({
        name: `${toolName} tool integration`,
        test: async () => {
          const toolOpened = await this.page.evaluate(async (tool) => {
            return await window.testUtils.tools.openTool(tool);
          }, toolName);
          
          if (toolOpened) {
            const isActive = await this.page.evaluate((tool) => {
              return window.testUtils.tools.isToolActive(tool);
            }, toolName);
            
            expect(isActive).toBe(true);
            
            // Close tool
            await this.page.evaluate(async (tool) => {
              await window.testUtils.tools.closeTool(tool);
            }, toolName);
          } else {
            console.log(`⚠️ Tool ${toolName} not available, skipping test`);
          }
        }
      });
    }

    return this.runTestSuite('Terminal Behavior Tests', tests);
  }

  async runTestSuite(suiteName, tests) {
    console.log(`\n🧪 Running ${suiteName}...`);
    const results = { passed: 0, failed: 0, errors: [] };
    
    for (const test of tests) {
      try {
        console.log(`  🔍 ${test.name}...`);
        await test.test();
        results.passed++;
        console.log(`  ✅ ${test.name}`);
      } catch (error) {
        results.failed++;
        results.errors.push({ test: test.name, error: error.message });
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
    
    this.testResults.total += tests.length;
    this.testResults.passed += results.passed;
    this.testResults.failed += results.failed;
    this.testResults.errors.push(...results.errors);
    
    console.log(`📊 ${suiteName}: ${results.passed}/${tests.length} passed`);
    return results;
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: ((this.testResults.passed / this.testResults.total) * 100).toFixed(2)
      },
      errors: this.testResults.errors,
      performance: this.testResults.performance,
      environment: {
        viewport: this.config.viewport,
        userAgent: await this.page.evaluate(() => navigator.userAgent),
        url: this.page.url()
      }
    };

    console.log('\n📊 === MCP PUPPETEER TEST REPORT ===');
    console.log(`🕒 Generated: ${report.timestamp}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}%`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`📝 Total: ${report.summary.total}`);
    
    if (report.errors.length > 0) {
      console.log('\n🔍 Error Details:');
      report.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.test || error.type}: ${error.message || error.error}`);
      });
    }

    return report;
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    if (this.page) {
      await this.page.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
    
    console.log('✅ Cleanup completed');
  }

  async run() {
    try {
      await this.initialize();
      await this.navigateToApp();
      await this.injectTestHelpers();
      
      // Run all test suites
      await this.runCursorTests();
      await this.runUIOptimizationTests();
      await this.runTerminalBehaviorTests();
      
      const report = await this.generateReport();
      
      // Save report
      const reportPath = path.join(__dirname, 'mcp-puppeteer-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 Report saved: ${reportPath}`);
      
      return report;
      
    } catch (error) {
      console.error('💥 Test execution failed:', error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Export for use in other modules
export default MCPPuppeteerFramework;

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const framework = new MCPPuppeteerFramework({
    headless: process.argv.includes('--headless'),
    serverPort: process.env.PORT || 8082
  });
  
  framework.run()
    .then((report) => {
      const exitCode = report.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('❌ Framework execution failed:', error);
      process.exit(2);
    });
}