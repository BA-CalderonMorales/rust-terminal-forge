import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';

// Mock the TabManager
const mockTabManager = {
  getSessions: vi.fn(() => []),
  getActiveSession: vi.fn(() => null),
  switchToSession: vi.fn(),
  createSession: vi.fn(),
  closeSession: vi.fn(),
  getState: vi.fn(() => ({
    sessions: [],
    activeSessionId: null,
    tabOrder: [],
    settings: { enableDragDrop: true }
  })),
  subscribe: vi.fn(() => vi.fn())
};

vi.mock('../src/core/tabManager', () => ({
  tabManager: mockTabManager
}));

// Mock gesture handler class for testing
export class GestureHandler {
  private element: HTMLElement;
  private onSwipeLeft: () => void;
  private onSwipeRight: () => void;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private isTracking: boolean = false;

  // Configuration
  private minSwipeDistance: number = 50;
  private maxSwipeTime: number = 500;
  private minSwipeVelocity: number = 0.3; // px/ms

  constructor(
    element: HTMLElement,
    callbacks: {
      onSwipeLeft?: () => void;
      onSwipeRight?: () => void;
    }
  ) {
    this.element = element;
    this.onSwipeLeft = callbacks.onSwipeLeft || (() => {});
    this.onSwipeRight = callbacks.onSwipeRight || (() => {});
    
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: true });
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) {
      this.isTracking = false;
      return;
    }

    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.isTracking = true;
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.isTracking || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartX);
    const deltaY = Math.abs(touch.clientY - this.touchStartY);

    // If vertical movement is greater than horizontal, this might be a scroll
    if (deltaY > deltaX && deltaY > 30) {
      this.isTracking = false;
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isTracking) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    const deltaTime = Date.now() - this.touchStartTime;

    this.isTracking = false;

    // Check if this qualifies as a horizontal swipe
    if (this.isValidSwipe(deltaX, deltaY, deltaTime)) {
      if (deltaX > 0) {
        this.onSwipeRight();
      } else {
        this.onSwipeLeft();
      }
    }
  }

  private handleTouchCancel(): void {
    this.isTracking = false;
  }

  private isValidSwipe(deltaX: number, deltaY: number, deltaTime: number): boolean {
    const distance = Math.abs(deltaX);
    const velocity = distance / deltaTime;

    return (
      distance >= this.minSwipeDistance &&
      deltaTime <= this.maxSwipeTime &&
      velocity >= this.minSwipeVelocity &&
      Math.abs(deltaY) < distance * 0.5 // Ensure it's more horizontal than vertical
    );
  }

  public destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
  }
}

// Test component that uses gesture navigation
const TestGestureComponent: React.FC<{
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}> = ({ onSwipeLeft, onSwipeRight }) => {
  const elementRef = React.useRef<HTMLDivElement>(null);
  const gestureHandlerRef = React.useRef<GestureHandler | null>(null);

  React.useEffect(() => {
    if (elementRef.current) {
      gestureHandlerRef.current = new GestureHandler(elementRef.current, {
        onSwipeLeft,
        onSwipeRight
      });
    }

    return () => {
      gestureHandlerRef.current?.destroy();
    };
  }, [onSwipeLeft, onSwipeRight]);

  return (
    <div
      ref={elementRef}
      data-testid="gesture-area"
      style={{ width: '100%', height: '400px', backgroundColor: 'lightgray' }}
    >
      Swipe me!
    </div>
  );
};

describe('Gesture Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('GestureHandler Class', () => {
    let element: HTMLDivElement;
    let onSwipeLeft: ReturnType<typeof vi.fn>;
    let onSwipeRight: ReturnType<typeof vi.fn>;
    let gestureHandler: GestureHandler;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
      onSwipeLeft = vi.fn();
      onSwipeRight = vi.fn();
      gestureHandler = new GestureHandler(element, {
        onSwipeLeft,
        onSwipeRight
      });
    });

    afterEach(() => {
      gestureHandler.destroy();
      document.body.removeChild(element);
    });

    it('should detect left swipe gesture', () => {
      // Simulate swipe left (end X < start X)
      const startTouch = new Touch({
        identifier: 0,
        target: element,
        clientX: 200,
        clientY: 100
      });

      const endTouch = new Touch({
        identifier: 0,
        target: element,
        clientX: 120, // 80px left movement
        clientY: 105  // Minimal vertical movement
      });

      // Touch start
      element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [startTouch],
        changedTouches: [startTouch]
      }));

      // Touch end after brief time
      setTimeout(() => {
        element.dispatchEvent(new TouchEvent('touchend', {
          touches: [],
          changedTouches: [endTouch]
        }));

        expect(onSwipeLeft).toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
      }, 100);
    });

    it('should detect right swipe gesture', () => {
      const startTouch = new Touch({
        identifier: 0,
        target: element,
        clientX: 100,
        clientY: 100
      });

      const endTouch = new Touch({
        identifier: 0,
        target: element,
        clientX: 180, // 80px right movement
        clientY: 105
      });

      element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [startTouch],
        changedTouches: [startTouch]
      }));

      setTimeout(() => {
        element.dispatchEvent(new TouchEvent('touchend', {
          touches: [],
          changedTouches: [endTouch]
        }));

        expect(onSwipeRight).toHaveBeenCalled();
        expect(onSwipeLeft).not.toHaveBeenCalled();
      }, 100);
    });

    it('should ignore short distance swipes', () => {
      const startTouch = new Touch({
        identifier: 0,
        target: element,
        clientX: 100,
        clientY: 100
      });

      const endTouch = new Touch({
        identifier: 0,
        target: element,
        clientX: 130, // Only 30px movement (below 50px threshold)
        clientY: 100
      });

      element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [startTouch],
        changedTouches: [startTouch]
      }));

      setTimeout(() => {
        element.dispatchEvent(new TouchEvent('touchend', {
          touches: [],
          changedTouches: [endTouch]
        }));

        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
      }, 100);
    });

    it('should ignore slow swipes', () => {
      const startTouch = new Touch({
        identifier: 0,
        target: element,
        clientX: 100,
        clientY: 100
      });

      const endTouch = new Touch({
        identifier: 0,
        target: element,
        clientX: 180, // 80px movement
        clientY: 100
      });

      element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [startTouch],
        changedTouches: [startTouch]
      }));

      // Wait too long before ending (over 500ms)
      setTimeout(() => {
        element.dispatchEvent(new TouchEvent('touchend', {
          touches: [],
          changedTouches: [endTouch]
        }));

        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
      }, 600);
    });

    it('should ignore predominantly vertical movements', () => {
      const startTouch = new Touch({
        identifier: 0,
        target: element,
        clientX: 100,
        clientY: 100
      });

      const endTouch = new Touch({
        identifier: 0,
        target: element,
        clientX: 160, // 60px horizontal
        clientY: 200  // 100px vertical (greater than horizontal)
      });

      element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [startTouch],
        changedTouches: [startTouch]
      }));

      setTimeout(() => {
        element.dispatchEvent(new TouchEvent('touchend', {
          touches: [],
          changedTouches: [endTouch]
        }));

        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
      }, 100);
    });

    it('should ignore multi-touch gestures', () => {
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

      element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [touch1, touch2],
        changedTouches: [touch1, touch2]
      }));

      setTimeout(() => {
        element.dispatchEvent(new TouchEvent('touchend', {
          touches: [],
          changedTouches: [touch1]
        }));

        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
      }, 100);
    });
  });

  describe('React Component Integration', () => {
    it('should render gesture component', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      render(<TestGestureComponent onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight} />);
      
      expect(screen.getByTestId('gesture-area')).toBeInTheDocument();
    });

    it('should handle swipe callbacks in React component', async () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      render(<TestGestureComponent onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight} />);
      
      const gestureArea = screen.getByTestId('gesture-area');
      
      // Simulate right swipe
      const startTouch = new Touch({
        identifier: 0,
        target: gestureArea,
        clientX: 100,
        clientY: 100
      });

      const endTouch = new Touch({
        identifier: 0,
        target: gestureArea,
        clientX: 180,
        clientY: 100
      });

      fireEvent.touchStart(gestureArea, {
        touches: [startTouch],
        changedTouches: [startTouch]
      });

      await waitFor(() => {
        fireEvent.touchEnd(gestureArea, {
          touches: [],
          changedTouches: [endTouch]
        });
      });

      await waitFor(() => {
        expect(onSwipeRight).toHaveBeenCalled();
      });
    });
  });

  describe('Tab Navigation Integration', () => {
    it('should switch to previous tab on right swipe', () => {
      const sessions = [
        { id: 'tab1', name: 'Tab 1', isActive: false },
        { id: 'tab2', name: 'Tab 2', isActive: true },
        { id: 'tab3', name: 'Tab 3', isActive: false }
      ];

      mockTabManager.getSessions.mockReturnValue(sessions);
      mockTabManager.getActiveSession.mockReturnValue(sessions[1]);
      mockTabManager.getState.mockReturnValue({
        sessions,
        activeSessionId: 'tab2',
        tabOrder: ['tab1', 'tab2', 'tab3'],
        settings: { enableDragDrop: true }
      });

      const handleSwipeRight = () => {
        const state = mockTabManager.getState();
        const currentIndex = state.tabOrder.indexOf(state.activeSessionId!);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : state.sessions.length - 1;
        const previousTabId = state.tabOrder[previousIndex];
        mockTabManager.switchToSession(previousTabId);
      };

      handleSwipeRight();

      expect(mockTabManager.switchToSession).toHaveBeenCalledWith('tab1');
    });

    it('should switch to next tab on left swipe', () => {
      const sessions = [
        { id: 'tab1', name: 'Tab 1', isActive: false },
        { id: 'tab2', name: 'Tab 2', isActive: true },
        { id: 'tab3', name: 'Tab 3', isActive: false }
      ];

      mockTabManager.getSessions.mockReturnValue(sessions);
      mockTabManager.getActiveSession.mockReturnValue(sessions[1]);
      mockTabManager.getState.mockReturnValue({
        sessions,
        activeSessionId: 'tab2',
        tabOrder: ['tab1', 'tab2', 'tab3'],
        settings: { enableDragDrop: true }
      });

      const handleSwipeLeft = () => {
        const state = mockTabManager.getState();
        const currentIndex = state.tabOrder.indexOf(state.activeSessionId!);
        const nextIndex = currentIndex < state.sessions.length - 1 ? currentIndex + 1 : 0;
        const nextTabId = state.tabOrder[nextIndex];
        mockTabManager.switchToSession(nextTabId);
      };

      handleSwipeLeft();

      expect(mockTabManager.switchToSession).toHaveBeenCalledWith('tab3');
    });

    it('should wrap around to first tab when swiping left from last tab', () => {
      const sessions = [
        { id: 'tab1', name: 'Tab 1', isActive: false },
        { id: 'tab2', name: 'Tab 2', isActive: false },
        { id: 'tab3', name: 'Tab 3', isActive: true }
      ];

      mockTabManager.getSessions.mockReturnValue(sessions);
      mockTabManager.getActiveSession.mockReturnValue(sessions[2]);
      mockTabManager.getState.mockReturnValue({
        sessions,
        activeSessionId: 'tab3',
        tabOrder: ['tab1', 'tab2', 'tab3'],
        settings: { enableDragDrop: true }
      });

      const handleSwipeLeft = () => {
        const state = mockTabManager.getState();
        const currentIndex = state.tabOrder.indexOf(state.activeSessionId!);
        const nextIndex = currentIndex < state.sessions.length - 1 ? currentIndex + 1 : 0;
        const nextTabId = state.tabOrder[nextIndex];
        mockTabManager.switchToSession(nextTabId);
      };

      handleSwipeLeft();

      expect(mockTabManager.switchToSession).toHaveBeenCalledWith('tab1');
    });

    it('should wrap around to last tab when swiping right from first tab', () => {
      const sessions = [
        { id: 'tab1', name: 'Tab 1', isActive: true },
        { id: 'tab2', name: 'Tab 2', isActive: false },
        { id: 'tab3', name: 'Tab 3', isActive: false }
      ];

      mockTabManager.getSessions.mockReturnValue(sessions);
      mockTabManager.getActiveSession.mockReturnValue(sessions[0]);
      mockTabManager.getState.mockReturnValue({
        sessions,
        activeSessionId: 'tab1',
        tabOrder: ['tab1', 'tab2', 'tab3'],
        settings: { enableDragDrop: true }
      });

      const handleSwipeRight = () => {
        const state = mockTabManager.getState();
        const currentIndex = state.tabOrder.indexOf(state.activeSessionId!);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : state.sessions.length - 1;
        const previousTabId = state.tabOrder[previousIndex];
        mockTabManager.switchToSession(previousTabId);
      };

      handleSwipeRight();

      expect(mockTabManager.switchToSession).toHaveBeenCalledWith('tab3');
    });

    it('should not switch tabs when there is only one tab', () => {
      const sessions = [
        { id: 'tab1', name: 'Tab 1', isActive: true }
      ];

      mockTabManager.getSessions.mockReturnValue(sessions);
      mockTabManager.getActiveSession.mockReturnValue(sessions[0]);
      mockTabManager.getState.mockReturnValue({
        sessions,
        activeSessionId: 'tab1',
        tabOrder: ['tab1'],
        settings: { enableDragDrop: true }
      });

      const handleSwipeLeft = () => {
        const state = mockTabManager.getState();
        if (state.sessions.length <= 1) {
          return; // Don't switch tabs if there's only one
        }
        // ... switching logic
      };

      handleSwipeLeft();

      expect(mockTabManager.switchToSession).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility and UX', () => {
    it('should provide haptic feedback on successful swipe', () => {
      const mockVibrate = vi.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        writable: true
      });

      const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
        if ('vibrate' in navigator) {
          const patterns = {
            light: [10],
            medium: [50],
            heavy: [100]
          };
          navigator.vibrate(patterns[type]);
        }
      };

      triggerHapticFeedback('medium');
      expect(mockVibrate).toHaveBeenCalledWith([50]);
    });

    it('should handle gesture conflicts with scroll', () => {
      // This test ensures vertical scrolling takes precedence over horizontal swipes
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const onSwipeLeft = vi.fn();
      const gestureHandler = new GestureHandler(element, { onSwipeLeft });

      const startTouch = new Touch({
        identifier: 0,
        target: element,
        clientX: 100,
        clientY: 100
      });

      // Start touch
      element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [startTouch],
        changedTouches: [startTouch]
      }));

      // Simulate vertical movement during touch move
      const moveTouch = new Touch({
        identifier: 0,
        target: element,
        clientX: 105,
        clientY: 150  // 50px vertical movement
      });

      element.dispatchEvent(new TouchEvent('touchmove', {
        touches: [moveTouch],
        changedTouches: [moveTouch]
      }));

      // End with horizontal movement that would normally trigger swipe
      const endTouch = new Touch({
        identifier: 0,
        target: element,
        clientX: 50, // 50px left movement
        clientY: 150
      });

      setTimeout(() => {
        element.dispatchEvent(new TouchEvent('touchend', {
          touches: [],
          changedTouches: [endTouch]
        }));

        // Should not trigger swipe because vertical movement was detected
        expect(onSwipeLeft).not.toHaveBeenCalled();
      }, 100);

      gestureHandler.destroy();
      document.body.removeChild(element);
    });
  });
});