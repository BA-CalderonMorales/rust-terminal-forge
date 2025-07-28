/**
 * 🌊 Fluid Animator - Physics-Based Animation Engine
 * Smooth, natural animations that feel like they understand spacetime
 */

export interface AnimationConfig {
  duration: number;
  easing: EasingFunction;
  delay?: number;
  loop?: boolean;
  direction?: 'normal' | 'reverse' | 'alternate';
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface AnimationState {
  id: string;
  element: HTMLElement;
  startTime: number;
  duration: number;
  progress: number;
  from: Record<string, number>;
  to: Record<string, number>;
  current: Record<string, number>;
  easing: EasingFunction;
  onUpdate?: (state: AnimationState) => void;
  onComplete?: (state: AnimationState) => void;
}

export type EasingFunction = (t: number) => number;

/**
 * Rick's Scientific Easing Functions
 * Not your basic CSS transitions, these are mathematically superior
 */
export const RickEasing = {
  // Portal physics - smooth interdimensional travel
  portal: (t: number): number => {
    return t < 0.5 
      ? 2 * t * t 
      : -1 + (4 - 2 * t) * t;
  },

  // Quantum bounce - scientifically accurate bouncing
  quantumBounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },

  // Dimension elastic - elastic but not annoying
  dimensionElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  // Science expo - exponential curve like scientific growth
  scienceExpo: (t: number): number => {
    return t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
  },

  // Lab linear - sometimes you just need linear, Morty
  labLinear: (t: number): number => t,

  // Wubba ease - Rick's personal favorite
  wubbaEase: (t: number): number => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
};

/**
 * Fluid Animator - The smoothest animations in any dimension
 */
export class FluidAnimator {
  private animations: Map<string, AnimationState> = new Map();
  private rafId: number | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.startRenderLoop();
  }

  /**
   * Animate element properties with physics-based easing
   */
  animate(
    id: string,
    element: HTMLElement,
    from: Record<string, number>,
    to: Record<string, number>,
    config: AnimationConfig
  ): Promise<void> {
    return new Promise((resolve) => {
      // Stop existing animation with same ID
      this.stop(id);

      const animation: AnimationState = {
        id,
        element,
        startTime: performance.now() + (config.delay || 0),
        duration: config.duration,
        progress: 0,
        from: { ...from },
        to: { ...to },
        current: { ...from },
        easing: config.easing,
        onComplete: () => resolve()
      };

      this.animations.set(id, animation);
    });
  }

  /**
   * Animate cursor movement with quantum precision
   */
  animateCursor(
    id: string,
    element: HTMLElement,
    fromPos: Vector2D,
    toPos: Vector2D,
    duration: number = 150
  ): Promise<void> {
    return this.animate(
      id,
      element,
      { x: fromPos.x, y: fromPos.y },
      { x: toPos.x, y: toPos.y },
      {
        duration,
        easing: RickEasing.portal
      }
    );
  }

  /**
   * Animate typing effect with character-by-character precision
   */
  animateTyping(
    id: string,
    element: HTMLElement,
    text: string,
    speed: number = 50
  ): Promise<void> {
    return new Promise((resolve) => {
      let currentIndex = 0;
      const typeChar = () => {
        if (currentIndex >= text.length) {
          resolve();
          return;
        }

        element.textContent = text.substring(0, currentIndex + 1);
        currentIndex++;
        
        setTimeout(typeChar, speed + Math.random() * 20); // Add natural variation
      };

      typeChar();
    });
  }

  /**
   * Animate element appearance with quantum fade
   */
  fadeIn(
    id: string,
    element: HTMLElement,
    duration: number = 300
  ): Promise<void> {
    element.style.opacity = '0';
    return this.animate(
      id,
      element,
      { opacity: 0 },
      { opacity: 1 },
      {
        duration,
        easing: RickEasing.scienceExpo
      }
    );
  }

  /**
   * Animate element disappearance with quantum fade
   */
  fadeOut(
    id: string,
    element: HTMLElement,
    duration: number = 300
  ): Promise<void> {
    return this.animate(
      id,
      element,
      { opacity: parseFloat(element.style.opacity) || 1 },
      { opacity: 0 },
      {
        duration,
        easing: RickEasing.scienceExpo
      }
    );
  }

  /**
   * Slide element in from specified direction
   */
  slideIn(
    id: string,
    element: HTMLElement,
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number = 100,
    duration: number = 400
  ): Promise<void> {
    const transforms = {
      left: { x: -distance, y: 0 },
      right: { x: distance, y: 0 },
      up: { x: 0, y: -distance },
      down: { x: 0, y: distance }
    };

    const from = transforms[direction];
    const to = { x: 0, y: 0 };

    // Set initial position
    element.style.transform = `translate(${from.x}px, ${from.y}px)`;

    return this.animate(
      id,
      element,
      from,
      to,
      {
        duration,
        easing: RickEasing.dimensionElastic
      }
    );
  }

  /**
   * Scale element with quantum physics
   */
  scale(
    id: string,
    element: HTMLElement,
    fromScale: number,
    toScale: number,
    duration: number = 200
  ): Promise<void> {
    return this.animate(
      id,
      element,
      { scale: fromScale },
      { scale: toScale },
      {
        duration,
        easing: RickEasing.quantumBounce
      }
    );
  }

  /**
   * Pulse effect for attention-grabbing
   */
  pulse(
    id: string,
    element: HTMLElement,
    intensity: number = 1.1,
    duration: number = 600
  ): Promise<void> {
    return this.animate(
      id,
      element,
      { scale: 1 },
      { scale: intensity },
      {
        duration: duration / 2,
        easing: RickEasing.wubbaEase
      }
    ).then(() => {
      return this.animate(
        `${id}_return`,
        element,
        { scale: intensity },
        { scale: 1 },
        {
          duration: duration / 2,
          easing: RickEasing.wubbaEase
        }
      );
    });
  }

  /**
   * Stop specific animation
   */
  stop(id: string): void {
    this.animations.delete(id);
  }

  /**
   * Stop all animations
   */
  stopAll(): void {
    this.animations.clear();
  }

  /**
   * Start the render loop
   */
  private startRenderLoop(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.renderFrame();
  }

  /**
   * Main render loop - runs at 60fps
   */
  private renderFrame(): void {
    const currentTime = performance.now();

    // Update all active animations
    for (const [id, animation] of this.animations.entries()) {
      if (currentTime < animation.startTime) continue;

      // Calculate progress
      const elapsed = currentTime - animation.startTime;
      animation.progress = Math.min(elapsed / animation.duration, 1);

      // Apply easing
      const easedProgress = animation.easing(animation.progress);

      // Update current values
      for (const prop in animation.to) {
        const from = animation.from[prop];
        const to = animation.to[prop];
        animation.current[prop] = from + (to - from) * easedProgress;
      }

      // Apply to DOM
      this.applyAnimationToDOM(animation);

      // Check if animation is complete
      if (animation.progress >= 1) {
        this.animations.delete(id);
        animation.onComplete?.(animation);
      }
    }

    // Continue render loop
    this.rafId = requestAnimationFrame(() => this.renderFrame());
  }

  /**
   * Apply animation values to DOM element
   */
  private applyAnimationToDOM(animation: AnimationState): void {
    const { element, current } = animation;

    // Handle different property types
    for (const prop in current) {
      const value = current[prop];

      switch (prop) {
        case 'x':
        case 'y':
          // Handle transform properties
          const x = current.x || 0;
          const y = current.y || 0;
          const scale = current.scale || 1;
          element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
          break;

        case 'scale':
          // Handled in x/y case
          break;

        case 'opacity':
          element.style.opacity = value.toString();
          break;

        case 'width':
          element.style.width = `${value}px`;
          break;

        case 'height':
          element.style.height = `${value}px`;
          break;

        default:
          // Generic CSS property
          (element.style as any)[prop] = value.toString();
      }
    }

    // Call update callback
    animation.onUpdate?.(animation);
  }

  /**
   * Get active animation count
   */
  getActiveAnimationCount(): number {
    return this.animations.size;
  }

  /**
   * Get animation by ID
   */
  getAnimation(id: string): AnimationState | undefined {
    return this.animations.get(id);
  }

  /**
   * Destroy animator and cleanup
   */
  destroy(): void {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.animations.clear();
  }
}

/**
 * React Hook for Fluid Animation Integration
 */
export function useFluidAnimator() {
  const animator = new FluidAnimator();

  return {
    animate: animator.animate.bind(animator),
    animateCursor: animator.animateCursor.bind(animator),
    animateTyping: animator.animateTyping.bind(animator),
    fadeIn: animator.fadeIn.bind(animator),
    fadeOut: animator.fadeOut.bind(animator),
    slideIn: animator.slideIn.bind(animator),
    scale: animator.scale.bind(animator),
    pulse: animator.pulse.bind(animator),
    stop: animator.stop.bind(animator),
    stopAll: animator.stopAll.bind(animator),
    getActiveAnimationCount: () => animator.getActiveAnimationCount(),
  };
}