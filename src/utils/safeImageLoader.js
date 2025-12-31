/**
 * 安全的图片加载工具函数
 * 防止图片加载失败导致页面崩溃
 */

/**
 * 创建安全的图片加载处理函数
 * @param {Object} options - 配置选项
 * @param {Function} options.onError - 错误回调
 * @param {string} options.fallbackBackground - 失败时的背景渐变
 * @returns {Function} 错误处理函数
 */
export function createSafeImageErrorHandler(options = {}) {
  const {
    onError,
    fallbackBackground = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  } = options;

  return function handleImageError(e) {
    try {
      if (!e || !e.target) {
        return;
      }

      const img = e.target;
      
      // 防止重复处理
      if (img.dataset.errorHandled === 'true') {
        return;
      }
      img.dataset.errorHandled = 'true';

      // 隐藏失败的图片
      img.style.display = 'none';
      
      // 创建或显示占位符
      const parent = img.parentElement;
      if (parent) {
        // 检查是否已有占位符
        let placeholder = parent.querySelector('.image-placeholder');
        
        if (!placeholder) {
          placeholder = document.createElement('div');
          placeholder.className = 'image-placeholder';
          placeholder.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${fallbackBackground};
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
          `;
          
          const icon = document.createElement('div');
          icon.style.cssText = `
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.6);
            font-size: 24px;
          `;
          icon.textContent = '📷';
          placeholder.appendChild(icon);
          
          // 确保父元素有相对定位
          const parentPosition = window.getComputedStyle(parent).position;
          if (parentPosition === 'static') {
            parent.style.position = 'relative';
          }
          
          parent.appendChild(placeholder);
        } else {
          placeholder.style.display = 'flex';
        }
      }

      // 调用自定义错误处理
      if (onError && typeof onError === 'function') {
        try {
          onError(e);
        } catch (error) {
          console.warn('Custom error handler failed:', error);
        }
      }
    } catch (error) {
      // 静默处理所有错误，防止崩溃
      console.warn('Image error handler failed:', error);
    }
  };
}

/**
 * 安全地预加载图片
 * @param {string|string[]} imageSrcs - 图片源或图片源数组
 * @param {Object} options - 配置选项
 * @returns {Promise} 加载结果
 */
export function safePreloadImage(imageSrcs, options = {}) {
  const {
    timeout = 10000,
    onProgress,
    onError,
  } = options;

  const sources = Array.isArray(imageSrcs) ? imageSrcs : [imageSrcs];
  const results = {
    loaded: [],
    failed: [],
  };

  return Promise.all(
    sources.map((src) => {
      return new Promise((resolve) => {
        if (!src) {
          resolve({ src, success: false });
          return;
        }

        const img = new Image();
        let resolved = false;

        const cleanup = () => {
          if (resolved) return;
          resolved = true;
          img.onload = null;
          img.onerror = null;
        };

        const timeoutId = setTimeout(() => {
          cleanup();
          results.failed.push(src);
          if (onError) {
            try {
              onError(src);
            } catch (error) {
              console.warn('Preload error handler failed:', error);
            }
          }
          resolve({ src, success: false });
        }, timeout);

        img.onload = () => {
          cleanup();
          clearTimeout(timeoutId);
          results.loaded.push(src);
          if (onProgress) {
            try {
              onProgress(results.loaded.length, sources.length);
            } catch (error) {
              console.warn('Progress handler failed:', error);
            }
          }
          resolve({ src, success: true });
        };

        img.onerror = () => {
          cleanup();
          clearTimeout(timeoutId);
          results.failed.push(src);
          if (onError) {
            try {
              onError(src);
            } catch (error) {
              console.warn('Preload error handler failed:', error);
            }
          }
          resolve({ src, success: false });
        };

        try {
          img.src = src;
        } catch (error) {
          cleanup();
          clearTimeout(timeoutId);
          results.failed.push(src);
          resolve({ src, success: false });
        }
      });
    })
  ).then(() => results);
}

/**
 * React 组件中使用的安全图片组件属性
 */
export function getSafeImageProps(src, options = {}) {
  const {
    alt = '',
    className = '',
    style = {},
    onError,
    fallbackBackground,
    ...otherProps
  } = options;

  return {
    src,
    alt,
    className,
    style,
    onError: createSafeImageErrorHandler({ onError, fallbackBackground }),
    loading: 'lazy',
    decoding: 'async',
    ...otherProps,
  };
}

