/**
 * SingletonCursor Manager - Centralized cursor management system
 * Eliminates dual cursor chaos with physics-based animations
 */

import { FluidAnimator, RickEasing, Vector2D } from '../engine/FluidAnimator';

export interface CursorPosition {
  x: number;
  y: number;
  element?: HTMLElement;
  line?: number;
  col?: number;
}

export interface CursorStyle {
  width: number;
  height: number;
  backgroundColor: string;
  borderRadius: number;
  mode: 'line' | 'block' | 'underline' | 'dot';
  opacity: number;
  boxShadow?: string;
  blinkSpeed: number;
}

export interface CursorConfig {
  id: string;
  position: CursorPosition;
  style: CursorStyle;
  context: string; // 'terminal', 'vim', 'code', 'ai'
  priority: number; // Higher priority cursors override lower priority ones
  isActive: boolean;
}

/**
 * Physics-based cursor animation states
 */
export interface CursorPhysics {
  velocity: Vector2D;
  acceleration: Vector2D;
  friction: number;
  mass: number;
  springConstant: number;
  dampening: number;
}

/**
 * Singleton Cursor Manager - Only one cursor exists across the entire application
 */
class CursorManagerSingleton {
  private static instance: CursorManagerSingleton;
  private animator: FluidAnimator;
  private activeCursor: CursorConfig | null = null;
  private cursorQueue: Map<string, CursorConfig> = new Map();
  private domElement: HTMLElement | null = null;
  private isBlinking: boolean = true;
  private blinkTimer: number | null = null;
  private lastPosition: CursorPosition = { x: 0, y: 0 };
  private physics: CursorPhysics = {
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    friction: 0.8,
    mass: 1,
    springConstant: 200,
    dampening: 0.7
  };

  private constructor() {
    this.animator = new FluidAnimator();
    this.createCursorElement();
    this.startBlinkCycle();
    this.bindGlobalListeners();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): CursorManagerSingleton {
    if (!CursorManagerSingleton.instance) {
      CursorManagerSingleton.instance = new CursorManagerSingleton();
    }
    return CursorManagerSingleton.instance;
  }

  /**
   * Create the DOM element for the singleton cursor
   */
  private createCursorElement(): void {
    this.domElement = document.createElement('div');
    this.domElement.className = 'singleton-cursor';
    this.domElement.setAttribute('data-testid', 'singleton-cursor');
    this.domElement.setAttribute('aria-hidden', 'true');
    this.domElement.setAttribute('role', 'presentation');
    
    // Base styles
    Object.assign(this.domElement.style, {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: '9999',
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden',
      transform: 'translateZ(0)', // Hardware acceleration
      transition: 'none', // We handle animations manually
      userSelect: 'none',
      WebkitUserSelect: 'none'
    });

    // Append to body
    document.body.appendChild(this.domElement);
  }

  /**
   * Register a cursor with the manager
   */
  public registerCursor(config: CursorConfig): void {
    this.cursorQueue.set(config.id, config);
    this.updateActiveCursor();
  }

  /**
   * Unregister a cursor from the manager
   */
  public unregisterCursor(id: string): void {
    this.cursorQueue.delete(id);
    
    // If the active cursor was removed, update to next highest priority
    if (this.activeCursor?.id === id) {
      this.activeCursor = null;
      this.updateActiveCursor();
    }
  }

  /**
   * Update cursor position with physics-based animation
   */
  public updateCursorPosition(id: string, newPosition: CursorPosition): void {
    const cursor = this.cursorQueue.get(id);
    if (!cursor) return;

    cursor.position = newPosition;
    
    // If this is the active cursor, animate to new position
    if (this.activeCursor?.id === id) {
      this.animateToPosition(newPosition);
    }
  }

  /**
   * Update cursor style dynamically
   */
  public updateCursorStyle(id: string, newStyle: Partial<CursorStyle>): void {
    const cursor = this.cursorQueue.get(id);
    if (!cursor) return;

    cursor.style = { ...cursor.style, ...newStyle };
    
    // If this is the active cursor, apply styles immediately
    if (this.activeCursor?.id === id) {
      this.applyCursorStyle(cursor.style);
    }
  }

  /**
   * Set cursor active state
   */
  public setCursorActive(id: string, isActive: boolean): void {
    const cursor = this.cursorQueue.get(id);
    if (!cursor) return;

    cursor.isActive = isActive;
    this.updateActiveCursor();
  }

  /**
   * Update the active cursor based on priority and active state
   */
  private updateActiveCursor(): void {
    // Find the highest priority active cursor
    let newActiveCursor: CursorConfig | null = null;
    let highestPriority = -1;

    for (const cursor of this.cursorQueue.values()) {
      if (cursor.isActive && cursor.priority > highestPriority) {
        newActiveCursor = cursor;
        highestPriority = cursor.priority;
      }
    }

    // If the active cursor changed, switch to the new one
    if (newActiveCursor?.id !== this.activeCursor?.id) {
      this.switchActiveCursor(newActiveCursor);
    }
  }

  /**
   * Switch to a new active cursor with smooth animation
   */
  private switchActiveCursor(newCursor: CursorConfig | null): void {
    const previousCursor = this.activeCursor;
    this.activeCursor = newCursor;

    if (!this.domElement) return;

    if (!newCursor) {
      // No active cursor - hide the element
      this.animator.fadeOut('cursor-fade', this.domElement, 150);
      return;
    }

    // If switching from one cursor to another, animate the transition
    if (previousCursor && newCursor.position) {
      this.animateTransition(previousCursor.position, newCursor.position, newCursor.style);
    } else {
      // First cursor or direct switch - immediate application
      this.applyCursorStyle(newCursor.style);
      this.setPosition(newCursor.position);
      this.animator.fadeIn('cursor-fade', this.domElement, 150);
    }

    // Update blink speed if needed
    if (newCursor.style.blinkSpeed !== this.getBlinkSpeed()) {
      this.updateBlinkSpeed(newCursor.style.blinkSpeed);
    }
  }

  /**
   * Animate transition between cursors with physics
   */
  private animateTransition(fromPos: CursorPosition, toPos: CursorPosition, newStyle: CursorStyle): void {
    if (!this.domElement) return;

    // First, morph the style
    this.morphCursorStyle(newStyle, 200);

    // Then animate position with physics
    this.animateToPosition(toPos, 250);
  }

  /**
   * Morph cursor style smoothly
   */
  private morphCursorStyle(targetStyle: CursorStyle, duration: number = 200): void {
    if (!this.domElement) return;

    const currentStyle = window.getComputedStyle(this.domElement);
    
    // Get current values
    const fromWidth = parseFloat(currentStyle.width) || targetStyle.width;
    const fromHeight = parseFloat(currentStyle.height) || targetStyle.height;
    const fromOpacity = parseFloat(currentStyle.opacity) || targetStyle.opacity;

    // Animate style properties
    this.animator.animate(
      'cursor-style-morph',
      this.domElement,
      {
        width: fromWidth,
        height: fromHeight,
        opacity: fromOpacity
      },
      {
        width: targetStyle.width,
        height: targetStyle.height,
        opacity: targetStyle.opacity
      },
      {
        duration,
        easing: RickEasing.dimensionElastic
      }
    );

    // Apply non-animated style properties immediately
    Object.assign(this.domElement.style, {
      backgroundColor: targetStyle.backgroundColor,
      borderRadius: `${targetStyle.borderRadius}px`,
      boxShadow: targetStyle.boxShadow || 'none'
    });
  }

  /**
   * Animate cursor to new position with physics-based movement
   */
  private animateToPosition(targetPos: CursorPosition, duration: number = 150): void {
    if (!this.domElement || !targetPos) return;

    const currentRect = this.domElement.getBoundingClientRect();
    const fromPos: Vector2D = { x: currentRect.left, y: currentRect.top };
    const toPos: Vector2D = this.calculateAbsolutePosition(targetPos);

    // Calculate distance for dynamic duration
    const distance = Math.sqrt(
      Math.pow(toPos.x - fromPos.x, 2) + Math.pow(toPos.y - fromPos.y, 2)
    );
    
    // Dynamic duration based on distance (but capped)
    const dynamicDuration = Math.min(duration, Math.max(100, distance * 0.5));

    // Use physics-based animation
    this.animator.animateCursor(
      'cursor-position',
      this.domElement,
      fromPos,
      toPos,
      dynamicDuration
    );

    this.lastPosition = targetPos;
  }

  /**
   * Calculate absolute position from cursor position
   */
  private calculateAbsolutePosition(pos: CursorPosition): Vector2D {
    if (pos.element) {
      const rect = pos.element.getBoundingClientRect();
      
      // If line/col provided, calculate position within element
      if (pos.line !== undefined && pos.col !== undefined) {
        const lineHeight = parseFloat(getComputedStyle(pos.element).lineHeight) || 16;
        const charWidth = this.getAverageCharWidth(pos.element);
        
        return {
          x: rect.left + (pos.col * charWidth),
          y: rect.top + ((pos.line - 1) * lineHeight)
        };
      }
      
      return { x: rect.left + pos.x, y: rect.top + pos.y };
    }
    
    return { x: pos.x, y: pos.y };
  }

  /**
   * Get average character width for text positioning
   */
  private getAverageCharWidth(element: HTMLElement): number {
    const style = getComputedStyle(element);
    const fontSize = parseFloat(style.fontSize) || 14;
    
    // Create a temporary element to measure character width
    const temp = document.createElement('span');
    temp.style.visibility = 'hidden';
    temp.style.position = 'absolute';
    temp.style.font = style.font;
    temp.textContent = 'W'; // Use 'W' as it's typically the widest character
    
    document.body.appendChild(temp);
    const width = temp.getBoundingClientRect().width;
    document.body.removeChild(temp);
    
    return width || fontSize * 0.6; // Fallback based on font size
  }

  /**
   * Set cursor position immediately (no animation)
   */
  private setPosition(pos: CursorPosition): void {
    if (!this.domElement || !pos) return;

    const absolutePos = this.calculateAbsolutePosition(pos);
    this.domElement.style.left = `${absolutePos.x}px`;
    this.domElement.style.top = `${absolutePos.y}px`;
    this.lastPosition = pos;
  }

  /**
   * Apply cursor style to DOM element
   */
  private applyCursorStyle(style: CursorStyle): void {
    if (!this.domElement) return;

    Object.assign(this.domElement.style, {
      width: `${style.width}px`,
      height: `${style.height}px`,
      backgroundColor: style.backgroundColor,
      borderRadius: `${style.borderRadius}px`,
      opacity: style.opacity.toString(),
      boxShadow: style.boxShadow || 'none'
    });

    // Apply mode-specific styling
    switch (style.mode) {
      case 'line':
        this.domElement.style.width = '2px';
        this.domElement.style.borderLeft = `2px solid ${style.backgroundColor}`;
        this.domElement.style.backgroundColor = 'transparent';
        break;
      case 'block':
        this.domElement.style.width = `${style.width}px`;
        this.domElement.style.backgroundColor = style.backgroundColor;
        break;
      case 'underline':
        this.domElement.style.height = '2px';
        this.domElement.style.bottom = '0';
        break;
      case 'dot':
        this.domElement.style.width = '6px';
        this.domElement.style.height = '6px';
        this.domElement.style.borderRadius = '50%';
        break;
    }
  }

  /**
   * Start the blink cycle
   */
  private startBlinkCycle(): void {
    this.updateBlinkSpeed(1000); // Default 1 second blink
  }

  /**
   * Update blink speed
   */
  private updateBlinkSpeed(speed: number): void {
    if (this.blinkTimer) {
      clearInterval(this.blinkTimer);
    }

    this.blinkTimer = window.setInterval(() => {
      this.isBlinking = !this.isBlinking;
      if (this.domElement && this.activeCursor) {
        this.domElement.style.opacity = this.isBlinking ? 
          this.activeCursor.style.opacity.toString() : '0';
      }
    }, speed / 2);
  }

  /**
   * Get current blink speed
   */
  private getBlinkSpeed(): number {
    return this.activeCursor?.style.blinkSpeed || 1000;
  }

  /**
   * Pause blinking (e.g., during typing)
   */
  public pauseBlinking(): void {
    if (this.blinkTimer) {
      clearInterval(this.blinkTimer);
    }
    if (this.domElement && this.activeCursor) {
      this.domElement.style.opacity = this.activeCursor.style.opacity.toString();
    }
  }

  /**
   * Resume blinking
   */
  public resumeBlinking(): void {
    if (this.activeCursor) {
      this.updateBlinkSpeed(this.activeCursor.style.blinkSpeed);
    }
  }

  /**
   * Bind global event listeners
   */
  private bindGlobalListeners(): void {
    // Pause blinking on any input
    document.addEventListener('input', () => {
      this.pauseBlinking();
      setTimeout(() => this.resumeBlinking(), 1000);
    });

    document.addEventListener('keydown', () => {
      this.pauseBlinking();
      setTimeout(() => this.resumeBlinking(), 1000);
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.activeCursor) {
        // Recalculate position after resize
        this.setPosition(this.lastPosition);
      }
    });

    // Handle reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        this.pauseBlinking();
      } else {
        this.resumeBlinking();
      }
    };

    if (mediaQuery.matches) {
      this.pauseBlinking();
    }

    mediaQuery.addEventListener('change', handleMotionChange);
  }

  /**
   * Get current active cursor
   */
  public getActiveCursor(): CursorConfig | null {
    return this.activeCursor;
  }

  /**
   * Get all registered cursors
   */
  public getAllCursors(): CursorConfig[] {
    return Array.from(this.cursorQueue.values());
  }

  /**
   * Destroy the cursor manager and cleanup
   */
  public destroy(): void {
    if (this.blinkTimer) {
      clearInterval(this.blinkTimer);
    }
    
    if (this.domElement) {
      document.body.removeChild(this.domElement);
    }

    this.animator.destroy();
    this.cursorQueue.clear();
    this.activeCursor = null;
  }
}

// Export the singleton instance
export const CursorManager = CursorManagerSingleton.getInstance();

// Default cursor styles for different contexts
export const DefaultCursorStyles = {
  terminal: {
    width: 2,
    height: 16,
    backgroundColor: '#00ff88',
    borderRadius: 1,
    mode: 'line' as const,
    opacity: 1,
    boxShadow: '0 0 8px rgba(0, 255, 136, 0.6)',
    blinkSpeed: 1000
  },
  vim: {
    width: 12,
    height: 16,
    backgroundColor: '#00ff88',
    borderRadius: 2,
    mode: 'block' as const,
    opacity: 1,
    blinkSpeed: 800
  },
  code: {
    width: 2,
    height: 18,
    backgroundColor: '#0099ff',
    borderRadius: 0,
    mode: 'line' as const,
    opacity: 1,
    blinkSpeed: 1200
  },
  ai: {
    width: 8,
    height: 8,
    backgroundColor: '#ff0099',
    borderRadius: 50,
    mode: 'dot' as const,
    opacity: 0.8,
    boxShadow: '0 0 12px rgba(255, 0, 153, 0.8)',
    blinkSpeed: 600
  }
};