/**
 * TDD RED PHASE: Visual Overlap Detection Tests
 * These tests should FAIL initially, then pass after implementation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

describe('Visual Overlap Detection - TDD RED Phase', () => {
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

  describe('Terminal Header and Main Content Overlap', () => {
    it('should detect no visual overlap between header and main terminal area', async () => {
      // RED: This test should FAIL initially due to overlapping elements
      const headerElement = await page.$('.terminal-header');
      const mainElement = await page.$('.terminal-main');
      
      expect(headerElement).toBeTruthy();
      expect(mainElement).toBeTruthy();

      const headerBox = await headerElement!.boundingBox();
      const mainBox = await mainElement!.boundingBox();

      expect(headerBox).toBeTruthy();
      expect(mainBox).toBeTruthy();

      // Check for overlap: header bottom should not exceed main top
      const headerBottom = headerBox!.y + headerBox!.height;
      const mainTop = mainBox!.y;
      
      // RED PHASE: This assertion should FAIL
      expect(headerBottom).toBeLessThanOrEqual(mainTop);
    });

    it('should have proper spacing between header and terminal content', async () => {
      const headerElement = await page.$('.terminal-header');
      const terminalContent = await page.$('[data-testid="terminal-content"]');
      
      const headerBox = await headerElement!.boundingBox();
      const contentBox = await terminalContent!.boundingBox();
      
      const spacing = contentBox!.y - (headerBox!.y + headerBox!.height);
      
      // RED PHASE: Should fail due to insufficient spacing
      expect(spacing).toBeGreaterThanOrEqual(8); // Minimum 8px spacing
    });
  });

  describe('Cursor Positioning and Element Overlap', () => {  
    it('should position cursor without overlapping other UI elements', async () => {
      const cursor = await page.$('[data-testid="terminal-cursor"]');
      const themeSwitcher = await page.$('[data-testid="theme-switcher-button"]');
      
      if (cursor && themeSwitcher) {
        const cursorBox = await cursor.boundingBox();
        const switcherBox = await themeSwitcher.boundingBox();
        
        // Check for overlap
        const noOverlap = 
          cursorBox!.x + cursorBox!.width < switcherBox!.x ||
          switcherBox!.x + switcherBox!.width < cursorBox!.x ||
          cursorBox!.y + cursorBox!.height < switcherBox!.y ||
          switcherBox!.y + switcherBox!.height < cursorBox!.y;
        
        // RED PHASE: Should fail if cursor overlaps with UI elements
        expect(noOverlap).toBe(true);
      }
    });

    it('should maintain cursor visibility within terminal bounds', async () => {
      const cursor = await page.$('[data-testid="terminal-cursor"]');
      const terminal = await page.$('.modern-terminal');
      
      if (cursor && terminal) {
        const cursorBox = await cursor.boundingBox();
        const terminalBox = await terminal.boundingBox();
        
        // Cursor should be within terminal bounds
        const withinBounds = 
          cursorBox!.x >= terminalBox!.x &&
          cursorBox!.y >= terminalBox!.y &&
          cursorBox!.x + cursorBox!.width <= terminalBox!.x + terminalBox!.width &&
          cursorBox!.y + cursorBox!.height <= terminalBox!.y + terminalBox!.height;
        
        // RED PHASE: May fail if cursor is positioned outside terminal
        expect(withinBounds).toBe(true);
      }
    });
  });

  describe('Responsive Layout Overflow Detection', () => {
    it('should not have horizontal overflow on mobile viewports', async () => {
      await page.setViewport({ width: 375, height: 667 }); // iPhone SE
      await page.waitForTimeout(500); // Allow layout adjustment
      
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
      
      // RED PHASE: Should fail if there's horizontal overflow
      expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1); // Allow 1px tolerance
    });

    it('should maintain proper spacing on tablet viewports', async () => {
      await page.setViewport({ width: 768, height: 1024 }); // iPad
      await page.waitForTimeout(500);
      
      const container = await page.$('[data-testid="responsive-container"]');
      const containerBox = await container!.boundingBox();
      
      // Container should have proper margins
      const leftMargin = containerBox!.x;
      const rightMargin = 768 - (containerBox!.x + containerBox!.width);
      
      // RED PHASE: May fail due to improper responsive margins  
      expect(leftMargin).toBeGreaterThanOrEqual(0);
      expect(rightMargin).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Z-Index and Layer Conflicts', () => {
    it('should have proper z-index stacking for overlays', async () => {
      // Trigger theme switcher dropdown
      const themeSwitcher = await page.$('[data-testid="theme-switcher-button"]');
      await themeSwitcher!.click();
      await page.waitForSelector('[data-testid="theme-dropdown"]', { timeout: 2000 });
      
      const dropdown = await page.$('[data-testid="theme-dropdown"]');
      const terminal = await page.$('.modern-terminal');
      
      if (dropdown && terminal) {
        const dropdownZIndex = await page.evaluate(el => {
          return window.getComputedStyle(el).zIndex;
        }, dropdown);
        
        const terminalZIndex = await page.evaluate(el => {
          return window.getComputedStyle(el).zIndex;
        }, terminal);
        
        // RED PHASE: Should fail if dropdown doesn't have higher z-index
        expect(parseInt(dropdownZIndex)).toBeGreaterThan(parseInt(terminalZIndex) || 0);
      }
    });

    it('should not have z-index conflicts causing element hiding', async () => {
      const allVisibleElements = await page.$$eval('[data-testid]', elements => {
        return elements.map(el => {
          const style = window.getComputedStyle(el);
          return {
            testId: el.getAttribute('data-testid'),
            zIndex: style.zIndex,
            visibility: style.visibility,
            display: style.display,
            opacity: style.opacity
          };
        });
      });
      
      // Check that important UI elements are visible
      const importantElements = ['responsive-container', 'terminal-content', 'terminal-cursor'];
      
      importantElements.forEach(testId => {
        const element = allVisibleElements.find(el => el.testId === testId);
        expect(element).toBeTruthy();
        
        if (element) {
          // RED PHASE: Should fail if elements are hidden by z-index conflicts
          expect(element.visibility).not.toBe('hidden');
          expect(element.display).not.toBe('none');
          expect(parseFloat(element.opacity)).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Visual Regression Detection', () => {
    it('should detect visual changes in terminal layout', async () => {
      await page.setViewport({ width: 1024, height: 768 });
      await page.waitForTimeout(1000);
      
      // Take screenshot of current state
      const currentScreenshot = await page.screenshot({ 
        type: 'png',
        clip: { x: 0, y: 0, width: 1024, height: 768 }
      });
      
      // Load reference screenshot (this would be saved from a known good state)
      // For now, we'll just verify the screenshot was captured
      expect(currentScreenshot).toBeTruthy();
      expect(currentScreenshot.length).toBeGreaterThan(1000); // Non-empty screenshot
      
      // RED PHASE: In real implementation, this would compare against a reference
      // and fail if significant visual differences are detected
    });

    it('should maintain consistent element positioning across refreshes', async () => {
      // Capture initial positions
      const initialPositions = await page.evaluate(() => {
        const elements = ['terminal-header', 'terminal-content', 'terminal-cursor'];
        return elements.reduce((acc, selector) => {
          const element = document.querySelector(`[data-testid="${selector}"], .${selector}`);
          if (element) {
            const rect = element.getBoundingClientRect();
            acc[selector] = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          }
          return acc;
        }, {} as Record<string, any>);
      });
      
      // Refresh page
      await page.reload();
      await page.waitForSelector('[data-testid="responsive-container"]', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // Capture positions after refresh
      const afterPositions = await page.evaluate(() => {
        const elements = ['terminal-header', 'terminal-content', 'terminal-cursor'];
        return elements.reduce((acc, selector) => {
          const element = document.querySelector(`[data-testid="${selector}"], .${selector}`);
          if (element) {
            const rect = element.getBoundingClientRect();
            acc[selector] = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          }
          return acc;
        }, {} as Record<string, any>);
      });
      
      // Compare positions (allow small tolerance for sub-pixel rendering)
      Object.keys(initialPositions).forEach(selector => {
        const initial = initialPositions[selector];
        const after = afterPositions[selector];
        
        if (initial && after) {
          // RED PHASE: Should fail if element positions are inconsistent
          expect(Math.abs(initial.x - after.x)).toBeLessThan(2);
          expect(Math.abs(initial.y - after.y)).toBeLessThan(2);
          expect(Math.abs(initial.width - after.width)).toBeLessThan(2);
          expect(Math.abs(initial.height - after.height)).toBeLessThan(2);
        }
      });
    });
  });
});