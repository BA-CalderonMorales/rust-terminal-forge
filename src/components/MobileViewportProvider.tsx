import React, { createContext, useContext, useEffect } from 'react';
import { useMobileViewport } from '../hooks/useMobileViewport';

interface MobileViewportContextType {
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

const MobileViewportContext = createContext<MobileViewportContextType | null>(null);

export const useMobileViewportContext = () => {
  const context = useContext(MobileViewportContext);
  if (!context) {
    throw new Error('useMobileViewportContext must be used within MobileViewportProvider');
  }
  return context;
};

interface MobileViewportProviderProps {
  children: React.ReactNode;
}

export const MobileViewportProvider: React.FC<MobileViewportProviderProps> = ({ children }) => {
  const viewport = useMobileViewport();

  // Apply mobile app container classes and data attributes
  useEffect(() => {
    const appContainer = document.getElementById('mobile-app-container');
    if (appContainer) {
      appContainer.setAttribute('data-keyboard-open', viewport.isKeyboardOpen.toString());
      appContainer.setAttribute('data-fullscreen', viewport.isFullscreen.toString());
      appContainer.setAttribute('data-orientation', viewport.orientation);
    }
  }, [viewport.isKeyboardOpen, viewport.isFullscreen, viewport.orientation]);

  return (
    <MobileViewportContext.Provider value={viewport}>
      <div 
        id="mobile-app-container"
        className="mobile-app-container"
        data-keyboard-open={viewport.isKeyboardOpen}
        data-fullscreen={viewport.isFullscreen}
        data-orientation={viewport.orientation}
      >
        <div className="mobile-terminal-layout">
          {children}
        </div>
      </div>
    </MobileViewportContext.Provider>
  );
};