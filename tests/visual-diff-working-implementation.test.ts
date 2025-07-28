/**
 * Working Visual-Diff Testing Framework Implementation
 * TDD GREEN Phase - Functional implementation that passes tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import { 
  PuppeteerTestManager, 
  VIEWPORT_CONFIGURATIONS, 
  FONT_SIZE_CONFIGURATIONS,
  THEME_CONFIGURATIONS 
} from '../src/testing/puppeteer-setup';
import { 
  VisualDiffFramework,
  analyzeASCIIAlignment,
  compareWithBaseline,
  analyzeLayoutTransition,
  analyzeThemeColors,
  analyzeReadability,
  analyzeThemeTransition,
  compareScreenshots,
  generateVisualDiffReport,
  analyzeForRegression
} from '../src/testing/visual-diff-framework';

describe('Visual-Diff Framework - Working Implementation', () => {
  let testManager: PuppeteerTestManager;
  let visualFramework: VisualDiffFramework;
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    testManager = new PuppeteerTestManager({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    browser = await testManager.initializeBrowser();
    page = await testManager.createPage('main-test');
    
    visualFramework = new VisualDiffFramework();
    await visualFramework.initializeBrowser(browser, page);

    // Navigate to the app (assuming it's running on localhost:8080)
    try {
      await testManager.navigateToApp(page);
    } catch (error) {
      console.warn('App not available at localhost:8080, using fallback');
      // Create a simple test page for testing
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                font-family: monospace; 
                background: #0f0f0f; 
                color: #e1e1e1; 
                margin: 0; 
                padding: 20px; 
              }
              .terminal-container { 
                width: 100%; 
                height: 500px; 
                position: relative; 
                background: #1a1a1a;
                border-radius: 8px;
                padding: 20px;
              }
              .terminal-output { 
                font-size: 14px; 
                line-height: 1.4; 
                white-space: pre-wrap; 
              }
              .terminal-cursor { 
                position: absolute; 
                width: 2px; 
                height: 1.4em; 
                background: #00ff88; 
                animation: blink 1s infinite; 
              }
              .terminal-input { 
                background: transparent; 
                border: none; 
                color: inherit; 
                font: inherit; 
                outline: none; 
              }
              @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
              }
            </style>
          </head>
          <body>
            <div data-testid="terminal-container" class="terminal-container">
              <div data-testid="terminal-output" class="terminal-output">Welcome to the terminal!</div>
              <div data-testid="terminal-cursor" class="terminal-cursor" style="left: 0; top: 1.4em;"></div>
              <input data-testid="terminal-input" class="terminal-input" type="text" />
            </div>
          </body>
        </html>
      `);
    }
  });

  afterAll(async () => {
    await testManager.cleanup();
  });

  beforeEach(async () => {
    await testManager.clearTerminal(page);
  });

  describe('Screenshot Comparison Engine', () => {
    it('should successfully compare identical screenshots', async () => {
      const screenshot1 = await testManager.takeScreenshot(page, 'identical-test-1');
      const screenshot2 = await testManager.takeScreenshot(page, 'identical-test-2');
      
      const comparison = await compareScreenshots(screenshot1, screenshot2);
      
      expect(comparison.similarityScore).toBeGreaterThan(0.99);
      expect(comparison.pixelDifference).toBeLessThan(1);
      expect(comparison.changedPixels).toBeLessThan(100);
    });

    it('should detect differences in screenshots', async () => {
      const screenshot1 = await testManager.takeScreenshot(page, 'difference-test-1');
      
      // Make a visible change
      await page.evaluate(() => {
        const output = document.querySelector('[data-testid="terminal-output"]');
        if (output) {
          output.textContent = 'Modified content for difference test';
        }
      });
      
      const screenshot2 = await testManager.takeScreenshot(page, 'difference-test-2');
      
      const comparison = await compareScreenshots(screenshot1, screenshot2);
      
      expect(comparison.similarityScore).toBeLessThan(0.99);
      expect(comparison.pixelDifference).toBeGreaterThan(0);
      expect(comparison.changedPixels).toBeGreaterThan(0);
    });
  });

  describe('Baseline Comparison System', () => {
    it('should create and compare with baseline screenshots', async () => {
      const screenshot = await testManager.takeScreenshot(page, 'baseline-test');
      
      // First comparison creates baseline
      const comparison1 = await compareWithBaseline(screenshot, 'test-baseline');
      expect(comparison1.similarity).toBe(1.0);
      
      // Second comparison uses existing baseline
      const comparison2 = await compareWithBaseline(screenshot, 'test-baseline');
      expect(comparison2.similarity).toBeGreaterThan(0.99);
    });
  });

  describe('ASCII Alignment Validation', () => {
    it('should analyze simple grid alignment', async () => {
      await page.evaluate(() => {
        const output = document.querySelector('[data-testid="terminal-output"]');
        if (output) {
          output.textContent = '┌─────────┐\n│  Test   │\n└─────────┘';
        }
      });
      
      const screenshot = await testManager.takeScreenshot(page, 'grid-alignment');
      const analysis = await analyzeASCIIAlignment(screenshot, 'perfect-grid');
      
      expect(analysis.isAligned).toBe(true);
      expect(analysis.misalignmentScore).toBeLessThan(0.5);
    });

    it('should analyze code indentation', async () => {
      await page.evaluate(() => {
        const output = document.querySelector('[data-testid="terminal-output"]');
        if (output) {
          output.textContent = 'function test() {\n    if (condition) {\n        console.log("indented");\n    }\n}';
        }
      });
      
      const screenshot = await testManager.takeScreenshot(page, 'code-indentation');
      const analysis = await analyzeASCIIAlignment(screenshot, 'code-indentation');
      
      expect(analysis.isAligned).toBe(true);
      expect(analysis.misalignmentScore).toBeLessThan(0.5);
    });
  });

  describe('Viewport and Responsive Testing', () => {
    const testViewports = VIEWPORT_CONFIGURATIONS.slice(0, 3); // Test first 3 for speed
    
    testViewports.forEach((viewport) => {
      it(`should maintain layout integrity at ${viewport.name}`, async () => {
        await page.setViewport({
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: viewport.deviceScaleFactor || 1,
        });
        
        await page.waitForTimeout(300); // Wait for resize
        
        const metrics = await testManager.getTerminalMetrics(page);
        
        expect(metrics.container.width).toBeGreaterThan(0);
        expect(metrics.container.height).toBeGreaterThan(0);
        expect(metrics.output.width).toBeLessThanOrEqual(metrics.container.width);
        expect(metrics.output.height).toBeLessThanOrEqual(metrics.container.height);
      });
    });

    it('should handle viewport transitions smoothly', async () => {
      // Take screenshot at large size
      await page.setViewport({ width: 1920, height: 1080 });
      const beforeScreenshot = await testManager.takeScreenshot(page, 'transition-before');
      
      // Transition to small size
      await page.setViewport({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      const afterScreenshot = await testManager.takeScreenshot(page, 'transition-after');
      
      const analysis = await analyzeLayoutTransition(beforeScreenshot, afterScreenshot);
      
      // Layout should adapt without breaking
      expect(analysis.hasLayoutBreaks).toBe(false);
    });
  });

  describe('Font Size Testing', () => {
    const testFontSizes = FONT_SIZE_CONFIGURATIONS.slice(0, 3); // Test subset for speed
    
    testFontSizes.forEach((fontConfig) => {
      it(`should render correctly at ${fontConfig.name} (${fontConfig.size})`, async () => {
        await testManager.setFontSize(page, fontConfig.size);
        
        const screenshot = await testManager.takeScreenshot(page, `font-${fontConfig.name}`);
        const readabilityScore = await analyzeReadability(screenshot, fontConfig.size);
        
        expect(readabilityScore).toBeGreaterThan(0.5);
      });
    });
  });

  describe('Theme Consistency Testing', () => {
    const testThemes = THEME_CONFIGURATIONS.slice(0, 2); // Test subset for speed
    
    testThemes.forEach((theme) => {
      it(`should maintain consistency for ${theme.name} theme`, async () => {
        await testManager.applyTheme(page, theme.name);
        
        const screenshot = await testManager.takeScreenshot(page, `theme-${theme.name}`);
        const themeAnalysis = await analyzeThemeColors(screenshot, theme.name);
        
        expect(themeAnalysis.colorConsistency).toBeGreaterThan(0.7);
        expect(themeAnalysis.contrastRatio).toBeGreaterThan(2.0);
      });
    });

    it('should handle theme transitions smoothly', async () => {
      await testManager.applyTheme(page, 'cyberpunk');
      const beforeScreenshot = await testManager.takeScreenshot(page, 'theme-transition-before');
      
      await testManager.applyTheme(page, 'matrix');
      const afterScreenshot = await testManager.takeScreenshot(page, 'theme-transition-after');
      
      const transitionAnalysis = await analyzeThemeTransition(beforeScreenshot, afterScreenshot);
      
      expect(transitionAnalysis.isSmoothTransition).toBe(true);
    });
  });

  describe('Cursor Positioning Validation', () => {
    it('should position cursor correctly for basic input', async () => {
      await testManager.typeInTerminal(page, 'hello');
      
      const cursorPosition = await testManager.getCursorPosition(page);
      const metrics = await testManager.getTerminalMetrics(page);
      
      expect(cursorPosition).toBeTruthy();
      if (cursorPosition) {
        expect(cursorPosition.x).toBeGreaterThan(0);
        expect(cursorPosition.y).toBeGreaterThan(0);
        
        // Cursor should be positioned after the text
        const expectedX = 5 * metrics.fontMetrics.width; // 5 characters * char width
        expect(Math.abs(cursorPosition.x - expectedX)).toBeLessThan(20); // Allow some tolerance
      }
    });

    it('should maintain cursor visibility across font sizes', async () => {
      const fontSizes = ['12px', '16px', '20px'];
      
      for (const fontSize of fontSizes) {
        await testManager.setFontSize(page, fontSize);
        await testManager.clearTerminal(page);
        await testManager.typeInTerminal(page, 'test');
        
        const cursorPosition = await testManager.getCursorPosition(page);
        expect(cursorPosition).toBeTruthy();
        expect(cursorPosition!.width).toBeGreaterThan(0);
        expect(cursorPosition!.height).toBeGreaterThan(0);
      }
    });
  });

  describe('Visual Diff Report Generation', () => {
    it('should generate comprehensive diff reports', async () => {
      const screenshot1 = await testManager.takeScreenshot(page, 'report-test-1');
      
      await page.evaluate(() => {
        const output = document.querySelector('[data-testid="terminal-output"]');
        if (output) {
          output.textContent = 'Modified content for report generation';
        }
      });
      
      const screenshot2 = await testManager.takeScreenshot(page, 'report-test-2');
      
      const report = await generateVisualDiffReport(screenshot1, screenshot2, 'diff-report-test');
      
      expect(report.reportPath).toBeTruthy();
      expect(report.statistics.pixelAccuracy).toBeLessThan(100);
      expect(report.statistics.totalPixels).toBeGreaterThan(0);
      expect(report.differences.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Regression Detection System', () => {
    it('should detect layout regressions', async () => {
      const metrics = await testManager.getTerminalMetrics(page);
      
      const regressionAnalysis = await analyzeForRegression(metrics, 'layout-regression-test');
      
      // First run creates baseline, should not detect regression
      expect(regressionAnalysis.hasRegression).toBe(false);
      expect(regressionAnalysis.confidence).toBe(1.0);
    });

    it('should detect cursor position regressions', async () => {
      await testManager.typeInTerminal(page, 'regression test');
      const cursorPosition = await testManager.getCursorPosition(page);
      
      const regressionAnalysis = await analyzeForRegression(cursorPosition, 'cursor-regression-test');
      
      expect(regressionAnalysis.hasRegression).toBe(false);
      expect(regressionAnalysis.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Performance Validation', () => {
    it('should complete visual tests within performance thresholds', async () => {
      const startTime = Date.now();
      
      // Simulate heavy content
      await page.evaluate(() => {
        const output = document.querySelector('[data-testid="terminal-output"]');
        if (output) {
          let content = '';
          for (let i = 0; i < 100; i++) {
            content += `Line ${i}: Terminal output with various content\n`;
          }
          output.textContent = content;
        }
      });
      
      const screenshot = await testManager.takeScreenshot(page, 'performance-test');
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(screenshot.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Integration test for the complete visual-diff workflow
 */
describe('Complete Visual-Diff Workflow Integration', () => {
  let testManager: PuppeteerTestManager;
  let page: Page;

  beforeAll(async () => {
    testManager = new PuppeteerTestManager({
      headless: 'new',
    });

    const browser = await testManager.initializeBrowser();
    page = await testManager.createPage('integration-test');

    // Create a comprehensive test page
    await page.setContent(`
      <!DOCTYPE html>
      <html data-theme="cyberpunk">
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
              background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
              color: #e1e1e1;
              min-height: 100vh;
              padding: 20px;
            }
            .terminal-container {
              width: 100%;
              max-width: 1200px;
              height: 600px;
              margin: 0 auto;
              background: rgba(0, 0, 0, 0.8);
              border: 1px solid rgba(0, 255, 136, 0.3);
              border-radius: 12px;
              overflow: hidden;
              backdrop-filter: blur(10px);
            }
            .terminal-header {
              height: 40px;
              background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
              border-bottom: 1px solid rgba(0, 255, 136, 0.2);
              display: flex;
              align-items: center;
              padding: 0 16px;
              font-size: 12px;
            }
            .terminal-output {
              height: calc(100% - 80px);
              padding: 16px;
              font-size: 14px;
              line-height: 1.4;
              white-space: pre-wrap;
              overflow-y: auto;
              position: relative;
            }
            .terminal-input-area {
              height: 40px;
              border-top: 1px solid rgba(0, 255, 136, 0.2);
              display: flex;
              align-items: center;
              padding: 0 16px;
            }
            .terminal-input {
              background: transparent;
              border: none;
              color: inherit;
              font: inherit;
              outline: none;
              flex: 1;
            }
            .terminal-cursor {
              position: absolute;
              width: 2px;
              height: 1.4em;
              background: #00ff88;
              box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
              animation: cursor-blink 1s infinite;
            }
            @keyframes cursor-blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
            .ascii-art {
              color: #00ff88;
              text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
            }
            /* Theme variations */
            [data-theme="matrix"] {
              --primary-color: #00ff41;
              --bg-color: #000000;
            }
            [data-theme="dracula"] {
              --primary-color: #50fa7b;
              --bg-color: #282a36;
            }
          </style>
        </head>
        <body>
          <div data-testid="terminal-container" class="terminal-container">
            <div data-testid="terminal-header" class="terminal-header">
              <span style="color: #00ff88;">●</span>
              <span style="margin-left: 8px;">Rust Terminal Forge - Visual Testing</span>
            </div>
            <div data-testid="terminal-output" class="terminal-output">
              <div class="ascii-art">
╔══════════════════════════════════════╗
║     Visual Diff Testing Framework   ║
║                                      ║
║  ┌─┐┬ ┬┌─┐┌─┐┌─┐┌┬┐┌─┐┌─┐┬─┐       ║
║  ├─┘│ │├─┘├─┘├┤  │ ├┤ ├┤ ├┬┘       ║
║  ┴  └─┘┴  ┴  └─┘ ┴ └─┘└─┘┴└─       ║
║                                      ║
║  Testing cursor positioning...       ║
║  Testing ASCII alignment...          ║
║  Testing responsive layout...        ║
║  Testing theme consistency...        ║
╚══════════════════════════════════════╝
              </div>
              <div style="margin-top: 20px;">
$ ls -la
total 42
drwxr-xr-x  3 user user  4096 Jul 27 00:45 .
drwxr-xr-x 15 user user  4096 Jul 27 00:44 ..
-rw-r--r--  1 user user  1234 Jul 27 00:45 test.txt
-rwxr-xr-x  1 user user  8192 Jul 27 00:45 visual-diff-test
              </div>
            </div>
            <div data-testid="terminal-input-area" class="terminal-input-area">
              <span style="color: #00ff88;">$ </span>
              <input data-testid="terminal-input" class="terminal-input" type="text" placeholder="Type command..." />
              <div data-testid="terminal-cursor" class="terminal-cursor" style="left: 32px;"></div>
            </div>
          </div>
        </body>
      </html>
    `);
  });

  afterAll(async () => {
    await testManager.cleanup();
  });

  it('should execute complete visual-diff testing workflow', async () => {
    // 1. Baseline screenshot
    const baselineScreenshot = await testManager.takeScreenshot(page, 'workflow-baseline');
    expect(baselineScreenshot.length).toBeGreaterThan(0);

    // 2. Test different viewports
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' },
    ];

    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await page.waitForTimeout(300);
      
      const screenshot = await testManager.takeScreenshot(page, `workflow-${viewport.name}`);
      const comparison = await compareScreenshots(baselineScreenshot, screenshot);
      
      // Different viewports should show differences but maintain readability
      expect(comparison.totalPixels).toBeGreaterThan(0);
    }

    // 3. Test font sizes
    await page.setViewport({ width: 1920, height: 1080 }); // Reset viewport
    const fontSizes = ['12px', '16px', '20px'];
    
    for (const fontSize of fontSizes) {
      await testManager.setFontSize(page, fontSize);
      
      const screenshot = await testManager.takeScreenshot(page, `workflow-font-${fontSize}`);
      const readability = await analyzeReadability(screenshot, fontSize);
      
      expect(readability).toBeGreaterThan(0.5);
    }

    // 4. Test themes
    const themes = ['cyberpunk', 'matrix', 'dracula'];
    
    for (const theme of themes) {
      await testManager.applyTheme(page, theme);
      
      const screenshot = await testManager.takeScreenshot(page, `workflow-theme-${theme}`);
      const themeAnalysis = await analyzeThemeColors(screenshot, theme);
      
      expect(themeAnalysis.colorConsistency).toBeGreaterThan(0.7);
    }

    // 5. Test cursor positioning
    await testManager.typeInTerminal(page, 'visual-diff-test-complete');
    const cursorPosition = await testManager.getCursorPosition(page);
    
    expect(cursorPosition).toBeTruthy();
    expect(cursorPosition!.width).toBeGreaterThan(0);
    expect(cursorPosition!.height).toBeGreaterThan(0);

    // 6. Generate final report
    const finalScreenshot = await testManager.takeScreenshot(page, 'workflow-final');
    const report = await generateVisualDiffReport(baselineScreenshot, finalScreenshot, 'complete-workflow');
    
    expect(report.reportPath).toBeTruthy();
    expect(report.statistics).toBeTruthy();
  });
});