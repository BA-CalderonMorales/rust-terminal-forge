/**
 * 📐 Layout Validation Tests - Zero Overlap Guarantee
 * Tests the QuantumLayout engine for collision-free positioning
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuantumLayout, LayoutDimensions, LayoutConstraints } from '../src/engine/QuantumLayout';

// Mock DOM environment
Object.defineProperty(window, 'HTMLElement', {
  value: class MockHTMLElement {
    style: Record<string, string> = {};
    offsetWidth = 100;
    offsetHeight = 50;
  }
});

describe('QuantumLayout Engine', () => {
  let layout: QuantumLayout;
  let viewport: LayoutDimensions;
  let mockElement1: HTMLElement;
  let mockElement2: HTMLElement;
  let mockElement3: HTMLElement;

  beforeEach(() => {
    viewport = { width: 800, height: 600, x: 0, y: 0 };
    layout = new QuantumLayout(viewport);
    
    // Create mock elements
    mockElement1 = new (window as any).HTMLElement();
    mockElement2 = new (window as any).HTMLElement();
    mockElement3 = new (window as any).HTMLElement();
  });

  describe('Node Registration', () => {
    it('should register nodes successfully', () => {
      const constraints: LayoutConstraints = {
        minWidth: 100,
        minHeight: 50
      };

      const node = layout.registerNode('test1', mockElement1, constraints, 1);
      
      expect(node.id).toBe('test1');
      expect(node.element).toBe(mockElement1);
      expect(node.constraints).toEqual(constraints);
      expect(node.priority).toBe(1);
    });

    it('should create parent-child relationships', () => {
      layout.registerNode('parent', mockElement1, {}, 1);
      layout.registerNode('child', mockElement2, {}, 0);
      
      layout.attachChild('parent', 'child');
      
      const parentNode = layout['nodes'].get('parent');
      const childNode = layout['nodes'].get('child');
      
      expect(childNode?.parent).toBe(parentNode);
      expect(parentNode?.children).toContain(childNode);
    });
  });

  describe('Layout Calculations', () => {
    it('should calculate layout without overlaps', () => {
      // Register multiple elements
      layout.registerNode('element1', mockElement1, { minWidth: 100, minHeight: 50 }, 3);
      layout.registerNode('element2', mockElement2, { minWidth: 100, minHeight: 50 }, 2);
      layout.registerNode('element3', mockElement3, { minWidth: 100, minHeight: 50 }, 1);

      // Calculate layout
      layout.calculateLayout();

      // Get computed layouts
      const layout1 = layout.getNodeLayout('element1');
      const layout2 = layout.getNodeLayout('element2');
      const layout3 = layout.getNodeLayout('element3');

      expect(layout1).toBeTruthy();
      expect(layout2).toBeTruthy();
      expect(layout3).toBeTruthy();

      // Verify no overlaps
      expect(hasOverlap(layout1!, layout2!)).toBe(false);
      expect(hasOverlap(layout1!, layout3!)).toBe(false);
      expect(hasOverlap(layout2!, layout3!)).toBe(false);
    });

    it('should respect priority ordering', () => {
      // High priority element should get better placement
      layout.registerNode('high', mockElement1, { minWidth: 200, minHeight: 100 }, 10);
      layout.registerNode('low', mockElement2, { minWidth: 200, minHeight: 100 }, 1);

      layout.calculateLayout();

      const highLayout = layout.getNodeLayout('high');
      const lowLayout = layout.getNodeLayout('low');

      // Higher priority should be positioned first (likely at origin with margin)
      expect(highLayout!.x).toBeLessThanOrEqual(lowLayout!.x);
      expect(highLayout!.y).toBeLessThanOrEqual(lowLayout!.y);
    });

    it('should snap to quantum grid', () => {
      const baseUnit = 8; // QuantumLayout's baseUnit
      
      layout.registerNode('test', mockElement1, { minWidth: 127, minHeight: 63 }, 1);
      layout.calculateLayout();

      const computed = layout.getNodeLayout('test');
      
      // Dimensions should be snapped to quantum grid
      expect(computed!.width % baseUnit).toBe(0);
      expect(computed!.height % baseUnit).toBe(0);
    });

    it('should handle aspect ratio constraints', () => {
      const aspectRatio = 16 / 9;
      
      layout.registerNode('video', mockElement1, {
        minWidth: 320,
        maxWidth: 640,
        aspectRatio
      }, 1);

      layout.calculateLayout();

      const computed = layout.getNodeLayout('video');
      const actualRatio = computed!.width / computed!.height;
      
      // Allow for small rounding differences
      expect(Math.abs(actualRatio - aspectRatio)).toBeLessThan(0.1);
    });
  });

  describe('Collision Detection', () => {
    it('should detect and prevent overlaps', () => {
      // Create elements that would naturally overlap
      mockElement1.offsetWidth = 200;
      mockElement1.offsetHeight = 200;
      mockElement2.offsetWidth = 200;
      mockElement2.offsetHeight = 200;

      layout.registerNode('big1', mockElement1, {}, 1);
      layout.registerNode('big2', mockElement2, {}, 1);

      layout.calculateLayout();

      const layout1 = layout.getNodeLayout('big1');
      const layout2 = layout.getNodeLayout('big2');

      expect(hasOverlap(layout1!, layout2!)).toBe(false);
    });

    it('should handle edge cases near viewport boundaries', () => {
      // Element that might exceed viewport
      mockElement1.offsetWidth = 400;
      mockElement1.offsetHeight = 300;

      layout.registerNode('large', mockElement1, {}, 1);
      layout.calculateLayout();

      const computed = layout.getNodeLayout('large');
      
      // Should fit within viewport
      expect(computed!.x + computed!.width).toBeLessThanOrEqual(viewport.width);
      expect(computed!.y + computed!.height).toBeLessThanOrEqual(viewport.height);
    });
  });

  describe('Viewport Updates', () => {
    it('should recalculate layout on viewport changes', () => {
      layout.registerNode('test', mockElement1, { minWidth: 100, minHeight: 50 }, 1);
      layout.calculateLayout();

      const originalLayout = layout.getNodeLayout('test');

      // Update viewport
      const newViewport: LayoutDimensions = { width: 1200, height: 800, x: 0, y: 0 };
      layout.updateViewport(newViewport);

      const newLayout = layout.getNodeLayout('test');

      // Layout should be recalculated (positions might change)
      expect(newLayout).toBeTruthy();
      expect(newLayout!.width).toBeGreaterThan(0);
      expect(newLayout!.height).toBeGreaterThan(0);
    });
  });

  describe('Node Management', () => {
    it('should remove nodes and recalculate layout', () => {
      layout.registerNode('temp', mockElement1, {}, 1);
      layout.registerNode('permanent', mockElement2, {}, 1);

      layout.calculateLayout();
      expect(layout.getNodeLayout('temp')).toBeTruthy();

      layout.removeNode('temp');
      
      expect(layout.getNodeLayout('temp')).toBeNull();
      expect(layout.getNodeLayout('permanent')).toBeTruthy();
    });

    it('should clean up parent-child relationships on removal', () => {
      layout.registerNode('parent', mockElement1, {}, 1);
      layout.registerNode('child', mockElement2, {}, 0);
      layout.attachChild('parent', 'child');

      const parentNode = layout['nodes'].get('parent');
      expect(parentNode!.children).toHaveLength(1);

      layout.removeNode('child');
      
      expect(parentNode!.children).toHaveLength(0);
    });
  });

  describe('Debug Information', () => {
    it('should provide accurate debug information', () => {
      layout.registerNode('test1', mockElement1, {}, 1);
      layout.registerNode('test2', mockElement2, {}, 1);
      layout.calculateLayout();

      const debugInfo = layout.getDebugInfo();

      expect(debugInfo.nodes).toBe(2);
      expect(debugInfo.collisions).toBe(0); // No collisions in quantum layout!
      expect(debugInfo.efficiency).toBeGreaterThan(0);
      expect(debugInfo.efficiency).toBeLessThanOrEqual(100);
    });
  });

  describe('DOM Integration', () => {
    it('should apply computed styles to DOM elements', () => {
      layout.registerNode('styled', mockElement1, { minWidth: 200, minHeight: 100 }, 1);
      layout.calculateLayout();

      // Check that styles were applied
      expect(mockElement1.style.position).toBe('absolute');
      expect(mockElement1.style.left).toMatch(/^\d+px$/);
      expect(mockElement1.style.top).toMatch(/^\d+px$/);
      expect(mockElement1.style.width).toMatch(/^\d+px$/);
      expect(mockElement1.style.height).toMatch(/^\d+px$/);
      expect(mockElement1.style.zIndex).toBe('1');
    });
  });

  describe('Stress Testing', () => {
    it('should handle many elements without performance issues', () => {
      const startTime = performance.now();
      
      // Register many elements
      for (let i = 0; i < 50; i++) {
        const element = new (window as any).HTMLElement();
        element.offsetWidth = 50 + Math.random() * 50;
        element.offsetHeight = 30 + Math.random() * 30;
        
        layout.registerNode(`stress${i}`, element, {
          minWidth: 40,
          minHeight: 20
        }, Math.floor(Math.random() * 10));
      }

      layout.calculateLayout();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // 1 second

      // Verify no overlaps even with many elements
      const layouts = [];
      for (let i = 0; i < 50; i++) {
        const computed = layout.getNodeLayout(`stress${i}`);
        if (computed) layouts.push(computed);
      }

      // Check for overlaps
      for (let i = 0; i < layouts.length; i++) {
        for (let j = i + 1; j < layouts.length; j++) {
          expect(hasOverlap(layouts[i], layouts[j])).toBe(false);
        }
      }
    });
  });
});

/**
 * Helper function to detect overlaps between two layout dimensions
 */
function hasOverlap(layout1: LayoutDimensions, layout2: LayoutDimensions): boolean {
  return !(
    layout1.x + layout1.width <= layout2.x ||
    layout2.x + layout2.width <= layout1.x ||
    layout1.y + layout1.height <= layout2.y ||
    layout2.y + layout2.height <= layout1.y
  );
}

/**
 * Performance benchmark for layout calculations
 */
describe('Performance Benchmarks', () => {
  it('should meet performance targets', () => {
    const viewport: LayoutDimensions = { width: 1920, height: 1080, x: 0, y: 0 };
    const layout = new QuantumLayout(viewport);

    const startTime = performance.now();

    // Create realistic scenario
    for (let i = 0; i < 20; i++) {
      const element = new (window as any).HTMLElement();
      element.offsetWidth = 100 + Math.random() * 200;
      element.offsetHeight = 50 + Math.random() * 100;
      
      layout.registerNode(`perf${i}`, element, {
        minWidth: 80,
        minHeight: 40,
        maxWidth: 400,
        maxHeight: 200
      }, Math.floor(Math.random() * 5));
    }

    layout.calculateLayout();

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Performance targets
    expect(duration).toBeLessThan(100); // < 100ms for 20 elements
    
    const debugInfo = layout.getDebugInfo();
    expect(debugInfo.collisions).toBe(0); // Zero overlaps
    expect(debugInfo.efficiency).toBeGreaterThan(10); // Reasonable space usage
  });
});

/**
 * Integration tests with real-world scenarios
 */
describe('Real-World Integration', () => {
  it('should handle terminal layout scenario', () => {
    const viewport: LayoutDimensions = { width: 800, height: 600, x: 0, y: 0 };
    const layout = new QuantumLayout(viewport);

    // Create terminal-like elements
    const terminal = new (window as any).HTMLElement();
    const sidebar = new (window as any).HTMLElement();
    const statusBar = new (window as any).HTMLElement();
    const cursor = new (window as any).HTMLElement();

    terminal.offsetWidth = 600;
    terminal.offsetHeight = 500;
    sidebar.offsetWidth = 200;
    sidebar.offsetHeight = 500;
    statusBar.offsetWidth = 800;
    statusBar.offsetHeight = 50;
    cursor.offsetWidth = 10;
    cursor.offsetHeight = 20;

    // Register with appropriate priorities
    layout.registerNode('terminal', terminal, { minWidth: 400, minHeight: 300 }, 8);
    layout.registerNode('sidebar', sidebar, { minWidth: 150, maxWidth: 250 }, 6);
    layout.registerNode('statusBar', statusBar, { minWidth: 800, minHeight: 30, maxHeight: 50 }, 4);
    layout.registerNode('cursor', cursor, { minWidth: 8, minHeight: 16 }, 10);

    layout.calculateLayout();

    // All elements should be positioned
    expect(layout.getNodeLayout('terminal')).toBeTruthy();
    expect(layout.getNodeLayout('sidebar')).toBeTruthy();
    expect(layout.getNodeLayout('statusBar')).toBeTruthy();
    expect(layout.getNodeLayout('cursor')).toBeTruthy();

    // No overlaps
    const layouts = ['terminal', 'sidebar', 'statusBar', 'cursor']
      .map(id => layout.getNodeLayout(id)!)
      .filter(Boolean);

    for (let i = 0; i < layouts.length; i++) {
      for (let j = i + 1; j < layouts.length; j++) {
        expect(hasOverlap(layouts[i], layouts[j])).toBe(false);
      }
    }
  });
});