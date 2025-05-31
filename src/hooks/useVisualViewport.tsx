
import { useState, useEffect, useCallback } from 'react';

interface ViewportState {
  height: number;
  width: number;
  offsetTop: number;
  offsetLeft: number;
  scale: number;
}

interface UseVisualViewportReturn {
  viewportHeight: number;
  viewportWidth: number;
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  isStable: boolean;
}

export const useVisualViewport = (): UseVisualViewportReturn => {
  const [viewport, setViewport] = useState<ViewportState>(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      return {
        height: window.visualViewport.height,
        width: window.visualViewport.width,
        offsetTop: window.visualViewport.offsetTop,
        offsetLeft: window.visualViewport.offsetLeft,
        scale: window.visualViewport.scale,
      };
    }
    return {
      height: typeof window !== 'undefined' ? window.innerHeight : 0,
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      offsetTop: 0,
      offsetLeft: 0,
      scale: 1,
    };
  });

  const [isStable, setIsStable] = useState(true);
  const [stableTimeout, setStableTimeout] = useState<NodeJS.Timeout | null>(null);

  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') return;

    setIsStable(false);
    
    // Clear existing timeout
    if (stableTimeout) {
      clearTimeout(stableTimeout);
    }

    // Set new timeout for stability detection
    const timeout = setTimeout(() => setIsStable(true), 300);
    setStableTimeout(timeout);

    const newViewport: ViewportState = window.visualViewport ? {
      height: window.visualViewport.height,
      width: window.visualViewport.width,
      offsetTop: window.visualViewport.offsetTop,
      offsetLeft: window.visualViewport.offsetLeft,
      scale: window.visualViewport.scale,
    } : {
      height: window.innerHeight,
      width: window.innerWidth,
      offsetTop: 0,
      offsetLeft: 0,
      scale: 1,
    };

    setViewport(newViewport);
  }, [stableTimeout]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId: number;
    
    const handleResize = () => {
      rafId = requestAnimationFrame(updateViewport);
    };

    // Use visual viewport if available (modern browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
    }

    // Initial update
    updateViewport();

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (stableTimeout) {
        clearTimeout(stableTimeout);
      }
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      }
    };
  }, [updateViewport, stableTimeout]);

  // Calculate keyboard state and dimensions
  const screenHeight = typeof window !== 'undefined' ? window.screen.height : 0;
  const isKeyboardOpen = viewport.height < screenHeight * 0.75;
  const keyboardHeight = Math.max(0, screenHeight - viewport.height - viewport.offsetTop);
  
  // Safe area calculations
  const safeAreaTop = viewport.offsetTop;
  const safeAreaBottom = typeof window !== 'undefined' && 'CSS' in window && CSS.supports?.('padding-bottom', 'env(safe-area-inset-bottom)') 
    ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0') 
    : 0;

  // Update CSS custom properties for dynamic layout
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.style.setProperty('--visual-viewport-height', `${viewport.height}px`);
    root.style.setProperty('--visual-viewport-width', `${viewport.width}px`);
    root.style.setProperty('--keyboard-open', isKeyboardOpen ? '1' : '0');
    root.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    root.style.setProperty('--safe-area-top', `${safeAreaTop}px`);
    root.style.setProperty('--safe-area-bottom', `${safeAreaBottom}px`);
    root.style.setProperty('--viewport-stable', isStable ? '1' : '0');
  }, [viewport, isKeyboardOpen, keyboardHeight, safeAreaTop, safeAreaBottom, isStable]);

  return {
    viewportHeight: viewport.height,
    viewportWidth: viewport.width,
    isKeyboardOpen,
    keyboardHeight,
    safeAreaTop,
    safeAreaBottom,
    isStable,
  };
};
