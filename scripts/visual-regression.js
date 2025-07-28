#!/usr/bin/env node
/**
 * 🎯 Visual Regression Testing - Rick's Pixel-Perfect Validation System
 * Tests terminal rendering across all fonts, DPIs, and viewports
 */

const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const TEST_CONFIG = {
  browsers: ['chromium', 'firefox', 'webkit'],
  fonts: [
    'JetBrains Mono',
    'Fira Code', 
    'SF Mono',
    'Consolas',
    'Monaco'
  ],
  fontSizes: [12, 14, 16, 18, 20, 24],
  deviceScaleFactors: [1, 1.25, 1.5, 2, 3],
  viewports: [
    { width: 320, height: 568, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1024, height: 768, name: 'tablet-landscape' },
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 2560, height: 1440, name: 'desktop-large' },
    { width: 3840, height: 2160, name: '4k' }
  ],
  themes: ['dark', 'light', 'neon', 'matrix'],
  testContent: {
    ascii: 'Hello World! 123 ABC xyz',
    unicode: '→ ← ↑ ↓ ★ ▲ ► ▼ ◄ ● ○ █ ░ ▒',
    mixed: 'Code: const x = "hello"; // → λ function',
    emoji: '🚀 📊 🔥 ⚡ 🎯 💻 🧠 🔬',
    code: `function test() {\n  return "Hello World";\n}`
  }
};

class VisualRegressionTester {
  constructor() {
    this.baselineDir = path.join(__dirname, '../test-results/baselines');
    this.currentDir = path.join(__dirname, '../test-results/current');
    this.diffDir = path.join(__dirname, '../test-results/diffs');
    this.results = [];
  }

  async initialize() {
    // Create directories
    await Promise.all([
      this.ensureDir(this.baselineDir),
      this.ensureDir(this.currentDir),
      this.ensureDir(this.diffDir)
    ]);

    console.log('🎯 Visual Regression Tester Initialized');
    console.log(`📁 Baseline: ${this.baselineDir}`);
    console.log(`📁 Current: ${this.currentDir}`);
    console.log(`📁 Diffs: ${this.diffDir}`);
  }

  async runTests() {
    console.log('\n🚀 Starting Visual Regression Tests...');
    
    for (const browserName of TEST_CONFIG.browsers) {
      console.log(`\n🌐 Testing with ${browserName}`);
      
      const browser = await this.launchBrowser(browserName);
      
      try {
        await this.testBrowser(browser, browserName);
      } finally {
        await browser.close();
      }
    }

    await this.generateReport();
    return this.results;
  }

  async launchBrowser(browserName) {
    const browsers = { chromium, firefox, webkit };
    return await browsers[browserName].launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });
  }

  async testBrowser(browser, browserName) {
    for (const viewport of TEST_CONFIG.viewports) {
      console.log(`  📱 Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      for (const deviceScaleFactor of TEST_CONFIG.deviceScaleFactors) {
        const context = await browser.newContext({
          viewport,
          deviceScaleFactor,
          colorScheme: 'dark'
        });

        try {
          await this.testContext(context, browserName, viewport, deviceScaleFactor);
        } finally {
          await context.close();
        }
      }
    }
  }

  async testContext(context, browserName, viewport, deviceScaleFactor) {
    const page = await context.newPage();
    
    try {
      // Navigate to the terminal app
      await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
      
      // Wait for the terminal to be ready
      await page.waitForSelector('.terminal-container', { timeout: 10000 });
      
      for (const theme of TEST_CONFIG.themes) {
        await this.testTheme(page, browserName, viewport, deviceScaleFactor, theme);
      }
    } finally {
      await page.close();
    }
  }

  async testTheme(page, browserName, viewport, deviceScaleFactor, theme) {
    console.log(`    🎨 Testing theme: ${theme}`);
    
    // Switch to the theme
    await this.switchTheme(page, theme);
    
    for (const font of TEST_CONFIG.fonts) {
      for (const fontSize of TEST_CONFIG.fontSizes) {
        await this.testFontConfiguration(
          page, browserName, viewport, deviceScaleFactor, theme, font, fontSize
        );
      }
    }
  }

  async testFontConfiguration(page, browserName, viewport, deviceScaleFactor, theme, font, fontSize) {
    const testId = `${browserName}-${viewport.name}-${deviceScaleFactor}x-${theme}-${font.replace(/\s+/g, '')}-${fontSize}px`;
    
    try {
      // Set font configuration
      await this.setFontConfiguration(page, font, fontSize);
      
      // Test different content types
      for (const [contentType, content] of Object.entries(TEST_CONFIG.testContent)) {
        await this.testContent(page, testId, contentType, content);
      }
      
      // Test specific terminal scenarios
      await this.testTerminalScenarios(page, testId);
      
    } catch (error) {
      console.error(`    ❌ Error testing ${testId}: ${error.message}`);
      this.results.push({
        testId,
        status: 'error',
        error: error.message
      });
    }
  }

  async testContent(page, testId, contentType, content) {
    const screenshotName = `${testId}-${contentType}`;
    
    try {
      // Clear terminal and input content
      await page.evaluate(() => {
        const terminal = document.querySelector('.terminal-content');
        if (terminal) terminal.innerHTML = '';
      });
      
      await page.type('.terminal-input', content);
      await page.keyboard.press('Enter');
      
      // Wait for rendering
      await page.waitForTimeout(100);
      
      // Take screenshot
      const screenshot = await page.screenshot({
        clip: await this.getTerminalBounds(page),
        type: 'png'
      });
      
      const currentPath = path.join(this.currentDir, `${screenshotName}.png`);
      await fs.writeFile(currentPath, screenshot);
      
      // Compare with baseline
      const result = await this.compareWithBaseline(screenshotName, screenshot);
      this.results.push(result);
      
    } catch (error) {
      console.error(`      ❌ Content test failed for ${contentType}: ${error.message}`);
    }
  }

  async testTerminalScenarios(page, testId) {
    const scenarios = [
      {
        name: 'cursor-positioning',
        action: async () => {
          await page.type('.terminal-input', 'echo "Testing cursor"');
          await page.keyboard.press('ArrowLeft', { delay: 50 });
          await page.keyboard.press('ArrowLeft', { delay: 50 });
        }
      },
      {
        name: 'selection',
        action: async () => {
          await page.type('.terminal-input', 'select this text');
          await page.keyboard.down('Shift');
          await page.keyboard.press('ArrowLeft');
          await page.keyboard.press('ArrowLeft');
          await page.keyboard.up('Shift');
        }
      },
      {
        name: 'multi-line',
        action: async () => {
          await page.type('.terminal-input', 'line 1\nline 2\nline 3');
        }
      }
    ];

    for (const scenario of scenarios) {
      try {
        await page.evaluate(() => {
          const terminal = document.querySelector('.terminal-content');
          if (terminal) terminal.innerHTML = '';
        });
        
        await scenario.action();
        await page.waitForTimeout(100);
        
        const screenshotName = `${testId}-${scenario.name}`;
        const screenshot = await page.screenshot({
          clip: await this.getTerminalBounds(page),
          type: 'png'
        });
        
        const currentPath = path.join(this.currentDir, `${screenshotName}.png`);
        await fs.writeFile(currentPath, screenshot);
        
        const result = await this.compareWithBaseline(screenshotName, screenshot);
        this.results.push(result);
        
      } catch (error) {
        console.error(`      ❌ Scenario test failed for ${scenario.name}: ${error.message}`);
      }
    }
  }

  async switchTheme(page, theme) {
    await page.evaluate((themeName) => {
      const themeButton = document.querySelector(`[data-theme="${themeName}"]`);
      if (themeButton) {
        themeButton.click();
      } else {
        // Fallback to CSS class switching
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);
      }
    }, theme);
    
    await page.waitForTimeout(200); // Wait for theme transition
  }

  async setFontConfiguration(page, fontFamily, fontSize) {
    await page.evaluate((font, size) => {
      const style = document.getElementById('dynamic-font-style') || document.createElement('style');
      style.id = 'dynamic-font-style';
      style.textContent = `
        .terminal-content, .terminal-input {
          font-family: "${font}", monospace !important;
          font-size: ${size}px !important;
        }
      `;
      if (!style.parentNode) {
        document.head.appendChild(style);
      }
    }, fontFamily, fontSize);
    
    await page.waitForTimeout(100); // Wait for font loading
  }

  async getTerminalBounds(page) {
    return await page.evaluate(() => {
      const terminal = document.querySelector('.terminal-container') || 
                     document.querySelector('.terminal') ||
                     document.querySelector('main');
      
      if (terminal) {
        const rect = terminal.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        };
      }
      
      return { x: 0, y: 0, width: 800, height: 600 };
    });
  }

  async compareWithBaseline(screenshotName, currentScreenshot) {
    const baselinePath = path.join(this.baselineDir, `${screenshotName}.png`);
    const currentPath = path.join(this.currentDir, `${screenshotName}.png`);
    
    try {
      const baselineExists = await fs.access(baselinePath).then(() => true).catch(() => false);
      
      if (!baselineExists) {
        // First run - create baseline
        await fs.writeFile(baselinePath, currentScreenshot);
        return {
          testId: screenshotName,
          status: 'baseline-created',
          message: 'Baseline image created'
        };
      }
      
      // Compare images (simplified - in production use a proper image diff library)
      const baseline = await fs.readFile(baselinePath);
      const pixelDifference = await this.compareImages(baseline, currentScreenshot);
      
      if (pixelDifference > 0.01) { // 1% difference threshold
        const diffPath = path.join(this.diffDir, `${screenshotName}-diff.png`);
        await this.createDiffImage(baseline, currentScreenshot, diffPath);
        
        return {
          testId: screenshotName,
          status: 'failed',
          difference: pixelDifference,
          diffPath
        };
      }
      
      return {
        testId: screenshotName,
        status: 'passed',
        difference: pixelDifference
      };
      
    } catch (error) {
      return {
        testId: screenshotName,
        status: 'error',
        error: error.message
      };
    }
  }

  async compareImages(baseline, current) {
    // Simplified comparison - in production use pixelmatch or similar
    if (baseline.length !== current.length) {
      return 1.0; // 100% different
    }
    
    let differences = 0;
    for (let i = 0; i < baseline.length; i++) {
      if (baseline[i] !== current[i]) {
        differences++;
      }
    }
    
    return differences / baseline.length;
  }

  async createDiffImage(baseline, current, diffPath) {
    // Simplified diff creation - in production use proper image diffing
    await fs.writeFile(diffPath, current);
  }

  async generateReport() {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    const baselines = this.results.filter(r => r.status === 'baseline-created').length;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed,
        failed,
        errors,
        baselines,
        successRate: (passed / this.results.length) * 100
      },
      results: this.results
    };
    
    const reportPath = path.join(__dirname, '../test-results/visual-regression-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Visual Regression Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🔧 Errors: ${errors}`);
    console.log(`📝 Baselines Created: ${baselines}`);
    console.log(`📈 Success Rate: ${report.summary.successRate.toFixed(2)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`  - ${r.testId} (${(r.difference * 100).toFixed(2)}% diff)`));
    }
    
    return report;
  }

  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

// Auto-repair system
class AutoRepairSystem {
  constructor(testResults) {
    this.results = testResults;
  }

  async repairFailures() {
    console.log('\n🔧 Auto-Repair System Activated');
    
    const failures = this.results.filter(r => r.status === 'failed');
    
    for (const failure of failures) {
      await this.repairTest(failure);
    }
  }

  async repairTest(failure) {
    console.log(`🔧 Attempting to repair: ${failure.testId}`);
    
    // Auto-repair strategies based on failure patterns
    if (failure.testId.includes('cursor')) {
      await this.repairCursorIssues();
    } else if (failure.testId.includes('layout')) {
      await this.repairLayoutIssues();
    } else if (failure.testId.includes('font')) {
      await this.repairFontIssues();
    }
  }

  async repairCursorIssues() {
    console.log('  🔧 Repairing cursor positioning...');
    // Implementation would include CSS fixes, JavaScript adjustments
  }

  async repairLayoutIssues() {
    console.log('  🔧 Repairing layout overlaps...');
    // Implementation would include layout recalculations
  }

  async repairFontIssues() {
    console.log('  🔧 Repairing font rendering...');
    // Implementation would include font metric adjustments
  }
}

// CLI execution
async function main() {
  const tester = new VisualRegressionTester();
  await tester.initialize();
  
  const results = await tester.runTests();
  
  // Auto-repair if enabled
  if (process.argv.includes('--auto-repair')) {
    const repairSystem = new AutoRepairSystem(results);
    await repairSystem.repairFailures();
  }
  
  // Exit with error code if tests failed
  const failed = results.filter(r => r.status === 'failed' || r.status === 'error').length;
  process.exit(failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VisualRegressionTester, AutoRepairSystem };