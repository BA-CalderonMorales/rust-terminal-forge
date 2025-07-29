/**
 * SingletonCursor - React component interface for the centralized cursor system
 * Eliminates dual cursor chaos with physics-based animations
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { CursorManager, CursorConfig, DefaultCursorStyles, CursorPosition, CursorStyle } from './CursorManager';

export interface SingletonCursorProps {
  /** Unique identifier for this cursor instance */
  id: string;
  
  /** Context type - determines default styling and behavior */
  context: 'terminal' | 'vim' | 'code' | 'ai';
  
  /** Current position of the cursor */
  position: CursorPosition;
  
  /** Whether this cursor should be active */
  isActive?: boolean;
  
  /** Priority level (higher values take precedence) */
  priority?: number;
  
  /** Custom style overrides */
  style?: Partial<CursorStyle>;
  
  /** Container element for relative positioning */
  containerRef?: React.RefObject<HTMLElement>;
  
  /** Callback when cursor becomes active */
  onActivate?: () => void;
  
  /** Callback when cursor becomes inactive */
  onDeactivate?: () => void;
  
  /** Additional CSS class name */
  className?: string;
}

/**
 * SingletonCursor Component
 * 
 * This component registers a cursor with the global cursor manager.
 * Only one cursor can be active at a time across the entire application.
 */
export const SingletonCursor: React.FC<SingletonCursorProps> = ({
  id,
  context,
  position,
  isActive = true,
  priority = 1,
  style = {},
  containerRef,
  onActivate,
  onDeactivate,
  className = ''
}) => {
  const isRegisteredRef = useRef(false);
  const lastActiveStateRef = useRef(isActive);

  // Calculate final style by merging defaults with overrides
  const finalStyle: CursorStyle = useMemo(() => ({
    ...DefaultCursorStyles[context],
    ...style
  }), [context, style]);

  // Calculate priority based on context if not explicitly provided
  const finalPriority = useMemo(() => {
    if (priority !== 1) return priority;
    
    // Default priorities by context
    const contextPriorities = {
      ai: 10,     // Highest - AI interactions take precedence
      vim: 8,     // High - Vim mode is important
      code: 6,    // Medium-high - Code editing
      terminal: 4 // Medium - Terminal input
    };
    
    return contextPriorities[context];
  }, [context, priority]);

  // Calculate absolute position including container offset
  const absolutePosition = useMemo((): CursorPosition => {
    if (containerRef?.current) {
      return {
        ...position,
        element: containerRef.current
      };
    }
    return position;
  }, [position, containerRef]);

  // Create cursor configuration
  const cursorConfig: CursorConfig = useMemo(() => ({
    id,
    position: absolutePosition,
    style: finalStyle,
    context,
    priority: finalPriority,
    isActive
  }), [id, absolutePosition, finalStyle, context, finalPriority, isActive]);

  // Register cursor with manager on mount
  useEffect(() => {
    if (!isRegisteredRef.current) {
      CursorManager.registerCursor(cursorConfig);
      isRegisteredRef.current = true;
    }

    // Cleanup on unmount
    return () => {
      if (isRegisteredRef.current) {
        CursorManager.unregisterCursor(id);
        isRegisteredRef.current = false;
      }
    };
  }, [id]); // Only re-run if ID changes

  // Update cursor configuration when props change
  useEffect(() => {
    if (isRegisteredRef.current) {
      CursorManager.registerCursor(cursorConfig);
    }
  }, [cursorConfig]);

  // Handle active state changes and callbacks
  useEffect(() => {
    const wasActive = lastActiveStateRef.current;
    const isNowActive = isActive;

    if (wasActive !== isNowActive) {
      if (isNowActive && onActivate) {
        // Check if this cursor actually became the active one
        setTimeout(() => {
          if (CursorManager.getActiveCursor()?.id === id) {
            onActivate();
          }
        }, 50); // Small delay to ensure manager has processed the change
      } else if (!isNowActive && onDeactivate) {
        onDeactivate();
      }
    }

    lastActiveStateRef.current = isActive;
  }, [isActive, id, onActivate, onDeactivate]);

  // This component doesn't render anything - the manager handles the DOM
  return null;
};

/**
 * Hook for easier cursor management
 */
export function useSingletonCursor(
  id: string,
  context: SingletonCursorProps['context'],
  containerRef?: React.RefObject<HTMLElement>
) {
  const [position, setPosition] = React.useState<CursorPosition>({ x: 0, y: 0 });
  const [isActive, setIsActive] = React.useState(true);
  const [style, setStyle] = React.useState<Partial<CursorStyle>>({});

  // Update position with automatic container detection
  const updatePosition = useCallback((newPosition: Partial<CursorPosition>) => {
    setPosition(prev => ({ ...prev, ...newPosition }));
  }, []);

  // Update position based on text coordinates
  const updateTextPosition = useCallback((line: number, col: number) => {
    setPosition(prev => ({ ...prev, line, col }));
  }, []);

  // Update position based on pixel coordinates
  const updatePixelPosition = useCallback((x: number, y: number) => {
    setPosition(prev => ({ ...prev, x, y }));
  }, []);

  // Show/hide cursor
  const show = useCallback(() => setIsActive(true), []);
  const hide = useCallback(() => setIsActive(false), []);

  // Update style
  const updateStyle = useCallback((newStyle: Partial<CursorStyle>) => {
    setStyle(prev => ({ ...prev, ...newStyle }));
  }, []);

  // Pause/resume blinking
  const pauseBlinking = useCallback(() => {
    CursorManager.pauseBlinking();
  }, []);

  const resumeBlinking = useCallback(() => {
    CursorManager.resumeBlinking();
  }, []);

  return {
    // State
    position,
    isActive,
    style,
    
    // Actions
    updatePosition,
    updateTextPosition,
    updatePixelPosition,
    show,
    hide,
    updateStyle,
    pauseBlinking,
    resumeBlinking,
    
    // Component props for easier usage
    cursorProps: {
      id,
      context,
      position,
      isActive,
      style,
      containerRef
    }
  };
}

/**
 * Higher-order component for automatic cursor management
 */
export function withSingletonCursor<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  cursorConfig: {
    id: string;
    context: SingletonCursorProps['context'];
    priority?: number;
    getPosition?: (props: P) => CursorPosition;
    getActive?: (props: P) => boolean;
  }
) {
  return React.forwardRef<any, P>((props, ref) => {
    const containerRef = useRef<HTMLElement>(null);
    
    const position = cursorConfig.getPosition ? 
      cursorConfig.getPosition(props as P) : 
      { x: 0, y: 0 };
    
    const isActive = cursorConfig.getActive ? 
      cursorConfig.getActive(props as P) : 
      true;

    return (
      <>
        <WrappedComponent {...(props as P)} ref={ref} />
        <SingletonCursor
          id={cursorConfig.id}
          context={cursorConfig.context}
          position={position}
          isActive={isActive}
          priority={cursorConfig.priority}
          containerRef={containerRef}
        />
      </>
    );
  });
}

/**
 * Context for sharing cursor state across components
 */
export const CursorContext = React.createContext<{
  activeCursorId: string | null;
  registerCursor: (config: CursorConfig) => void;
  unregisterCursor: (id: string) => void;
  updatePosition: (id: string, position: CursorPosition) => void;
  updateStyle: (id: string, style: Partial<CursorStyle>) => void;
}>({
  activeCursorId: null,
  registerCursor: () => {},
  unregisterCursor: () => {},
  updatePosition: () => {},
  updateStyle: () => {}
});

/**
 * Provider component for cursor context
 */
export const CursorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCursorId, setActiveCursorId] = React.useState<string | null>(null);

  // Update active cursor ID when manager state changes
  React.useEffect(() => {
    const checkActiveCursor = () => {
      const activeCursor = CursorManager.getActiveCursor();
      setActiveCursorId(activeCursor?.id || null);
    };

    // Check initially
    checkActiveCursor();

    // Set up polling for changes (could be improved with events)
    const interval = setInterval(checkActiveCursor, 100);
    
    return () => clearInterval(interval);
  }, []);

  const contextValue = React.useMemo(() => ({
    activeCursorId,
    registerCursor: (config: CursorConfig) => CursorManager.registerCursor(config),
    unregisterCursor: (id: string) => CursorManager.unregisterCursor(id),
    updatePosition: (id: string, position: CursorPosition) => 
      CursorManager.updateCursorPosition(id, position),
    updateStyle: (id: string, style: Partial<CursorStyle>) => 
      CursorManager.updateCursorStyle(id, style)
  }), [activeCursorId]);

  return (
    <CursorContext.Provider value={contextValue}>
      {children}
    </CursorContext.Provider>
  );
};

/**
 * Hook to access cursor context
 */
export function useCursorContext() {
  return React.useContext(CursorContext);
}

export default SingletonCursor;