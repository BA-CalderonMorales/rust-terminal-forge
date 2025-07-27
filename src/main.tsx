import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/responsive-improvements.css'
import './styles/ui-optimizations.css'
import { themeManager } from './theme';

window.onerror = function(message, source, lineno, colno, error) {
  console.error("Uncaught error:", { message, source, lineno, colno, error });
};

// Make themeManager globally available for TDD tests
declare global {
  interface Window {
    themeManager: typeof themeManager;
  }
}

window.themeManager = themeManager;

// Initialize theme system
themeManager.init();

createRoot(document.getElementById("root")!).render(<App />);
