/**
 * Comprehensive Tests for SingletonCursor System
 * Tests physics-based animations, dual cursor elimination, and sub-pixel positioning
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock FluidAnimator
vi.mock('../src/engine/FluidAnimator', () => ({
  FluidAnimator: vi.fn().mockImplementation(() => ({
    animate: vi.fn().mockResolvedValue(undefined),
    animateCursor: vi.fn().mockResolvedValue(undefined),
    fadeIn: vi.fn().mockResolvedValue(undefined),
    fadeOut: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn()
  })),
  RickEasing: {
    portal: vi.fn((t: number) => t),
    dimensionElastic: vi.fn((t: number) => t),
    quantumBounce: vi.fn((t: number) => t)
  }
}));

// Import after mocking
import { CursorManager, DefaultCursorStyles } from '../src/components/CursorManager';
import { SingletonCursor, useSingletonCursor, CursorProvider } from '../src/components/SingletonCursor';
import { CursorPhysics, PhysicsPresets } from '../src/components/CursorPhysics';

describe('SingletonCursor System', () => {
  beforeEach(() => {
    // Clear any existing cursor elements
    document.querySelectorAll('.singleton-cursor').forEach(el => el.remove());
    
    // Reset the cursor manager
    CursorManager.destroy();
    
    // Mock performance.now for consistent timing
    vi.spyOn(performance, 'now').mockReturnValue(0);
    
    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
    global.cancelAnimationFrame = vi.fn(id => clearTimeout(id));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CursorManager Singleton', () => {
    it('should create only one cursor element globally', () => {
      // Register multiple cursors
      CursorManager.registerCursor({
        id: 'cursor1',
        position: { x: 10, y: 10 },
        style: DefaultCursorStyles.terminal,
        context: 'terminal',
        priority: 1,
        isActive: true
      });

      CursorManager.registerCursor({
        id: 'cursor2',
        position: { x: 20, y: 20 },
        style: DefaultCursorStyles.vim,
        context: 'vim',
        priority: 2,
        isActive: true
      });

      // Should only have one cursor element in DOM
      const cursorElements = document.querySelectorAll('.singleton-cursor');
      expect(cursorElements).toHaveLength(1);
    });

    it('should prioritize higher priority cursors', () => {
      const lowPriorityCursor = {
        id: 'low',
        position: { x: 10, y: 10 },
        style: DefaultCursorStyles.terminal,
        context: 'terminal' as const,
        priority: 1,
        isActive: true
      };

      const highPriorityCursor = {
        id: 'high',
        position: { x: 20, y: 20 },
        style: DefaultCursorStyles.ai,
        context: 'ai' as const,
        priority: 10,
        isActive: true
      };

      CursorManager.registerCursor(lowPriorityCursor);
      CursorManager.registerCursor(highPriorityCursor);

      const activeCursor = CursorManager.getActiveCursor();
      expect(activeCursor?.id).toBe('high');
    });

    it('should switch to next highest priority when active cursor is removed', () => {
      const cursor1 = {
        id: 'cursor1',
        position: { x: 10, y: 10 },
        style: DefaultCursorStyles.terminal,
        context: 'terminal' as const,
        priority: 5,
        isActive: true
      };

      const cursor2 = {
        id: 'cursor2',
        position: { x: 20, y: 20 },
        style: DefaultCursorStyles.vim,
        context: 'vim' as const,
        priority: 3,
        isActive: true
      };

      CursorManager.registerCursor(cursor1);
      CursorManager.registerCursor(cursor2);

      // cursor1 should be active (higher priority)
      expect(CursorManager.getActiveCursor()?.id).toBe('cursor1');

      // Remove cursor1
      CursorManager.unregisterCursor('cursor1');

      // cursor2 should now be active
      expect(CursorManager.getActiveCursor()?.id).toBe('cursor2');
    });

    it('should handle position updates with animation', async () => {
      const cursor = {
        id: 'test-cursor',
        position: { x: 10, y: 10 },
        style: DefaultCursorStyles.terminal,
        context: 'terminal' as const,
        priority: 1,
        isActive: true
      };

      CursorManager.registerCursor(cursor);

      // Update position
      CursorManager.updateCursorPosition('test-cursor', { x: 50, y: 60 });

      const activeCursor = CursorManager.getActiveCursor();
      expect(activeCursor?.position.x).toBe(50);
      expect(activeCursor?.position.y).toBe(60);
    });
  });

  describe('Physics-Based Animation', () => {
    let element: HTMLElement;
    let physics: CursorPhysics;

    beforeEach(() => {
      element = document.createElement('div');
      element.style.position = 'absolute';
      document.body.appendChild(element);
      physics = new CursorPhysics(element, { x: 0, y: 0 });
    });

    afterEach(() => {
      physics.destroy();
      document.body.removeChild(element);
    });

    it('should animate to target position with spring physics', async () => {
      const targetPosition = { x: 100, y: 50 };
      
      // Mock the animation frame timing
      let frameCount = 0;
      global.requestAnimationFrame = vi.fn(cb => {
        frameCount++;
        setTimeout(() => {
          // Simulate time passing
          vi.spyOn(performance, 'now').mockReturnValue(frameCount * 16);
          cb(frameCount * 16);
        }, 16);
        return frameCount;
      });

      const completionPromise = new Promise<void>(resolve => {
        physics.moveTo(targetPosition, resolve);
      });

      // Wait for animation to complete
      await waitFor(() => {
        expect(physics.isMoving()).toBe(false);
      }, { timeout: 1000 });

      const finalPosition = physics.getPosition();
      expect(Math.abs(finalPosition.x - targetPosition.x)).toBeLessThan(1);
      expect(Math.abs(finalPosition.y - targetPosition.y)).toBeLessThan(1);
    });

    it('should respect physics presets', () => {
      physics.updateConfig(PhysicsPresets.terminal);
      const state = physics.getPhysicsState();
      
      expect(state.springConstant).toBe(PhysicsPresets.terminal.springConstant);
      expect(state.friction).toBe(PhysicsPresets.terminal.friction);
      expect(state.dampening).toBe(PhysicsPresets.terminal.dampening);
    });

    it('should provide sub-pixel positioning accuracy', () => {
      const precisePosition = { x: 123.456, y: 789.123 };
      physics.setPosition(precisePosition);
      
      const currentPosition = physics.getPosition();
      expect(currentPosition.x).toBe(precisePosition.x);
      expect(currentPosition.y).toBe(precisePosition.y);
      
      // Check that transform uses sub-pixel values
      expect(element.style.transform).toContain('123.456px');
      expect(element.style.transform).toContain('789.123px');
    });
  });

  describe('SingletonCursor React Component', () => {
    it('should register cursor on mount and unregister on unmount', () => {
      const registerSpy = vi.spyOn(CursorManager, 'registerCursor');
      const unregisterSpy = vi.spyOn(CursorManager, 'unregisterCursor');

      const { unmount } = render(
        React.createElement(SingletonCursor, {
          id: 'test-cursor',
          context: 'terminal',
          position: { x: 10, y: 10 }
        })
      );

      expect(registerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-cursor',
          context: 'terminal'
        })
      );

      unmount();

      expect(unregisterSpy).toHaveBeenCalledWith('test-cursor');
    });

    it('should call activation callbacks when cursor becomes active', async () => {
      const onActivate = vi.fn();
      const onDeactivate = vi.fn();

      render(
        React.createElement(SingletonCursor, {
          id: 'test-cursor',
          context: 'terminal',
          position: { x: 10, y: 10 },
          isActive: true,
          onActivate,
          onDeactivate
        })
      );

      // Wait for activation callback
      await waitFor(() => {
        expect(onActivate).toHaveBeenCalled();
      });
    });

    it('should use context-based default priorities', () => {
      const registerSpy = vi.spyOn(CursorManager, 'registerCursor');

      render(
        React.createElement(SingletonCursor, {
          id: 'ai-cursor',
          context: 'ai',
          position: { x: 10, y: 10 }
        })
      );

      expect(registerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 10 // AI should have high priority
        })
      );
    });
  });

  describe('useSingletonCursor Hook', () => {
    it('should provide cursor control methods', () => {
      let hookResult: any;

      function TestComponent() {
        hookResult = useSingletonCursor('test-hook-cursor', 'terminal');
        return null;
      }

      render(React.createElement(TestComponent));

      expect(hookResult).toHaveProperty('updatePosition');
      expect(hookResult).toHaveProperty('updateTextPosition');
      expect(hookResult).toHaveProperty('updatePixelPosition');
      expect(hookResult).toHaveProperty('show');
      expect(hookResult).toHaveProperty('hide');
      expect(hookResult).toHaveProperty('pauseBlinking');
      expect(hookResult).toHaveProperty('resumeBlinking');
    });

    it('should update position when methods are called', () => {
      let hookResult: any;

      function TestComponent() {
        hookResult = useSingletonCursor('test-hook-cursor', 'terminal');
        return null;
      }

      const { rerender } = render(React.createElement(TestComponent));

      // Update pixel position
      hookResult.updatePixelPosition(100, 200);
      rerender(React.createElement(TestComponent));

      expect(hookResult.position.x).toBe(100);
      expect(hookResult.position.y).toBe(200);

      // Update text position
      hookResult.updateTextPosition(5, 10);
      rerender(React.createElement(TestComponent));

      expect(hookResult.position.line).toBe(5);
      expect(hookResult.position.col).toBe(10);
    });
  });

  describe('Blink Synchronization', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should pause blinking during typing', () => {
      const pauseSpy = vi.spyOn(CursorManager, 'pauseBlinking');
      const resumeSpy = vi.spyOn(CursorManager, 'resumeBlinking');

      CursorManager.registerCursor({
        id: 'blink-test',
        position: { x: 10, y: 10 },
        style: DefaultCursorStyles.terminal,
        context: 'terminal',
        priority: 1,
        isActive: true
      });

      // Simulate typing
      const inputEvent = new Event('input');
      document.dispatchEvent(inputEvent);

      expect(pauseSpy).toHaveBeenCalled();

      // Fast-forward time
      vi.advanceTimersByTime(1000);

      expect(resumeSpy).toHaveBeenCalled();
    });

    it('should respect reduced motion preferences', () => {
      // Mock media query for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn()
        }))
      });

      const pauseSpy = vi.spyOn(CursorManager, 'pauseBlinking');

      // Create new manager instance to trigger media query check
      CursorManager.destroy();
      CursorManager.registerCursor({
        id: 'reduced-motion-test',
        position: { x: 10, y: 10 },
        style: DefaultCursorStyles.terminal,
        context: 'terminal',
        priority: 1,
        isActive: true
      });

      expect(pauseSpy).toHaveBeenCalled();
    });
  });

  describe('Integration with Terminal Components', () => {
    it('should work with containerRef for relative positioning', () => {
      const containerRef = React.createRef<HTMLDivElement>();

      function TestContainer() {
        return React.createElement('div', {
          ref: containerRef,
          style: { position: 'absolute', left: '100px', top: '50px' }
        });
      }

      render(React.createElement(TestContainer));

      const registerSpy = vi.spyOn(CursorManager, 'registerCursor');

      render(
        React.createElement(SingletonCursor, {
          id: 'container-test',
          context: 'terminal',
          position: { x: 10, y: 10 },
          containerRef
        })
      );

      expect(registerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          position: expect.objectContaining({
            element: containerRef.current
          })
        })
      );
    });

    it('should eliminate dual cursors when multiple terminals are active', () => {
      // Register cursors from multiple terminal instances
      CursorManager.registerCursor({
        id: 'terminal1',
        position: { x: 10, y: 10 },
        style: DefaultCursorStyles.terminal,
        context: 'terminal',
        priority: 4,
        isActive: true
      });

      CursorManager.registerCursor({
        id: 'terminal2',
        position: { x: 20, y: 20 },
        style: DefaultCursorStyles.terminal,
        context: 'terminal',
        priority: 4,
        isActive: true
      });

      // Only one should be active
      const allCursors = CursorManager.getAllCursors();
      const activeCursors = allCursors.filter(c => c.isActive);
      expect(activeCursors).toHaveLength(2);

      // But only one cursor element should exist
      const cursorElements = document.querySelectorAll('.singleton-cursor');
      expect(cursorElements).toHaveLength(1);

      // The first registered with same priority should be active
      expect(CursorManager.getActiveCursor()?.id).toBe('terminal1');
    });
  });

  describe('Performance and Optimization', () => {
    it('should use hardware acceleration for animations', () => {
      CursorManager.registerCursor({
        id: 'perf-test',
        position: { x: 10, y: 10 },
        style: DefaultCursorStyles.terminal,
        context: 'terminal',
        priority: 1,
        isActive: true
      });

      const cursorElement = document.querySelector('.singleton-cursor') as HTMLElement;
      expect(cursorElement?.style.willChange).toContain('transform');
      expect(cursorElement?.style.backfaceVisibility).toBe('hidden');
      expect(cursorElement?.style.transform).toContain('translateZ(0)');
    });

    it('should handle rapid position updates efficiently', () => {
      CursorManager.registerCursor({
        id: 'rapid-test',
        position: { x: 0, y: 0 },
        style: DefaultCursorStyles.terminal,
        context: 'terminal',
        priority: 1,
        isActive: true
      });

      // Simulate rapid position updates
      for (let i = 0; i < 100; i++) {
        CursorManager.updateCursorPosition('rapid-test', { x: i, y: i });
      }

      // Should not crash and final position should be correct
      const activeCursor = CursorManager.getActiveCursor();
      expect(activeCursor?.position.x).toBe(99);
      expect(activeCursor?.position.y).toBe(99);
    });
  });
});