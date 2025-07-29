import { useState, useEffect, useCallback } from 'react';

interface MobileViewportState {
  height: number;
  width: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  safeAreaLeft: number;
  safeAreaRight: number;
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  isFullscreen: boolean;
  orientation: 'portrait' | 'landscape';
}

export const useMobileViewport = () => {
  const [viewport, setViewport] = useState<MobileViewportState>(() => {
    if (typeof window === 'undefined') {
      return {
        height: 0,
        width: 0,
        safeAreaTop: 0,
        safeAreaBottom: 0,
        safeAreaLeft: 0,
        safeAreaRight: 0,
        isKeyboardOpen: false,
        keyboardHeight: 0,
        isFullscreen: false,
        orientation: 'portrait'
      };
    }

    const getSafeAreaValue = (property: string): number => {
      if ('CSS' in window && CSS.supports?.('padding', `env(${property})`)) {
        const value = getComputedStyle(document.documentElement)
          .getPropertyValue(`--safe-area-${property.replace('safe-area-inset-', '')}`) || '0px';
        return parseInt(value);
      }
      return 0;
    };

    return {
      height: window.visualViewport?.height || window.innerHeight,
      width: window.visualViewport?.width || window.innerWidth,
      safeAreaTop: getSafeAreaValue('safe-area-inset-top'),
      safeAreaBottom: getSafeAreaValue('safe-area-inset-bottom'),
      safeAreaLeft: getSafeAreaValue('safe-area-inset-left'),
      safeAreaRight: getSafeAreaValue('safe-area-inset-right'),
      isKeyboardOpen: false,
      keyboardHeight: 0,
      isFullscreen: window.innerHeight === window.screen.height,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
    };
  });

  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') return;

    const visualViewport = window.visualViewport;
    const currentHeight = visualViewport?.height || window.innerHeight;
    const currentWidth = visualViewport?.width || window.innerWidth;
    const layoutHeight = window.innerHeight;
    
    // Detect keyboard by comparing visual viewport to layout viewport
    const keyboardHeight = Math.max(0, layoutHeight - currentHeight);
    const isKeyboardOpen = keyboardHeight > 50; // threshold for keyboard detection

    // Get safe area values from CSS environment variables
    const getSafeAreaValue = (property: string): number => {
      try {
        const value = getComputedStyle(document.documentElement)
          .getPropertyValue(`--safe-area-${property}`) || '0px';
        return parseInt(value) || 0;
      } catch {
        return 0;
      }
    };

    const newViewport: MobileViewportState = {
      height: currentHeight,
      width: currentWidth,
      safeAreaTop: getSafeAreaValue('top'),
      safeAreaBottom: getSafeAreaValue('bottom'),
      safeAreaLeft: getSafeAreaValue('left'),
      safeAreaRight: getSafeAreaValue('right'),
      isKeyboardOpen,
      keyboardHeight,
      isFullscreen: window.innerHeight === window.screen.height,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
    };

    setViewport(newViewport);

    // Update CSS custom properties for dynamic styling
    const root = document.documentElement;
    root.style.setProperty('--mobile-vh', `${currentHeight}px`);
    root.style.setProperty('--mobile-vw', `${currentWidth}px`);
    root.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    root.style.setProperty('--keyboard-open', isKeyboardOpen ? '1' : '0');
    root.style.setProperty('--safe-area-top', `${newViewport.safeAreaTop}px`);
    root.style.setProperty('--safe-area-bottom', `${newViewport.safeAreaBottom}px`);
    root.style.setProperty('--safe-area-left', `${newViewport.safeAreaLeft}px`);
    root.style.setProperty('--safe-area-right', `${newViewport.safeAreaRight}px`);
    root.style.setProperty('--is-fullscreen', newViewport.isFullscreen ? '1' : '0');
    root.style.setProperty('--orientation', newViewport.orientation);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial update
    updateViewport();

    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateViewport, 100);
    };

    // Listen to viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', debouncedUpdate);
      window.visualViewport.addEventListener('scroll', debouncedUpdate);
    }

    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', () => {
      // Delay orientation change to allow browser to update
      setTimeout(updateViewport, 200);
    });

    // Listen to safe area changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', updateViewport);

    return () => {
      clearTimeout(timeoutId);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', debouncedUpdate);
        window.visualViewport.removeEventListener('scroll', debouncedUpdate);
      }
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', updateViewport);
      mediaQuery.removeEventListener('change', updateViewport);
    };
  }, [updateViewport]);

  return viewport;
};