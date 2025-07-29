/**
 * 🔴 TDD RED PHASE: Terminal Layout Tests - THESE TESTS SHOULD FAIL INITIALLY
 * Tests for terminal height and overlap issues before implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { launch, Browser, Page } from 'puppeteer';

describe('Terminal Layout TDD Tests - RED PHASE', () => {
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    browser = await launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterEach(async () => {
    await browser.close();
  });

  describe('🔴 FAILING: Terminal Height on All Devices', () => {
    it('should take up full viewport height on desktop (1920x1080)', async () => {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
      
      const viewportHeight = 1080;
      const terminalElement = await page.$('.modern-terminal');
      expect(terminalElement).toBeTruthy();
      
      const terminalBox = await terminalElement!.boundingBox();
      expect(terminalBox).toBeTruthy();
      
      // Terminal should take up at least 95% of viewport height
      const minExpectedHeight = viewportHeight * 0.95;
      expect(terminalBox!.height).toBeGreaterThanOrEqual(minExpectedHeight);
      
      // Terminal should not exceed viewport height
      expect(terminalBox!.height).toBeLessThanOrEqual(viewportHeight);
    });

    it('should take up full viewport height on tablet (768x1024)', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
      
      const viewportHeight = 1024;
      const terminalElement = await page.$('.modern-terminal');
      expect(terminalElement).toBeTruthy();
      
      const terminalBox = await terminalElement!.boundingBox();
      expect(terminalBox).toBeTruthy();
      
      // Terminal should take up at least 95% of viewport height
      const minExpectedHeight = viewportHeight * 0.95;
      expect(terminalBox!.height).toBeGreaterThanOrEqual(minExpectedHeight);
      
      // Terminal should not exceed viewport height
      expect(terminalBox!.height).toBeLessThanOrEqual(viewportHeight);
    });

    it('should take up full viewport height on mobile (375x667)', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
      
      const viewportHeight = 667;
      const terminalElement = await page.$('.modern-terminal');
      expect(terminalElement).toBeTruthy();
      
      const terminalBox = await terminalElement!.boundingBox();
      expect(terminalBox).toBeTruthy();
      
      // Terminal should take up at least 95% of viewport height
      const minExpectedHeight = viewportHeight * 0.95;
      expect(terminalBox!.height).toBeGreaterThanOrEqual(minExpectedHeight);
      
      // Terminal should not exceed viewport height
      expect(terminalBox!.height).toBeLessThanOrEqual(viewportHeight);
    });

    it('should take up full viewport height on mobile landscape (667x375)', async () => {
      await page.setViewport({ width: 667, height: 375 });
      await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
      
      const viewportHeight = 375;
      const terminalElement = await page.$('.modern-terminal');
      expect(terminalElement).toBeTruthy();
      
      const terminalBox = await terminalElement!.boundingBox();
      expect(terminalBox).toBeTruthy();
      
      // Terminal should take up at least 95% of viewport height
      const minExpectedHeight = viewportHeight * 0.95;
      expect(terminalBox!.height).toBeGreaterThanOrEqual(minExpectedHeight);
      
      // Terminal should not exceed viewport height
      expect(terminalBox!.height).toBeLessThanOrEqual(viewportHeight);
    });

    it('should adapt to viewport changes dynamically', async () => {
      await page.setViewport({ width: 1024, height: 768 });
      await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
      
      // Get initial height
      let terminalElement = await page.$('.modern-terminal');
      const initialBox = await terminalElement!.boundingBox();
      const initialViewportHeight = 768;
      
      // Change viewport size
      const newViewportHeight = 1200;
      await page.setViewport({ width: 1024, height: newViewportHeight });
      await new Promise(resolve => setTimeout(resolve, 500)); // Allow time for resize
      
      // Get new height
      terminalElement = await page.$('.modern-terminal');
      const newBox = await terminalElement!.boundingBox();
      
      // Terminal should adapt to new viewport height (allow for reasonable tolerance)
      const heightDifference = Math.abs(newBox!.height - initialBox!.height);
      // If viewport changes significantly, terminal should respond
      if (newViewportHeight !== initialViewportHeight) {
        expect(heightDifference).toBeGreaterThan(0); // Some change should occur
      }
      
      // Should still take up at least 95% of new viewport height
      const minExpectedHeight = 1200 * 0.95;
      expect(newBox!.height).toBeGreaterThanOrEqual(minExpectedHeight);
    });
  });

  describe('🔴 FAILING: Zero UI Element Overlaps', () => {
    it('should have no overlapping elements on desktop', async () => {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
      
      const overlaps = await detectOverlappingElements(page);
      expect(overlaps).toHaveLength(0);
    });

    it('should have no overlapping elements on tablet', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
      
      const overlaps = await detectOverlappingElements(page);
      expect(overlaps).toHaveLength(0);
    });

    it('should have no overlapping elements on mobile', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
      
      const overlaps = await detectOverlappingElements(page);
      expect(overlaps).toHaveLength(0);
    });

    it('should maintain no overlaps during terminal interaction', async () => {
      await page.setViewport({ width: 1024, height: 768 });
      await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
      
      // Wait for terminal to be ready
      await page.waitForSelector('.modern-terminal', { visible: true });
      
      // Simulate typing
      await page.click('.terminal-main');
      await page.keyboard.type('ls -la');
      await page.keyboard.press('Enter');
      
      // Wait for command output
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for overlaps after interaction
      const overlaps = await detectOverlappingElements(page);
      expect(overlaps).toHaveLength(0);
    });

    it('should maintain proper z-index stacking order', async () => {
      await page.setViewport({ width: 1024, height: 768 });
      await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
      
      const zIndexOrder = await page.evaluate(() => {
        const elements = [
          { selector: '.terminal-header', name: 'header' },
          { selector: '.terminal-main', name: 'main' },
          { selector: '.terminal-output', name: 'output' },
          { selector: '.terminal-status', name: 'status' },
          { selector: '.singleton-cursor', name: 'cursor' }
        ];
        
        return elements.map(({ selector, name }) => {
          const element = document.querySelector(selector);
          const zIndex = element ? window.getComputedStyle(element).zIndex : 'auto';
          return { name, zIndex, exists: !!element };
        });
      });
      
      // Cursor should have highest z-index
      const cursorElement = zIndexOrder.find(el => el.name === 'cursor');
      if (cursorElement?.exists) {
        const cursorZIndex = parseInt(cursorElement.zIndex) || 0;
        
        // Other elements should have lower z-index than cursor
        zIndexOrder.forEach(el => {
          if (el.name !== 'cursor' && el.exists && el.zIndex !== 'auto') {
            const elZIndex = parseInt(el.zIndex) || 0;
            expect(elZIndex).toBeLessThan(cursorZIndex);
          }
        });
      }
    });
  });

  describe('🔴 FAILING: Terminal Container Sizing', () => {
    it('should have correct flex layout structure', async () => {
      await page.setViewport({ width: 1024, height: 768 });
      await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
      
      const layoutInfo = await page.evaluate(() => {
        const terminal = document.querySelector('.modern-terminal');
        const header = document.querySelector('.terminal-header');
        const main = document.querySelector('.terminal-main');
        const status = document.querySelector('.terminal-status');
        
        return {
          terminal: {
            display: window.getComputedStyle(terminal!).display,
            flexDirection: window.getComputedStyle(terminal!).flexDirection,
            height: window.getComputedStyle(terminal!).height
          },
          main: {
            flex: window.getComputedStyle(main!).flex,
            position: window.getComputedStyle(main!).position,
            height: window.getComputedStyle(main!).height
          },
          header: {
            minHeight: window.getComputedStyle(header!).minHeight
          },
          status: {
            minHeight: window.getComputedStyle(status!).minHeight
          }
        };
      });
      
      // Terminal should use flex layout
      expect(layoutInfo.terminal.display).toBe('flex');
      expect(layoutInfo.terminal.flexDirection).toBe('column');
      
      // Main area should flex to fill available space
      expect(layoutInfo.main.flex).toContain('1');
      
      // Terminal height should be viewport height or close to it
      const terminalHeight = parseInt(layoutInfo.terminal.height);
      expect(terminalHeight).toBeGreaterThan(700); // Should be close to 768px viewport
    });

    it('should handle virtual keyboard on mobile without breaking layout', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
      
      // Get initial terminal height
      const terminalElement = await page.$('.modern-terminal');
      const terminalBox = await terminalElement!.boundingBox();
      const initialHeight = terminalBox!.height;
      
      // Simulate virtual keyboard by reducing viewport height
      await page.setViewport({ width: 375, height: 400 }); // Simulating keyboard showing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Terminal should still be properly sized
      const updatedElement = await page.$('.modern-terminal');
      const updatedBox = await updatedElement!.boundingBox();
      
      // Terminal should adapt to new height or maintain reasonable size
      // On mobile, height might not change due to CSS viewport units handling
      expect(updatedBox!.height).toBeGreaterThan(300); // Should still be reasonably sized
      expect(updatedBox!.height).toBeLessThanOrEqual(initialHeight + 50); // Allow some tolerance
    });
  });

  describe('🔴 FAILING: QuantumLayout Integration', () => {
    it('should use QuantumLayout for collision-free positioning', async () => {
      await page.setViewport({ width: 1024, height: 768 });
      await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
      
      // Check if QuantumLayout is being used
      const quantumLayoutUsage = await page.evaluate(() => {
        // Check for QuantumLayout class or usage indicators
        const hasQuantumClass = !!document.querySelector('[data-quantum-layout]');
        const hasAbsolutePositioning = Array.from(document.querySelectorAll('.modern-terminal *'))
          .some(el => window.getComputedStyle(el).position === 'absolute');
        
        return {
          hasQuantumClass,
          hasAbsolutePositioning,
          elementCount: document.querySelectorAll('.modern-terminal *').length
        };
      });
      
      // Should have absolute positioning for quantum layout precision
      expect(quantumLayoutUsage.hasAbsolutePositioning).toBe(true);
      expect(quantumLayoutUsage.elementCount).toBeGreaterThan(5); // Should have multiple elements
    });
  });
});

/**
 * Helper function to detect overlapping elements using collision detection
 */
async function detectOverlappingElements(page: Page): Promise<Array<{element1: string, element2: string}>> {
  return await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('.modern-terminal *'))
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0';
      });
    
    const overlaps: Array<{element1: string, element2: string}> = [];
    
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const el1 = elements[i];
        const el2 = elements[j];
        
        // Skip if one element contains the other
        if (el1.contains(el2) || el2.contains(el1)) continue;
        
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        
        // Check for overlap
        const hasOverlap = !(
          rect1.right <= rect2.left ||
          rect2.right <= rect1.left ||
          rect1.bottom <= rect2.top ||
          rect2.bottom <= rect1.top
        );
        
        if (hasOverlap && rect1.width > 0 && rect1.height > 0 && rect2.width > 0 && rect2.height > 0) {
          overlaps.push({
            element1: el1.tagName + (el1.className ? '.' + el1.className.split(' ')[0] : ''),
            element2: el2.tagName + (el2.className ? '.' + el2.className.split(' ')[0] : '')
          });
        }
      }
    }
    
    return overlaps;
  });
}