/**
 * TDD RED PHASE: Responsive Layout Validation Tests
 * These tests verify layout behavior across different screen sizes
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('Responsive Layout Validation - TDD RED Phase', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--disable-dev-shm-usage', '--no-sandbox']
    });
    page = await browser.newPage();
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="responsive-container"]', { timeout: 10000 });
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Mobile Layout (320px - 767px)', () => {
    const mobileViewports = [
      { width: 320, height: 568, name: 'iPhone 5/SE' },
      { width: 375, height: 667, name: 'iPhone 6/7/8' },
      { width: 414, height: 896, name: 'iPhone 11' }
    ];

    mobileViewports.forEach(({ width, height, name }) => {
      it(`should properly layout terminal components on ${name} (${width}x${height})`, async () => {
        await page.setViewport({ width, height });
        await page.waitForTimeout(500);

        // Check mobile layout markers
        const mobileLayout = await page.$('[data-testid="mobile-layout"]');
        expect(mobileLayout).toBeTruthy();

        // Verify no horizontal overflow
        const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
        
        // RED PHASE: Should fail if horizontal overflow exists
        expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1);

        // Check terminal header height on mobile
        const header = await page.$('.terminal-header');
        const headerBox = await header!.boundingBox();
        
        // RED PHASE: Should fail if header is too tall for mobile
        expect(headerBox!.height).toBeLessThanOrEqual(48); // Max 48px on mobile

        // Verify touch target sizes (minimum 44px)
        const touchTargets = await page.$$('[data-testid="theme-switcher-button"]');
        for (const target of touchTargets) {
          const box = await target.boundingBox();
          // RED PHASE: Should fail if touch targets are too small
          expect(box!.width).toBeGreaterThanOrEqual(44);
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
      });

      it(`should adapt font sizes appropriately on ${name}`, async () => {
        await page.setViewport({ width, height });
        await page.waitForTimeout(500);

        const terminalOutput = await page.$('.terminal-output');
        const computedStyle = await page.evaluate(el => {
          return window.getComputedStyle(el);
        }, terminalOutput);

        const fontSize = parseFloat(computedStyle.fontSize);
        
        // RED PHASE: Should fail if fonts are too small/large on mobile
        expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size
        expect(fontSize).toBeLessThanOrEqual(18); // Maximum mobile size
      });
    });

    it('should handle virtual keyboard appearance gracefully', async () => {
      await page.setViewport({ width: 375, height: 667 });
      
      // Simulate virtual keyboard by reducing viewport height
      await page.setViewport({ width: 375, height: 300 }); // Keyboard visible
      await page.waitForTimeout(500);

      const container = await page.$('[data-testid="responsive-container"]');
      const containerBox = await container!.boundingBox();

      // Terminal should still be usable with keyboard visible
      // RED PHASE: Should fail if terminal is not properly adjusted
      expect(containerBox!.height).toBeGreaterThan(100); // Minimum usable height
      
      // Check if keyboard data attribute is set
      const keyboardOpen = await page.evaluate(() => {
        const container = document.querySelector('[data-testid="responsive-container"]');
        return container?.getAttribute('data-keyboard-open') === '1';
      });

      // RED PHASE: Should fail if keyboard state is not detected
      expect(keyboardOpen).toBe(true);
    });
  });

  describe('Tablet Layout (768px - 1023px)', () => {
    const tabletViewports = [
      { width: 768, height: 1024, name: 'iPad Portrait' },
      { width: 1024, height: 768, name: 'iPad Landscape' },
      { width: 834, height: 1194, name: 'iPad Pro 11"' }
    ];

    tabletViewports.forEach(({ width, height, name }) => {
      it(`should optimize layout for ${name} (${width}x${height})`, async () => {
        await page.setViewport({ width, height });
        await page.waitForTimeout(500);

        // Check for proper spacing on tablets
        const container = await page.$('[data-testid="responsive-container"]');
        const containerBox = await container!.boundingBox();

        // Tablet should have reasonable margins
        const leftMargin = containerBox!.x;
        const rightMargin = width - (containerBox!.x + containerBox!.width);

        // RED PHASE: Should fail if margins are not tablet-appropriate
        expect(leftMargin).toBeGreaterThanOrEqual(0);
        expect(rightMargin).toBeGreaterThanOrEqual(0);
        expect(containerBox!.width).toBeLessThanOrEqual(width);

        // Terminal should utilize available space efficiently
        const terminalMain = await page.$('.terminal-main');
        const terminalBox = await terminalMain!.boundingBox();
        
        // RED PHASE: Should fail if terminal doesn't use space well
        const utilization = (terminalBox!.width * terminalBox!.height) / (width * height);
        expect(utilization).toBeGreaterThan(0.3); // At least 30% space utilization
      });

      it(`should maintain readable typography on ${name}`, async () => {
        await page.setViewport({ width, height });
        await page.waitForTimeout(500);

        // Check various text elements
        const textElements = [
          '.terminal-header',
          '.terminal-output',
          '.terminal-status'
        ];

        for (const selector of textElements) {
          const element = await page.$(selector);
          if (element) {
            const computedStyle = await page.evaluate(el => {
              return window.getComputedStyle(el);
            }, element);

            const fontSize = parseFloat(computedStyle.fontSize);
            
            // RED PHASE: Should fail if typography is not tablet-optimized
            expect(fontSize).toBeGreaterThanOrEqual(12);
            expect(fontSize).toBeLessThanOrEqual(20);
          }
        }
      });
    });
  });

  describe('Desktop Layout (1024px+)', () => {
    const desktopViewports = [
      { width: 1024, height: 768, name: 'Small Desktop' },
      { width: 1440, height: 900, name: 'Medium Desktop' },
      { width: 1920, height: 1080, name: 'Full HD' },
      { width: 2560, height: 1440, name: '1440p' }
    ];

    desktopViewports.forEach(({ width, height, name }) => {
      it(`should utilize desktop space effectively on ${name} (${width}x${height})`, async () => {
        await page.setViewport({ width, height });
        await page.waitForTimeout(500);

        // Check desktop layout markers
        const desktopFeatures = await page.$('[data-testid="desktop-features"]');
        if (width >= 1024) {
          expect(desktopFeatures).toBeTruthy();
        }

        // Verify layout doesn't become too wide or narrow
        const container = await page.$('[data-testid="responsive-container"]');
        const containerBox = await container!.boundingBox();

        // RED PHASE: Should fail if layout is not desktop-optimized
        expect(containerBox!.width).toBeGreaterThan(800); // Minimum useful width
        expect(containerBox!.width).toBeLessThanOrEqual(width); // No overflow

        // Check if elements are properly spaced for desktop
        const header = await page.$('.terminal-header');
        const main = await page.$('.terminal-main');
        
        const headerBox = await header!.boundingBox();
        const mainBox = await main!.boundingBox();

        const spacing = mainBox!.y - (headerBox!.y + headerBox!.height);
        
        // RED PHASE: Should fail if spacing is not desktop-appropriate
        expect(spacing).toBeGreaterThanOrEqual(0);
        expect(spacing).toBeLessThanOrEqual(20); // Reasonable max spacing
      });

      it(`should scale typography appropriately on ${name}`, async () => {
        await page.setViewport({ width, height });
        await page.waitForTimeout(500);

        const terminalOutput = await page.$('.terminal-output');
        const computedStyle = await page.evaluate(el => {
          return window.getComputedStyle(el);
        }, terminalOutput);

        const fontSize = parseFloat(computedStyle.fontSize);
        
        // RED PHASE: Should fail if desktop typography is not optimal
        expect(fontSize).toBeGreaterThanOrEqual(12);
        expect(fontSize).toBeLessThanOrEqual(16); // Desktop terminal font range
      });
    });
  });

  describe('Orientation Changes', () => {
    it('should handle portrait to landscape transitions smoothly', async () => {
      // Start in portrait
      await page.setViewport({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      const portraitLayout = await page.evaluate(() => {
        const container = document.querySelector('[data-testid="responsive-container"]');
        const rect = container?.getBoundingClientRect();
        return { width: rect?.width, height: rect?.height };
      });

      // Rotate to landscape
      await page.setViewport({ width: 667, height: 375 });
      await page.waitForTimeout(500);

      const landscapeLayout = await page.evaluate(() => {
        const container = document.querySelector('[data-testid="responsive-container"]');
        const rect = container?.getBoundingClientRect();
        return { width: rect?.width, height: rect?.height };
      });

      // RED PHASE: Should fail if layout doesn't adapt to orientation
      expect(landscapeLayout.width).toBeGreaterThan(portraitLayout.width!);
      expect(landscapeLayout.height).toBeLessThan(portraitLayout.height!);

      // Verify no layout breaks occurred
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
      
      expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1);
    });

    it('should adjust element sizes appropriately in landscape mode', async () => {
      await page.setViewport({ width: 812, height: 375 }); // iPhone X landscape
      await page.waitForTimeout(500);

      // Header should be shorter in landscape
      const header = await page.$('.terminal-header');
      const headerBox = await header!.boundingBox();
      
      // RED PHASE: Should fail if header is too tall in landscape
      expect(headerBox!.height).toBeLessThanOrEqual(36); // Compact header in landscape

      // Terminal should use most of the available height
      const terminal = await page.$('.terminal-main');
      const terminalBox = await terminal!.boundingBox();
      
      const heightUtilization = terminalBox!.height / 375;
      
      // RED PHASE: Should fail if terminal doesn't utilize height well
      expect(heightUtilization).toBeGreaterThan(0.7); // At least 70% height usage
    });
  });

  describe('Dynamic Content Scaling', () => {
    it('should handle long terminal output without layout breaks', async () => {
      await page.setViewport({ width: 1024, height: 768 });
      
      // Simulate long terminal output
      await page.evaluate(() => {
        const output = document.querySelector('.terminal-output');
        if (output) {
          // Add many lines of content
          const longContent = Array(100).fill(0).map((_, i) => 
            `Line ${i + 1}: This is a long line of terminal output that might cause layout issues`
          ).join('\n');
          
          output.textContent = longContent;
        }
      });

      await page.waitForTimeout(500);

      // Verify no horizontal overflow
      const terminalOutput = await page.$('.terminal-output');
      const outputScrollWidth = await page.evaluate(el => el.scrollWidth, terminalOutput);
      const outputClientWidth = await page.evaluate(el => el.clientWidth, terminalOutput);

      // RED PHASE: Should fail if long content causes horizontal overflow
      expect(outputScrollWidth).toBeLessThanOrEqual(outputClientWidth + 5); // Allow small tolerance

      // Verify vertical scrolling works
      const outputScrollHeight = await page.evaluate(el => el.scrollHeight, terminalOutput);
      const outputClientHeight = await page.evaluate(el => el.clientHeight, terminalOutput);

      expect(outputScrollHeight).toBeGreaterThan(outputClientHeight);
    });

    it('should maintain layout stability with dynamic theme changes', async () => {
      await page.setViewport({ width: 1024, height: 768 });
      
      // Get initial layout
      const initialLayout = await page.evaluate(() => {
        const elements = ['.terminal-header', '.terminal-main', '.terminal-output'];
        return elements.reduce((acc, selector) => {
          const element = document.querySelector(selector);
          if (element) {
            const rect = element.getBoundingClientRect();
            acc[selector] = { width: rect.width, height: rect.height };
          }
          return acc;
        }, {} as Record<string, any>);
      });

      // Trigger theme change
      const themeSwitcher = await page.$('[data-testid="theme-switcher-button"]');
      if (themeSwitcher) {
        await themeSwitcher.click();
        await page.waitForTimeout(500);
        
        const themeOption = await page.$('[data-theme-key]');
        if (themeOption) {
          await themeOption.click();
          await page.waitForTimeout(1000); // Allow theme transition
        }
      }

      // Get layout after theme change
      const afterLayout = await page.evaluate(() => {
        const elements = ['.terminal-header', '.terminal-main', '.terminal-output'];
        return elements.reduce((acc, selector) => {
          const element = document.querySelector(selector);
          if (element) {
            const rect = element.getBoundingClientRect();
            acc[selector] = { width: rect.width, height: rect.height };
          }
          return acc;
        }, {} as Record<string, any>);
      });

      // Compare layouts - should be stable across theme changes
      Object.keys(initialLayout).forEach(selector => {
        const initial = initialLayout[selector];
        const after = afterLayout[selector];
        
        if (initial && after) {
          // RED PHASE: Should fail if theme changes break layout
          expect(Math.abs(initial.width - after.width)).toBeLessThan(5);
          expect(Math.abs(initial.height - after.height)).toBeLessThan(5);
        }
      });
    });
  });
});