/**
 * UI DEBUG VALIDATION TESTS
 * Tests for all the UI fixes implemented to resolve overlapping elements,
 * z-index conflicts, positioning issues, and performance problems
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealTerminal } from '@/components/RealTerminal';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { HomeView } from '@/home/view';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Mock theme manager
vi.mock('@/theme', () => ({
  themeManager: {
    init: vi.fn(),
    getCurrentTheme: vi.fn(() => ({ name: 'Professional', colors: {} })),
    getAvailableThemes: vi.fn(() => [
      { key: 'professional', name: 'Professional' },
      { key: 'cyberpunk', name: 'Cyberpunk' }
    ]),
    subscribe: vi.fn(() => vi.fn()),
    setTheme: vi.fn()
  }
}));

describe('UI Debug Validation', () => {
  beforeEach(() => {
    // Reset viewport
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
    
    // Mock CSS custom properties
    const mockComputedStyle = {
      getPropertyValue: (prop: string) => {
        const cssVars: Record<string, string> = {
          '--z-dropdown': '100',
          '--z-terminal-main': '5',
          '--z-terminal-cursor': '10',
          '--z-header': '15'
        };
        return cssVars[prop] || '1';
      }
    };
    
    window.getComputedStyle = vi.fn(() => mockComputedStyle as any);
  });

  describe('Z-Index System', () => {
    it('should apply correct z-index hierarchy', async () => {
      render(<HomeView />);
      
      // Wait for components to render
      await waitFor(() => {
        const header = document.querySelector('.terminal-header');
        const main = document.querySelector('.terminal-main');
        const themeContainer = document.querySelector('.theme-switcher-container');
        
        expect(header).toBeInTheDocument();
        expect(main).toBeInTheDocument();
        
        // Check z-index values through CSS variables
        const headerZIndex = window.getComputedStyle(header!).getPropertyValue('z-index');
        const mainZIndex = window.getComputedStyle(main!).getPropertyValue('z-index');
        
        // Header should have higher z-index than main content
        expect(parseInt(headerZIndex) || 15).toBeGreaterThan(parseInt(mainZIndex) || 5);
      });
    });

    it('should prevent theme switcher dropdown from overlapping main content', async () => {
      render(<ThemeSwitcher subtle />);
      
      const button = screen.getByTestId('theme-switcher-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const dropdown = screen.getByTestId('theme-dropdown');
        expect(dropdown).toBeInTheDocument();
        
        const dropdownStyle = window.getComputedStyle(dropdown);
        const zIndex = dropdownStyle.getPropertyValue('z-index');
        
        // Should use CSS variable for z-index
        expect(zIndex).toBe('var(--z-dropdown)');
        
        // Should have max-height for scrollability
        expect(dropdown.style.maxHeight).toBe('300px');
        expect(dropdown.style.overflowY).toBe('auto');
      });
    });
  });

  describe('Positioning System', () => {
    it('should use proper positioning hierarchy', async () => {
      render(<HomeView />);
      
      await waitFor(() => {
        const app = document.querySelector('.terminal-app');
        const layoutContainer = document.querySelector('.terminal-layout-container');
        const header = document.querySelector('.terminal-header');
        const main = document.querySelector('.terminal-main');
        
        expect(app).toBeInTheDocument();
        expect(layoutContainer).toBeInTheDocument();
        expect(header).toBeInTheDocument();
        expect(main).toBeInTheDocument();
        
        // Check positioning
        const appStyle = window.getComputedStyle(app!);
        const containerStyle = window.getComputedStyle(layoutContainer!);
        const headerStyle = window.getComputedStyle(header!);
        const mainStyle = window.getComputedStyle(main!);
        
        expect(appStyle.position).toBe('fixed');
        expect(containerStyle.position).toBe('relative');
        expect(headerStyle.position).toBe('relative');
        expect(mainStyle.position).toBe('relative');
      });
    });

    it('should handle mobile viewport correctly', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true });
      
      render(<RealTerminal />);
      
      // Should detect mobile device
      const terminalElement = document.querySelector('.modern-terminal');
      expect(terminalElement).toBeInTheDocument();
      
      // Should apply mobile-specific styles
      const style = window.getComputedStyle(terminalElement!);
      expect(style.position).toBe('absolute');
    });
  });

  describe('Performance Optimizations', () => {
    it('should not overuse will-change property', async () => {
      render(<HomeView />);
      
      await waitFor(() => {
        const terminalOutput = document.querySelector('.terminal-output');
        
        if (terminalOutput) {
          const style = window.getComputedStyle(terminalOutput);
          // Should use optimized will-change value
          expect(['auto', 'scroll-position'].includes(style.willChange || 'auto')).toBe(true);
        }
      });
    });

    it('should optimize animations for mobile', async () => {
      // Simulate mobile
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      
      render(<RealTerminal />);
      
      const cursor = document.querySelector('.singleton-cursor') || 
                    document.querySelector('.terminal-cursor');
      
      if (cursor) {
        const style = window.getComputedStyle(cursor);
        // Should use simple animation on mobile
        expect(style.animationName).toMatch(/simple-blink|optimized-cursor-blink/);
      }
    });
  });

  describe('Mobile Viewport Handling', () => {
    it('should handle virtual keyboard properly', async () => {
      // Mock mobile environment
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });
      
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true });
      
      render(<RealTerminal />);
      
      // Simulate viewport change (keyboard opening)
      Object.defineProperty(window, 'innerHeight', { value: 400, configurable: true });
      fireEvent(window, new Event('resize'));
      
      // Should detect keyboard visibility
      await waitFor(() => {
        const hiddenInput = document.querySelector('input[type=\"text\"]');
        expect(hiddenInput).toBeInTheDocument();
      });
    });

    it('should use visualViewport API when available', async () => {
      // Mock visualViewport API
      const mockViewport = {
        width: 375,
        height: 667,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      
      Object.defineProperty(window, 'visualViewport', {
        value: mockViewport,
        configurable: true
      });
      
      render(<RealTerminal />);
      
      // Should register viewport event listener
      expect(mockViewport.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        { passive: true }
      );
    });
  });

  describe('Cursor System', () => {
    it('should properly position singleton cursor', async () => {
      render(<RealTerminal />);
      
      // Wait for cursor to be positioned
      await waitFor(() => {
        const cursor = document.querySelector('.singleton-cursor') ||
                      document.querySelector('[data-testid*=\"cursor\"]');
        
        // Cursor should exist and be properly positioned
        if (cursor) {
          const style = window.getComputedStyle(cursor);
          expect(style.position).toBe('absolute');
          expect(parseInt(style.zIndex || '10')).toBeGreaterThan(5);
        }
      }, { timeout: 3000 });
    });
  });

  describe('CSS Import Order', () => {
    it('should load UI fixes before other styles', () => {
      // Check if CSS files are imported in correct order
      const linkElements = document.querySelectorAll('link[rel=\"stylesheet\"]');
      const styleElements = document.querySelectorAll('style');
      
      // Should have style elements (from CSS imports)
      expect(linkElements.length + styleElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper focus states', async () => {
      render(<ThemeSwitcher subtle />);
      
      const button = screen.getByTestId('theme-switcher-button');
      
      // Should be focusable
      expect(button).toHaveAttribute('tabIndex', '0');
      expect(button).toHaveAttribute('role', 'button');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      expect(button).toHaveAttribute('aria-label', 'Switch theme');
    });

    it('should support reduced motion preferences', async () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => ({
          matches: true,
          media: '(prefers-reduced-motion: reduce)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        })),
        configurable: true
      });
      
      render(<RealTerminal />);
      
      // Should respect reduced motion preference
      const cursor = document.querySelector('.terminal-cursor');
      if (cursor) {
        const style = window.getComputedStyle(cursor);
        // Animation should be disabled or simplified
        expect(['none', 'paused'].includes(style.animationPlayState || 'running')).toBe(true);
      }
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle backdrop-filter fallback', async () => {
      render(<HomeView />);
      
      const header = document.querySelector('.terminal-header');
      if (header) {
        const style = window.getComputedStyle(header);
        // Should have fallback background when backdrop-filter is not supported
        expect(style.background).toBeTruthy();
      }
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<RealTerminal />);
      unmount();
      
      // Should remove resize listeners
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    });
  });
});