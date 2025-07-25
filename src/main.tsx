import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

window.onerror = function(message, source, lineno, colno, error) {
  console.error("Uncaught error:", { message, source, lineno, colno, error });
};

createRoot(document.getElementById("root")!).render(<App />);
