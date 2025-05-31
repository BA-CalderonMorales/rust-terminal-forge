
import { useState, useEffect } from 'react';

export const useVisualViewport = () => {
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.visualViewport?.height || window.innerHeight;
    }
    return 0;
  });

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      const fullHeight = window.screen.height;
      
      setViewportHeight(height);
      // Consider keyboard open if viewport is significantly smaller
      setIsKeyboardOpen(height < fullHeight * 0.75);
    };

    // Use visual viewport if available (modern browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
      updateViewport();
      
      return () => {
        window.visualViewport?.removeEventListener('resize', updateViewport);
      };
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', updateViewport);
      updateViewport();
      
      return () => {
        window.removeEventListener('resize', updateViewport);
      };
    }
  }, []);

  return { viewportHeight, isKeyboardOpen };
};
