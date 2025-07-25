import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GestureHandler, hapticFeedback } from '../src/core/gestureNavigation';

// Import Touch from test setup
const Touch = (global as any).Touch;

describe('Gesture Navigation Unit Tests', () => {
  let element: HTMLDivElement;
  let onSwipeLeft: ReturnType<typeof vi.fn>;
  let onSwipeRight: ReturnType<typeof vi.fn>;
  let onTap: ReturnType<typeof vi.fn>;
  let onLongPress: ReturnType<typeof vi.fn>;
  let gestureHandler: GestureHandler;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    onSwipeLeft = vi.fn();
    onSwipeRight = vi.fn();
    onTap = vi.fn();
    onLongPress = vi.fn();
    
    gestureHandler = new GestureHandler(element, {
      onSwipeLeft,
      onSwipeRight,
      onTap,
      onLongPress
    });
  });

  afterEach(() => {
    gestureHandler.destroy();
    document.body.removeChild(element);
    vi.clearAllMocks();
  });

  describe('GestureHandler Core Functionality', () => {
    it('should initialize with correct default configuration', () => {
      expect(gestureHandler).toBeDefined();
    });

    it('should bind event listeners on creation', () => {
      const spy = vi.spyOn(element, 'addEventListener');
      const newGestureHandler = new GestureHandler(element, {});
      
      expect(spy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
      expect(spy).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: true });
      expect(spy).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true });
      expect(spy).toHaveBeenCalledWith('touchcancel', expect.any(Function), { passive: true });
      
      newGestureHandler.destroy();
    });

    it('should remove event listeners on destroy', () => {
      const spy = vi.spyOn(element, 'removeEventListener');
      gestureHandler.destroy();
      
      expect(spy).toHaveBeenCalledTimes(4); // touchstart, touchmove, touchend, touchcancel
    });

    it('should update callbacks', () => {
      const newOnSwipeLeft = vi.fn();
      gestureHandler.updateCallbacks({ onSwipeLeft: newOnSwipeLeft });
      
      // Simulate swipe left
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 200,
          clientY: 100
        })]
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 120,
          clientY: 105
        })]
      });

      element.dispatchEvent(touchStartEvent);
      
      // Simulate quick swipe
      setTimeout(() => {
        element.dispatchEvent(touchEndEvent);
        expect(newOnSwipeLeft).toHaveBeenCalled();
        expect(onSwipeLeft).not.toHaveBeenCalled();
      }, 100);
    });

    it('should update configuration', () => {
      gestureHandler.updateConfig({ minSwipeDistance: 100 });
      
      // Test with gesture that would pass old config but not new
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100
        })]
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 160, // 60px movement, would pass default 50px but not 100px
          clientY: 100
        })]
      });

      element.dispatchEvent(touchStartEvent);
      
      setTimeout(() => {
        element.dispatchEvent(touchEndEvent);
        expect(onSwipeRight).not.toHaveBeenCalled();
      }, 100);
    });
  });

  describe('Swipe Detection', () => {
    it('should detect left swipe gesture', (done) => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 200,
          clientY: 100
        })]
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 120, // 80px left movement
          clientY: 105  // Minimal vertical movement
        })]
      });

      element.dispatchEvent(touchStartEvent);

      setTimeout(() => {
        element.dispatchEvent(touchEndEvent);
        expect(onSwipeLeft).toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should detect right swipe gesture', (done) => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100
        })]
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 180, // 80px right movement
          clientY: 105
        })]
      });

      element.dispatchEvent(touchStartEvent);

      setTimeout(() => {
        element.dispatchEvent(touchEndEvent);
        expect(onSwipeRight).toHaveBeenCalled();
        expect(onSwipeLeft).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should ignore short distance swipes', (done) => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100
        })]
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 130, // Only 30px movement (below 50px threshold)
          clientY: 100
        })]
      });

      element.dispatchEvent(touchStartEvent);

      setTimeout(() => {
        element.dispatchEvent(touchEndEvent);
        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should ignore slow swipes', (done) => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100
        })]
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 180, // 80px movement
          clientY: 100
        })]
      });

      element.dispatchEvent(touchStartEvent);

      // Wait too long before ending (over 500ms)
      setTimeout(() => {
        element.dispatchEvent(touchEndEvent);
        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
        done();
      }, 600);
    });

    it('should ignore predominantly vertical movements', (done) => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100
        })]
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 160, // 60px horizontal
          clientY: 200  // 100px vertical (greater than horizontal)
        })]
      });

      element.dispatchEvent(touchStartEvent);

      setTimeout(() => {
        element.dispatchEvent(touchEndEvent);
        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should ignore multi-touch gestures', (done) => {
      const touch1 = new Touch({
        identifier: 0,
        target: element,
        clientX: 100,
        clientY: 100
      });

      const touch2 = new Touch({
        identifier: 1,
        target: element,
        clientX: 150,
        clientY: 100
      });

      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [touch1, touch2]
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [touch1]
      });

      element.dispatchEvent(touchStartEvent);

      setTimeout(() => {
        element.dispatchEvent(touchEndEvent);
        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('Tap Detection', () => {
    it('should detect tap gesture', (done) => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100
        })]
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 105, // Minimal movement
          clientY: 102
        })]
      });

      element.dispatchEvent(touchStartEvent);

      setTimeout(() => {
        element.dispatchEvent(touchEndEvent);
        expect(onTap).toHaveBeenCalled();
        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
        done();
      }, 50); // Quick tap
    });

    it('should not detect tap for long touches', (done) => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100
        })]
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 105,
          clientY: 102
        })]
      });

      element.dispatchEvent(touchStartEvent);

      setTimeout(() => {
        element.dispatchEvent(touchEndEvent);
        expect(onTap).not.toHaveBeenCalled();
        done();
      }, 400); // Too long for tap
    });
  });

  describe('Long Press Detection', () => {
    it('should detect long press gesture', (done) => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100
        })]
      });

      element.dispatchEvent(touchStartEvent);

      // Long press should trigger after 500ms
      setTimeout(() => {
        expect(onLongPress).toHaveBeenCalled();
        done();
      }, 600);
    });

    it('should cancel long press on movement', (done) => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100
        })]
      });

      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 130, // Move beyond tolerance
          clientY: 100
        })]
      });

      element.dispatchEvent(touchStartEvent);
      
      setTimeout(() => {
        element.dispatchEvent(touchMoveEvent);
      }, 100);

      setTimeout(() => {
        expect(onLongPress).not.toHaveBeenCalled();
        done();
      }, 600);
    });
  });

  describe('Touch Move Handling', () => {
    it('should handle touch move for scroll detection', () => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100
        })]
      });

      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 105,
          clientY: 150 // Significant vertical movement
        })]
      });

      element.dispatchEvent(touchStartEvent);
      element.dispatchEvent(touchMoveEvent);

      // Should not trigger gestures after vertical scroll detected
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 180,
          clientY: 150
        })]
      });

      setTimeout(() => {
        element.dispatchEvent(touchEndEvent);
        expect(onSwipeRight).not.toHaveBeenCalled();
      }, 100);
    });
  });

  describe('Touch Cancel Handling', () => {
    it('should handle touch cancel', () => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 0,
          target: element,
          clientX: 100,
          clientY: 100
        })]
      });

      element.dispatchEvent(touchStartEvent);
      element.dispatchEvent(new TouchEvent('touchcancel'));

      // Should not trigger long press after cancel
      setTimeout(() => {
        expect(onLongPress).not.toHaveBeenCalled();
      }, 600);
    });
  });
});

describe('Haptic Feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide light haptic feedback', () => {
    const mockVibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: mockVibrate,
      writable: true
    });

    // Mock mobile device
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      writable: true
    });

    hapticFeedback.light();
    expect(mockVibrate).toHaveBeenCalledWith(10);
  });

  it('should provide medium haptic feedback', () => {
    const mockVibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: mockVibrate,
      writable: true
    });

    hapticFeedback.medium();
    expect(mockVibrate).toHaveBeenCalledWith(50);
  });

  it('should provide heavy haptic feedback', () => {
    const mockVibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: mockVibrate,
      writable: true
    });

    hapticFeedback.heavy();
    expect(mockVibrate).toHaveBeenCalledWith(100);
  });

  it('should detect mobile device correctly', () => {
    // The setup.ts already mocks the navigator as mobile
    // We expect it to be true based on our global setup
    expect(hapticFeedback.isMobileDevice()).toBe(true);
  });

  it('should not vibrate on non-mobile devices', () => {
    const mockVibrate = vi.fn();
    
    // Temporarily override navigator to simulate desktop
    const originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      value: {
        ...originalNavigator,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
        vibrate: mockVibrate,
        maxTouchPoints: 0
      },
      writable: true,
      configurable: true
    });

    // Remove ontouchstart to simulate non-mobile
    const originalOntouchstart = (window as any).ontouchstart;
    delete (window as any).ontouchstart;

    hapticFeedback.light();
    expect(mockVibrate).not.toHaveBeenCalled();
    
    // Restore original values
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true
    });
    (window as any).ontouchstart = originalOntouchstart;
  });
});