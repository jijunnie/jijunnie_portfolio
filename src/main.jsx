// Suppress FBXLoader texture warnings globally (these are harmless - FBX files load fine)
// Set up warning suppression at the very start, before any imports
(function() {
  if (typeof console === 'undefined') return;
  
  const suppressFBXWarning = (message) => {
    if (!message) return false;
    const msg = String(message);
    // Match the exact warning pattern: "FBXLoader: Image type "..." is not supported."
    return (msg.includes('FBXLoader') && 
            msg.includes('Image type') && 
            (msg.includes('is not supported') || msg.includes('not supported'))) ||
           // Also catch variations with regex
           /FBXLoader.*Image type.*not supported/i.test(msg);
  };
  
  const wrapConsoleMethod = (original, methodName) => {
    if (!original) return;
    const wrapped = function(...args) {
      // Check all arguments for FBXLoader texture warnings
      const shouldSuppress = args.some(arg => suppressFBXWarning(arg));
      if (shouldSuppress) {
        return; // Suppress these specific warnings
      }
      return original.apply(console, args);
    };
    // Preserve original properties
    Object.setPrototypeOf(wrapped, original);
    Object.defineProperty(wrapped, 'name', { value: methodName });
    return wrapped;
  };
  
  // Override console.warn and console.error
  if (console.warn) {
    console.warn = wrapConsoleMethod(console.warn, 'warn');
  }
  if (console.error) {
    console.error = wrapConsoleMethod(console.error, 'error');
  }
  // Also check console.log just in case
  if (console.log) {
    const originalLog = console.log;
    console.log = function(...args) {
      const shouldSuppress = args.some(arg => suppressFBXWarning(arg));
      if (shouldSuppress) return;
      return originalLog.apply(console, args);
    };
  }
})();

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Error boundary for rendering errors
try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
} catch (error) {
  console.error('Failed to render app:', error)
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>Error Loading Application</h1>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    </div>
  `
}
