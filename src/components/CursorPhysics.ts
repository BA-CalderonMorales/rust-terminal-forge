/**
 * Advanced Physics Engine for Cursor Animations
 * Provides realistic motion with spring dynamics, friction, and sub-pixel accuracy
 */

import { Vector2D, FluidAnimator, RickEasing } from '../engine/FluidAnimator';

export interface PhysicsState {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  mass: number;
  friction: number;
  springConstant: number;
  dampening: number;
  targetPosition: Vector2D;
  isMoving: boolean;
  restThreshold: number;
}

export interface CursorPhysicsConfig {
  mass?: number;
  friction?: number;
  springConstant?: number;
  dampening?: number;
  restThreshold?: number;
  maxVelocity?: number;
  minVelocity?: number;
}

/**
 * Physics-based cursor animation system
 */
export class CursorPhysics {
  private state: PhysicsState;
  private config: Required<CursorPhysicsConfig>;
  private animationFrame: number | null = null;
  private element: HTMLElement;
  private onUpdate?: (position: Vector2D) => void;
  private onComplete?: () => void;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;
  private readonly fixedTimeStep: number = 1 / 120; // 120 FPS for smooth physics

  constructor(
    element: HTMLElement,
    initialPosition: Vector2D,
    config: CursorPhysicsConfig = {}
  ) {
    this.element = element;
    
    // Default physics configuration
    this.config = {
      mass: config.mass ?? 1,
      friction: config.friction ?? 0.8,
      springConstant: config.springConstant ?? 250,
      dampening: config.dampening ?? 0.7,
      restThreshold: config.restThreshold ?? 0.1,
      maxVelocity: config.maxVelocity ?? 2000,
      minVelocity: config.minVelocity ?? 0.01
    };

    // Initialize physics state
    this.state = {
      position: { ...initialPosition },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      mass: this.config.mass,
      friction: this.config.friction,
      springConstant: this.config.springConstant,
      dampening: this.config.dampening,
      targetPosition: { ...initialPosition },
      isMoving: false,
      restThreshold: this.config.restThreshold
    };
  }

  /**
   * Set target position with physics animation
   */
  public moveTo(targetPosition: Vector2D, onComplete?: () => void): void {
    this.state.targetPosition = { ...targetPosition };
    this.state.isMoving = true;
    this.onComplete = onComplete;

    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Instantly set position without animation
   */
  public setPosition(position: Vector2D): void {
    this.state.position = { ...position };
    this.state.targetPosition = { ...position };
    this.state.velocity = { x: 0, y: 0 };
    this.state.acceleration = { x: 0, y: 0 };
    this.state.isMoving = false;
    this.updateElementPosition();
  }

  /**
   * Add impulse force to the cursor
   */
  public addImpulse(force: Vector2D): void {
    this.state.velocity.x += force.x / this.state.mass;
    this.state.velocity.y += force.y / this.state.mass;
    this.state.isMoving = true;

    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Update physics configuration
   */
  public updateConfig(newConfig: Partial<CursorPhysicsConfig>): void {
    Object.assign(this.config, newConfig);
    
    // Update state values that correspond to config
    if (newConfig.mass !== undefined) this.state.mass = newConfig.mass;
    if (newConfig.friction !== undefined) this.state.friction = newConfig.friction;
    if (newConfig.springConstant !== undefined) this.state.springConstant = newConfig.springConstant;
    if (newConfig.dampening !== undefined) this.state.dampening = newConfig.dampening;
    if (newConfig.restThreshold !== undefined) this.state.restThreshold = newConfig.restThreshold;
  }

  /**
   * Set update callback
   */
  public setUpdateCallback(callback: (position: Vector2D) => void): void {
    this.onUpdate = callback;
  }

  /**
   * Start the physics simulation
   */
  private start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.accumulatedTime = 0;
    this.animate();
  }

  /**
   * Stop the physics simulation
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Main animation loop with fixed timestep
   */
  private animate(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.05); // Cap at 50ms
    this.lastFrameTime = currentTime;

    this.accumulatedTime += deltaTime;

    // Fixed timestep physics updates
    while (this.accumulatedTime >= this.fixedTimeStep) {
      this.updatePhysics(this.fixedTimeStep);
      this.accumulatedTime -= this.fixedTimeStep;
    }

    // Interpolate position for smooth rendering
    const alpha = this.accumulatedTime / this.fixedTimeStep;
    this.interpolatePosition(alpha);

    // Update DOM
    this.updateElementPosition();

    // Check if we should continue
    if (this.state.isMoving) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    } else {
      this.isRunning = false;
      this.onComplete?.();
    }
  }

  /**
   * Update physics simulation
   */
  private updatePhysics(deltaTime: number): void {
    const state = this.state;

    // Calculate spring force towards target
    const displacement = {
      x: state.targetPosition.x - state.position.x,
      y: state.targetPosition.y - state.position.y
    };

    const springForce = {
      x: displacement.x * state.springConstant,
      y: displacement.y * state.springConstant
    };

    // Calculate damping force (opposes velocity)
    const dampingForce = {
      x: -state.velocity.x * state.dampening,
      y: -state.velocity.y * state.dampening
    };

    // Calculate friction force
    const frictionForce = {
      x: -state.velocity.x * state.friction,
      y: -state.velocity.y * state.friction
    };

    // Total force
    const totalForce = {
      x: springForce.x + dampingForce.x + frictionForce.x,
      y: springForce.y + dampingForce.y + frictionForce.y
    };

    // Update acceleration (F = ma, so a = F/m)
    state.acceleration.x = totalForce.x / state.mass;
    state.acceleration.y = totalForce.y / state.mass;

    // Update velocity
    state.velocity.x += state.acceleration.x * deltaTime;
    state.velocity.y += state.acceleration.y * deltaTime;

    // Apply velocity limits
    const speed = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2);
    if (speed > this.config.maxVelocity) {
      const scale = this.config.maxVelocity / speed;
      state.velocity.x *= scale;
      state.velocity.y *= scale;
    }

    // Update position
    state.position.x += state.velocity.x * deltaTime;
    state.position.y += state.velocity.y * deltaTime;

    // Check if we're close enough to target and moving slowly enough to stop
    const distanceToTarget = Math.sqrt(displacement.x ** 2 + displacement.y ** 2);
    const currentSpeed = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2);

    if (distanceToTarget < state.restThreshold && currentSpeed < this.config.minVelocity) {
      // Snap to target and stop
      state.position = { ...state.targetPosition };
      state.velocity = { x: 0, y: 0 };
      state.acceleration = { x: 0, y: 0 };
      state.isMoving = false;
    }
  }

  /**
   * Interpolate position for smooth rendering between physics updates
   */
  private interpolatePosition(alpha: number): void {
    // For now, we'll use the actual physics position
    // In a more advanced implementation, we could interpolate between
    // the previous and current physics positions for even smoother motion
  }

  /**
   * Update the DOM element position with sub-pixel accuracy
   */
  private updateElementPosition(): void {
    const { position } = this.state;
    
    // Use transform for sub-pixel accuracy and hardware acceleration
    this.element.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
    
    // Call update callback if provided
    this.onUpdate?.(position);
  }

  /**
   * Get current position
   */
  public getPosition(): Vector2D {
    return { ...this.state.position };
  }

  /**
   * Get current velocity
   */
  public getVelocity(): Vector2D {
    return { ...this.state.velocity };
  }

  /**
   * Check if currently moving
   */
  public isMoving(): boolean {
    return this.state.isMoving;
  }

  /**
   * Get physics state for debugging
   */
  public getPhysicsState(): PhysicsState {
    return { ...this.state };
  }

  /**
   * Destroy the physics engine and cleanup
   */
  public destroy(): void {
    this.stop();
    this.onUpdate = undefined;
    this.onComplete = undefined;
  }
}

/**
 * Preset physics configurations for different cursor behaviors
 */
export const PhysicsPresets = {
  // Snappy response for terminal cursors
  terminal: {
    mass: 1,
    friction: 0.7,
    springConstant: 300,
    dampening: 0.8,
    restThreshold: 0.5,
    maxVelocity: 1500
  },

  // Smooth, flowing motion for code editors
  code: {
    mass: 1.2,
    friction: 0.6,
    springConstant: 200,
    dampening: 0.7,
    restThreshold: 0.3,
    maxVelocity: 1200
  },

  // Bouncy, attention-grabbing for AI interfaces
  ai: {
    mass: 0.8,
    friction: 0.4,
    springConstant: 400,
    dampening: 0.5,
    restThreshold: 0.2,
    maxVelocity: 2000
  },

  // Heavy, deliberate motion for vim
  vim: {
    mass: 1.5,
    friction: 0.8,
    springConstant: 250,
    dampening: 0.9,
    restThreshold: 0.1,
    maxVelocity: 1000
  },

  // Ultra-smooth for precise positioning
  precise: {
    mass: 2,
    friction: 0.9,
    springConstant: 150,
    dampening: 0.95,
    restThreshold: 0.05,
    maxVelocity: 800
  }
};

/**
 * Utility function to create physics-based cursor animation
 */
export function createPhysicsCursor(
  element: HTMLElement,
  initialPosition: Vector2D,
  preset: keyof typeof PhysicsPresets = 'terminal'
): CursorPhysics {
  return new CursorPhysics(element, initialPosition, PhysicsPresets[preset]);
}

/**
 * Advanced easing functions for cursor animations that integrate with physics
 */
export const CursorEasing = {
  // Spring-based easing that mimics physics
  spring: (tension: number = 0.8, friction: number = 0.2) => {
    return (t: number): number => {
      const omega = Math.sqrt(tension);
      const zeta = friction / (2 * Math.sqrt(tension));
      
      if (zeta < 1) {
        // Underdamped spring
        const omega_d = omega * Math.sqrt(1 - zeta * zeta);
        return 1 - Math.exp(-zeta * omega * t) * 
          (Math.cos(omega_d * t) + (zeta * omega / omega_d) * Math.sin(omega_d * t));
      } else {
        // Critically damped or overdamped spring
        return 1 - Math.exp(-omega * t) * (1 + omega * t);
      }
    };
  },

  // Elastic easing with customizable bounce
  elastic: (amplitude: number = 1, period: number = 0.3) => {
    return (t: number): number => {
      if (t === 0 || t === 1) return t;
      return amplitude * Math.pow(2, -10 * t) * 
        Math.sin((t - period / 4) * (2 * Math.PI) / period) + 1;
    };
  },

  // Smooth acceleration and deceleration
  smoothStep: (t: number): number => {
    return t * t * (3 - 2 * t);
  },

  // Even smoother step function
  smootherStep: (t: number): number => {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
};