/**
 * Gesture Navigation System
 * Provides touch gesture support for tab navigation with mobile-optimized UX
 */

export interface GestureCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
}

export interface GestureConfig {
  // Swipe detection thresholds
  minSwipeDistance: number;
  maxSwipeTime: number;
  minSwipeVelocity: number; // px/ms
  
  // Long press settings
  longPressTime: number;
  longPressTolerance: number; // Max movement allowed during long press
  
  // Tap settings
  maxTapTime: number;
  maxTapDistance: number;
}

const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  minSwipeDistance: 40, // Reduced for better mobile sensitivity
  maxSwipeTime: 600,    // Increased for more forgiving gestures
  minSwipeVelocity: 0.2, // Reduced for easier swipes
  longPressTime: 400,   // Reduced for quicker response
  longPressTolerance: 25, // Increased tolerance for touch variation
  maxTapTime: 350,      // Increased for better touch recognition
  maxTapDistance: 15    // Increased for touch accuracy
};

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  currentX?: number;
  currentY?: number;
  isTracking: boolean;
  touchId?: number;
  longPressTimer?: number;
}

export class GestureHandler {
  private element: HTMLElement;
  private callbacks: GestureCallbacks;
  private config: GestureConfig;
  private touchState: TouchState = {
    startX: 0,
    startY: 0,
    startTime: 0,
    isTracking: false
  };

  constructor(
    element: HTMLElement,
    callbacks: GestureCallbacks = {},
    config: Partial<GestureConfig> = {}
  ) {
    this.element = element;
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_GESTURE_CONFIG, ...config };
    
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: true });
  }

  private handleTouchStart(event: TouchEvent): void {
    // Only handle single finger touches
    if (event.touches.length !== 1) {
      this.resetTouchState();
      return;
    }

    const touch = event.touches[0];
    this.touchState = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      currentX: touch.clientX,
      currentY: touch.clientY,
      touchId: touch.identifier,
      isTracking: true
    };

    // Start long press timer
    this.touchState.longPressTimer = window.setTimeout(() => {
      if (this.touchState.isTracking && this.isWithinLongPressTolerance()) {
        this.callbacks.onLongPress?.();
        this.resetTouchState();
      }
    }, this.config.longPressTime);
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.touchState.isTracking) return;

    const touch = Array.from(event.touches).find(t => t.identifier === this.touchState.touchId);
    if (!touch) {
      this.resetTouchState();
      return;
    }

    this.touchState.currentX = touch.clientX;
    this.touchState.currentY = touch.clientY;

    // Cancel long press if moved too much
    const distance = this.getDistance();
    if (distance > this.config.longPressTolerance) {
      this.clearLongPressTimer();
    }

    // Check if vertical movement suggests scrolling
    const deltaY = Math.abs(touch.clientY - this.touchState.startY);
    const deltaX = Math.abs(touch.clientX - this.touchState.startX);
    
    if (deltaY > deltaX && deltaY > 30) {
      // This looks like a scroll gesture, stop tracking horizontal swipes
      this.touchState.isTracking = false;
      this.clearLongPressTimer();
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.touchState.isTracking) {
      this.resetTouchState();
      return;
    }

    const touch = Array.from(event.changedTouches).find(t => t.identifier === this.touchState.touchId);
    if (!touch) {
      this.resetTouchState();
      return;
    }

    const deltaX = touch.clientX - this.touchState.startX;
    const deltaY = touch.clientY - this.touchState.startY;
    const deltaTime = Date.now() - this.touchState.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    this.clearLongPressTimer();

    // Check for tap gesture
    if (this.isTap(distance, deltaTime)) {
      this.callbacks.onTap?.();
    } 
    // Check for swipe gesture
    else if (this.isValidSwipe(deltaX, deltaY, deltaTime, distance)) {
      if (deltaX > 0) {
        this.callbacks.onSwipeRight?.();
      } else {
        this.callbacks.onSwipeLeft?.();
      }
    }

    this.resetTouchState();
  }

  private handleTouchCancel(): void {
    this.resetTouchState();
  }

  private resetTouchState(): void {
    this.clearLongPressTimer();
    this.touchState = {
      startX: 0,
      startY: 0,
      startTime: 0,
      isTracking: false
    };
  }

  private clearLongPressTimer(): void {
    if (this.touchState.longPressTimer) {
      clearTimeout(this.touchState.longPressTimer);
      this.touchState.longPressTimer = undefined;
    }
  }

  private getDistance(): number {
    if (!this.touchState.currentX || !this.touchState.currentY) return 0;
    const deltaX = this.touchState.currentX - this.touchState.startX;
    const deltaY = this.touchState.currentY - this.touchState.startY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  private isWithinLongPressTolerance(): boolean {
    const distance = this.getDistance();
    return distance <= this.config.longPressTolerance;
  }

  private isTap(distance: number, deltaTime: number): boolean {
    return (
      distance <= this.config.maxTapDistance &&
      deltaTime <= this.config.maxTapTime
    );
  }

  private isValidSwipe(deltaX: number, deltaY: number, deltaTime: number, distance: number): boolean {
    const horizontalDistance = Math.abs(deltaX);
    const velocity = distance / deltaTime;

    return (
      // Must meet minimum distance and time requirements
      horizontalDistance >= this.config.minSwipeDistance &&
      deltaTime <= this.config.maxSwipeTime &&
      velocity >= this.config.minSwipeVelocity &&
      // Must be more horizontal than vertical
      Math.abs(deltaY) < horizontalDistance * 0.5
    );
  }

  public destroy(): void {
    this.clearLongPressTimer();
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
  }

  public updateCallbacks(callbacks: Partial<GestureCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public updateConfig(config: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Enhanced haptic feedback system with NvChad-inspired cyberpunk patterns
export const hapticFeedback = {
  light(): void {
    if ('vibrate' in navigator && this.isMobileDevice()) {
      navigator.vibrate(8); // Subtle neon touch
    }
  },

  medium(): void {
    if ('vibrate' in navigator && this.isMobileDevice()) {
      navigator.vibrate(25); // Button press feedback
    }
  },

  heavy(): void {
    if ('vibrate' in navigator && this.isMobileDevice()) {
      navigator.vibrate([40, 20, 40]); // Strong interaction feedback
    }
  },

  // New cyberpunk-themed haptic patterns
  success(): void {
    if ('vibrate' in navigator && this.isMobileDevice()) {
      navigator.vibrate([30, 15, 30, 15, 30]); // Success celebration pattern
    }
  },

  error(): void {
    if ('vibrate' in navigator && this.isMobileDevice()) {
      navigator.vibrate([100, 50, 100, 50, 100]); // Error warning pattern  
    }
  },

  cyberpunkPulse(): void {
    if ('vibrate' in navigator && this.isMobileDevice()) {
      navigator.vibrate([20, 10, 20, 10, 40]); // Pulsing neon effect
    }
  },

  matrixGlitch(): void {
    if ('vibrate' in navigator && this.isMobileDevice()) {
      navigator.vibrate([15, 5, 15, 5, 15, 5, 30]); // Digital glitch pattern
    }
  },

  synthwaveRipple(): void {
    if ('vibrate' in navigator && this.isMobileDevice()) {
      navigator.vibrate([25, 15, 35, 20, 45]); // Retro wave pattern
    }
  },

  terminalBoot(): void {
    if ('vibrate' in navigator && this.isMobileDevice()) {
      navigator.vibrate([50, 25, 50, 25, 100]); // Terminal startup sequence
    }
  },

  neonSwipe(): void {
    if ('vibrate' in navigator && this.isMobileDevice()) {
      navigator.vibrate([15, 10, 25, 10, 15]); // Tab switching effect
    }
  },

  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }
};