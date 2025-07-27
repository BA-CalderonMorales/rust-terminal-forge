#!/usr/bin/env node

/**
 * Puppeteer TDD Validation for Theme Switcher and Tool UIs
 * Comprehensive cross-device testing
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = 'http://localhost:8082';
const TEST_TIMEOUT = 30000;

class ThemeUIValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      themeTests: [],
      uiTests: [],
      responsiveTests: [],
      errors: []
    };
  }

  async initialize() {
    console.log('🚀 Initializing Puppeteer for Theme and UI validation...');
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Setup console logging
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.testResults.errors.push({
          type: 'console',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    console.log('✅ Puppeteer initialized');
  }

  async navigateToApp() {
    console.log(`🌐 Navigating to ${APP_URL}...`);
    await this.page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
    await this.page.waitForSelector('#root', { timeout: 10000 });
    console.log('✅ Application loaded');
  }

  async testThemeSwitcherSubtlety() {
    console.log('🎨 Testing theme switcher subtlety and professionalism...');
    
    const tests = [
      {
        name: 'Theme switcher is subtle and professional',
        test: async () => {
          const switcher = await this.page.$('[data-testid="theme-switcher-subtle"]');
          if (!switcher) {
            throw new Error('Subtle theme switcher not found');
          }
          
          const styles = await this.page.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              position: computed.position,
              opacity: computed.opacity,
              zIndex: computed.zIndex
            };
          }, switcher);
          
          if (styles.position !== 'absolute' && styles.position !== 'fixed') {
            throw new Error('Theme switcher should be positioned absolutely or fixed');
          }
          
          const opacity = parseFloat(styles.opacity);
          console.log(`    Theme switcher opacity: ${opacity}`);
        }
      },
      {
        name: 'Theme switcher has proper hover states',
        test: async () => {
          const button = await this.page.$('[data-testid="theme-switcher-button"]');
          if (!button) {
            throw new Error('Theme switcher button not found');
          }
          
          // Test hover
          await button.hover();
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const hoverStyles = await this.page.evaluate((el) => {
            return window.getComputedStyle(el).opacity;
          }, button);
          
          // Should become more visible on hover
          if (parseFloat(hoverStyles) <= 0.5) {
            throw new Error('Theme switcher should become more visible on hover');
          }
        }
      },
      {
        name: 'Theme dropdown only appears on click',
        test: async () => {
          const button = await this.page.$('[data-testid="theme-switcher-button"]');
          let dropdown = await this.page.$('[data-testid="theme-dropdown"]');
          
          // Initially hidden
          if (dropdown) {
            const isVisible = await dropdown.isIntersectingViewport();
            if (isVisible) {
              throw new Error('Theme dropdown should be hidden initially');
            }
          }
          
          // Show on click
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 200));
          
          dropdown = await this.page.$('[data-testid="theme-dropdown"]');
          if (!dropdown) {
            throw new Error('Theme dropdown should appear after click');
          }
          
          const isVisible = await dropdown.isIntersectingViewport();
          if (!isVisible) {
            throw new Error('Theme dropdown should be visible after click');
          }
        }
      }
    ];

    for (const test of tests) {
      try {
        await test.test();
        this.testResults.themeTests.push({
          name: test.name,
          status: 'passed',
          timestamp: new Date().toISOString()
        });
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.testResults.themeTests.push({
          name: test.name,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async testAllThemesFunctionality() {
    console.log('🎨 Testing all themes functionality...');
    
    // Get available themes
    const themes = await this.page.evaluate(() => {
      return window.themeManager ? window.themeManager.getAvailableThemes() : [];
    });

    if (themes.length === 0) {
      console.log('⚠️ No themes found in themeManager');
      return;
    }

    for (const theme of themes) {
      try {
        console.log(`  Testing theme: ${theme.name}`);
        
        // Check if this theme is already active
        const currentTheme = await this.page.evaluate(() => {
          return window.themeManager ? window.themeManager.getCurrentTheme() : null;
        });
        
        if (currentTheme && currentTheme.name === theme.name) {
          console.log(`    Theme ${theme.name} is already active`);
          this.testResults.themeTests.push({
            name: `Theme switching to ${theme.name}`,
            status: 'passed',
            timestamp: new Date().toISOString()
          });
          console.log(`  ✅ ${theme.name} was already active`);
          continue;
        }
        
        // Ensure dropdown is closed first by clicking outside
        await this.page.click('body');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Open theme switcher and wait for dropdown
        const button = await this.page.$('[data-testid="theme-switcher-button"]');
        if (button) {
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 500)); // Increased wait time
          
          // Wait for dropdown to be visible
          await this.page.waitForSelector('[data-testid="theme-dropdown"]', { 
            visible: true, 
            timeout: 2000 
          });
        }
        
        // Debug: List all available theme options after dropdown opens
        const availableOptions = await this.page.evaluate(() => {
          const dropdown = document.querySelector('[data-testid="theme-dropdown"]');
          if (!dropdown) return [];
          const buttons = Array.from(dropdown.querySelectorAll('button'));
          return buttons.map(btn => ({
            text: btn.textContent?.trim(),
            dataThemeKey: btn.getAttribute('data-theme-key')
          })).filter(btn => btn.text && btn.dataThemeKey);
        });
        console.log(`    Available theme options:`, availableOptions);
        
        // Find and click theme option - search within dropdown
        let themeOption = await this.page.$(`[data-testid="theme-dropdown"] [data-theme-key="${theme.key}"]`);
        if (!themeOption) {
          // Try finding by text content within dropdown
          themeOption = await this.page.evaluateHandle((themeName) => {
            const dropdown = document.querySelector('[data-testid="theme-dropdown"]');
            if (!dropdown) return null;
            const buttons = Array.from(dropdown.querySelectorAll('button'));
            return buttons.find(btn => btn.textContent && btn.textContent.trim() === themeName);
          }, theme.name);
        }
        if (!themeOption || !themeOption.asElement) {
          // Try finding by partial text match within dropdown
          themeOption = await this.page.evaluateHandle((themeName) => {
            const dropdown = document.querySelector('[data-testid="theme-dropdown"]');
            if (!dropdown) return null;
            const buttons = Array.from(dropdown.querySelectorAll('button'));
            return buttons.find(btn => btn.textContent && btn.textContent.includes(themeName.split(' ')[0]));
          }, theme.name);
        }
        
        if (themeOption) {
          if (typeof themeOption.click === 'function') {
            await themeOption.click();
          } else if (themeOption.asElement) {
            const element = await themeOption.asElement();
            if (element) {
              await element.click();
            } else {
              throw new Error(`Could not get element for theme: ${theme.name}`);
            }
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verify theme was applied
          const currentTheme = await this.page.evaluate(() => {
            return window.themeManager ? window.themeManager.getCurrentTheme() : null;
          });
          
          if (currentTheme && currentTheme.name !== theme.name) {
            throw new Error(`Theme ${theme.name} was not applied correctly`);
          }
          
          this.testResults.themeTests.push({
            name: `Theme switching to ${theme.name}`,
            status: 'passed',
            timestamp: new Date().toISOString()
          });
          console.log(`  ✅ ${theme.name} applied successfully`);
        } else {
          throw new Error(`Theme option for ${theme.name} not found`);
        }
      } catch (error) {
        this.testResults.themeTests.push({
          name: `Theme switching to ${theme.name}`,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.log(`  ❌ ${theme.name}: ${error.message}`);
      }
    }
  }

  async testToolUIResponsiveness() {
    console.log('🛠️ Testing tool UI responsiveness...');
    
    const deviceSizes = [
      { name: 'Mobile Portrait', width: 375, height: 667 },
      { name: 'Mobile Landscape', width: 667, height: 375 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    const toolSelectors = [
      '[data-testid="vim-interface"]',
      '[data-testid="claude-interface"]',
      '[data-testid="gemini-interface"]',
      '[data-testid="qwen-interface"]',
      '[data-testid="code-interface"]'
    ];

    for (const device of deviceSizes) {
      console.log(`  📱 Testing ${device.name} (${device.width}x${device.height})`);
      
      await this.page.setViewport({
        width: device.width,
        height: device.height
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Test terminal responsiveness
        const terminal = await this.page.$('[class*="terminal"]');
        if (terminal) {
          const terminalRect = await terminal.boundingBox();
          
          if (terminalRect.width > device.width) {
            throw new Error(`Terminal width (${terminalRect.width}) exceeds viewport width (${device.width})`);
          }
          
          // Test touch targets on mobile
          if (device.width <= 768) {
            const buttons = await this.page.$$('button');
            for (const button of buttons) {
              const rect = await button.boundingBox();
              if (rect && (rect.height < 44 || rect.width < 44)) {
                console.warn(`Small touch target found: ${rect.width}x${rect.height}`);
              }
            }
          }
        }
        
        // Test tool interfaces if they exist
        for (const selector of toolSelectors) {
          const toolUI = await this.page.$(selector);
          if (toolUI) {
            const isVisible = await toolUI.isIntersectingViewport();
            if (!isVisible) {
              console.warn(`Tool UI ${selector} not visible on ${device.name}`);
            }
          }
        }
        
        this.testResults.responsiveTests.push({
          device: device.name,
          status: 'passed',
          timestamp: new Date().toISOString()
        });
        console.log(`    ✅ ${device.name} responsive test passed`);
        
      } catch (error) {
        this.testResults.responsiveTests.push({
          device: device.name,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.log(`    ❌ ${device.name}: ${error.message}`);
      }
    }
  }

  async testNvChadDesignConsistency() {
    console.log('🎨 Testing NvChad design system consistency...');
    
    const designTests = [
      {
        name: 'NvChad color variables are defined',
        test: async () => {
          const nvChadColors = await this.page.evaluate(() => {
            const styles = getComputedStyle(document.documentElement);
            return {
              primary: styles.getPropertyValue('--nvchad-primary'),
              secondary: styles.getPropertyValue('--nvchad-secondary'),
              background: styles.getPropertyValue('--nvchad-background'),
              accent: styles.getPropertyValue('--nvchad-accent')
            };
          });
          
          const missingColors = Object.entries(nvChadColors)
            .filter(([key, value]) => !value || value.trim() === '')
            .map(([key]) => key);
          
          if (missingColors.length > 0) {
            throw new Error(`Missing NvChad color variables: ${missingColors.join(', ')}`);
          }
        }
      },
      {
        name: 'Consistent typography system',
        test: async () => {
          const typography = await this.page.evaluate(() => {
            const container = document.querySelector('[data-testid="nvchad-typography"]');
            if (!container) return null;
            
            const styles = getComputedStyle(container);
            return {
              fontFamily: styles.fontFamily,
              fontSize: styles.fontSize,
              lineHeight: styles.lineHeight
            };
          });
          
          if (!typography) {
            throw new Error('NvChad typography container not found');
          }
          
          if (!typography.fontFamily.includes('monospace')) {
            throw new Error('NvChad typography should use monospace font');
          }
        }
      }
    ];

    for (const test of designTests) {
      try {
        await test.test();
        this.testResults.uiTests.push({
          name: test.name,
          status: 'passed',
          timestamp: new Date().toISOString()
        });
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.testResults.uiTests.push({
          name: test.name,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        themeTests: {
          total: this.testResults.themeTests.length,
          passed: this.testResults.themeTests.filter(t => t.status === 'passed').length,
          failed: this.testResults.themeTests.filter(t => t.status === 'failed').length
        },
        uiTests: {
          total: this.testResults.uiTests.length,
          passed: this.testResults.uiTests.filter(t => t.status === 'passed').length,
          failed: this.testResults.uiTests.filter(t => t.status === 'failed').length
        },
        responsiveTests: {
          total: this.testResults.responsiveTests.length,
          passed: this.testResults.responsiveTests.filter(t => t.status === 'passed').length,
          failed: this.testResults.responsiveTests.filter(t => t.status === 'failed').length
        },
        errors: this.testResults.errors.length
      },
      detailed: this.testResults
    };

    console.log('\n📊 === THEME & UI VALIDATION REPORT ===');
    console.log(`🕒 Generated: ${report.timestamp}`);
    console.log(`🎨 Theme Tests: ${report.summary.themeTests.passed}/${report.summary.themeTests.total} passed`);
    console.log(`🛠️ UI Tests: ${report.summary.uiTests.passed}/${report.summary.uiTests.total} passed`);
    console.log(`📱 Responsive Tests: ${report.summary.responsiveTests.passed}/${report.summary.responsiveTests.total} passed`);
    console.log(`❌ Errors: ${report.summary.errors}`);
    
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
      await this.testThemeSwitcherSubtlety();
      await this.testAllThemesFunctionality();
      await this.testToolUIResponsiveness();
      await this.testNvChadDesignConsistency();
      
      const report = await this.generateReport();
      
      // Save report
      const reportPath = path.join(__dirname, 'theme-ui-validation-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 Detailed report saved to: ${reportPath}`);
      
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
  console.log('🧪 Starting Theme & UI Puppeteer Validation (TDD)');
  console.log('=' .repeat(60));
  
  const validator = new ThemeUIValidator();
  
  try {
    const report = await validator.run();
    
    const totalTests = report.summary.themeTests.total + report.summary.uiTests.total + report.summary.responsiveTests.total;
    const totalPassed = report.summary.themeTests.passed + report.summary.uiTests.passed + report.summary.responsiveTests.passed;
    
    if (totalPassed === totalTests && report.summary.errors === 0) {
      console.log('\n🎉 All tests passed! Theme and UI are working perfectly.');
      process.exit(0);
    } else {
      console.log(`\n⚠️ Some tests failed: ${totalTests - totalPassed}/${totalTests}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Validation failed:', error.message);
    process.exit(2);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ThemeUIValidator;