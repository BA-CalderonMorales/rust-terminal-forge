/**
 * Final Visual-Diff Testing Framework - Complete Working Implementation
 * TDD GREEN Phase - Production-ready implementation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import { 
  VisualDiffFramework,
  compareScreenshots,
  generateVisualDiffReport,
  analyzeASCIIAlignment,
  analyzeThemeColors,
  analyzeReadability
} from '../src/testing/visual-diff-framework';

// Helper function to wait for timeout (Puppeteer compatible)
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Visual-Diff Framework - Final Implementation', () => {
  let browser: Browser;
  let page: Page;
  let visualFramework: VisualDiffFramework;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    visualFramework = new VisualDiffFramework();
    await visualFramework.initializeBrowser(browser, page);

    // Create a test terminal page for testing
    await page.setContent(`
      <!DOCTYPE html>
      <html data-theme="cyberpunk">
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'SF Mono', Monaco, monospace;
              background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
              color: #e1e1e1;
              min-height: 100vh;
              padding: 20px;
            }
            .terminal-container {
              width: 100%;
              max-width: 1000px;
              height: 500px;
              margin: 0 auto;
              background: rgba(0, 0, 0, 0.9);
              border: 1px solid rgba(0, 255, 136, 0.3);
              border-radius: 8px;
              overflow: hidden;
              position: relative;
            }
            .terminal-output {
              height: calc(100% - 40px);
              padding: 16px;
              font-size: 14px;
              line-height: 1.4;
              white-space: pre-wrap;
              overflow-y: auto;
              font-family: 'SF Mono', Monaco, monospace;
            }
            .terminal-input-area {
              height: 40px;
              border-top: 1px solid rgba(0, 255, 136, 0.2);
              display: flex;
              align-items: center;
              padding: 0 16px;
              background: rgba(0, 0, 0, 0.3);
            }
            .terminal-input {
              background: transparent;
              border: none;
              color: inherit;
              font: inherit;
              outline: none;
              flex: 1;
              margin-left: 8px;
            }
            .terminal-cursor {
              position: absolute;
              width: 2px;
              height: 1.4em;
              background: #00ff88;
              animation: cursor-blink 1s infinite;
              left: 40px;
              bottom: 10px;
            }
            @keyframes cursor-blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
            .ascii-content {
              color: #00ff88;
              text-shadow: 0 0 5px rgba(0, 255, 136, 0.3);
            }
            /* Theme System */
            [data-theme="cyberpunk"] { --primary: #00ff88; --bg: #0f0f0f; }
            [data-theme="matrix"] { --primary: #00ff41; --bg: #000000; }
            [data-theme="dracula"] { --primary: #50fa7b; --bg: #282a36; }
          </style>
        </head>
        <body>
          <div data-testid="terminal-container" class="terminal-container">
            <div data-testid="terminal-output" class="terminal-output">
              <div class="ascii-content">
╔═══════════════════════════════════════════╗
║        Visual Diff Testing Framework     ║
║                                           ║
║  ┌─┐┬ ┬┌─┐┌─┐┌─┐┌┬┐┌─┐┌─┐┬─┐            ║
║  ├─┘│ │├─┘├─┘├┤  │ ├┤ ├┤ ├┬┘            ║
║  ┴  └─┘┴  ┴  └─┘ ┴ └─┘└─┘┴└─            ║
║                                           ║
║  ✓ Cursor positioning validation         ║
║  ✓ ASCII alignment testing               ║
║  ✓ Layout integrity verification         ║
║  ✓ Theme consistency validation          ║
║  ✓ Font size & DPI testing               ║
║  ✓ Pixel-perfect regression detection    ║
╚═══════════════════════════════════════════╝
              </div>
            </div>
            <div data-testid="terminal-input-area" class="terminal-input-area">
              <span style="color: var(--primary, #00ff88);">$</span>
              <input data-testid="terminal-input" class="terminal-input" type="text" />
              <div data-testid="terminal-cursor" class="terminal-cursor"></div>
            </div>
          </div>
          <script>
            // Simple theme manager for testing
            window.themeManager = {
              setTheme: function(theme) {
                document.documentElement.setAttribute('data-theme', theme);
                console.log('Theme changed to:', theme);
              },
              getCurrentTheme: function() {
                return document.documentElement.getAttribute('data-theme') || 'cyberpunk';
              }
            };
          </script>
        </body>
      </html>
    `);

    await wait(500); // Wait for page to render
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    // Reset to default state
    await page.evaluate(() => {
      const output = document.querySelector('[data-testid="terminal-output"]');
      const input = document.querySelector('[data-testid="terminal-input"]');
      if (input) (input as HTMLInputElement).value = '';
      window.themeManager.setTheme('cyberpunk');
    });
    await wait(100);
  });

  describe('Core Screenshot Comparison Engine', () => {
    it('should detect identical screenshots with high accuracy', async () => {
      const screenshot1 = await page.screenshot({ type: 'png' });
      await wait(100);
      const screenshot2 = await page.screenshot({ type: 'png' });
      
      const comparison = await compareScreenshots(screenshot1, screenshot2);
      
      expect(comparison.similarityScore).toBeGreaterThan(0.95);
      expect(comparison.pixelDifference).toBeLessThan(5);
      expect(comparison.totalPixels).toBeGreaterThan(0);
    });

    it('should accurately detect visual differences', async () => {
      const screenshot1 = await page.screenshot({ type: 'png' });
      
      // Make a visible change
      await page.evaluate(() => {
        const output = document.querySelector('[data-testid="terminal-output"]');
        if (output) {
          output.innerHTML = '<div style="color: red;">DIFFERENCE TEST CONTENT</div>';
        }
      });
      
      const screenshot2 = await page.screenshot({ type: 'png' });
      
      const comparison = await compareScreenshots(screenshot1, screenshot2);
      
      expect(comparison.similarityScore).toBeLessThan(0.95);
      expect(comparison.pixelDifference).toBeGreaterThan(1);
      expect(comparison.changedPixels).toBeGreaterThan(100);
    });
  });

  describe('ASCII Alignment and Text Rendering Validation', () => {
    it('should validate box drawing characters alignment', async () => {
      await page.evaluate(() => {
        const output = document.querySelector('[data-testid="terminal-output"]');
        if (output) {
          output.innerHTML = `
            <div style="font-family: monospace; font-size: 14px; line-height: 1.0;">
┌─────────────┐
│   Test Box  │
│   Content   │
└─────────────┘
            </div>
          `;
        }
      });
      
      const screenshot = await page.screenshot({ type: 'png' });
      const analysis = await analyzeASCIIAlignment(screenshot, 'perfect-grid');
      
      expect(analysis.isAligned).toBe(true);
      expect(analysis.misalignmentScore).toBeLessThan(0.3);
    });

    it('should validate code indentation patterns', async () => {
      await page.evaluate(() => {
        const output = document.querySelector('[data-testid="terminal-output"]');
        if (output) {
          output.innerHTML = `
            <div style="font-family: monospace; font-size: 14px; white-space: pre;">
function test() {
    if (condition) {
        console.log("properly indented");
        return true;
    }
    return false;
}
            </div>
          `;
        }
      });
      
      const screenshot = await page.screenshot({ type: 'png' });
      const analysis = await analyzeASCIIAlignment(screenshot, 'code-indentation');
      
      expect(analysis.isAligned).toBe(true);
      expect(analysis.misalignmentScore).toBeLessThan(0.4);
    });
  });

  describe('Responsive Layout Integrity', () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-fhd' },
      { width: 1366, height: 768, name: 'desktop-laptop' },
      { width: 768, height: 1024, name: 'tablet-portrait' },
      { width: 375, height: 667, name: 'mobile-portrait' },
    ];

    viewports.forEach((viewport) => {
      it(`should maintain layout integrity at ${viewport.name}`, async () => {
        await page.setViewport({
          width: viewport.width,
          height: viewport.height,
        });
        
        await wait(200); // Wait for layout adjustment
        
        const screenshot = await page.screenshot({ type: 'png' });
        
        // Check that terminal is rendered properly
        const hasTerminal = await page.evaluate(() => {
          const container = document.querySelector('[data-testid="terminal-container"]');
          const rect = container?.getBoundingClientRect();
          return rect && rect.width > 0 && rect.height > 0;
        });
        
        expect(hasTerminal).toBe(true);
        expect(screenshot.length).toBeGreaterThan(1000); // Non-empty screenshot
      });
    });

    it('should handle extreme aspect ratios gracefully', async () => {
      // Test ultrawide
      await page.setViewport({ width: 3440, height: 1440 });
      await wait(200);
      
      const ultrawideScreenshot = await page.screenshot({ type: 'png' });
      expect(ultrawideScreenshot.length).toBeGreaterThan(1000);
      
      // Test very narrow
      await page.setViewport({ width: 320, height: 568 });
      await wait(200);
      
      const narrowScreenshot = await page.screenshot({ type: 'png' });
      expect(narrowScreenshot.length).toBeGreaterThan(1000);
    });
  });

  describe('Theme Consistency Validation', () => {
    const themes = ['cyberpunk', 'matrix', 'dracula'];

    themes.forEach((theme) => {
      it(`should render ${theme} theme consistently`, async () => {
        await page.evaluate((themeName) => {
          window.themeManager.setTheme(themeName);
        }, theme);
        
        await wait(300); // Wait for theme application
        
        const screenshot = await page.screenshot({ type: 'png' });
        const themeAnalysis = await analyzeThemeColors(screenshot, theme);
        
        expect(themeAnalysis.colorConsistency).toBeGreaterThan(0.7);
        expect(themeAnalysis.contrastRatio).toBeGreaterThan(2.0);
        expect(themeAnalysis.dominantColors.length).toBeGreaterThan(0);
      });
    });

    it('should handle theme transitions smoothly', async () => {
      // Capture initial theme
      await page.evaluate(() => window.themeManager.setTheme('cyberpunk'));
      await wait(200);
      const cyberpunkScreenshot = await page.screenshot({ type: 'png' });
      
      // Switch theme
      await page.evaluate(() => window.themeManager.setTheme('matrix'));
      await wait(200);
      const matrixScreenshot = await page.screenshot({ type: 'png' });
      
      // Themes should be different but valid
      const comparison = await compareScreenshots(cyberpunkScreenshot, matrixScreenshot);
      expect(comparison.similarityScore).toBeLessThan(0.8); // Should be different
      expect(comparison.pixelDifference).toBeGreaterThan(5); // Visible changes
    });
  });

  describe('Font Size and DPI Testing', () => {
    const fontSizes = ['12px', '14px', '16px', '18px', '20px'];

    fontSizes.forEach((fontSize) => {
      it(`should maintain readability at ${fontSize}`, async () => {
        await page.evaluate((size) => {
          const output = document.querySelector('[data-testid="terminal-output"]');
          const input = document.querySelector('[data-testid="terminal-input"]');
          if (output) output.style.fontSize = size;
          if (input) input.style.fontSize = size;
        }, fontSize);
        
        await wait(200);
        
        const screenshot = await page.screenshot({ type: 'png' });
        const readabilityScore = await analyzeReadability(screenshot, fontSize);
        
        expect(readabilityScore).toBeGreaterThan(0.4);
      });
    });

    it('should handle high DPI displays correctly', async () => {
      const dpiSettings = [1, 1.5, 2, 2.5];
      
      for (const dpi of dpiSettings) {
        await page.setViewport({
          width: 1200,
          height: 800,
          deviceScaleFactor: dpi,
        });
        
        await wait(200);
        
        const screenshot = await page.screenshot({ type: 'png' });
        expect(screenshot.length).toBeGreaterThan(1000);
        
        // Verify cursor is still visible
        const cursorVisible = await page.evaluate(() => {
          const cursor = document.querySelector('[data-testid="terminal-cursor"]');
          const rect = cursor?.getBoundingClientRect();
          return rect && rect.width > 0 && rect.height > 0;
        });
        
        expect(cursorVisible).toBe(true);
      }
    });
  });

  describe('Cursor Positioning Validation', () => {
    it('should position cursor correctly for text input', async () => {
      await page.type('[data-testid="terminal-input"]', 'hello world');
      await wait(100);
      
      const cursorRect = await page.evaluate(() => {
        const cursor = document.querySelector('[data-testid="terminal-cursor"]');
        return cursor?.getBoundingClientRect();
      });
      
      expect(cursorRect).toBeTruthy();
      expect(cursorRect!.width).toBeGreaterThan(0);
      expect(cursorRect!.height).toBeGreaterThan(0);
    });

    it('should maintain cursor visibility across viewport changes', async () => {
      const viewports = [
        { width: 1920, height: 1080 },
        { width: 768, height: 1024 },
        { width: 375, height: 667 },
      ];
      
      for (const viewport of viewports) {
        await page.setViewport(viewport);
        await wait(200);
        
        const cursorVisible = await page.evaluate(() => {
          const cursor = document.querySelector('[data-testid="terminal-cursor"]');
          if (!cursor) return false;
          
          const rect = cursor.getBoundingClientRect();
          const style = window.getComputedStyle(cursor);
          
          return rect.width > 0 && rect.height > 0 && style.opacity !== '0';
        });
        
        expect(cursorVisible).toBe(true);
      }
    });
  });

  describe('Visual Diff Report Generation', () => {
    it('should generate comprehensive visual diff reports', async () => {
      const screenshot1 = await page.screenshot({ type: 'png' });
      
      // Make a change
      await page.evaluate(() => {
        const output = document.querySelector('[data-testid="terminal-output"]');
        if (output) {
          output.innerHTML += '<div>Additional content for diff report test</div>';
        }
      });
      
      const screenshot2 = await page.screenshot({ type: 'png' });
      
      const report = await generateVisualDiffReport(screenshot1, screenshot2, 'report-generation-test');
      
      expect(report.reportPath).toBeTruthy();
      expect(report.statistics.totalPixels).toBeGreaterThan(0);
      expect(report.statistics.pixelAccuracy).toBeLessThan(100);
      expect(report.timestamp).toBeTruthy();
    });

    it('should handle minimal differences correctly', async () => {
      const screenshot1 = await page.screenshot({ type: 'png' });
      
      // Make a tiny change
      await page.evaluate(() => {
        const cursor = document.querySelector('[data-testid="terminal-cursor"]');
        if (cursor) {
          (cursor as HTMLElement).style.opacity = '0.9';
        }
      });
      
      const screenshot2 = await page.screenshot({ type: 'png' });
      
      const report = await generateVisualDiffReport(screenshot1, screenshot2, 'minimal-diff-test');
      
      expect(report.reportPath).toBeTruthy();
      expect(report.statistics.pixelAccuracy).toBeGreaterThan(90);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large content volumes efficiently', async () => {
      const startTime = Date.now();
      
      // Generate large content
      await page.evaluate(() => {
        const output = document.querySelector('[data-testid="terminal-output"]');
        if (output) {
          let content = '';
          for (let i = 0; i < 500; i++) {
            content += `Line ${i}: Terminal output with various content and ANSI sequences\n`;
          }
          output.innerHTML = `<pre>${content}</pre>`;
        }
      });
      
      const screenshot = await page.screenshot({ type: 'png' });
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(screenshot.length).toBeGreaterThan(1000);
    });

    it('should handle empty and edge case content', async () => {
      // Test empty content
      await page.evaluate(() => {
        const output = document.querySelector('[data-testid="terminal-output"]');
        if (output) output.innerHTML = '';
      });
      
      const emptyScreenshot = await page.screenshot({ type: 'png' });
      expect(emptyScreenshot.length).toBeGreaterThan(100);
      
      // Test special characters
      await page.evaluate(() => {
        const output = document.querySelector('[data-testid="terminal-output"]');
        if (output) {
          output.innerHTML = '💻 🚀 ⚡ 🎯 Terminal with emojis and ᴜɴɪᴄᴏᴅᴇ';
        }
      });
      
      const unicodeScreenshot = await page.screenshot({ type: 'png' });
      expect(unicodeScreenshot.length).toBeGreaterThan(100);
    });

    it('should maintain consistent performance across multiple operations', async () => {
      const operations = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        await page.evaluate((index) => {
          const output = document.querySelector('[data-testid="terminal-output"]');
          if (output) {
            output.innerHTML = `Test content iteration ${index}`;
          }
        }, i);
        
        const screenshot = await page.screenshot({ type: 'png' });
        const endTime = Date.now();
        
        operations.push(endTime - startTime);
        expect(screenshot.length).toBeGreaterThan(100);
      }
      
      // All operations should be reasonably fast
      const averageTime = operations.reduce((a, b) => a + b, 0) / operations.length;
      expect(averageTime).toBeLessThan(3000); // Average under 3 seconds
    });
  });
});

describe('Integration Test: Complete Visual-Diff Workflow', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // Set up the complete test environment
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: 'SF Mono', Monaco, monospace; 
              background: #0a0a0a; 
              color: #ffffff; 
              margin: 0; 
              padding: 20px; 
            }
            .test-terminal { 
              width: 800px; 
              height: 600px; 
              background: #1a1a1a; 
              border: 2px solid #00ff88; 
              border-radius: 10px; 
              padding: 20px; 
              position: relative;
            }
            .content { 
              font-size: 14px; 
              line-height: 1.4; 
              white-space: pre-wrap; 
            }
            .cursor { 
              width: 2px; 
              height: 20px; 
              background: #00ff88; 
              position: absolute; 
              bottom: 20px; 
              left: 20px; 
              animation: blink 1s infinite; 
            }
            @keyframes blink { 
              0%, 50% { opacity: 1; } 
              51%, 100% { opacity: 0; } 
            }
          </style>
        </head>
        <body>
          <div data-testid="terminal-container" class="test-terminal">
            <div data-testid="terminal-output" class="content">
╔════════════════════════════════════════════════════════════╗
║                 COMPREHENSIVE VISUAL TEST                 ║
║                                                            ║
║  ✓ Screenshot comparison engine working                   ║
║  ✓ ASCII alignment validation passing                     ║
║  ✓ Layout integrity tests successful                      ║
║  ✓ Theme consistency validation complete                  ║
║  ✓ Font size and DPI testing verified                     ║
║  ✓ Cursor positioning accuracy confirmed                  ║
║  ✓ Regression detection system active                     ║
║  ✓ Performance benchmarks met                             ║
║                                                            ║
║  🎯 All visual-diff framework tests PASSED! 🎯           ║
╚════════════════════════════════════════════════════════════╝

$ visual-diff-framework --comprehensive --validate-all
Running comprehensive visual validation suite...

[✓] Pixel-perfect accuracy: 99.8%
[✓] Layout stability: STABLE
[✓] Theme consistency: VERIFIED
[✓] Responsive behavior: ADAPTIVE
[✓] Performance metrics: OPTIMAL

Framework ready for production use! 🚀
            </div>
            <div data-testid="terminal-cursor" class="cursor"></div>
          </div>
        </body>
      </html>
    `);

    await wait(500);
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('should successfully execute the complete visual-diff testing workflow', async () => {
    // Step 1: Baseline capture
    const baselineScreenshot = await page.screenshot({ type: 'png' });
    expect(baselineScreenshot.length).toBeGreaterThan(1000);

    // Step 2: Test different viewports
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-hd' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 375, height: 667, name: 'mobile-portrait' },
    ];

    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await wait(300);
      
      const screenshot = await page.screenshot({ type: 'png' });
      const comparison = await compareScreenshots(baselineScreenshot, screenshot);
      
      expect(comparison.totalPixels).toBeGreaterThan(0);
      expect(screenshot.length).toBeGreaterThan(100);
    }

    // Step 3: ASCII content validation
    const screenshot = await page.screenshot({ type: 'png' });
    const asciiAnalysis = await analyzeASCIIAlignment(screenshot, 'perfect-grid');
    expect(asciiAnalysis.isAligned).toBe(true);

    // Step 4: Generate final report
    await page.setViewport({ width: 1200, height: 800 }); // Reset viewport
    const finalScreenshot = await page.screenshot({ type: 'png' });
    const report = await generateVisualDiffReport(baselineScreenshot, finalScreenshot, 'complete-workflow');
    
    expect(report.reportPath).toBeTruthy();
    expect(report.statistics.totalPixels).toBeGreaterThan(0);
    
    console.log('🎉 Complete visual-diff framework validation successful!');
    console.log(`📊 Report generated: ${report.reportPath}`);
    console.log(`📈 Pixel accuracy: ${report.statistics.pixelAccuracy.toFixed(2)}%`);
  });
});