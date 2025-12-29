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

// Fix viewport height on mobile to prevent expansion when scrolling
(function() {
  // Set a fixed viewport height to prevent mobile browser UI from affecting layout
  const setViewportHeight = () => {
    // Get the actual viewport height (not affected by browser UI)
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Also set fixed height for html and body to prevent expansion
    const height = window.innerHeight;
    document.documentElement.style.height = `${height}px`;
    document.body.style.height = `${height}px`;
  };

  // Set initial height immediately
  setViewportHeight();

  // Only update on actual window resize, not on scroll
  let resizeTimer;
  let lastHeight = window.innerHeight;
  
  const handleResize = () => {
    const currentHeight = window.innerHeight;
    // Only update if height actually changed (not just visual viewport)
    if (Math.abs(currentHeight - lastHeight) > 50) {
      lastHeight = currentHeight;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setViewportHeight, 100);
    }
  };

  window.addEventListener('resize', handleResize);

  // Handle orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      setViewportHeight();
      lastHeight = window.innerHeight;
    }, 200);
  });

  // Prevent visual viewport changes (from scrolling) from affecting layout
  if ('visualViewport' in window) {
    // Visual viewport changes happen on scroll, but we don't want to update
    // We only want to update on actual window resize
    let visualViewportHeight = window.visualViewport.height;
    window.visualViewport.addEventListener('resize', () => {
      // Ignore visual viewport changes that are just from scrolling
      // Only update if it's a significant change (likely orientation/resize)
      const newHeight = window.visualViewport.height;
      if (Math.abs(newHeight - visualViewportHeight) > 100) {
        visualViewportHeight = newHeight;
        // This is likely a real resize, not just scroll
        handleResize();
      }
    });
  }
})();

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
