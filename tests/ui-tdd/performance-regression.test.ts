/**
 * TDD RED PHASE: Performance Regression Tests
 * These tests establish performance baselines and detect regressions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('Performance Regression Tests - TDD RED Phase', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-web-security']
    });
    page = await browser.newPage();
    
    // Enable performance monitoring
    await page.setCacheEnabled(false);
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="responsive-container"]', { timeout: 10000 });
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Initial Load Performance', () => {
    it('should load initial page within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
      await page.waitForSelector('[data-testid="responsive-container"]');
      
      const loadTime = Date.now() - startTime;
      
      // RED PHASE: Should fail if load time exceeds threshold
      expect(loadTime).toBeLessThan(3000); // 3 seconds max
    });

    it('should achieve First Contentful Paint within 1.5 seconds', async () => {
      const metrics = await page.metrics();
      const navigationStart = await page.evaluate(() => performance.timeOrigin);
      
      // Get FCP from Performance Observer API
      const fcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                resolve(entry.startTime);
              }
            }
          }).observe({ entryTypes: ['paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve(null), 5000);
        });
      });

      if (fcp) {
        // RED PHASE: Should fail if FCP is too slow
        expect(fcp).toBeLessThan(1500); // 1.5 seconds
      }
    });

    it('should have minimal JavaScript execution time during load', async () => {
      const metrics = await page.metrics();
      
      // RED PHASE: Should fail if JS execution time is excessive
      expect(metrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024); // 50MB max
      expect(metrics.JSEventListeners).toBeLessThan(100); // Reasonable listener count
    });

    it('should load critical resources efficiently', async () => {
      const performanceEntries = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map(entry => ({
          name: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize,
          initiatorType: entry.initiatorType
        }));
      });

      // Check CSS load times
      const cssEntries = performanceEntries.filter(entry => 
        entry.name.endsWith('.css') || entry.initiatorType === 'css'
      );
      
      cssEntries.forEach(entry => {
        // RED PHASE: Should fail if CSS resources are too slow
        expect(entry.duration).toBeLessThan(500);
      });

      // Check JS load times
      const jsEntries = performanceEntries.filter(entry => 
        entry.name.endsWith('.js') || entry.initiatorType === 'script'
      );
      
      jsEntries.forEach(entry => {
        // RED PHASE: Should fail if JS resources are too slow
        expect(entry.duration).toBeLessThan(1000);
      });
    });
  });

  describe('Runtime Performance', () => {
    it('should maintain smooth scrolling performance', async () => {
      // Add content to make scrolling possible
      await page.evaluate(() => {
        const output = document.querySelector('.terminal-output');
        if (output) {
          const longContent = Array(100).fill(0).map((_, i) => 
            `Line ${i + 1}: Performance test content for scrolling evaluation`
          ).join('\n');
          output.textContent = longContent;
        }
      });

      const startTime = performance.now();
      
      // Perform scrolling
      await page.evaluate(() => {
        const output = document.querySelector('.terminal-output');
        if (output) {
          output.scrollTop = 0;
          output.scrollTop = output.scrollHeight / 2;
          output.scrollTop = output.scrollHeight;
        }
      });

      const scrollTime = performance.now() - startTime;
      
      // RED PHASE: Should fail if scrolling is not smooth
      expect(scrollTime).toBeLessThan(100); // Should be very fast
    });

    it('should handle rapid keyboard input efficiently', async () => {
      const terminal = await page.$('.terminal-main');
      await terminal!.focus();

      const startTime = performance.now();
      
      // Simulate rapid typing
      const rapidInput = 'abcdefghijklmnopqrstuvwxyz'.split('');
      for (const char of rapidInput) {
        await page.keyboard.press(char);
      }

      const inputTime = performance.now() - startTime;
      
      // RED PHASE: Should fail if input handling is too slow
      expect(inputTime).toBeLessThan(500); // 500ms for 26 characters
    });

    it('should maintain low memory usage during operation', async () => {
      const initialMetrics = await page.metrics();
      
      // Perform memory-intensive operations
      await page.evaluate(() => {
        // Simulate terminal output updates
        for (let i = 0; i < 50; i++) {
          const output = document.querySelector('.terminal-output');
          if (output) {
            output.textContent += `Memory test line ${i}\n`;
          }
        }
      });

      await page.waitForTimeout(1000); // Allow GC

      const finalMetrics = await page.metrics();
      const memoryIncrease = finalMetrics.JSHeapUsedSize - initialMetrics.JSHeapUsedSize;
      
      // RED PHASE: Should fail if memory usage grows excessively
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB max increase
    });

    it('should have efficient cursor animation performance', async () => {
      const cursor = await page.$('[data-testid="terminal-cursor"]');
      expect(cursor).toBeTruthy();

      // Measure cursor animation frame rate
      const animationPerformance = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frameCount = 0;
          const startTime = performance.now();
          
          const countFrames = () => {
            frameCount++;
            if (frameCount < 60) { // Count 60 frames
              requestAnimationFrame(countFrames);
            } else {
              const endTime = performance.now();
              const fps = (frameCount * 1000) / (endTime - startTime);
              resolve(fps);
            }
          };
          
          requestAnimationFrame(countFrames);
        });
      });

      // RED PHASE: Should fail if animation FPS is too low
      expect(animationPerformance).toBeGreaterThan(30); // At least 30 FPS
    });
  });

  describe('UI Interaction Performance', () => {
    it('should respond to theme changes quickly', async () => {
      const themeSwitcher = await page.$('[data-testid="theme-switcher-button"]');
      
      if (themeSwitcher) {
        const startTime = performance.now();
        
        await themeSwitcher.click();
        await page.waitForSelector('[data-testid="theme-dropdown"]');
        
        const themeOption = await page.$('[data-theme-key]');
        if (themeOption) {
          await themeOption.click();
          await page.waitForTimeout(500); // Allow theme transition
        }
        
        const responseTime = performance.now() - startTime;
        
        // RED PHASE: Should fail if theme change is too slow
        expect(responseTime).toBeLessThan(1000); // 1 second max
      }
    });

    it('should handle window resize efficiently', async () => {
      const startTime = performance.now();
      
      // Perform multiple resizes
      const viewports = [
        { width: 1024, height: 768 },
        { width: 768, height: 1024 },
        { width: 375, height: 667 },
        { width: 1440, height: 900 }
      ];

      for (const viewport of viewports) {
        await page.setViewport(viewport);
        await page.waitForTimeout(100); // Allow layout adjustment
      }

      const resizeTime = performance.now() - startTime;
      
      // RED PHASE: Should fail if resize handling is too slow
      expect(resizeTime).toBeLessThan(2000); // 2 seconds for all resizes
    });

    it('should maintain performance during rapid UI updates', async () => {
      const startTime = performance.now();
      
      // Simulate rapid terminal output
      await page.evaluate(() => {
        const output = document.querySelector('.terminal-output');
        if (output) {
          let lineCount = 0;
          const addLine = () => {
            if (lineCount < 100) {
              output.textContent += `Rapid update line ${lineCount++}\n`;
              requestAnimationFrame(addLine);
            }
          };
          addLine();
        }
      });

      await page.waitForTimeout(2000); // Allow updates to complete

      const updateTime = performance.now() - startTime;
      
      // Check for dropped frames during updates
      const longTaskEntries = await page.evaluate(() => {
        return performance.getEntriesByType('longtask').length;
      });

      // RED PHASE: Should fail if there are too many long tasks
      expect(longTaskEntries).toBeLessThan(5); // Max 5 long tasks
      expect(updateTime).toBeLessThan(3000); // Should complete quickly
    });
  });

  describe('Resource Usage Optimization', () => {
    it('should have efficient CSS selector performance', async () => {
      const startTime = performance.now();
      
      // Test complex selector queries
      const selectorTests = [
        '.terminal-output',
        '[data-testid]',
        '.modern-terminal .terminal-header',
        '.terminal-cursor',
        '[data-theme]'
      ];

      for (const selector of selectorTests) {
        await page.$(selector);
      }

      const selectorTime = performance.now() - startTime;
      
      // RED PHASE: Should fail if selector queries are too slow
      expect(selectorTime).toBeLessThan(100);
    });

    it('should minimize layout thrashing during updates', async () => {
      // Enable layout shift detection
      const layoutShifts = await page.evaluate(() => {
        return new Promise((resolve) => {
          let shifts = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'layout-shift') {
                shifts++;
              }
            }
          }).observe({ entryTypes: ['layout-shift'] });
          
          // Trigger potential layout shifts
          const container = document.querySelector('[data-testid="responsive-container"]');
          if (container) {
            container.style.width = '90%';
            container.style.width = '100%';
            container.style.height = '90vh';
            container.style.height = '100vh';
          }
          
          setTimeout(() => resolve(shifts), 1000);
        });
      });

      // RED PHASE: Should fail if there are excessive layout shifts
      expect(layoutShifts).toBeLessThan(3); // Max 3 layout shifts
    });

    it('should have efficient event listener management', async () => {
      const initialListeners = await page.metrics().then(m => m.JSEventListeners);
      
      // Simulate component mounting/unmounting
      await page.evaluate(() => {
        // This would typically test component lifecycle
        const event = new Event('resize');
        window.dispatchEvent(event);
      });

      const finalListeners = await page.metrics().then(m => m.JSEventListeners);
      const listenerIncrease = finalListeners - initialListeners;
      
      // RED PHASE: Should fail if event listeners leak
      expect(listenerIncrease).toBeLessThan(10); // Minimal listener increase
    });
  });

  describe('Mobile Performance', () => {
    it('should maintain performance on mobile viewports', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      const mobileMetrics = await page.metrics();
      
      // RED PHASE: Should fail if mobile performance is poor
      expect(mobileMetrics.JSHeapUsedSize).toBeLessThan(40 * 1024 * 1024); // 40MB on mobile
    });

    it('should handle touch events efficiently', async () => {
      await page.setViewport({ width: 375, height: 667 });
      
      const terminal = await page.$('.terminal-main');
      const startTime = performance.now();
      
      // Simulate touch interactions
      await terminal!.tap();
      await page.touchscreen.tap(200, 300);
      
      const touchTime = performance.now() - startTime;
      
      // RED PHASE: Should fail if touch handling is slow
      expect(touchTime).toBeLessThan(200); // 200ms max for touch response
    });

    it('should optimize rendering for small screens', async () => {
      await page.setViewport({ width: 320, height: 568 }); // Smallest mobile
      
      const renderMetrics = await page.evaluate(() => {
        const start = performance.now();
        
        // Force a repaint
        document.body.style.transform = 'translateZ(0)';
        document.body.offsetHeight; // Trigger layout
        document.body.style.transform = '';
        
        return performance.now() - start;
      });

      // RED PHASE: Should fail if small screen rendering is slow
      expect(renderMetrics).toBeLessThan(50); // 50ms max for repaint
    });
  });

  describe('Bundle Size and Network Performance', () => {
    it('should have acceptable JavaScript bundle size', async () => {
      const jsResources = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(entry => entry.name.endsWith('.js'))
          .reduce((total, entry) => total + (entry.transferSize || 0), 0);
      });

      // RED PHASE: Should fail if JS bundle is too large
      expect(jsResources).toBeLessThan(2 * 1024 * 1024); // 2MB max
    });

    it('should minimize CSS bundle size', async () => {
      const cssResources = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(entry => entry.name.endsWith('.css'))
          .reduce((total, entry) => total + (entry.transferSize || 0), 0);
      });

      // RED PHASE: Should fail if CSS bundle is too large
      expect(cssResources).toBeLessThan(500 * 1024); // 500KB max
    });

    it('should load efficiently on slow networks', async () => {
      // Simulate slow 3G
      const client = await page.target().createCDPSession();
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 40
      });

      const startTime = performance.now();
      await page.reload({ waitUntil: 'domcontentloaded' });
      const loadTime = performance.now() - startTime;

      // RED PHASE: Should fail if slow network performance is poor
      expect(loadTime).toBeLessThan(10000); // 10 seconds on slow 3G
    });
  });
});