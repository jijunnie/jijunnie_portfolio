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
      const shouldSuppress = args.some(arg => 
        suppressFBXWarning(arg)
      );
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
      const shouldSuppress = args.some(arg => 
        suppressFBXWarning(arg)
      );
      if (shouldSuppress) return;
      return originalLog.apply(console, args);
    };
  }
})();

// 重写纹理URL：将错误的远程路径转换为本地路径
if (typeof window !== 'undefined') {
  // 辅助函数：检查URL是否需要重写
  const shouldRewriteTextureUrl = (url) => {
    return typeof url === 'string' && (
      url.includes('mixamo-mini') ||
      url.includes('r2.dev/home') ||
      url.includes('.fbm/')
    );
  };
  
  // 辅助函数：将远程URL转换为本地路径
  const rewriteTextureUrl = (url) => {
    if (!shouldRewriteTextureUrl(url)) return url;
    // 提取文件名
    const fileName = url.split('/').pop().split('?')[0];
    // 重写为本地路径
    return `/models/textures/${fileName}`;
  };
  
  // 拦截fetch请求
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (shouldRewriteTextureUrl(url)) {
      args[0] = rewriteTextureUrl(url);
    }
    return originalFetch.apply(this, args);
  };
  
  // 拦截XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (shouldRewriteTextureUrl(url)) {
      url = rewriteTextureUrl(url);
    }
    this._url = url;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };
  
  // 拦截Image.src设置
  const originalImageSrcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    set: function(value) {
      if (shouldRewriteTextureUrl(value)) {
        value = rewriteTextureUrl(value);
      }
      originalImageSrcSetter.call(this, value);
    },
    get: function() {
      return this.getAttribute('src') || '';
    }
  });
}

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
