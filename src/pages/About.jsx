(function() {
  if (typeof console === 'undefined') return;
  const isProduction = import.meta.env?.PROD || process.env.NODE_ENV === 'production';
  if (!isProduction) return;
  const suppressFBXWarning = (message) => {
    if (!message) return false;
    try {
      const msg = String(message);
      return (msg.includes('FBXLoader') && 
              msg.includes('Image type') && 
              (msg.includes('is not supported') || msg.includes('not supported'))) ||
             msg.match(/FBXLoader.*Image type.*not supported/i);
    } catch (e) {
      return false;
    }
  };
  const wrapConsoleMethod = (original, methodName) => {
    if (!original) return;
    try {
      const wrapped = function(...args) {
        try {
          const shouldSuppress = args.some(arg => suppressFBXWarning(arg));
          if (shouldSuppress) {
            return;
          }
          return original.apply(console, args);
        } catch (e) {
          return original.apply(console, args);
        }
      };
      Object.setPrototypeOf(wrapped, original);
      Object.defineProperty(wrapped, 'name', { value: methodName });
      return wrapped;
    } catch (e) {
      return original;
    }
  };
  try {
    if (console.warn) {
      const wrappedWarn = wrapConsoleMethod(console.warn, 'warn');
      if (wrappedWarn) {
        console.warn = wrappedWarn;
      }
    }
    if (console.error) {
      const wrappedError = wrapConsoleMethod(console.error, 'error');
      if (wrappedError) {
        console.error = wrappedError;
      }
    }
  } catch (e) {}
})();

import React, { useRef, useEffect, Suspense, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import Spline from '@splinetool/react-spline';
import { createSafeImageErrorHandler, safePreloadImage } from '../utils/safeImageLoader';

// 远程资源基础 URL
const REMOTE_IMAGE_BASE_URL = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/';

// 辅助函数：将本地图片路径转换为远程 URL
const getRemoteImageUrl = (localPath) => {
  if (!localPath) return localPath;
  // 提取文件名（去除前导斜杠和目录）
  const fileName = localPath.replace(/^\/[^\/]+\//, '').replace(/^\//, '');
  return `${REMOTE_IMAGE_BASE_URL}${fileName}`;
};

// 辅助函数：将本地模型/动画路径转换为远程 URL
const getRemoteModelUrl = (localPath) => {
  if (!localPath) return localPath;
  // 提取文件名（去除前导斜杠和目录）
  const fileName = localPath.replace(/^\/[^\/]+\//, '').replace(/^\//, '');
  return `${REMOTE_IMAGE_BASE_URL}${fileName}`;
};

// 修复纹理路径：将远程URL转换为本地路径
// 使用WeakSet来跟踪已经修复过的场景，防止重复修复
const fixedScenes = new WeakSet();
const textureLoader = new THREE.TextureLoader(); // 复用单个加载器实例

const fixTexturePaths = (scene) => {
  if (!scene || fixedScenes.has(scene)) return; // 已经修复过，跳过
  fixedScenes.add(scene);
  
  scene.traverse((child) => {
    if (child.isMesh && child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      
      materials.forEach((material) => {
        const textureProperties = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'];
        
        textureProperties.forEach((prop) => {
          if (material[prop]) {
            const texture = material[prop];
            const currentSrc = texture.image?.src || texture.image?.currentSrc || texture.source?.data?.src;
            
            // 检查是否是错误的远程路径（包含mixamo-mini或r2.dev/home）
            if (currentSrc && (
              currentSrc.includes('mixamo-mini') ||
              currentSrc.includes('r2.dev/home') ||
              currentSrc.includes('.fbm/')
            )) {
              // 直接移除无效纹理，使用默认材质（避免异步加载导致的问题）
              material[prop] = null;
              material.needsUpdate = true;
            }
          }
        });
      });
    }
  });
};


function Avatar({ animationPath, scale = 1.6, position = [0, -1.5, 0], onBoundingBoxCalculated, noRotation = false, rotation = null }) {
  const group = useRef();
  const mixer = useRef();
  const currentActionRef = useRef();
  
  const { scene: baseAvatar, error } = useGLTF(getRemoteModelUrl('/models/avatar.glb'));
  
  useEffect(() => {
    if (error) {
      console.warn('Avatar loading error:', error);
    }
    // 修复纹理路径（如果模型已加载）- 只执行一次
    if (baseAvatar) {
      fixTexturePaths(baseAvatar);
    }
  }, [baseAvatar]); // 移除error依赖，避免不必要的重渲染
  
  const fbx = useFBX(animationPath);
  
  const clonedAvatar = React.useMemo(() => {
    if (!baseAvatar) return null;
    
    let cloned;
    try {
      cloned = SkeletonUtils.clone(baseAvatar);
    } catch (error) {
      cloned = baseAvatar.clone(true);
    }
    
    // 修复克隆场景中的纹理路径（在useMemo中执行，只执行一次）
    fixTexturePaths(cloned);
    
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
        
        if (child.material) {
          child.material = child.material.clone();
          child.material.needsUpdate = true;
          if (child.material.transparent) {
            child.material.opacity = 1;
          }
        }
      }
      
      if (child.isSkinnedMesh && child.skeleton) {
        child.skeleton.pose();
      }
    });
    
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    
    if (onBoundingBoxCalculated) {
      onBoundingBoxCalculated(center.y);
    }
    
    return cloned;
  }, [baseAvatar]); // 移除onBoundingBoxCalculated依赖，避免不必要的重新克隆
  
  useEffect(() => {
    if (clonedAvatar && group.current) {
      try {
        mixer.current = new THREE.AnimationMixer(clonedAvatar);
      } catch (error) {
        mixer.current = null;
      }
    }
    return () => {
      if (mixer.current) {
        try {
          mixer.current.stopAllAction();
          mixer.current.uncacheRoot(mixer.current.getRoot());
          mixer.current = null;
        } catch (error) {
        }
      }
      
      // Dispose geometry and materials to prevent memory leaks
      if (clonedAvatar) {
        clonedAvatar.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => {
                  if (m) {
                    if (m.map) m.map.dispose();
                    if (m.normalMap) m.normalMap.dispose();
                    if (m.emissiveMap) m.emissiveMap.dispose();
                    m.dispose();
                  }
                });
              } else {
                if (child.material.map) child.material.map.dispose();
                if (child.material.normalMap) child.material.normalMap.dispose();
                if (child.material.emissiveMap) child.material.emissiveMap.dispose();
                child.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [clonedAvatar]);
  
  // 使用ref来跟踪当前动画路径，避免不必要的重新加载
  const currentAnimationPathRef = useRef(animationPath);
  const animationsLengthRef = useRef(0);
  
  useEffect(() => {
    if (!fbx.animations?.length || !mixer.current || !clonedAvatar) return;
    
    // 如果动画路径和长度都没变，跳过
    if (currentAnimationPathRef.current === animationPath && 
        animationsLengthRef.current === fbx.animations.length) {
      return;
    }
    
    currentAnimationPathRef.current = animationPath;
    animationsLengthRef.current = fbx.animations.length;
    
    const newAnimation = fbx.animations[0];
    if (!newAnimation || !newAnimation.tracks || newAnimation.tracks.length === 0) {
      return;
    }
    
    const boneMap = new Map();
    clonedAvatar.traverse((object) => {
      if (object.isBone) {
        boneMap.set(object.name.toLowerCase(), object);
      }
    });
    
    try {
      const retargetedClip = newAnimation.clone();
      
      retargetedClip.tracks = retargetedClip.tracks.map((track) => {
        const trackName = track.name;
        
        const boneNameMatch = trackName.match(/\.bones\[(.+?)\]\.(.+)/);
        if (!boneNameMatch) return track;
        
        const originalBoneName = boneNameMatch[1];
        const property = boneNameMatch[2];
        
        const cleanBoneName = originalBoneName.replace(/^mixamorig/i, '');
        
        const targetBone = boneMap.get(cleanBoneName.toLowerCase());
        
        if (targetBone) {
          const newTrack = track.clone();
          newTrack.name = `.bones[${targetBone.name}].${property}`;
          return newTrack;
        } else {
          const exactBone = boneMap.get(originalBoneName.toLowerCase());
          if (exactBone) {
            const newTrack = track.clone();
            newTrack.name = `.bones[${exactBone.name}].${property}`;
            return newTrack;
          }
        }
        
        return track;
      });
      
      const newAction = mixer.current.clipAction(retargetedClip);
      
      if (!newAction) {
        return;
      }
      
      newAction.setLoop(THREE.LoopRepeat);
      newAction.clampWhenFinished = false;
      newAction.enabled = true;
      
      if (currentActionRef.current && currentActionRef.current !== newAction) {
        const fadeDuration = 0.5;
        
        if (currentActionRef.current) {
          currentActionRef.current.fadeOut(fadeDuration);
        }
        
        newAction.reset()
          .setEffectiveTimeScale(1)
          .setEffectiveWeight(1)
          .fadeIn(fadeDuration)
          .play();
      } else {
        newAction.reset()
          .setEffectiveTimeScale(1)
          .setEffectiveWeight(1)
          .play();
      }
      
      currentActionRef.current = newAction;
      
      return () => {
        if (newAction) {
          newAction.fadeOut(0.3);
        }
      };
    } catch (error) {
      console.warn('Animation error:', error);
    }
  }, [animationPath, clonedAvatar]); // 移除fbx.animations依赖，使用ref跟踪
  
  const lastUpdateRef = useRef(0);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  useFrame((state, delta) => {
    if (!mixer.current) return;
    if (typeof delta !== 'number' || !isFinite(delta)) return;
    
    // Throttle updates on mobile to prevent crashes
    if (isMobile) {
      const now = Date.now();
      if (now - lastUpdateRef.current < 33) { // ~30fps on mobile instead of 60fps
        return;
      }
      lastUpdateRef.current = now;
    }
    
    try {
      mixer.current.update(delta);
    } catch (error) {
    }
  });
  
  if (!clonedAvatar) return null;
  
  const backwardRotation = noRotation ? 0 : 15 * (Math.PI / 180);
  const finalRotation = rotation !== null ? rotation : [backwardRotation, 0, 0];
  
  return (
    <group 
      ref={group} 
      position={position} 
      scale={scale} 
      rotation={finalRotation}
      dispose={null}
    >
      <primitive object={clonedAvatar} />
    </group>
  );
}

useGLTF.preload(getRemoteModelUrl('/models/avatar.glb'));

function CameraDrift() {
  const lastUpdateRef = useRef(0);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  useFrame(({ camera }) => {
    // Throttle updates on mobile to prevent crashes
    if (isMobile) {
      const now = Date.now();
      if (now - lastUpdateRef.current < 50) { // ~20fps on mobile
        return;
      }
      lastUpdateRef.current = now;
    }
    
    const time = Date.now() * 0.0001;
    camera.rotation.y = Math.sin(time * 0.1) * 0.008;
    camera.rotation.x = Math.cos(time * 0.15) * 0.005;
  });
  return null;
}


function NeonWaveBackground({ scrollProgress, sectionTrigger, fadeOffset, fadeInSpeed }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timeRef = useRef(0);
  const particlesRef = useRef([]);
  const isInitializedRef = useRef(false);
  const scrollProgressRef = useRef(scrollProgress);

  // Update scroll progress ref without triggering re-render
  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // Use fixed viewport height to prevent content shift
    const fixedHeight = fixedViewportHeight.current || window.innerHeight;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = fixedHeight;

    // Initialize particles - reduce count on mobile for better performance
    const isMobile = window.innerWidth < 768;
    const initParticles = () => {
      particlesRef.current = [];
      // Reduce particle count on mobile: divide by 50000 instead of 30000 for better performance
      const divisor = isMobile ? 50000 : 15000;
      const particleCount = Math.floor((width * height) / divisor);
      // Cap maximum particles on mobile to prevent performance issues
      const maxParticles = isMobile ? 30 : Infinity;
      for (let i = 0; i < Math.min(particleCount, maxParticles); i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.2,
          hue: Math.random() * 60 + 200 // Purple to cyan range (200-260)
        });
      }
    };

    // Only initialize particles once
    if (!isInitializedRef.current) {
      initParticles();
      isInitializedRef.current = true;
    }

    const handleResize = () => {
      // Use fixed height, only update width
      const currentFixedHeight = fixedViewportHeight.current || window.innerHeight;
      width = canvas.width = window.innerWidth;
      height = canvas.height = currentFixedHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    const drawWave = (ctx, time, offsetY, amplitude, frequency, speed, color, lineWidth) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      // Reduce shadow blur on mobile for better performance
      ctx.shadowBlur = isMobile ? 15 : 25;
      ctx.shadowColor = color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Increase step size on mobile to reduce calculations
      const stepSize = isMobile ? 2.5 : 1.5;
      for (let x = 0; x <= width; x += stepSize) {
        const wave = Math.sin((x * frequency + time * speed) * 0.01) * amplitude;
        const y = offsetY + wave;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    const drawParticles = (ctx, particles) => {
      particles.forEach(particle => {
        // Update particle position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // Draw particle with glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 60%, ${particle.opacity})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 60%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animate = () => {
      // Check if canvas still exists
      if (!canvasRef.current) return;
      
      ctx.clearRect(0, 0, width, height);
      
      // Much slower animation on mobile for better performance and battery life
      timeRef.current += isMobile ? 0.008 : 0.02;

      // Calculate opacity based on scroll - use ref to avoid dependency
      const currentScrollProgress = scrollProgressRef.current;
      const opacity = Math.min(1, Math.max(0, (currentScrollProgress - (sectionTrigger - fadeOffset)) * fadeInSpeed)) * 0.7;
      
      if (opacity > 0) {
        ctx.globalAlpha = opacity;

        // Draw multiple wave layers with different colors and speeds - clearer
        const waveColors = [
          'rgba(138, 43, 226, 0.85)',  // Purple - brighter
          'rgba(59, 130, 246, 0.8)',   // Blue - brighter
          'rgba(147, 51, 234, 0.75)',  // Violet - brighter
          'rgba(79, 70, 229, 0.7)',   // Indigo - brighter
        ];

        // Draw waves at different Y positions - reduce wave count on mobile
        const waveCount = isMobile ? 1 : 3;
        const wavePositions = isMobile 
          ? [height * 0.5]
          : [height * 0.3, height * 0.5, height * 0.7];
        wavePositions.forEach((yPos, i) => {
          const amplitude = 30 + i * 10;
          const frequency = 0.5 + i * 0.2;
          const speed = 1 + i * 0.3;
          drawWave(
            ctx,
            timeRef.current,
            yPos,
            amplitude,
            frequency,
            speed,
            waveColors[i % waveColors.length],
            2.5
          );
        });

        // Draw additional flowing waves - disable on mobile for better performance
        const additionalWaveCount = isMobile ? 0 : 3;
        for (let i = 0; i < additionalWaveCount; i++) {
          const yPos = height * 0.4 + Math.sin(timeRef.current * 0.5 + i) * 50;
          const amplitude = 25 + Math.sin(timeRef.current + i) * 10;
          drawWave(
            ctx,
            timeRef.current * (1 + i * 0.2),
            yPos,
            amplitude,
            0.4,
            1.5,
            `rgba(${100 + i * 30}, ${50 + i * 40}, ${200 + i * 20}, 0.65)`,
            2
          );
        }

        // Draw particles
        drawParticles(ctx, particlesRef.current);

        ctx.globalAlpha = 1;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Only start animation if not already running
    if (!animationFrameRef.current) {
      animate();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Clear particles to free memory
      particlesRef.current = [];
      isInitializedRef.current = false;
    };
  }, [sectionTrigger, fadeOffset, fadeInSpeed]); // Removed scrollProgress from dependencies

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
}


const throttle = (func, limit) => {
  let inThrottle;
  let timeoutId;
  const throttled = function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      timeoutId = setTimeout(() => inThrottle = false, limit);
    }
  };
  // Add cancel method for cleanup
  throttled.cancel = () => {
    clearTimeout(timeoutId);
    inThrottle = false;
  };
  return throttled;
};


const debounce = (func, wait) => {
  let timeout;
  const debounced = function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
  // Add cancel method for cleanup
  debounced.cancel = () => {
    clearTimeout(timeout);
  };
  return debounced;
};

export default function About() {
  // Fixed viewport height to prevent content shift on mobile address bar collapse
  const fixedViewportHeight = useRef(null);
  
  const [currentAnimation, setCurrentAnimation] = useState(getRemoteModelUrl('/animations/idle.fbx'));
  const [navBarTop, setNavBarTop] = useState(16); // Dynamic navigation bar top position
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        // Use the maximum height to account for address bar
        const windowHeight = window.innerHeight || 800;
        const visualViewportHeight = window.visualViewport ? window.visualViewport.height : windowHeight;
        const initialHeight = Math.max(windowHeight, visualViewportHeight || windowHeight);
        // Set fixed height on initial load
        fixedViewportHeight.current = initialHeight;
        return { width: window.innerWidth || 1920, height: initialHeight };
      } catch (error) {
        return { width: 1920, height: 1080 };
      }
    }
    return { width: 1920, height: 1080 };
  });
  
  // Comprehensive device and browser detection
  const deviceInfo = useMemo(() => {
    try {
      const width = windowSize.width;
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
      const platform = typeof navigator !== 'undefined' ? navigator.platform.toLowerCase() : '';
      
      // Device type detection
      let deviceType = 'desktop';
      if (width < 640) {
        deviceType = 'mobile';
      } else if (width >= 640 && width < 1024) {
        deviceType = 'tablet';
      }
      
      // Browser detection
      let browser = 'unknown';
      let browserVersion = 0;
      if (ua.includes('chrome') && !ua.includes('edg')) {
        browser = 'chrome';
        const match = ua.match(/chrome\/(\d+)/);
        browserVersion = match ? parseInt(match[1]) : 0;
      } else if (ua.includes('safari') && !ua.includes('chrome')) {
        browser = 'safari';
        const match = ua.match(/version\/(\d+)/);
        browserVersion = match ? parseInt(match[1]) : 0;
      } else if (ua.includes('firefox')) {
        browser = 'firefox';
        const match = ua.match(/firefox\/(\d+)/);
        browserVersion = match ? parseInt(match[1]) : 0;
      } else if (ua.includes('edg')) {
        browser = 'edge';
        const match = ua.match(/edg\/(\d+)/);
        browserVersion = match ? parseInt(match[1]) : 0;
      }
      
      // OS detection
      let os = 'unknown';
      if (ua.includes('android')) os = 'android';
      else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) os = 'ios';
      else if (ua.includes('mac')) os = 'macos';
      else if (ua.includes('win')) os = 'windows';
      else if (ua.includes('linux')) os = 'linux';
      
      // Performance tier detection (based on hardware concurrency, memory hints, and device type)
      let performanceTier = 'high'; // Default to high for desktop
      if (deviceType === 'mobile') {
        // Check for low-end device indicators
        const hardwareConcurrency = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;
        const deviceMemory = typeof navigator !== 'undefined' ? (navigator.deviceMemory || 4) : 4;
        
        // Low-end: < 4 cores or < 4GB RAM
        if (hardwareConcurrency < 4 || deviceMemory < 4) {
          performanceTier = 'low';
        } 
        // Mid-range: 4-6 cores or 4-6GB RAM
        else if (hardwareConcurrency <= 6 && deviceMemory <= 6) {
          performanceTier = 'medium';
        }
        // High-end: > 6 cores and > 6GB RAM
        else {
          performanceTier = 'high';
        }
        
        // Additional checks for known low-end devices
        if (ua.includes('android') && (ua.includes('go edition') || ua.includes('lite'))) {
          performanceTier = 'low';
        }
      } else if (deviceType === 'tablet') {
        performanceTier = 'medium'; // Tablets are generally medium performance
      }
      
      // Safari-specific optimizations (especially iOS Safari)
      const isSafari = browser === 'safari';
      const isIOSSafari = isSafari && os === 'ios';
      const isAndroid = os === 'android';
      
      return {
        deviceType,
        browser,
        browserVersion,
        os,
        performanceTier, // 'low', 'medium', 'high'
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop',
        isSafari,
        isIOSSafari,
        isAndroid,
        isChrome: browser === 'chrome',
        isFirefox: browser === 'firefox',
        isEdge: browser === 'edge',
        // Performance flags
        shouldReduceAnimations: performanceTier === 'low' || (deviceType === 'mobile' && performanceTier === 'medium'),
        shouldDisable3D: performanceTier === 'low',
        shouldLazyLoadImages: deviceType === 'mobile' || performanceTier === 'low' || performanceTier === 'medium',
        shouldReduceParticles: performanceTier === 'low' || deviceType === 'mobile',
        shouldOptimizeVideo: deviceType === 'mobile' || isIOSSafari,
        maxConcurrentImageLoads: performanceTier === 'low' ? 1 : performanceTier === 'medium' ? 2 : deviceType === 'mobile' ? 2 : 6,
        imageLoadDelay: performanceTier === 'low' ? 500 : performanceTier === 'medium' ? 300 : deviceType === 'mobile' ? 200 : 0,
        scrollThrottle: performanceTier === 'low' ? 200 : performanceTier === 'medium' ? 100 : deviceType === 'mobile' ? 100 : 16,
        animationFrameRate: performanceTier === 'low' ? 20 : performanceTier === 'medium' ? 30 : deviceType === 'mobile' ? 30 : 60
      };
    } catch (error) {
      // Fallback to safe defaults
      return {
        deviceType: 'desktop',
        browser: 'unknown',
        browserVersion: 0,
        os: 'unknown',
        performanceTier: 'medium',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isSafari: false,
        isIOSSafari: false,
        isAndroid: false,
        isChrome: false,
        isFirefox: false,
        isEdge: false,
        shouldReduceAnimations: false,
        shouldDisable3D: false,
        shouldLazyLoadImages: false,
        shouldReduceParticles: false,
        shouldOptimizeVideo: false,
        maxConcurrentImageLoads: 6,
        imageLoadDelay: 0,
        scrollThrottle: 16,
        animationFrameRate: 60
      };
    }
  }, [windowSize.width]);
  
  // Extract commonly used properties for backward compatibility
  const isMobile = deviceInfo.isMobile;
  const isTablet = deviceInfo.isTablet;
  const isDesktop = deviceInfo.isDesktop;
  
  // Proportional scaling helper for Sing Out Voices section
  // Interpolates between mobile and desktop values for tablet sizes (640px - 1024px)
  const interpolateValue = useMemo(() => {
    return (mobileValue, desktopValue) => {
      const width = windowSize.width;
      if (width < 640) return mobileValue; // Mobile: use mobile value
      if (width >= 1024) return desktopValue; // Desktop: use desktop value
      // Tablet: interpolate between mobile and desktop
      const progress = (width - 640) / (1024 - 640); // 0 to 1
      if (typeof mobileValue === 'number' && typeof desktopValue === 'number') {
        return mobileValue + (desktopValue - mobileValue) * progress;
      }
      // For string values like 'clamp()', return desktop for tablet
      return desktopValue;
    };
  }, [windowSize.width]);
  
  const [modelCenterY, setModelCenterY] = useState(0);
  const [singingModelCenterY, setSingingModelCenterY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const previousScrollProgress = useRef(0);
  const scrollDirection = useRef('down'); // 'up' or 'down'
  const lastVideoCheckProgress = useRef(0);
  
  const [modelsVisible, setModelsVisible] = useState(false);
  const [mainTitleVisible, setMainTitleVisible] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [hasEnteredMusicSection, setHasEnteredMusicSection] = useState(false);
  const [titleTypingText, setTitleTypingText] = useState('');
  const [titleComplete, setTitleComplete] = useState(false);
  const [subtitlePrefixVisible, setSubtitlePrefixVisible] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [currentIdentityIndex, setCurrentIdentityIndex] = useState(0);
  const [pageOpacity, setPageOpacity] = useState(1); // Start at 1 to prevent initial flash
  const [pageReady, setPageReady] = useState(true); // Start ready to prevent delays
  const [scriptVisible, setScriptVisible] = useState(false);
  const [galleryScroll, setGalleryScroll] = useState(0);
  const [hoveredGalleryItem, setHoveredGalleryItem] = useState(null);
  const [galleryImagesPreloaded, setGalleryImagesPreloaded] = useState(false);
  const galleryPreloadRef = useRef(false);
  
  // Interests carousel state
  const [carouselRotation, setCarouselRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dragStartRotation = useRef(0);
  const lastClickTime = useRef(0);
  const dragDistance = useRef(0);
  const carouselRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastRotationTime = useRef(0);
  const animationTimerRef = useRef(null);
  
  const containerRef = useRef(null);
  const galleryRef = useRef(null);
  const travelVideoRef = useRef(null);
  const developVideoRef = useRef(null);
  const competeVideoRef = useRef(null);
  const musicVideoRef = useRef(null);
  const musicAudioRef = useRef(null);
  const galleryScrollThrottleRef = useRef(0);
  
  const titleText = 'Hi, I am Jijun Nie';
  
  const identities = [
    'UF Sophomore Student',
    'Web Developer',
    'Scrum Master',
    'Polymathic Integrator',
    'Proactive, action-oriented hard worker',
    'Photography Enthusiast',
    'Music Lover',
    'Singer',
    'Sport Enthusiast',
    'Competitive Gamer',
    'Creative Thinker'
  ];
  
  useFBX(getRemoteModelUrl('/animations/idle.fbx'));
  useFBX(getRemoteModelUrl('/animations/Waving.fbx'));
  useFBX(getRemoteModelUrl('/animations/Singing.fbx'));
  
  // Define all icons from icons2 folder (all PNG files)
  const learningIcons = [
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/asana.png', name: 'Asana' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/three.js.png', name: 'Three.js' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/google.png', name: 'Google' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/capcut.png', name: 'CapCut' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/solidwork.png', name: 'SolidWorks' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/chatgpt.png', name: 'ChatGPT' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/claude.png', name: 'Claude' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/coursera.png', name: 'Coursera' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/cursor.png', name: 'Cursor' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/dji.png', name: 'DJI' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/canva.png', name: 'Canva' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/jimengai.png', name: 'JiMengAI' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/microsoft.png', name: 'Microsoft' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/vite.png', name: 'Vite' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/react.png', name: 'React' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/spline.png', name: 'Spline' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/chanjing.png', name: 'ChanJing' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/meitu.png', name: 'Meitu' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/blender.png', name: 'Blender' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/SQL.png', name: 'SQL' },
    { url: 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/vscode.png', name: 'VS Code' },
  ];
  
  // Sing Out Voices carousel images
  const carouselImages = useMemo(() => [
    getRemoteImageUrl('/images/sing1.jpg'),
    getRemoteImageUrl('/images/sing2.JPG'),
    getRemoteImageUrl('/images/sing3.JPG'),
    getRemoteImageUrl('/images/sing4.jpg'),
    getRemoteImageUrl('/images/sing5.JPG'),
    getRemoteImageUrl('/images/sing6.jpg'),
    getRemoteImageUrl('/images/sing7.jpg')
  ], []);
  
  // Capture the Beauty gallery images - all 28 images with metadata
  const galleryItems = useMemo(() => [
    { title: 'Photo 1', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/1.jpg'), location: 'Daytona Beach, Florida' },
    { title: 'Photo 2', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/2.jpg'), location: 'Marina Bay Sands, Singapore' },
    { title: 'Photo 3', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/3.JPG'), location: 'Niagara Falls, Canada' },
    { title: 'Photo 4', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/4.jpg'), location: '大三巴, Macau' },
    { title: 'Photo 5', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/5.JPG'), location: 'Gardens by the Bay, Singapore' },
    { title: 'Photo 6', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/6.JPG'), location: 'My Home, South Florida' },
    { title: 'Photo 7', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/7.jpg.JPG'), location: 'Universal Studios Singapore' },
    { title: 'Photo 8', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/8.jpg'), location: '九寨沟, Sichuan' },
    { title: 'Photo 9', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/9.jpg'), location: 'Bayside Marketplace, Miami' },
    { title: 'Photo 10', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/10.jpg'), location: '佛山, 广东' },
    { title: 'Photo 11', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/11.jpg'), location: 'Random Library, 佛山' },
    { title: 'Photo 12', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/12.JPG'), location: 'My Home, South Florida' },
    { title: 'Photo 13', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/13.JPG'), location: 'Deerfield Beach, Florida' },
    { title: 'Photo 14', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/14.jpg'), location: 'Manhattan, New York' },
    { title: 'Photo 15', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/15.JPG'), location: 'Everglades, Florida' },
    { title: 'Photo 16', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/16.jpg'), location: 'Marina Bay Sands, Singapore' },
    { title: 'Photo 17', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/17.jpg'), location: 'Marina Bay Sands, Singapore' },
    { title: 'Photo 18', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/18.JPG'), location: 'Daytona Beach, Florida' },
    { title: 'Photo 19', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/19.JPG'), location: 'Niagara Falls, Canada' },
    { title: 'Photo 20', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/20.JPG'), location: 'Downtown Miami' },
    { title: 'Photo 21', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/21.JPG'), location: 'Everglades, Florida' },
    { title: 'Photo 22', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/22.jpg'), location: 'Kuala Lumpur, Malaysia' },
    { title: 'Photo 23', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/23.JPG'), location: 'Boca Raton, Florida' },
    { title: 'Photo 24', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/24.JPG'), location: 'Fort Canning Park, Singapore' },
    { title: 'Photo 25', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/25.JPG'), location: 'South Beach, Florida' },
    { title: 'Photo 26', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/26.JPG'), location: 'Toronto, Canada' },
    { title: 'Photo 27', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/27.png'), location: '香格里拉, 云南' },
    { title: 'Photo 28', description: 'Capturing the beauty of moments', image: getRemoteImageUrl('/aboutImage/28.JPG'), location: '香格里拉, 云南' },
  ], []);
  
  // Extract just the image URLs for preloading
  const galleryImages = useMemo(() => galleryItems.map(item => item.image), [galleryItems]);
  
  const carouselItemsCount = carouselImages.length;
  const angleStep = 360 / carouselItemsCount;
  
  // Responsive values for interests carousel - redesigned for tablet
  const responsiveCarousel = useMemo(() => {
    return {
      carouselRadius: isMobile ? 200 : isTablet ? 280 : 240,
      cardWidth: isMobile ? 120 : isTablet ? 150 : 110,
      cardHeight: isMobile ? 160 : isTablet ? 200 : 150,
      carouselHeight: isMobile ? 200 : isTablet ? 250 : 200,
      avatarScale: isMobile ? 2.4 : isTablet ? 3.2 : 3.6,
      avatarPosition: isMobile ? [0, -2.5, 0] : isTablet ? [0, -2.8, 0] : [0, -2.7, 0],
      cameraPosition: isMobile ? [0, 0.8, 3.5] : isTablet ? [0, 1.0, 4.2] : [0, 1, 4.5],
      cameraFov: isMobile ? 55 : isTablet ? 50 : 50,
    };
  }, [deviceInfo]);
  
  // Preload gallery images with concurrency control based on device and browser
  const preloadGalleryImages = useCallback(() => {
    if (galleryPreloadRef.current) return; // Already started
    galleryPreloadRef.current = true;
    
    // Use device-specific settings - increase concurrency for faster loading
    const CONCURRENT_LOADS = deviceInfo.performanceTier === 'low' ? 3 :
                             deviceInfo.performanceTier === 'medium' ? 5 :
                             deviceInfo.isMobile ? 4 : 8; // Increased for faster preloading
    const BATCH_DELAY = deviceInfo.performanceTier === 'low' ? 300 : 
                       deviceInfo.performanceTier === 'medium' ? 200 : 
                       deviceInfo.isMobile ? 150 : 50; // Reduced delays for faster loading
    const TIMEOUT = deviceInfo.performanceTier === 'low' ? 15000 : 10000;
    
    let currentIndex = 0;
    const loadedImages = new Set();
    const failedImages = new Set();
    const totalImages = galleryImages.length;
    
    const loadImage = (src, index) => {
      return new Promise((resolve) => {
        // Skip if already loaded or failed
        if (loadedImages.has(src) || failedImages.has(src)) {
          resolve();
          return;
        }
        
        // Create image element for preloading
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const timeoutId = setTimeout(() => {
          failedImages.add(src);
          resolve();
        }, TIMEOUT);
        
        img.onload = () => {
          clearTimeout(timeoutId);
          loadedImages.add(src);
          resolve();
        };
        
        img.onerror = () => {
          clearTimeout(timeoutId);
          failedImages.add(src);
          resolve();
        };
        
        // Start loading
        img.src = src;
      });
    };
    
    let isMounted = true;
    let timeoutId = null;
    
    const loadBatch = async () => {
      if (!isMounted) return;
      
      const batch = [];
      const endIndex = Math.min(currentIndex + CONCURRENT_LOADS, totalImages);
      
      for (let i = currentIndex; i < endIndex; i++) {
        batch.push(loadImage(galleryImages[i], i));
      }
      
      await Promise.all(batch);
      
      if (!isMounted) return;
      
      currentIndex = endIndex;
      
      if (currentIndex < totalImages && isMounted) {
        timeoutId = setTimeout(loadBatch, BATCH_DELAY);
      } else if (isMounted) {
        // All images loaded (or attempted)
        setGalleryImagesPreloaded(true);
        console.debug(`Gallery preload complete: ${loadedImages.size}/${totalImages} images loaded`);
      }
    };
    
    // Start preloading immediately - no delay for better UX
    requestAnimationFrame(() => {
      if (isMounted) {
        loadBatch();
      }
    });
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, [galleryImages, deviceInfo]);
  
  useEffect(() => {
    // Page is already ready and visible (initialized in state)
    // Optimize 3D model loading for smooth initial animation
    if (deviceInfo.shouldDisable3D) {
      // Low-end devices: disable 3D models completely
      setModelsVisible(false);
    } else if (deviceInfo.performanceTier === 'low' || deviceInfo.isMobile) {
      // Low-end or mobile: delay 3D models but reduce delay for better UX
      const delay = deviceInfo.performanceTier === 'low' ? 1000 : deviceInfo.isMobile ? 200 : 100;
      // Use requestIdleCallback if available for better performance
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
          setTimeout(() => {
            try {
              setModelsVisible(true);
            } catch (error) {
            }
          }, delay);
        }, { timeout: 500 });
      } else {
        setTimeout(() => {
          try {
            setModelsVisible(true);
          } catch (error) {
          }
        }, delay);
      }
    } else {
      // Desktop/High-end: load immediately for smooth hero animation
      // Use requestIdleCallback to avoid blocking initial render
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
          requestAnimationFrame(() => {
            try {
              setModelsVisible(true);
            } catch (error) {
            }
          });
        }, { timeout: 100 });
      } else {
        requestAnimationFrame(() => {
          try {
            setModelsVisible(true);
          } catch (error) {
          }
        });
      }
    }
  }, [deviceInfo]);
  
  const titleTypingRef = useRef({ currentIndex: 0, timeoutId: null, timerId: null });
  
  useEffect(() => {
    if (!mainTitleVisible) return;
    
    titleTypingRef.current.currentIndex = 0;
    setTitleTypingText('');
    setTitleComplete(false);
    
    const typeTitle = () => {
      const state = titleTypingRef.current;
      if (state.currentIndex < titleText.length) {
        setTitleTypingText(titleText.slice(0, state.currentIndex + 1));
        state.currentIndex++;
        // Use requestAnimationFrame for smoother typing animation
        state.timeoutId = setTimeout(() => {
          requestAnimationFrame(typeTitle);
        }, 50);
      } else {
        setTitleComplete(true);
      }
    };
    
    // Start typing animation after a brief delay to ensure smooth fade-in completes
    // Use double requestAnimationFrame for smoother start
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const timer = setTimeout(() => {
          requestAnimationFrame(typeTitle);
        }, 150);
        titleTypingRef.current.timerId = timer;
      });
    });
    
    return () => {
      cancelAnimationFrame(rafId);
      if (titleTypingRef.current.timeoutId) {
        clearTimeout(titleTypingRef.current.timeoutId);
      }
      if (titleTypingRef.current.timerId) {
        clearTimeout(titleTypingRef.current.timerId);
      }
    };
  }, [mainTitleVisible]);
  
  useEffect(() => {
    // Show title immediately for smooth hero animation
    // Use double requestAnimationFrame to ensure it happens after browser completes initial render
    // This prevents layout shifts and ensures smooth animation start
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMainTitleVisible(true);
      });
    });
  }, []);
  
  useEffect(() => {
    if (titleComplete) {
      setSubtitlePrefixVisible(true);
    }
  }, [titleComplete]);
  
  useEffect(() => {
    if (subtitlePrefixVisible) {
      const timer = setTimeout(() => {
        setScriptVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [subtitlePrefixVisible]);
  
  useEffect(() => {
    // Disable mouse tracking on mobile/tablet or low-performance devices to improve performance
    if (deviceInfo.isMobile || deviceInfo.isTablet || deviceInfo.performanceTier === 'low') {
      return; // Disable mouse tracking on mobile/tablet/low-end devices
    }
    
    const throttleTime = deviceInfo.performanceTier === 'medium' ? 32 : 16; // ~30fps for medium, ~60fps for high
    const handleMouseMove = throttle((e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      // Use fixed viewport height to prevent content shift
      const fixedHeight = fixedViewportHeight.current || window.innerHeight;
      const y = (e.clientY / fixedHeight - 0.5) * 2;
      setMousePosition({ x, y });
    }, throttleTime);
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      // Cancel throttle if it has cancel method
      if (handleMouseMove.cancel) {
        handleMouseMove.cancel();
      }
    };
  }, [deviceInfo]);
  
  // Start preloading gallery images immediately on page load
  // This ensures all images are ready when user reaches the "Capture the Beauty" section
  useEffect(() => {
    // Start preloading immediately after initial render
    // Use requestIdleCallback if available for better performance, otherwise use requestAnimationFrame
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        preloadGalleryImages();
      }, { timeout: 1000 }); // Start within 1 second even if browser is busy
    } else {
      // Fallback: start after a very short delay to not block initial render
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          preloadGalleryImages();
        });
      });
    }
  }, [preloadGalleryImages]);
  
  // Preload sport background images
  useEffect(() => {
    const preloadSportImages = () => {
      const horizontalImg = new Image();
      const verticalImg = new Image();
      horizontalImg.src = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/sport horizontal.jpg';
      verticalImg.src = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/sport vertical.jpg';
      
      // Handle load errors
      horizontalImg.onerror = () => {};
      verticalImg.onerror = () => console.warn('Failed to load sport vertical.jpg');
    };
    
    // Preload after a short delay to not interfere with initial page load
    setTimeout(preloadSportImages, 1000);
  }, []);
  
  // 使用ref存储deviceInfo，避免依赖变化导致重新设置监听器
  const deviceInfoRef = useRef(deviceInfo);
  useEffect(() => {
    deviceInfoRef.current = deviceInfo;
  }, [deviceInfo]);
  
  useEffect(() => {
    const rafIdRef = { current: null };
    let ticking = false;
    let isMounted = true;
    
    let lastUpdateTime = 0;
    
    const updateScrollProgress = () => {
      try {
        if (!isMounted || !containerRef.current) {
          ticking = false;
          return;
        }
        
        // Throttle updates based on device performance to prevent crashes
        const now = Date.now();
        const throttleMs = deviceInfoRef.current.scrollThrottle;
        if (now - lastUpdateTime < throttleMs) {
          ticking = false;
          return;
        }
        lastUpdateTime = now;
        
        const scrollTop = window.scrollY || 0;
        // Use fixed viewport height to prevent content shift
        const fixedHeight = fixedViewportHeight.current || window.innerHeight || 800;
        const docHeight = Math.max(0, (document.documentElement.scrollHeight || 0) - fixedHeight);
        
        // Validate all calculations to prevent NaN
        if (!isFinite(scrollTop) || !isFinite(fixedHeight) || !isFinite(docHeight)) {
          ticking = false;
          return;
        }
        
        // Prevent division by zero and NaN
        const progress = docHeight > 0 ? Math.min(Math.max(0, scrollTop / docHeight), 1) : 0;
        
        // Extra safety check for NaN
        if (!isFinite(progress) || isNaN(progress)) {
          ticking = false;
          return;
        }
        
        const progressThreshold = deviceInfoRef.current.performanceTier === 'low' ? 0.02 :
                                 deviceInfoRef.current.performanceTier === 'medium' ? 0.015 :
                                 deviceInfoRef.current.isMobile ? 0.01 : 0.001;
        const progressDiff = Math.abs(progress - previousScrollProgress.current);
        if (progressDiff < progressThreshold) {
          ticking = false;
          return;
        }
        
        if (progress < previousScrollProgress.current) {
          scrollDirection.current = 'up';
        } else if (progress > previousScrollProgress.current) {
          scrollDirection.current = 'down';
        }
        previousScrollProgress.current = progress;
        try {
          // Validate progress value before setting state
          if (typeof progress === 'number' && isFinite(progress) && !isNaN(progress)) {
            setScrollProgress(progress);
          } else {
            ticking = false;
            return;
          }
        } catch (error) {
          ticking = false;
          console.debug('setScrollProgress error:', error);
          return;
        }
        
        ticking = false;
        rafIdRef.current = null;
      } catch (error) {
        console.error('Error in updateScrollProgress:', error);
        ticking = false;
        rafIdRef.current = null;
      }
    };
    
    const handleScroll = () => {
      try {
        if (!isMounted || ticking) return;
        
        // Additional safety check for mobile
        const isMobile = deviceInfoRef.current.isMobile;
        if (isMobile) {
          // On mobile, add extra validation to prevent crashes
          if (typeof window === 'undefined' || !window.document) return;
        }
        
        ticking = true;
        if (rafIdRef.current) {
          try {
            cancelAnimationFrame(rafIdRef.current);
          } catch (error) {
            console.debug('Cancel animation frame error:', error);
          }
        }
        
        try {
          rafIdRef.current = requestAnimationFrame(updateScrollProgress);
        } catch (error) {
          console.debug('Request animation frame error:', error);
          ticking = false;
        }
      } catch (error) {
        ticking = false;
        console.debug('Scroll handler error:', error);
      }
    };
    const throttleTime = deviceInfoRef.current.scrollThrottle;
    const throttledHandleScroll = throttle(handleScroll, throttleTime);
    try {
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('scroll', throttledHandleScroll, { passive: true });
        // Initialize scroll immediately for smooth hero animation
        // Use requestAnimationFrame to avoid blocking initial render
        requestAnimationFrame(() => {
          try {
            if (isMounted) {
              handleScroll();
            }
          } catch (error) {
            console.debug('Initial scroll handler error:', error);
          }
        });
      }
    } catch (error) {
      console.debug('Scroll listener setup error:', error);
    }
    
    return () => {
      try {
        isMounted = false;
        window.removeEventListener('scroll', throttledHandleScroll);
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        if (throttledHandleScroll && throttledHandleScroll.cancel) {
          throttledHandleScroll.cancel();
        }
        ticking = false;
      } catch (error) {
        console.warn('Error cleaning up scroll listener:', error);
      }
    };
  }, []); // 移除依赖，只在组件挂载时设置一次
  
  const typingStateRef = useRef({
    currentCharIndex: 0,
    isDeleting: false,
    identityIndex: 0,
    timeoutId: null
  });
  
  useEffect(() => {
    if (!subtitlePrefixVisible) return;
    
    const state = typingStateRef.current;
    
    const typeCharacter = () => {
      const currentIdentity = identities[state.identityIndex];
      
      if (!state.isDeleting) {
        if (state.currentCharIndex < currentIdentity.length) {
          const char = currentIdentity[state.currentCharIndex];
          setTypingText(prev => prev + char);
          state.currentCharIndex++;
          
          const charDelay = 80;
          state.timeoutId = setTimeout(typeCharacter, charDelay);
        } else {
          state.timeoutId = setTimeout(() => {
            state.isDeleting = true;
            state.currentCharIndex = currentIdentity.length;
            typeCharacter();
          }, 900);
        }
      } else {
        if (state.currentCharIndex > 0) {
          setTypingText(prev => prev.slice(0, -1));
          state.currentCharIndex--;
          state.timeoutId = setTimeout(typeCharacter, 50);
        } else {
          state.timeoutId = setTimeout(() => {
            state.isDeleting = false;
            state.identityIndex = (state.identityIndex + 1) % identities.length;
            setCurrentIdentityIndex(state.identityIndex);
            
            state.timeoutId = setTimeout(() => {
              state.currentCharIndex = 0;
              typeCharacter();
            }, 300);
          }, 300);
        }
      }
    };
    
    const initialTimeout = setTimeout(() => {
      typeCharacter();
    }, 400);
    return () => {
      clearTimeout(initialTimeout);
      if (state.timeoutId) clearTimeout(state.timeoutId);
    };
  }, [subtitlePrefixVisible]);
  
  // Set viewport height and handle mobile address bar collapse - iOS Safari fix
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // More accurate iOS detection
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                   !window.MSStream; // Exclude IE
      const isIOSStandalone = window.navigator.standalone === true;
      
      // Lock viewport height on first load - use the largest initial height
      const lockInitialViewportHeight = () => {
        try {
          let initialHeight;
          
          // Get the maximum height to account for address bar
          const windowHeight = window.innerHeight || 800;
          const visualViewportHeight = window.visualViewport ? (window.visualViewport.height || windowHeight) : windowHeight;
          
          // Use the larger value to ensure content is visible
          initialHeight = Math.max(windowHeight, visualViewportHeight || windowHeight);
          
          // Only set once on initial load
          if (fixedViewportHeight.current === null && initialHeight > 0) {
            fixedViewportHeight.current = initialHeight;
            const vh = initialHeight * 0.01;
            
            // Set CSS variables with error handling
            try {
              if (document && document.documentElement) {
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                document.documentElement.style.setProperty('--fixed-vh', `${vh}px`);
                document.documentElement.style.setProperty('--fixed-vh-px', `${initialHeight}px`);
              }
            } catch (cssError) {
              console.error('Error setting CSS variables:', cssError);
            }
            
            // Update window size state
            try {
              setWindowSize({ width: window.innerWidth || 1920, height: initialHeight });
            } catch (stateError) {
              console.error('Error updating window size:', stateError);
            }
            
            // Only apply fixed body on iOS Safari (not other mobile browsers)
            if (isIOS && !isIOSStandalone) {
              try {
                const root = document.getElementById('root');
                if (root) {
                  root.style.height = `${initialHeight}px`;
                  root.style.overflowY = 'auto';
                  root.style.WebkitOverflowScrolling = 'touch';
                }
              } catch (rootError) {
                console.error('Error setting root styles:', rootError);
              }
            }
          }
        } catch (error) {
          console.error('Error in lockInitialViewportHeight:', error);
          // Fallback to safe defaults
          if (fixedViewportHeight.current === null) {
            fixedViewportHeight.current = 800;
            try {
              setWindowSize({ width: window.innerWidth || 1920, height: 800 });
            } catch (e) {
              // Silently fail if state update fails
            }
          }
        }
      };
      
      // Set immediately on mount
      lockInitialViewportHeight();
      
      // Set again after short delay for better browser compatibility
      // Reduced timeout frequency on mobile to prevent excessive updates
      const timeoutId = setTimeout(lockInitialViewportHeight, isIOS ? 200 : 100);
      const timeoutId2 = setTimeout(lockInitialViewportHeight, isIOS ? 500 : 300);
      
      // Function to recalculate navigation bar position based on current viewport
      const recalculateNavBarPosition = () => {
        try {
          const currentWidth = window.innerWidth || 1920;
          const currentViewportHeight = window.visualViewport 
            ? window.visualViewport.height 
            : window.innerHeight;
          const maxViewportHeight = Math.max(
            window.innerHeight || 800,
            currentViewportHeight || 800
          );
          
          // Calculate safe area insets for notched devices
          const safeAreaTop = typeof CSS !== 'undefined' && CSS.supports('padding', 'env(safe-area-inset-top)')
            ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0')
            : 0;
          
          // Base top position: responsive based on screen size
          let baseTop = 8; // mobile (top-2)
          if (currentWidth >= 640) baseTop = 12; // sm (top-3)
          if (currentWidth >= 768) baseTop = 16; // md+ (top-4)
          
          // Adjust for address bar collapse/expand
          // When address bar is visible (smaller viewport), add more top spacing
          // When address bar is hidden (larger viewport), use base spacing
          const viewportDiff = maxViewportHeight - currentViewportHeight;
          const addressBarHeight = Math.max(0, viewportDiff);
          
          // Calculate final top position
          // Add safe area inset and slight adjustment for address bar state
          const finalTop = baseTop + safeAreaTop + (addressBarHeight > 50 ? 2 : 0);
          
          setNavBarTop(finalTop);
          
          // Update navigation bar position in DOM via CSS variable
          // This ensures the nav bar in App.jsx uses the correct position
          try {
            const navElement = document.querySelector('nav[class*="fixed"]');
            if (navElement) {
              navElement.style.top = `${finalTop}px`;
            }
            // Also set CSS variable for consistency
            document.documentElement.style.setProperty('--nav-bar-top', `${finalTop}px`);
          } catch (domError) {
            // Silently fail if DOM update fails
          }
        } catch (error) {
          console.error('Error recalculating nav bar position:', error);
          // Fallback to base position
          const currentWidth = window.innerWidth || 1920;
          const baseTop = currentWidth >= 768 ? 16 : currentWidth >= 640 ? 12 : 8;
          setNavBarTop(baseTop);
          try {
            const navElement = document.querySelector('nav[class*="fixed"]');
            if (navElement) {
              navElement.style.top = `${baseTop}px`;
            }
            document.documentElement.style.setProperty('--nav-bar-top', `${baseTop}px`);
          } catch (domError) {
            // Silently fail
          }
        }
      };
      
      // Initial calculation
      recalculateNavBarPosition();
      
      // On iOS, listen to scroll end to restore touch targets
      let scrollEndTimer = null;
      let isScrolling = false;
      const handleScrollEnd = () => {
        if (isScrolling) return; // Prevent multiple simultaneous calls
        isScrolling = true;
        clearTimeout(scrollEndTimer);
        scrollEndTimer = setTimeout(() => {
          try {
            // Force reflow to restore touch targets after address bar movement
            if (isIOS && document.body) {
              document.body.style.transform = 'translate3d(0,0,0)';
              // Trigger reflow
              void document.body.offsetHeight;
              document.body.style.transform = '';
            }
          } catch (error) {
            console.error('Error in handleScrollEnd:', error);
          } finally {
            isScrolling = false;
          }
        }, 200); // Increased from 150 to 200 for better stability
      };
      
      if (isIOS) {
        window.addEventListener('scroll', handleScrollEnd, { passive: true });
        // Also listen to visualViewport changes
        if (window.visualViewport) {
          window.visualViewport.addEventListener('scroll', handleScrollEnd, { passive: true });
        }
      }
      
      // Listen to visualViewport resize events to recalculate nav bar position
      const handleViewportResize = () => {
        recalculateNavBarPosition();
      };
      
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportResize, { passive: true });
        window.visualViewport.addEventListener('scroll', handleViewportResize, { passive: true });
      }
      
      // Also listen to window resize for non-visualViewport browsers
      const handleWindowResize = debounce(() => {
        recalculateNavBarPosition();
      }, 100);
      
      window.addEventListener('resize', handleWindowResize, { passive: true });
      
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(timeoutId2);
        clearTimeout(scrollEndTimer);
        if (isIOS) {
          window.removeEventListener('scroll', handleScrollEnd);
          if (window.visualViewport) {
            window.visualViewport.removeEventListener('scroll', handleScrollEnd);
          }
        }
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportResize);
          window.visualViewport.removeEventListener('scroll', handleViewportResize);
        }
        window.removeEventListener('resize', handleWindowResize);
        // Cancel debounce if it has cancel method
        if (handleWindowResize.cancel) {
          handleWindowResize.cancel();
        }
      };
    }
  }, [windowSize.width]);
  
  // Ensure navigation bar is always visible when scrolling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const ensureNavBarVisible = () => {
      try {
        const navElement = document.querySelector('nav[class*="fixed"]');
        if (!navElement) return;
        
        const navRect = navElement.getBoundingClientRect();
        const viewportHeight = window.visualViewport 
          ? window.visualViewport.height 
          : window.innerHeight;
        
        // Check if nav bar is out of viewport (scrolled past)
        const isNavBarVisible = navRect.top >= 0 && navRect.top < viewportHeight;
        
        // If nav bar is not visible, ensure it's positioned correctly
        // The nav bar is fixed, so we just need to ensure its top value is correct
        if (!isNavBarVisible && navRect.top < 0) {
          // Nav bar scrolled above viewport - this shouldn't happen with fixed positioning
          // But we ensure it's at the correct position
          const currentTop = parseInt(navElement.style.top) || navBarTop;
          if (currentTop !== navBarTop) {
            navElement.style.top = `${navBarTop}px`;
          }
        }
        
        // Ensure nav bar has high z-index to stay on top
        if (parseInt(navElement.style.zIndex) < 50) {
          navElement.style.zIndex = '50';
        }
      } catch (error) {
        // Silently fail
      }
    };
    
    // Check on scroll
    const handleScroll = () => {
      ensureNavBarVisible();
    };
    
    // Throttle scroll events for performance
    let scrollTimeout = null;
    const throttledScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
      }, 16); // ~60fps
    };
    
    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    // Also check on visualViewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('scroll', throttledScroll, { passive: true });
      window.visualViewport.addEventListener('resize', throttledScroll, { passive: true });
    }
    
    // Initial check
    ensureNavBarVisible();
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('scroll', throttledScroll);
        window.visualViewport.removeEventListener('resize', throttledScroll);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [navBarTop]);
  
  const resizeHandlerRef = useRef(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use fixed height, only update width on resize
      const currentHeight = fixedViewportHeight.current || window.innerHeight;
      setWindowSize(prev => {
        // Only update if width changed to prevent unnecessary re-renders
        const newWidth = window.innerWidth;
        if (prev && prev.width === newWidth && prev.height === currentHeight) {
          return prev;
        }
        return { width: newWidth, height: currentHeight };
      });
    }
    
    const handleResize = debounce(() => {
      if (typeof window !== 'undefined') {
        // Only update width, keep height fixed to prevent content shift
        const currentHeight = fixedViewportHeight.current || window.innerHeight;
        setWindowSize(prev => {
          const newWidth = window.innerWidth;
          // Only update if width actually changed
          if (prev && prev.width === newWidth && prev.height === currentHeight) {
            return prev;
          }
          return { width: newWidth, height: currentHeight };
        });
      }
    }, 150); // Debounce resize to avoid excessive updates
    
    // Store handler in ref for cleanup
    resizeHandlerRef.current = handleResize;
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize, { passive: true });
      return () => {
        if (resizeHandlerRef.current) {
          window.removeEventListener('resize', resizeHandlerRef.current);
          // Clean up debounce function
          if (resizeHandlerRef.current.cancel) {
            resizeHandlerRef.current.cancel();
          }
          resizeHandlerRef.current = null;
        }
      };
    }
  }, []);

  useEffect(() => {
    setCurrentAnimation(getRemoteModelUrl('/animations/idle.fbx'));
    
    let timeoutIds = [];

    const scheduleNextWaving = () => {
      const randomDelay = Math.random() * (15000 - 6000) + 6000;
      const nextTimeout = setTimeout(() => {
        triggerWaving();
      }, randomDelay);
      timeoutIds.push(nextTimeout);
    };

    const triggerWaving = () => {
      setCurrentAnimation(getRemoteModelUrl('/animations/Waving.fbx'));
      const wavingTimeout = setTimeout(() => {
        setCurrentAnimation(getRemoteModelUrl('/animations/idle.fbx'));
        scheduleNextWaving();
      }, 3000);
      timeoutIds.push(wavingTimeout);
    };

    const fadeInDuration = 800;
    const initialTimeout = setTimeout(() => {
      triggerWaving();
    }, fadeInDuration);
    timeoutIds.push(initialTimeout);

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, []);

  // Set initial scroll position for gallery to show less of first box
  useEffect(() => {
    if (galleryRef.current) {
      const boxWidth = isDesktop ? 340 : isTablet ? 300 : 250;
      const scrollAmount = boxWidth * 0.65; // Scroll more to show less of first box
      // Use setTimeout to ensure the gallery is fully rendered before scrolling
      const timeoutId = setTimeout(() => {
        if (galleryRef.current) {
          try {
            galleryRef.current.scrollLeft = scrollAmount;
          } catch (error) {
            console.warn('Gallery scroll error:', error);
          }
        }
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [windowSize.width, isDesktop, isTablet]);

  // Intersection Observer for optimized image lazy loading with queue management
  useEffect(() => {
    if (!galleryRef.current || typeof IntersectionObserver === 'undefined') return;
    
    let loadingQueue = [];
    let currentlyLoading = 0;
    // Reduce concurrent loads on mobile to prevent crashes
    const maxConcurrentLoads = windowSize.width < 768 ? 1 : 3;
    const loadDelay = windowSize.width < 768 ? 200 : 100; // Longer delay on mobile
    
    const processQueue = () => {
      if (currentlyLoading >= maxConcurrentLoads || loadingQueue.length === 0) {
        return;
      }
      
      const img = loadingQueue.shift();
      if (img && img.dataset.src && !img.src) {
        currentlyLoading++;
        const dataSrc = img.dataset.src;
        img.src = dataSrc;
        img.removeAttribute('data-src');
        
        const handleLoadComplete = () => {
          currentlyLoading--;
          if (loadingQueue.length > 0) {
            setTimeout(processQueue, loadDelay);
          }
        };
        
        img.onload = handleLoadComplete;
        img.onerror = handleLoadComplete;
      } else if (loadingQueue.length > 0) {
        // If current img is invalid, try next one
        setTimeout(processQueue, loadDelay);
      }
    };
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const dataSrc = img.dataset.src;
            if (dataSrc && !img.src) {
              // Add to queue instead of loading immediately
              if (!loadingQueue.includes(img)) {
                loadingQueue.push(img);
                observer.unobserve(img);
              }
              processQueue();
            }
          }
        });
      },
      { 
        // Reduce rootMargin on mobile to prevent loading too many images at once
        rootMargin: windowSize.width < 768 ? '50px' : '150px',
        threshold: 0.01 
      }
    );
    
    // Observe all images with data-src attribute
    const images = galleryRef.current.querySelectorAll('img[data-src]');
    images.forEach(img => observer.observe(img));
    
    return () => {
      try {
        observer.disconnect();
        loadingQueue = [];
        currentlyLoading = 0;
      } catch (error) {
        // Silently handle cleanup errors
        console.warn('Observer cleanup error:', error);
      }
    };
  }, [galleryRef.current, windowSize.width]);

  // Preload travel video - delay on mobile to improve initial load
  useEffect(() => {
    const isMobile = windowSize.width < 768;
    const videoUrl = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/IMG_0496.MP4';
    let preloadAttempted = false;
    
    const preloadVideo = () => {
      if (preloadAttempted) return; // Prevent multiple preload attempts
      preloadAttempted = true;
      
      try {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.preload = windowSize.width < 768 ? 'none' : 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.onerror = () => {
          // Silently handle preload errors
          preloadAttempted = false; // Allow retry on error
        };
        // Preload the video
        video.load();
      } catch (error) {
        // Silently handle preload errors
        preloadAttempted = false;
      }
    };
    
    let timeoutId = null;
    if (deviceInfo.shouldOptimizeVideo || deviceInfo.performanceTier === 'low') {
      // Delay video preload significantly on mobile/low-end devices to prevent crashes
      const delay = deviceInfo.performanceTier === 'low' ? 8000 : 
                   deviceInfo.isMobile ? 5000 : 3000;
      timeoutId = setTimeout(preloadVideo, delay);
    } else {
      preloadVideo();
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [deviceInfo]);

  useEffect(() => {
    const isMobile = windowSize.width < 768;
    const checkInterval = isMobile ? 0.05 : 0.02;
    if (Math.abs(scrollProgress - lastVideoCheckProgress.current) < checkInterval) {
      return;
    }
    lastVideoCheckProgress.current = scrollProgress;
    const travelSectionTrigger = 0.38;
    const developSectionTrigger = 0.20;
    const shouldPlayTravel = scrollProgress >= travelSectionTrigger - 0.05 && scrollProgress <= travelSectionTrigger + 0.15;
    const shouldPlayDevelop = scrollProgress >= developSectionTrigger - 0.05 && scrollProgress <= developSectionTrigger + 0.15;
    const delay = isMobile ? 100 : 0;
    const timeoutId = setTimeout(() => {
      const rafId = requestAnimationFrame(() => {
        try {
          if (travelVideoRef.current) {
            if (shouldPlayTravel && travelVideoRef.current.paused) {
              travelVideoRef.current.play().catch(() => {});
            } else if (!shouldPlayTravel && !travelVideoRef.current.paused) {
              travelVideoRef.current.pause();
            }
          }
          if (developVideoRef.current) {
            try {
              if (developVideoRef.current.error || developVideoRef.current.dataset.errorLogged === 'true') {
                return; // Skip if video has errors
              }
              
              if (shouldPlayDevelop && developVideoRef.current.paused) {
                developVideoRef.current.play().catch(err => {
                  // Silently handle autoplay errors on mobile
                  if (!isMobile) {
                    console.warn('Develop video autoplay prevented:', err);
                  }
                });
              } else if (!shouldPlayDevelop && !developVideoRef.current.paused) {
                developVideoRef.current.pause();
              }
            } catch (error) {
              // Silently handle video control errors
              if (!isMobile) {
                console.warn('Error controlling develop video:', error);
              }
            }
          }
        } catch (error) {
          // Silently handle errors on mobile to prevent console spam
          if (!isMobile) {
            console.error('Error controlling video playback:', error);
          }
        }
      });
      
      return () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
      };
    }, delay);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [scrollProgress, windowSize.width]);
  
  // Sing Out Voices carousel initialization - trigger animation when section starts appearing, then auto-rotate
  useEffect(() => {
    // Skip if already animated to avoid unnecessary checks
    if (hasAnimated) return;
    
    const sectionStart = 0.32; // sectionTriggers[2] - Sing Out Voices section
    const sectionEnd = 0.38; // sectionTriggers[3]
    const fadeOffset = sectionConfig.fadeOffset; // Use unified fadeOffset
    const fadeInStart = sectionStart - fadeOffset;
    if (scrollProgress >= fadeInStart) {
      const timer = setTimeout(() => {
        try {
          setHasAnimated(true);
          setIsAnimating(true);
          if (animationTimerRef.current) {
            clearTimeout(animationTimerRef.current);
          }
          animationTimerRef.current = setTimeout(() => {
            setIsAnimating(false);
            animationTimerRef.current = null;
          }, 2700);
        } catch (error) {}
      }, 100);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [scrollProgress, hasAnimated, windowSize.width]);
  
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, []);

  const audioUnlockedRef = useRef(false);
  useEffect(() => {
    if (audioUnlockedRef.current) return;
    const unlockAudio = () => {
      if (musicAudioRef.current && !audioUnlockedRef.current) {
        const playPromise = musicAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (musicAudioRef.current) {
                musicAudioRef.current.pause();
                musicAudioRef.current.currentTime = 0;
                audioUnlockedRef.current = true;
              }
            })
            .catch(() => {});
        }
      }
    };
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: true, passive: true });
    });
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, unlockAudio);
      });
    };
  }, []);

  const musicSectionTriggerRef = useRef(false);
  useEffect(() => {
    try {
      if (!musicAudioRef.current || musicSectionTriggerRef.current) return;
      const audio = musicAudioRef.current;
      if (!audio || !sectionTriggers || !sectionTriggers[5]) return;
      
      const musicSectionStart = sectionTriggers[5];
      const musicSectionTrigger = musicSectionStart + 0.02;
      const hasEntered = scrollProgress >= musicSectionTrigger;
      
      if (hasEntered && !hasEnteredMusicSection) {
        musicSectionTriggerRef.current = true;
        try {
          if (audio && typeof audio.volume !== 'undefined') {
            audio.volume = 0.5;
          }
        } catch (error) {
          console.debug('Audio volume error:', error);
        }
        setHasEnteredMusicSection(true);
        setIsMusicPlaying(true);
      }
    } catch (error) {
      console.debug('Music section trigger error:', error);
    }
  }, [scrollProgress, hasEnteredMusicSection]);

  const audioPlaybackRef = useRef(null);
  useEffect(() => {
    if (!musicAudioRef.current) return;
    const audio = musicAudioRef.current;
    if (!audio) return;
    
    if (audioPlaybackRef.current) {
      clearTimeout(audioPlaybackRef.current);
      audioPlaybackRef.current = null;
    }
    
    // Use longer delay on mobile to prevent crashes
    const isMobile = windowSize.width < 768;
    const delay = isMobile ? 100 : 50;
    
    audioPlaybackRef.current = setTimeout(() => {
      try {
        if (!audio || !audio.readyState) return;
        
        if (isMusicPlaying && hasEnteredMusicSection) {
          // On mobile, only play if user has interacted (autoplay restrictions)
          if (audio && audio.paused && audio.readyState >= 2) {
            // Check if we're on mobile and haven't had user interaction
            if (isMobile) {
              // On mobile, be more conservative with autoplay
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise.catch((error) => {
                  // Silently handle play errors to prevent crashes
                  console.debug('Audio play error (mobile):', error);
                  // Don't set playing state if autoplay fails on mobile
                  setIsMusicPlaying(false);
                });
              }
            } else {
              // Desktop: normal play
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise.catch((error) => {
                  console.debug('Audio play error:', error);
                });
              }
            }
          }
        } else {
          if (audio && !audio.paused) {
            try {
              audio.pause();
            } catch (error) {
              console.debug('Audio pause error:', error);
            }
          }
        }
      } catch (error) {
        // Silently handle any errors to prevent crashes
        console.debug('Audio playback error:', error);
      }
    }, delay);
    
    return () => {
      if (audioPlaybackRef.current) {
        clearTimeout(audioPlaybackRef.current);
        audioPlaybackRef.current = null;
      }
    };
  }, [isMusicPlaying, hasEnteredMusicSection, windowSize.width]);

  const toggleMusic = useCallback(() => {
    try {
      if (!musicAudioRef.current) {
        setIsMusicPlaying(false);
        return;
      }
      
      const audio = musicAudioRef.current;
      const isMobile = windowSize.width < 768;
      
      setIsMusicPlaying(prev => {
        const newState = !prev;
        
        // Immediately update audio state
        try {
          if (!audio || typeof audio.readyState === 'undefined') {
            return prev; // Can't play if audio not ready
          }
          
          if (newState && audio.readyState >= 2) {
            // On mobile, check if page is visible before playing
            if (isMobile && typeof document !== 'undefined' && document.hidden) {
              console.debug('Page hidden on mobile, not playing audio');
              return prev; // Don't play if page is hidden on mobile
            }
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                console.debug('Toggle play error:', error);
                setIsMusicPlaying(false);
              });
            }
          } else if (!newState && !audio.paused) {
            try {
              audio.pause();
            } catch (error) {
              console.debug('Pause error:', error);
            }
          }
        } catch (error) {
          console.debug('Toggle music error:', error);
          return prev; // Revert on error
        }
        
        return newState;
      });
    } catch (error) {
      console.debug('Toggle music callback error:', error);
      setIsMusicPlaying(false);
    }
  }, [windowSize.width]);
  
  // Handle page visibility changes on mobile to prevent crashes
  useEffect(() => {
    const isMobile = windowSize.width < 768;
    if (!isMobile) return;
    
    const handleVisibilityChange = () => {
      try {
        if (typeof document !== 'undefined' && document.hidden) {
          // Page is hidden - pause audio and video to prevent crashes
          if (musicAudioRef.current) {
            try {
              if (!musicAudioRef.current.paused) {
                musicAudioRef.current.pause();
              }
              // Reset audio to prevent memory issues
              musicAudioRef.current.currentTime = 0;
            } catch (error) {
              console.debug('Audio pause error in visibility change:', error);
            }
          }
          if (musicVideoRef.current) {
            try {
              if (!musicVideoRef.current.paused) {
                musicVideoRef.current.pause();
              }
              // On mobile, also reset video source to free memory
              if (windowSize.width < 768) {
                // Don't reset source, just pause and mark as paused
                musicVideoRef.current.dataset.wasPausedByVisibility = 'true';
              }
            } catch (error) {
              console.debug('Video pause error in visibility change:', error);
            }
          }
        } else {
          // Page is visible again - don't auto-resume on mobile to prevent crashes
          if (windowSize.width < 768) {
            // On mobile, require user interaction to resume
            if (musicVideoRef.current && musicVideoRef.current.dataset.wasPausedByVisibility === 'true') {
              musicVideoRef.current.dataset.wasPausedByVisibility = 'false';
              // Don't auto-resume - wait for user interaction
            }
          }
        }
      } catch (error) {
        console.debug('Visibility change handler error:', error);
      }
    };
    
    const handlePageHide = () => {
      try {
        // Pause all media when page is being hidden
        if (musicAudioRef.current) {
          try {
            if (!musicAudioRef.current.paused) {
              musicAudioRef.current.pause();
            }
            musicAudioRef.current.currentTime = 0;
          } catch (error) {
            console.debug('Audio pause error in page hide:', error);
          }
        }
        if (musicVideoRef.current) {
          try {
            if (!musicVideoRef.current.paused) {
              musicVideoRef.current.pause();
            }
            // On mobile, also unload video to free memory
            if (windowSize.width < 768) {
              musicVideoRef.current.load(); // Reload to free memory
            }
          } catch (error) {
            console.debug('Video pause error in page hide:', error);
          }
        }
      } catch (error) {
        console.debug('Page hide handler error:', error);
      }
    };
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
      window.addEventListener('pagehide', handlePageHide, { passive: true });
    }
    
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pagehide', handlePageHide);
      }
    };
  }, [windowSize.width]);
  
  useEffect(() => {
    if (hasAnimated) return;
    const sectionEnd = 0.38;
    if (scrollProgress > sectionEnd + 0.1) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
        setIsAnimating(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [scrollProgress, hasAnimated]);
  
  useEffect(() => {
    const isMobile = windowSize.width < 768;
    if (!isDragging && hasAnimated && !isAnimating) {
      const animate = (timestamp) => {
        if (!lastRotationTime.current) {
          lastRotationTime.current = timestamp;
        }
        const elapsed = timestamp - lastRotationTime.current;
        const updateInterval = isMobile ? 50 : 33;
        const rotationSpeed = isMobile ? 0.2 : 0.3;
        if (elapsed >= updateInterval) {
          setCarouselRotation(prev => prev + rotationSpeed);
          lastRotationTime.current = timestamp;
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        lastRotationTime.current = 0;
      };
    }
  }, [isDragging, hasAnimated, isAnimating, windowSize.width]);
  
  // Interests carousel pointer handlers
  const handlePointerDown = useCallback((e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setIsDragging(true);
    setStartX(clientX);
    dragStartRotation.current = carouselRotation;
    lastClickTime.current = Date.now();
    dragDistance.current = 0;
  }, [carouselRotation]);
  
  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startX;
    dragDistance.current = Math.abs(deltaX);
    const rotationDelta = deltaX * 0.5;
    setCarouselRotation(dragStartRotation.current + rotationDelta);
  }, [isDragging, startX]);
  
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  
  // Unified event listeners for carousel
  useEffect(() => {
    if (isDragging) {
      const handleMove = (e) => handlePointerMove(e);
      const handleUp = () => handlePointerUp();
      
      window.addEventListener('mousemove', handleMove, { passive: true });
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove, { passive: true });
      window.addEventListener('touchend', handleUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);
  
  // Generate keyframe styles for carousel
  const keyframeStyles = useMemo(() => {
    return carouselImages.map((_, index) => {
      const angle = angleStep * index;
      const startAngle = -135;
      const midAngle = startAngle + ((angle - startAngle) * 0.5);
      
      return `
        @keyframes slide-curve-in-${index} {
          0% {
            transform: rotateY(${startAngle}deg) translateZ(${responsiveCarousel.carouselRadius + 200}px) rotateX(-15deg);
            opacity: 0;
          }
          50% {
            transform: rotateY(${midAngle}deg) translateZ(${responsiveCarousel.carouselRadius + 100}px) rotateX(-15deg);
            opacity: 0.5;
          }
          70%, 100% {
            transform: rotateY(${angle}deg) translateZ(${responsiveCarousel.carouselRadius}px) rotateX(-15deg);
            opacity: 1;
          }
        }
      `;
    }).join('\n');
  }, [carouselImages, angleStep, responsiveCarousel.carouselRadius]);

  
  const calculateScale = () => {
    const screenWidth = windowSize.width;
    
    const baseScale = 1.4;
    const minScale = 0.6;
    const maxScale = 2.0;
    
    let scale = baseScale;
    if (screenWidth < 480) {
      scale = Math.max(minScale, baseScale * 0.5);
    } else if (screenWidth < 640) {
      scale = Math.max(minScale, baseScale * 0.65);
    } else if (screenWidth < 768) {
      scale = Math.max(minScale, baseScale * 0.75);
    } else if (screenWidth < 1024) {
      scale = Math.max(minScale, baseScale * 0.85);
    } else if (screenWidth < 1440) {
      scale = baseScale * 0.95;
    } else if (screenWidth < 1920) {
      scale = Math.min(maxScale, baseScale * 1.0);
    } else {
      scale = Math.min(maxScale, baseScale * 1.05);
    }
    
    return scale;
  };
  
  const calculateFontSize = (baseSize, minSize, maxSize) => {
    const screenWidth = windowSize.width;
    const screenHeight = windowSize.height;
    
    // 增强的响应式计算，更细粒度的断点和更激进的移动端缩放
    // 基础缩放基于屏幕宽度，确保在最小值和最大值之间平滑过渡
    let scale = 1;
    
    // 更细粒度的断点控制
    if (screenWidth < 360) {
      // 超小屏幕（小手机）
      scale = Math.max(0.35, screenWidth / 1024);
    } else if (screenWidth < 480) {
      // 超小屏幕（手机竖屏）- 更激进的缩小
      scale = 0.4 + (screenWidth - 360) / 120 * 0.15; // 0.4 到 0.55
    } else if (screenWidth < 640) {
      // 小屏幕（手机横屏/小平板）- 明显缩小
      scale = 0.55 + (screenWidth - 480) / 160 * 0.2; // 0.55 到 0.75
    } else if (screenWidth < 768) {
      // 中等屏幕（平板竖屏）
      scale = 0.7 + (screenWidth - 640) / 128 * 0.15; // 0.7 到 0.85
    } else if (screenWidth < 1024) {
      // 大屏幕（平板横屏/小笔记本）
      scale = 0.8 + (screenWidth - 768) / 256 * 0.1; // 0.8 到 0.9
    } else if (screenWidth < 1280) {
      // 超大屏幕（笔记本）
      scale = 0.85 + (screenWidth - 1024) / 256 * 0.1; // 0.85 到 0.95
    } else if (screenWidth < 1440) {
      // 超宽屏幕（桌面显示器）
      scale = 0.9 + (screenWidth - 1280) / 160 * 0.05; // 0.9 到 0.95
    } else if (screenWidth < 1920) {
      // 超宽屏幕（大桌面显示器）
      scale = 0.95 + (screenWidth - 1440) / 480 * 0.05; // 0.95 到 1.0
    } else {
      // 超大屏幕（4K等）
      scale = 1.0 + Math.min(0.05, (screenWidth - 1920) / 1000 * 0.05); // 1.0 到 1.05
    }
    
    // 考虑屏幕高度，如果屏幕很高但很窄，稍微减小字体
    if (screenHeight > screenWidth * 1.5) {
      scale *= 0.95;
    }
    
    // 计算最终大小，确保在最小值和最大值之间
    const calculatedSize = baseSize * scale;
    const clampedSize = Math.max(minSize, Math.min(maxSize, calculatedSize));
    
    return `${clampedSize}px`;
  };
  
  const calculateSpacing = (baseValue) => {
    const screenWidth = windowSize.width;
    
    if (screenWidth < 480) {
      return baseValue * 0.4; // 超小屏幕，更激进的缩小
    } else if (screenWidth < 640) {
      return baseValue * 0.5; // 小屏幕
    } else if (screenWidth < 768) {
      return baseValue * 0.65; // 中等屏幕
    } else if (screenWidth < 1024) {
      return baseValue * 0.8; // 大屏幕
    } else if (screenWidth < 1440) {
      return baseValue * 0.9; // 超大屏幕
    } else if (screenWidth < 1920) {
      return baseValue; // 超宽屏幕
    } else {
      return baseValue * 1.1; // 超大屏幕
    }
  };
  
  const avatarScale = calculateScale();
  
  // Navigation bar position - dynamically calculated based on viewport and address bar state
  // navBarTop is now a state variable that updates when address bar collapses/expands
  const navBarHeight = windowSize.width >= 768 ? 64 : 56;
  const navBarTotalHeight = navBarTop + navBarHeight; // Dynamic: adjusts when address bar changes
  // availableHeight uses current viewport height
  const availableHeight = Math.max(windowSize.height - navBarTotalHeight, 100);
  
  const desktopYOffset = isDesktop ? -0.5 : 0;
  // Adjust avatar position for mobile - shift down
  const avatarPosition = isMobile
    ? [0, -modelCenterY + desktopYOffset - 0.3, 0]
    : isTablet
      ? [0, -modelCenterY + desktopYOffset - 0.1, 0]  // Tablet: slight adjustment
      : [0, -modelCenterY + desktopYOffset, 0];
  
  const calculateSplineSize = () => {
    const screenWidth = windowSize.width;
    const screenHeight = windowSize.height;
    
    const baseWidth = 1920;
    const baseContainerSize = 800;
    
    const scaleFactor = screenWidth / baseWidth;
    const containerSize = baseContainerSize * scaleFactor;
    
    const maxWidth = screenWidth * 0.4;
    const maxHeight = screenHeight * 0.6;
    const finalSize = Math.min(containerSize, maxWidth, maxHeight);
    
    return {
      containerWidth: finalSize,
      containerHeight: finalSize,
      modelScale: 1
    };
  };
  
  const calculateBottomRightSplineSize = () => {
    const screenWidth = windowSize.width;
    const screenHeight = windowSize.height;
    
    if (screenWidth < 640) {
      return { width: 120, height: 120 };
    } else if (screenWidth < 768) {
      return { width: 150, height: 150 };
    } else if (screenWidth < 1024) {
      return { width: 200, height: 200 };
    } else if (screenWidth < 1440) {
      return { width: 250, height: 250 };
    } else {
      return { width: 300, height: 300 };
    }
  };
  
  const splineSize = calculateSplineSize();
  const bottomRightSplineSize = calculateBottomRightSplineSize();
  
  const sectionConfig = {
    fadeInSpeed: 8,  // Same for both mobile and desktop for consistent animation
    fadeOffset: 0.05,  // Same for both mobile and desktop
    translateYAmplitude: 40  // Same for both mobile and desktop
  };
  
  const sectionTriggers = [0.08, 0.20, 0.32, 0.38, 0.56, 0.68, 0.76, 0.84];
  
  // Sport section background image based on screen orientation
  const sportBackgroundImage = useMemo(() => {
    // Use encodeURI to handle spaces in filename
    const imagePath = windowSize.width > windowSize.height 
      ? 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/sport horizontal.jpg' 
      : 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/sport vertical.jpg';
    return encodeURI(imagePath);
  }, [windowSize.width, windowSize.height]);
  
  // Memoize expensive calculations to prevent unnecessary re-renders
  const avatarTransform = useMemo(() => 
    `translateY(${scrollProgress * 15}%) scale(${1 - scrollProgress * 0.15})`,
    [scrollProgress]
  );
  
  // Avatar completely disappears when "Learning Beyond Classroom" section appears (fades out by sectionTriggers[0] = 0.08)
  const avatarOpacity = useMemo(() => 
    modelsVisible ? Math.max(0, 1 - Math.max(0, (scrollProgress - 0.03) / (sectionTriggers[0] - 0.03) * 1)) : 0,
    [modelsVisible, scrollProgress]
  );
  
  // Limit textTransform to prevent horizontal overflow - disable on mobile for performance
  const textTransform = useMemo(() => {
    if (isMobile || isTablet) {
      // Disable mouse tracking on mobile/tablet to improve performance
      return 'translateX(0px) translateY(0px)';
    }
    const maxTranslateX = 20; // Maximum horizontal translation in pixels
    const limitedX = Math.max(-maxTranslateX, Math.min(maxTranslateX, mousePosition.x * 10));
    return `translateX(${limitedX}px) translateY(${mousePosition.y * 10}px)`;
  }, [isMobile, isTablet, mousePosition.x, mousePosition.y]);

  return (
    <div ref={containerRef} className="w-full" style={{ minHeight: 'calc(var(--vh, 1vh) * 800)', width: '100%', maxWidth: '100vw', position: 'relative', top: 0, left: 0, display: 'block', visibility: 'visible', opacity: 1, background: '#fafafa', overflowX: 'hidden', overflowY: 'visible' }}>
      <style>{`
        
        * {
          max-width: 100%;
        }
        
        html {
          height: 100%;
          overflow-x: hidden;
          width: 100%;
        }
        
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          overflow-x: hidden;
          
          overflow-y: auto;
          
          overscroll-behavior-y: auto;
          
          min-height: 100vh;
          min-height: 100dvh;
          min-height: calc(var(--vh, 1vh) * 100);
          
          min-height: -webkit-fill-available;
          
          position: relative;
        }
        
        
        #root {
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          min-height: calc(var(--vh, 1vh) * 100);
          
          min-height: -webkit-fill-available;
          
          position: relative;
          overflow-y: visible;
        }
        
        
        @supports (-webkit-touch-callout: none) {
          html {
            height: -webkit-fill-available;
          }
          
          body {
            
            min-height: -webkit-fill-available;
            
            transform: translate3d(0, 0, 0);
            -webkit-transform: translate3d(0, 0, 0);
          }
          
          #root {
            min-height: -webkit-fill-available;
            
            transform: translate3d(0, 0, 0);
            -webkit-transform: translate3d(0, 0, 0);
            
            position: relative;
            overflow-y: visible;
          }
          
          
          * {
            -webkit-tap-highlight-color: transparent;
          }
          
          
          button, a, [role="button"], [onClick] {
            touch-action: manipulation;
            cursor: pointer;
            
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
          }
          
          
          canvas {
            touch-action: none !important;
            pointer-events: auto !important;
            -webkit-touch-callout: none;
          }
          
          
          [style*="position: fixed"], [style*="position:fixed"] {
            transform: translate3d(0, 0, 0);
            -webkit-transform: translate3d(0, 0, 0);
            will-change: transform;
          }
          
          
          .w-full {
            transform: translate3d(0, 0, 0);
            -webkit-transform: translate3d(0, 0, 0);
          }
        }
        
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes bounceDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        @keyframes float-0 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-12px); }
        }
        @keyframes float-1 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-15px); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-10px); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-13px); }
        }
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .about-page-content:not(.ready) {
          opacity: 0 !important;
          visibility: hidden;
        }
        .about-page-content.ready {
          opacity: 1;
          visibility: visible;
          transition: opacity 0.3s ease-in, visibility 0s linear 0s;
        }
        
        @media (max-width: 767px) {
          .about-page-content.ready {
            transition: opacity 0.2s ease-in, visibility 0s linear 0s;
          }
        }
        
        
        
        .neon-glow {
          filter: drop-shadow(0 0 8px currentColor);
          animation: neon-flicker 3s infinite alternate;
        }

        .neon-glow-large {
          filter: drop-shadow(0 0 20px currentColor) drop-shadow(0 0 40px currentColor);
          animation: neon-pulse 2s infinite;
        }

        .neon-icon {
          filter: drop-shadow(0 0 6px currentColor);
        }

        @keyframes neon-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        @keyframes neon-pulse {
          0%, 100% { 
            filter: drop-shadow(0 0 20px currentColor) drop-shadow(0 0 40px currentColor);
          }
          50% { 
            filter: drop-shadow(0 0 30px currentColor) drop-shadow(0 0 60px currentColor);
          }
        }

        
        .cyberpunk-card {
          position: relative;
          background-clip: padding-box;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .glitch-overlay {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
          );
          animation: glitch-slide 3s infinite;
        }

        @keyframes glitch-slide {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }

        .border-animation {
          border: 2px solid transparent;
          background: linear-gradient(90deg, #00ffff, #ff00ff, #00ffff) border-box;
          mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          animation: border-rotate 3s linear infinite;
        }

        @keyframes border-rotate {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        
        .cyber-text {
          text-shadow: 
            0 0 10px rgba(0, 255, 255, 0.8),
            0 0 20px rgba(0, 255, 255, 0.4);
        }

        .cyber-text-glow {
          text-shadow: 
            0 0 10px rgba(0, 255, 255, 0.8),
            0 0 20px rgba(0, 255, 255, 0.6),
            0 0 30px rgba(0, 255, 255, 0.4);
          animation: text-flicker 2s infinite alternate;
        }

        @keyframes text-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }

        .cyber-title {
          text-shadow: 
            0 0 20px rgba(0, 255, 255, 0.8),
            0 0 40px rgba(255, 0, 255, 0.6),
            0 0 60px rgba(0, 255, 255, 0.4);
          animation: title-glow 2s infinite alternate;
        }

        @keyframes title-glow {
          0% { 
            text-shadow: 
              0 0 20px rgba(0, 255, 255, 0.8),
              0 0 40px rgba(255, 0, 255, 0.6),
              0 0 60px rgba(0, 255, 255, 0.4);
          }
          100% { 
            text-shadow: 
              0 0 30px rgba(0, 255, 255, 1),
              0 0 50px rgba(255, 0, 255, 0.8),
              0 0 70px rgba(0, 255, 255, 0.6);
          }
        }

        .cyber-text-content {
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
        }

        
        .cyber-close-btn {
          position: relative;
          clip-path: polygon(
            4px 0, calc(100% - 4px) 0, 100% 4px,
            100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px
          );
        }

        .cyber-close-btn:hover {
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.6);
        }

        .cyber-button {
          position: relative;
          clip-path: polygon(
            8px 0, calc(100% - 8px) 0, 100% 8px,
            100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px
          );
        }

        .cyber-button:hover {
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.6);
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
        }

        .cyber-bar {
          animation: bar-pulse 2s infinite;
        }

        @keyframes bar-pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 255, 0.5); }
          50% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.8); }
        }

        .cyber-skill-tag {
          animation: skill-fade-in 0.5s ease-out forwards;
          opacity: 0;
          transform: translateY(10px);
        }

        @keyframes skill-fade-in {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        
        .cyberpunk-modal {
          box-shadow: 
            0 0 40px rgba(0, 255, 255, 0.3),
            inset 0 0 40px rgba(0, 255, 255, 0.1);
        }

        .cyberpunk-modal-bg {
          background: 
            radial-gradient(circle at center, rgba(0, 255, 255, 0.1), transparent 50%),
            radial-gradient(circle at center, rgba(255, 0, 255, 0.1), transparent 70%);
        }

        .glitch-overlay-modal {
          background: linear-gradient(
            45deg,
            transparent 0%,
            rgba(0, 255, 255, 0.05) 25%,
            transparent 50%,
            rgba(255, 0, 255, 0.05) 75%,
            transparent 100%
          );
          background-size: 200% 200%;
          animation: modal-glitch 4s linear infinite;
        }

        @keyframes modal-glitch {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 200%; }
        }

        .cyber-section {
          animation: section-slide-in 0.5s ease-out;
        }

        @keyframes section-slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        
        @keyframes carousel-spin {
          from {
            transform: rotateY(0deg);
          }
          to {
            transform: rotateY(360deg);
          }
        }

        .animate-carousel-spin {
          animation: carousel-spin 2.5s linear;
        }

        ${keyframeStyles}

        @keyframes bounce-cyber {
          0%, 100% {
            transform: translateY(0px);
            filter: drop-shadow(0 0 20px currentColor);
          }
          50% {
            transform: translateY(-20px);
            filter: drop-shadow(0 0 40px currentColor);
          }
        }
        
        .animate-bounce-cyber {
          animation: bounce-cyber 3s ease-in-out infinite;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        @keyframes scale-in-cyber {
          from {
            opacity: 0;
            transform: scale(0.9);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: scale(1);
            filter: blur(0px);
          }
        }
        
        .animate-scale-in-cyber {
          animation: scale-in-cyber 0.4s ease-out;
        }
      `}</style>
      
      {}
      {isDesktop && [...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 3) * 20}%`,
            width: `${4 + i % 3}px`,
            height: `${4 + i % 3}px`,
            borderRadius: '50%',
            background: `rgba(23, 23, 23, ${0.1 + (i % 3) * 0.05})`,
            transform: `translate(${mousePosition.x * (10 + i * 5)}px, ${mousePosition.y * (10 + i * 5)}px) translateY(${scrollProgress * 200 * (i % 2 === 0 ? 1 : -1)}px)`,
            transition: 'transform 0.3s ease-out',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
      ))}
      
      <div className="relative w-full" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', paddingTop: `${navBarTotalHeight}px`, overflow: 'hidden', overflowX: 'hidden' }}>
        {availableHeight > 0 && windowSize.width > 0 && modelsVisible && (
          <div 
            className="fixed overflow-visible flex items-end justify-center"
            style={{
              left: isDesktop ? '0' : isTablet ? '5%' : '-20px',  // Tablet: slight offset
              top: isDesktop ? `${navBarTotalHeight}px` : isTablet ? `${navBarTotalHeight + 10}px` : `${navBarTotalHeight - 20}px`,
              bottom: 'auto',
              width: isDesktop
                ? `${Math.max(windowSize.width * 0.32, 200)}px`
                : isTablet
                  ? `${Math.max(windowSize.width * 0.35, 250)}px`  // Tablet: slightly larger
                  : `${Math.max(windowSize.width * 0.375, 200)}px`,
              maxWidth: '100vw',
              height: `${availableHeight}px`,
              minWidth: isTablet ? '250px' : '200px',
              minHeight: '100px',
              paddingBottom: isDesktop ? '10%' : isTablet ? '8%' : '5%',
              zIndex: 5,
              filter: 'drop-shadow(0 10px 40px rgba(0, 0, 0, 0.08))',
              transform: isDesktop
                ? avatarTransform 
                : isTablet
                  ? `${avatarTransform} translateY(-${windowSize.height * 0.1}px)`  // Tablet: less offset
                  : `${avatarTransform} translateY(-${windowSize.height * 0.15}px)`,
              opacity: avatarOpacity,
              transition: 'transform 0.3s ease-out, opacity 0.6s ease-out',
              pointerEvents: 'auto',
              background: 'transparent'
            }}
          >
            <Canvas 
              camera={{ position: [0, 0, 5], fov: 50, up: [0, 1, 0] }}
              dpr={windowSize.width < 768 ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2)}
              frameloop="always"
              gl={{ 
                antialias: windowSize.width >= 768, 
                alpha: true,
                premultipliedAlpha: false,
                powerPreference: "high-performance",
                preserveDrawingBuffer: false, // Set to false for better performance
                failIfMajorPerformanceCaveat: false,
                stencil: false, // Disable stencil for better performance
                depth: true
              }}
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0);
                // Optimize WebGL context for better performance
                gl.domElement.style.willChange = 'auto';
              }}
              performance={{ min: 0.5 }} // Allow lower FPS when needed
              style={{ 
                background: 'transparent', 
                width: '100%', 
                height: '100%', 
                minWidth: '200px',
                minHeight: '100px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
            <CameraDrift />
            <ambientLight intensity={1.5} />
            <directionalLight position={[5, 8, 5]} intensity={2.5} />
            <directionalLight position={[0, 3, 8]} intensity={2} />
            <directionalLight position={[-5, 5, -5]} intensity={1.2} color="#a5b4fc" />
            <pointLight position={[8, 2, 3]} intensity={1} color="#fbbf24" />
            <pointLight position={[-8, 2, 3]} intensity={1} color="#60a5fa" />
            <hemisphereLight skyColor="#ffffff" groundColor="#b0b0b0" intensity={1.2} />
            
            <Suspense fallback={null}>
              <Avatar 
                animationPath={currentAnimation} 
                scale={avatarScale} 
                position={avatarPosition}
                onBoundingBoxCalculated={setModelCenterY}
              />
            </Suspense>
          </Canvas>
          
          {}
          <div
            style={{
              position: 'absolute',
              top: isDesktop ? '8%' : isTablet ? '6%' : isMobile ? '30%' : '3%',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: isMobile ? 'normal' : 'nowrap',
              fontSize: isDesktop 
                ? calculateFontSize(14, 10, 16)
                : isTablet
                  ? calculateFontSize(13, 9, 15)
                  : calculateFontSize(11, 8, 13),
              fontWeight: 500,
              color: '#525252',
              opacity: avatarOpacity,
              transition: 'opacity 0.6s ease-out',
              zIndex: 10,
              padding: isMobile ? '5px 10px' : '6px 12px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              maxWidth: isMobile ? '90%' : 'none'
            }}
          >
            Open to Internship / Part time jobs
          </div>
          
          {}
          <div
            style={{
              position: 'absolute',
              bottom: isDesktop ? '12%' : isTablet ? '10%' : '8%',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: isDesktop ? '8px' : isTablet ? '6px' : '6px',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: avatarOpacity,
              transition: 'opacity 0.6s ease-out',
              zIndex: 10,
              maxWidth: isDesktop ? '300px' : isMobile ? '150px' : '100%',
              width: isDesktop ? '300px' : isMobile ? '150px' : 'auto'
            }}
          >
            {['Scorpio', 'ENFJ', 'Christian', 'Mandarin', 'Cantonese', 'English'].map((tag, index) => (
              <div
                key={index}
                style={{
                  fontSize: isDesktop 
                    ? calculateFontSize(12, 9, 14)
                    : isTablet
                      ? calculateFontSize(11, 8, 13)
                      : calculateFontSize(10, 7, 12),
                  fontWeight: 500,
                  color: '#171717',
                  padding: isDesktop ? '6px 14px' : isTablet ? '5px 12px' : '4px 10px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                  whiteSpace: 'nowrap'
                }}
              >
                {tag}
              </div>
            ))}
          </div>
          </div>
        )}
        
        <div 
          className={`w-full flex flex-col justify-center about-page-content ${pageReady ? 'ready' : ''}`}
          style={{
            minHeight: `calc(calc(var(--vh, 1vh) * 100) - ${navBarTotalHeight}px)`,
            opacity: pageOpacity,
            transition: 'opacity 1.2s ease-in',
            paddingLeft: isDesktop
              ? 'clamp(0.5rem, 1.5vw, 1.5rem)' 
              : isTablet
                ? 'clamp(2rem, 4vw, 3rem)'  // Tablet: more padding
                : windowSize.width < 480 
                  ? '0' 
                  : 'clamp(0.25rem, 1vw, 0.5rem)',
            paddingTop: isDesktop
              ? 'clamp(4rem, 6vw, 8rem)' 
              : isTablet
                ? 'clamp(3rem, 5vw, 5rem)'  // Tablet: balanced padding
                : windowSize.width < 480 
                  ? 'clamp(0.25rem, 1.5vw, 0.75rem)'
                  : 'clamp(0.5rem, 2.5vw, 1.5rem)',
            paddingBottom: isMobile && windowSize.width < 480 
              ? 'clamp(2rem, 4vw, 3rem)' 
              : isTablet
                ? 'clamp(3rem, 5vw, 5rem)'  // Tablet: balanced padding
                : 'clamp(4rem, 8vw, 8rem)',
            paddingRight: isMobile && windowSize.width < 480 ? 'clamp(0.75rem, 2vw, 1rem)' : isTablet ? 'clamp(2rem, 4vw, 3rem)' : '0',
            transform: isDesktop
              ? `translateY(-5%) translateY(${scrollProgress * -30}px)`
              : isTablet
                ? `translateY(-8%) translateY(${scrollProgress * -25}px)`  // Tablet: balanced transform
                : `translateY(-18%) translateY(${scrollProgress * -30}px) translateY(60px)`,
            position: 'relative',
            zIndex: 10,
            marginLeft: isDesktop
              ? '28%'  // Shifted right a little for desktop
              : isTablet
                ? '15%'  // Tablet: centered with margin
                : windowSize.width < 480 
                  ? `${Math.max(windowSize.width * 0.375, 200) - 40}px`
                  : `${Math.max(windowSize.width * 0.375, 200) - 36}px`,
            maxWidth: isDesktop
              ? '50%' 
              : isTablet
                ? '70%'  // Tablet: wider content area
                : windowSize.width < 480 
                  ? `${Math.max(windowSize.width - Math.max(windowSize.width * 0.375, 200) - 8, windowSize.width * 0.9)}px` 
                  : `${windowSize.width - Math.max(windowSize.width * 0.375, 200) - 16}px`,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <h1
            style={{
              fontSize: isMobile
                ? `clamp(22px, 5.2vw, 80px)`
                : isTablet
                  ? `clamp(32px, 6vw, 72px)`  // Tablet: medium size
                  : calculateFontSize(80, 28, 100),
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#0a0a0a',
              opacity: mainTitleVisible ? (isDesktop
                ? (1 - scrollProgress * 0.4) 
                : Math.max(0, 1 - scrollProgress * 0.6)) : 0,
              transform: `${mainTitleVisible ? 'translateY(0)' : 'translateY(8px)'} ${textTransform}`,
              transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), fontSize 0.3s ease-out',
              willChange: mainTitleVisible ? 'opacity, transform' : 'opacity, transform',
              marginBottom: `${calculateSpacing(16)}px`,
              whiteSpace: isMobile ? 'normal' : 'nowrap',
              overflow: 'hidden',
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased'
            }}
          >
            {titleTypingText}
            {mainTitleVisible && !titleComplete && (
              <span style={{ 
                opacity: 1,
                marginLeft: '2px',
                animation: 'blink 1s step-end infinite'
              }}>|</span>
            )}
          </h1>
          
          <div
            style={{
              fontSize: isMobile
                ? `clamp(13px, 2.8vw, 28px)`
                : isTablet
                  ? `clamp(16px, 3.2vw, 32px)`  // Tablet: medium size
                  : calculateFontSize(28, 12, 36),
              fontWeight: 400,
              lineHeight: 1.4,
              color: '#525252',
              minHeight: '1.4em',
              transform: textTransform,
              transition: 'transform 0.6s ease-out, fontSize 0.3s ease-out',
              whiteSpace: isMobile ? 'normal' : 'nowrap',
              overflow: 'hidden'
            }}
          >
            <span
              style={{
              opacity: subtitlePrefixVisible ? (isDesktop
                ? (1 - scrollProgress * 0.4) 
                : Math.max(0, 1 - scrollProgress * 0.6)) : 0,
                transition: 'opacity 0.6s ease-out'
              }}
            >
              I am a{' '}
            </span>
            <span style={{ 
              fontWeight: 500, 
              color: '#171717',
              opacity: isDesktop
                ? (1 - scrollProgress * 0.4) 
                : Math.max(0, 1 - scrollProgress * 0.6)
            }}>{typingText}</span>
          </div>
          
          <div
            style={{
              marginTop: `${calculateSpacing(40)}px`,
              maxWidth: isMobile && windowSize.width < 480 
                ? `${Math.min(calculateSpacing(600), windowSize.width * 0.9)}px` 
                : isMobile && windowSize.width < 640 
                  ? `${Math.min(calculateSpacing(600), windowSize.width * 0.85)}px`
                  : isTablet
                    ? `${Math.min(calculateSpacing(700), windowSize.width * 0.8)}px`
                    : `${calculateSpacing(600)}px`,
              fontSize: isMobile
                ? calculateFontSize(20, 11, 24)
                : isTablet
                  ? calculateFontSize(20, 14, 26)
                  : calculateFontSize(20, 12, 24),
              fontWeight: 400,
              lineHeight: 1.7,
              color: '#525252',
              opacity: scriptVisible ? (isDesktop
                ? (1 - scrollProgress * 0.4) 
                : Math.max(0, 1 - scrollProgress * 0.6)) : 0,
              transform: `${scriptVisible ? 'translateY(0)' : 'translateY(8px)'} ${textTransform}`,
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out, fontSize 0.3s ease-out',
              paddingLeft: isMobile && windowSize.width < 480 ? `${calculateSpacing(16)}px` : isTablet ? `${calculateSpacing(32)}px` : `${calculateSpacing(24)}px`,
              borderLeft: `${calculateSpacing(2)}px solid #e5e5e5`
            }}
          >
            <p>
              I'm a junior standing Industrial & Systems Engineering student at the University of Florida who thrives at the intersection of engineering, business, and technology. 
              I specialize in elevating processes, teams, and experiences by turning insight into action, while continuously learning new skills, combine and master with what I already know to create smarter, more efficient solutions.
            </p>
            <p style={{ marginTop: `${calculateSpacing(20)}px` }}>
              I also enjoy building intuitive digital products that blend creativity and functionality to make a meaningful impact on users. 
              I look forward to transforming my skills and experiences into innovative, AI-driven ventures that deliver real-world value.
            </p>
          </div>
        </div>
        
        {splineSize.containerWidth > 0 && splineSize.containerHeight > 0 && modelsVisible && (
          <div 
            className="absolute pointer-events-auto"
            style={{
              right: isDesktop ? '2%' : isTablet ? '5%' : 'auto',  // Back to original right bottom position for desktop
              left: isDesktop ? 'auto' : isTablet ? 'auto' : '50%',
              bottom: isDesktop ? '0%' : isTablet ? '5%' : '15%',
              top: isDesktop ? 'auto' : 'auto',
              width: isDesktop
                ? `${splineSize.containerWidth}px`
                : isTablet
                  ? `${Math.max(splineSize.containerWidth * 0.9, windowSize.width * 0.4)}px`
                  : `${Math.max(splineSize.containerWidth, windowSize.width * 0.9)}px`,
              height: isDesktop
                ? `${splineSize.containerHeight}px`
                : isTablet
                  ? `${Math.max(splineSize.containerHeight * 0.9, windowSize.width * 0.4)}px`
                  : `${Math.max(splineSize.containerHeight, windowSize.width * 0.9)}px`,
              minWidth: isMobile ? `${windowSize.width * 0.8}px` : isTablet ? `${windowSize.width * 0.35}px` : 'auto',
              minHeight: isMobile ? `${windowSize.width * 0.8}px` : isTablet ? `${windowSize.width * 0.35}px` : 'auto',
              transform: isDesktop
                ? `${avatarTransform} translateY(40px)`
                : isTablet
                  ? `${avatarTransform} translateY(60px)`
                  : `translateX(-50%) translateY(180px) ${avatarTransform}`,
              opacity: avatarOpacity,
              zIndex: 0,
              pointerEvents: 'auto',
              willChange: isMobile ? 'auto' : 'transform',
              transition: isMobile ? 'opacity 0.6s ease-out' : 'transform 0.6s ease-out, opacity 0.6s ease-out',
              overflow: 'visible'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                transformOrigin: 'center center',
                overflow: 'visible',
                position: 'relative'
              }}
            >
              <Suspense fallback={
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ color: '#999', fontSize: '14px' }}>Loading...</div>
                </div>
              }>
                <Spline 
                  scene={isDesktop
                    ? "https://prod.spline.design/RiI1HgjSIb8MFplx/scene.splinecode"
                    : isTablet
                      ? "https://prod.spline.design/RiI1HgjSIb8MFplx/scene.splinecode"  // Tablet: use desktop scene
                      : "https://prod.spline.design/LYnE7DUy1dfNnCfp/scene.splinecode"}
                  style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'visible'
                  }}
                  onLoad={() => {
                    try {
                      console.log('Spline scene loaded');
                    } catch (error) {
                      console.warn('Spline load callback error:', error);
                    }
                  }}
                  onError={(error) => {
                    try {
                      console.error('Spline error:', error);
                    } catch (err) {
                      console.warn('Spline error handler failed:', err);
                    }
                  }}
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>

      <div 
        className="relative w-full"
        style={{ 
          minHeight: 'calc(var(--vh, 1vh) * 100)',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'visible',  // Allow icons to overflow and show
          overflowX: 'visible',
          overflowY: 'visible',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          transform: 'none',  // Explicitly disable any transform to prevent sliding
          willChange: 'auto'  // Disable will-change to prevent GPU acceleration that might cause sliding
        }}
      >
        <div 
          className="w-full flex flex-col items-center justify-center"
          style={{
            paddingTop: 'clamp(3rem, 6vw, 6rem)',
            paddingBottom: 'clamp(3rem, 6vw, 6rem)',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            transform: 'none',
            opacity: (() => {
              // Use faster fade speed when scrolling up, but slower overall
              const fadeSpeed = scrollDirection.current === 'up' ? sectionConfig.fadeInSpeed * 2.0 : sectionConfig.fadeInSpeed * 1.2;
              const fadeIn = Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[0] - sectionConfig.fadeOffset)) * fadeSpeed));
              // Fade out starts when Develop section begins, completes at the middle of Develop section
              // Develop section: sectionTriggers[1] (0.20) to sectionTriggers[2] (0.32)
              // Middle of Develop section: 0.20 + (0.32 - 0.20) / 2 = 0.26
              const fadeOutStart = sectionTriggers[1] - 0.08; // Start fading out slightly before Develop section (0.12)
              const fadeOutEnd = sectionTriggers[1] + (sectionTriggers[2] - sectionTriggers[1]) / 2; // Middle of Develop section (0.26)
              const fadeOutDuration = fadeOutEnd - fadeOutStart; // 0.14 (longer fade out)
              const fadeOut = Math.max(0, Math.min(1, (scrollProgress - fadeOutStart) / fadeOutDuration));
              return fadeIn * (1 - fadeOut);
            })(),
            transition: 'opacity 0.5s ease-out',  // Removed transform transition to prevent sliding
            maxWidth: '900px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'center',
            position: 'relative',
            zIndex: isDesktop ? 35 : 20  // Higher z-index than icons to ensure text appears on top
          }}
        >
          <h2
            style={{
              fontSize: isMobile
                ? `clamp(20px, 5vw, 80px)`
                : isTablet
                  ? `clamp(28px, 5.5vw, 72px)`  // Tablet: medium size
                  : calculateFontSize(64, 32, 80),
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#0a0a0a',
              textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)',
              marginBottom: `${calculateSpacing(20)}px`,
              textAlign: 'center'
            }}
          >
            Learning Beyond Classroom
          </h2>
          
          <p
            style={{
              fontSize: isMobile
                ? calculateFontSize(22, 14, 28)
                : isTablet
                  ? calculateFontSize(24, 16, 28)
                  : calculateFontSize(24, 18, 30),
              fontWeight: 400,
              lineHeight: 1.5,
              color: '#525252',
              textShadow: '1px 1px 2px rgba(255, 255, 255, 0.6)',
              maxWidth: isTablet ? '750px' : '700px',
              textAlign: 'center',
              marginBottom: 0,
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            I enjoy expanding my skill set beyond the classroom by turning curiosity into hands-on execution during free times. I continuously integrate new tools and methods with previously learned skills, using each project to strengthen fundamentals while uncovering how cross-disciplinary skills can compound into scalable, high-impact solutions.
          </p>
        </div>
        
        {}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: isDesktop ? 25 : 15,  // Higher z-index for desktop to ensure icons appear above previous section's gradient
            overflow: 'visible',  // Allow icons to overflow and show in other sections
            clipPath: 'none',  // Ensure no clipping so overflowing icons can show
            transform: 'none'  // Disable transform to prevent sliding
          }}
        >
          {learningIcons.map((icon, i) => {
            const isMobile = windowSize.width < 768;
            const isDesktop = windowSize.width >= 1024;
            // Start animation earlier by increasing fadeOffset
            const animationStart = sectionTriggers[0] - (sectionConfig.fadeOffset + 0.02); // Start earlier
            
            // Mobile: Animation completes earlier with shorter duration (0.07)
            // Desktop: Animation completes earlier with shorter duration (0.04)
            let animationDuration;
            if (isMobile) {
              // Shorter duration for mobile: 0.07 (reduced from 0.09)
              animationDuration = 0.07;
            } else {
              animationDuration = 0.04; // Reduced from 0.05 for earlier completion
            }
            
            const sectionProgress = Math.max(0, Math.min(1, (scrollProgress - animationStart) / animationDuration));
            // Icons should always be visible once they fade in, no fade out effect
            // Only apply fade in, keep opacity at 1 once visible
            const iconOpacity = Math.min(1, sectionProgress);
            
            // Create multiple orbital paths - ensure equal distribution across 4 orbits
            // Use round-robin distribution: icon 0→orbit0, icon 1→orbit1, icon 2→orbit2, icon 3→orbit3, icon 4→orbit0, etc.
            let orbitIndex = i % 4;
            
            // Count how many icons are in this orbit
            let iconsInThisOrbit = Math.floor((learningIcons.length - orbitIndex + 3) / 4);
            
            // Calculate which icon this is within its orbit (0-based)
            let itemInOrbit = Math.floor(i / 4);
            
            // Swap Spline and JiMengAI positions on desktop
            if (isDesktop) {
              const splineIndex = learningIcons.findIndex(ic => ic.name === 'Spline');
              const jiMengAIIndex = learningIcons.findIndex(ic => ic.name === 'JiMengAI');
              if (icon.name === 'Spline' && jiMengAIIndex !== -1) {
                // Use JiMengAI's position
                orbitIndex = jiMengAIIndex % 4;
                itemInOrbit = Math.floor(jiMengAIIndex / 4);
                iconsInThisOrbit = Math.floor((learningIcons.length - orbitIndex + 3) / 4);
              } else if (icon.name === 'JiMengAI' && splineIndex !== -1) {
                // Use Spline's position
                orbitIndex = splineIndex % 4;
                itemInOrbit = Math.floor(splineIndex / 4);
                iconsInThisOrbit = Math.floor((learningIcons.length - orbitIndex + 3) / 4);
              }
            }
            
            const totalInOrbit = iconsInThisOrbit;
            
            // Different orbit radii and positions
            const orbitConfigs = [
              { x: 23, y: 20, radius: 180, rotation: 0 },     // Top left orbit
              { x: 77, y: 20, radius: 180, rotation: 90 },    // Top right orbit
              { x: 23, y: 80, radius: 180, rotation: 180 },   // Bottom left orbit
              { x: 77, y: 80, radius: 180, rotation: 270 }    // Bottom right orbit
            ];
            
            const config = orbitConfigs[orbitIndex];
            const baseRadius = isMobile && windowSize.width < 640 ? config.radius * 0.5 : 
                              isMobile ? config.radius * 0.65 :
                              isTablet ? config.radius * 0.8 : config.radius;
            
            // Spiral outward as items increase - made smaller at final state
            const spiralRadius = (baseRadius + (itemInOrbit * 40)) * 0.75;
            
            // Angle based on position in orbit
            const angleOffset = (itemInOrbit / totalInOrbit) * 360;
            const angle = (config.rotation + angleOffset + sectionProgress * 180) * (Math.PI / 180);
            
            // Calculate position
            const centerX = (windowSize.width * config.x) / 100;
            const centerY = (windowSize.height * config.y) / 100;
            
            let finalX = centerX + Math.cos(angle) * spiralRadius * sectionProgress;
            let finalY = centerY + Math.sin(angle) * spiralRadius * sectionProgress;
            
            // Shift down all four orbit icons on desktop
            if (isDesktop) {
              finalY += 40;  // Shift down by 40px on desktop
            }
            
            // Special adjustment for Meitu icon to shift it up
            if (icon.name === 'Meitu') {
              finalY -= 50;
              // On mobile, shift Meitu to the right
              if (windowSize.width < 768) {
                finalX += 85;
              }
            }
            
            // Special adjustment for Blender icon to shift it down
            if (icon.name === 'Blender') {
              finalY += 80;
            }
            
            // Desktop-specific adjustments
            if (isDesktop) {
              // Shift Cursor icon down on desktop
              if (icon.name === 'Cursor') {
                finalY += 60;
              }
              // Shift Claude icon up on desktop
              if (icon.name === 'Claude') {
                finalY -= 50;
              }
            }
            
            // Scale animation
            const scale = 0.3 + (sectionProgress * 0.7);
            
            const baseIconSize = windowSize.width < 640 ? 44 : 
                            windowSize.width < 768 ? 52 :
                            windowSize.width < 1024 ? 60 : 70;
            
            // Make SolidWorks bigger, Google and Microsoft a little bigger, Blender a tiny bit bigger
            let iconSize = baseIconSize;
            if (icon.name === 'SolidWorks') {
              iconSize = baseIconSize * 1.6;
            } else if (icon.name === 'Google' || icon.name === 'Microsoft') {
              iconSize = baseIconSize * 1.3;
            } else if (icon.name === 'Blender') {
              iconSize = baseIconSize * 1.15;
            }
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${finalX}px`,
                  top: `${finalY}px`,
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                  transform: `translate(-50%, -50%) scale(${scale}) rotate(${-angle * (180 / Math.PI)}deg)`,
                  opacity: iconOpacity,
                  transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
                  pointerEvents: 'none',
                  cursor: 'default',
                  touchAction: 'none',
                  filter: `blur(${(1 - sectionProgress) * 8}px) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))`,
                  animationName: iconOpacity > 0 ? `float-${orbitIndex}` : 'none',
                  animationDuration: iconOpacity > 0 ? '3s' : 'none',
                  animationTimingFunction: iconOpacity > 0 ? 'ease-in-out' : 'none',
                  animationIterationCount: iconOpacity > 0 ? 'infinite' : 'none',
                  animationDelay: `${itemInOrbit * 0.2}s`,
                  zIndex: isDesktop ? 30 : 20,  // Higher z-index for desktop to ensure icons appear above previous section's gradient
                  overflow: 'visible'  // Ensure icons are not clipped
                }}
                title={icon.name}
              >
                <img 
                  src={icon.url} 
                  alt={icon.name}
                  onError={createSafeImageErrorHandler()}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
            );
          })}
        </div>
        {}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '400px',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(250, 250, 250, 0.1) 20%, rgba(250, 250, 250, 0.3) 40%, rgba(250, 250, 250, 0.6) 60%, rgba(250, 250, 250, 0.85) 80%, rgba(250, 250, 250, 1) 100%)',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
      </div>

      <div 
        className="relative w-full"
        style={{ 
          minHeight: 'calc(var(--vh, 1vh) * 100)',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          overflowX: 'hidden',
          position: 'relative',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box'
        }}
      >
        {}
        <video
          ref={developVideoRef}
          src="https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/develop bg.mp4"
          autoPlay={false}
          loop
          muted
          playsInline
          preload={windowSize.width < 768 ? "none" : "metadata"}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: 0,
            opacity: scrollProgress >= sectionTriggers[1] - sectionConfig.fadeOffset ? 1 : 0,
            transition: 'opacity 0.3s ease-out'
          }}
          onError={(e) => {
            try {
              // Prevent repeated error logging
              if (e && e.target && !e.target.dataset.errorLogged) {
                e.target.dataset.errorLogged = 'true';
                console.warn('Develop video failed to load, using fallback background');
                // Hide video element on error
                if (e.target) {
                  e.target.style.display = 'none';
                }
              }
            } catch (error) {
              // Silently handle error handler errors
            }
          }}
          onLoadStart={() => {
            // Reset error flag when loading starts
            if (developVideoRef.current) {
              developVideoRef.current.dataset.errorLogged = 'false';
            }
          }}
        />
        {}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '400px',
            background: 'linear-gradient(to bottom, rgba(250, 250, 250, 1) 0%, rgba(250, 250, 250, 0.85) 20%, rgba(250, 250, 250, 0.6) 40%, rgba(250, 250, 250, 0.3) 60%, rgba(250, 250, 250, 0.1) 80%, transparent 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
        <div 
          className="w-full"
          style={{
            paddingTop: windowSize.width < 768 
              ? 'clamp(5rem, 10vw, 9rem)'  // Slightly increased padding on mobile
              : 'clamp(4rem, 8vw, 8rem)',
            paddingBottom: 'clamp(3rem, 6vw, 6rem)',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            maxWidth: '1400px',
            marginLeft: 'auto',
            marginRight: 'auto',
            transform: windowSize.width < 768
              ? `translateY(${-100 + Math.max(0, (scrollProgress - sectionTriggers[1]) * -sectionConfig.translateYAmplitude) + 30}px)`  // Add 30px shift down on mobile
              : windowSize.width >= 1024
              ? `translateY(${-120 + Math.max(0, (scrollProgress - sectionTriggers[1]) * -sectionConfig.translateYAmplitude)}px)`  // Shift up a bit for desktop
              : `translateY(${-100 + Math.max(0, (scrollProgress - sectionTriggers[1]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: scrollProgress >= sectionTriggers[1] - sectionConfig.fadeOffset ? 1 : 0,
            transition: 'transform 0.8s ease-out, opacity 0.3s ease-out',
            position: 'relative',
            zIndex: 2
          }}
        >
          <div style={{ textAlign: 'left', marginBottom: `${calculateSpacing(60)}px` }}>
            <h2
              style={{
                fontSize: windowSize.width < 768 
                  ? `clamp(18px, 4.5vw, 72px)`
                  : calculateFontSize(56, 28, 72),
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                marginBottom: `${calculateSpacing(16)}px`,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
              }}
            >
              Develop With Creativity
            </h2>
            <p
              style={{
                fontSize: windowSize.width < 768 
                  ? calculateFontSize(22, 13, 26)
                  : calculateFontSize(24, 18, 28),
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#ffffff',
                maxWidth: windowSize.width >= 1024 ? '900px' : '700px',  // Wider container on desktop
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)'
              }}
            >
              I also enjoy designing and developing web experiences that blend creative, thoughtful design with clear, user‑centered thinking. I care deeply about usability, accessibility, and performance of my projects, turning complex problems into elegant products that people enjoy using.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: windowSize.width >= 1024 ? 'repeat(3, 1fr)' : windowSize.width >= 640 ? 'repeat(2, 1fr)' : '1fr',
            gap: `${calculateSpacing(32)}px`,
            marginTop: windowSize.width < 768 
              ? `${calculateSpacing(20)}px`  // Add extra margin on mobile to shift boxes down
              : windowSize.width >= 1024 
              ? '-20px'  // Shift up on desktop
              : '0'
          }}>
            {[
              { title: 'Innovative Solutions', description: 'Develop projects that create meaningful, measurable impact for communities' },
              { title: 'User Experience', description: 'Deliver projects with accessible, interactive experiences that attract and retain users.' },
              { title: 'Visual Appearance', description: 'Design intuitive, memorable projects with thoughtful typography, color and motion' }
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: '#ffffff',
                  padding: `${calculateSpacing(32)}px`,
                  borderRadius: '16px',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                  transform: `translateY(${Math.max(0, (sectionTriggers[1] - scrollProgress) * (20 + i * 5))}px)`,
                  transition: 'transform 0.6s ease-out, box-shadow 0.3s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 style={{
                  fontSize: windowSize.width < 768 
                    ? calculateFontSize(22, 16, 26)
                    : calculateFontSize(28, 20, 32),
                  fontWeight: 600,
                  color: '#0a0a0a',
                  marginBottom: `${calculateSpacing(12)}px`
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: windowSize.width < 768 
                    ? calculateFontSize(14, 13, 18)
                    : calculateFontSize(16, 13, 18),
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color: '#525252'
                }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <div
          style={{
            position: 'absolute',
            right: windowSize.width < 640 ? '1rem' : '2rem',
            bottom: windowSize.width < 640 ? '-0.5rem' : windowSize.width < 768 ? '-0.5rem' : '0',  // Shift down even more
            width: windowSize.width < 640 ? 'clamp(180px, 40vw, 220px)' :  // Bigger container for mobile
                   windowSize.width < 768 ? 'clamp(200px, 40vw, 280px)' :  // Bigger container for mobile
                   windowSize.width < 1024 ? 'clamp(200px, 35vw, 300px)' :
                   windowSize.width < 1440 ? 'clamp(250px, 40vw, 400px)' : 'clamp(300px, 40vw, 500px)',
            aspectRatio: '1 / 1',
            zIndex: 20,
            pointerEvents: 'auto',
            overflow: 'hidden',
            borderRadius: '8px',
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[1] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed))
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              overflow: 'hidden',
              borderRadius: '8px'
            }}
          >
            <Suspense fallback={
              <div style={{ 
                width: '100%', 
                height: '100%', 
                background: 'rgba(240, 240, 240, 0.5)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '8px',
                position: 'absolute',
                top: 0,
                left: 0
              }}>
                <div style={{ color: '#666', fontSize: '12px' }}>Loading...</div>
              </div>
            }>
              <Spline 
                scene={windowSize.width < 768 
                  ? "https://prod.spline.design/a-Lkih3pG1Z1zQP8/scene.splinecode"  // Mobile: different scene
                  : "https://prod.spline.design/o2BjYpYprFxeYswd/scene.splinecode"}  // Desktop/Tablet: original scene
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
                onLoad={() => console.log('Develop section Spline scene loaded')}
                onError={(error) => console.error('Develop section Spline error:', error)}
              />
            </Suspense>
          </div>
        </div>
        {}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '400px',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.1) 20%, rgba(255, 255, 255, 0.3) 40%, rgba(255, 255, 255, 0.6) 60%, rgba(255, 255, 255, 0.85) 80%, rgba(255, 255, 255, 1) 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      </div>

      <div 
        className="relative w-full"
        style={{ 
          minHeight: 'calc(var(--vh, 1vh) * 100)',
          background: 'linear-gradient(to bottom, #f3f4f6, #e5e7eb, #d1d5db)',
          position: 'relative',
          overflowX: 'hidden',
          overflowY: 'visible',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: (() => {
            const sectionStart = 0.32; // sectionTriggers[2]
            const fadeOffset = sectionConfig.fadeOffset; // Use unified fadeOffset
            const fadeInStart = sectionStart - fadeOffset;
            // Faster fade in for mobile
            const fadeInEnd = sectionStart + (windowSize.width < 768 ? 0.015 : 0.03);
            
            if (scrollProgress < fadeInStart) return 0;
            if (scrollProgress >= fadeInStart && scrollProgress <= fadeInEnd) {
              return (scrollProgress - fadeInStart) / (fadeInEnd - fadeInStart);
            }
            // 保持可见，不再淡出
            return 1;
          })(),
          transition: 'opacity 0.3s ease-out'
        }}
      >
        {}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '400px',
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.85) 20%, rgba(255, 255, 255, 0.6) 40%, rgba(255, 255, 255, 0.3) 60%, rgba(255, 255, 255, 0.1) 80%, transparent 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
        
        {}
        {windowSize.width < 1024 && (
          <div 
            style={{
              position: 'absolute',
              top: windowSize.width < 640 
                ? 'clamp(7rem, 14vw, 9rem)' 
                : `${interpolateValue(12, 15)}%`,  // Interpolate between tablet start (12%) and desktop (15%)
              left: '50%',
              textAlign: 'center',
              maxWidth: windowSize.width < 640 ? '800px' : `${interpolateValue(800, 1000)}px`,
              width: '90%',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              zIndex: 20,
              transform: `translateX(-50%) translateY(${Math.max(0, (scrollProgress - sectionTriggers[2]) * -sectionConfig.translateYAmplitude)}px)`,
              opacity: 1,
              transition: 'transform 0.8s ease-out'
            }}
          >
            <h2
              style={{
                fontSize: windowSize.width < 768 
                  ? `clamp(20px, 5vw, 80px)`
                  : calculateFontSize(56, 28, 72),
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: '#0a0a0a',
                marginBottom: `${calculateSpacing(16)}px`
              }}
            >
              Sing Out Voices
            </h2>
            <p
              style={{
                fontSize: windowSize.width < 768 
                  ? calculateFontSize(22, 14, 28)
                  : calculateFontSize(22, 16, 26),
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#525252',
                maxWidth: '700px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            >
              Music is my emotional outlet and creative way of expression. Through singing, I connect stories with lyrics, convey emotions with rhythm and share experiences that words alone cannot capture.
            </p>
          </div>
        )}
        
        {}
        <div 
          className="relative z-20 w-full flex items-center justify-center"
          style={{
            position: 'absolute',
            top: windowSize.width >= 1024 
              ? '38%' 
              : windowSize.width < 640 
              ? 'clamp(22rem, 48vw, 28rem)' 
              : `${interpolateValue(24, 38)}%`,  // Interpolate between tablet mobile equivalent and desktop
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${Math.max(0, (scrollProgress - sectionTriggers[2]) * -sectionConfig.translateYAmplitude)}px) ${windowSize.width < 640 ? 'scale(0.75)' : windowSize.width >= 1024 ? 'scale(1)' : `scale(${interpolateValue(0.75, 1)})`}`,  // Proportional scale for tablet
            opacity: 1,
            transition: 'transform 0.8s ease-out',
            width: '100%',
            pointerEvents: 'auto',
            overflow: 'visible',
            clipPath: 'none'
          }}
        >
            <div
              className="relative cursor-grab active:cursor-grabbing select-none"
              style={{
                perspective: '1000px',
                width: '100%',
                height: `${responsiveCarousel.carouselHeight}px`,
                overflow: 'visible',
                clipPath: 'none'
              }}
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
            >
              <div
                ref={carouselRef}
                className={`relative w-full h-full ${isAnimating ? 'animate-carousel-spin' : ''}`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${carouselRotation}deg)`,
                  transition: isDragging || isAnimating ? 'none' : 'transform 0.05s linear',
                  overflow: 'visible',
                  clipPath: 'none',
                  width: '100%',
                  height: '100%'
                }}
              >
                {carouselImages.map((imageUrl, index) => {
                  const animationDelay = index * 0.15;
                  
                  return (
                    <div
                      key={index}
                      className={`absolute left-1/2 top-1/2 ${hasAnimated ? '' : 'opacity-0'}`}
                      style={{
                        width: `${responsiveCarousel.cardWidth}px`,
                        height: `${responsiveCarousel.cardHeight}px`,
                        marginLeft: `-${responsiveCarousel.cardWidth / 2}px`,
                        marginTop: `-${responsiveCarousel.cardHeight / 2}px`,
                        transformStyle: 'preserve-3d',
                        animation: hasAnimated ? `slide-curve-in-${index} 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${animationDelay}s both` : 'none',
                        overflow: 'visible',
                        clipPath: 'none'
                      }}
                    >
                      <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl transform hover:scale-110 transition-all duration-300">
                        <img 
                          src={imageUrl} 
                          alt={`Sing Out Voices ${index + 1}`}
                          className="w-full h-full object-cover"
                          style={{ 
                            display: 'block',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center'
                          }}
                          onError={createSafeImageErrorHandler()}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        
        {}
        <div
          style={{
            position: 'absolute',
            bottom: windowSize.width >= 1024 
              ? '3vh' 
              : windowSize.width < 640 
              ? '8vh' 
              : `${interpolateValue(13, 3)}vh`,  // Interpolate between tablet mobile equivalent and desktop
            left: windowSize.width >= 1024 
              ? 'calc(50% - 30px)' 
              : windowSize.width < 640 
              ? 'calc(50% - 20px)' 
              : `calc(50% - ${interpolateValue(25, 30)}px)`,  // Interpolate between tablet and desktop
            transform: `translateX(-50%) translateY(${Math.max(0, (scrollProgress - sectionTriggers[2]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: 1,
            transition: 'transform 0.8s ease-out',
            width: windowSize.width >= 1024 
              ? '680px' 
              : windowSize.width < 640 
              ? '500px' 
              : `${interpolateValue(600, 680)}px`,  // Interpolate between tablet and desktop
            height: windowSize.width >= 1024 
              ? '500px' 
              : windowSize.width < 640 
              ? '400px' 
              : `${interpolateValue(450, 500)}px`,  // Interpolate between tablet and desktop
            zIndex: 15,
            pointerEvents: 'none',
            overflow: 'visible',
            clipPath: 'none'
          }}
        >
          <Suspense fallback={
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ color: '#999', fontSize: '14px' }}>Loading 3D model...</div>
            </div>
          }>
            <Canvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
              gl={{ 
                antialias: windowSize.width >= 768,
                powerPreference: windowSize.width >= 768 ? "high-performance" : "low-power",
                stencil: false,
                depth: true
              }}
              dpr={windowSize.width < 768 ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio}
            >
              {}
              {windowSize.width >= 1024 ? (
                // Desktop lighting
                <>
                  <ambientLight intensity={1.8} />
                  <directionalLight position={[10, 10, 5]} intensity={3.5} />
                  <directionalLight position={[-5, 5, -3]} intensity={1.8} />
                  <pointLight position={[-10, -10, -5]} intensity={2.2} />
                  <pointLight position={[5, 8, 3]} intensity={1.5} />
                </>
              ) : windowSize.width >= 640 ? (
                // Tablet lighting
                <>
                  <ambientLight intensity={1.9} />
                  <directionalLight position={[8, 8, 4]} intensity={3.2} />
                  <directionalLight position={[-4, 4, -2]} intensity={1.7} />
                  <pointLight position={[-8, -8, -4]} intensity={2.3} />
                  <pointLight position={[4, 6, 2]} intensity={1.6} />
                </>
              ) : (
                // Mobile lighting
                <>
                  <ambientLight intensity={2.0} />
                  <directionalLight position={[6, 6, 3]} intensity={3.0} />
                  <directionalLight position={[-3, 3, -2]} intensity={1.8} />
                  <pointLight position={[-6, -6, -3]} intensity={2.4} />
                  <pointLight position={[3, 5, 2]} intensity={1.7} />
                </>
              )}
              <Avatar
                animationPath={getRemoteModelUrl('/animations/Singing.fbx')}
                scale={windowSize.width >= 1024 
                  ? 1.4 
                  : windowSize.width < 640 
                  ? 1.3 
                  : interpolateValue(1.45, 1.4)}  // Interpolate between tablet and desktop
                position={windowSize.width < 640 
                  ? [0, -1.8, 0] 
                  : windowSize.width >= 1024
                  ? [0, -1.5, 0]
                  : [0, interpolateValue(-1.65, -1.5), 0]}  // Interpolate Y position between tablet and desktop
              />
            </Canvas>
          </Suspense>
        </div>
        
        {}
        {windowSize.width >= 1024 && (
          <div 
            style={{
              position: 'absolute',
              top: '15%',  // Shifted up for desktop
              left: '50%',
              textAlign: 'center',
              maxWidth: '1000px',
              width: '95%',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              zIndex: 20,
              transform: `translate(-50%, -50%) translateY(${Math.max(0, (scrollProgress - sectionTriggers[2]) * -sectionConfig.translateYAmplitude)}px)`,
              opacity: 1,
              transition: 'transform 0.8s ease-out'
            }}
          >
          <h2
            style={{
              fontSize: windowSize.width < 768 
                ? `clamp(20px, 5vw, 80px)`
                : calculateFontSize(56, 28, 72),
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#0a0a0a',
              marginBottom: `${calculateSpacing(16)}px`
            }}
          >
            Sing Out Voices
          </h2>
          <p
            style={{
              fontSize: windowSize.width < 768 
                ? calculateFontSize(22, 14, 28)
                : calculateFontSize(22, 16, 26),
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#525252',
              maxWidth: '900px',
              marginLeft: 'auto',
              marginRight: 'auto',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            Music is my emotional outlet and creative way of expression. Through singing, I connect stories with lyrics, convey emotions with rhythm and share experiences that words alone cannot capture.
          </p>
          </div>
        )}

        {}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '120px',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.4) 40%, rgba(255, 255, 255, 0.8) 70%, rgba(255, 255, 255, 1) 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      </div>

      <div 
        className="relative w-full"
        style={{ 
          minHeight: 'calc(var(--vh, 1vh) * 100)',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          overflow: 'hidden',
          overflowX: 'hidden',
          position: 'relative',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          zIndex: 10
        }}
      >
        {}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '120px',
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.8) 30%, rgba(255, 255, 255, 0.4) 60%, transparent 100%)',
            zIndex: 1,
            pointerEvents: 'none',
            opacity: 1
          }}
        />
        {}
        <video
          ref={travelVideoRef}
          src="https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/IMG_0496.MP4"
          autoPlay={false}
          loop
          muted
          playsInline
          preload={windowSize.width < 768 ? "none" : "metadata"}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: 0,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[3] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
            transition: 'opacity 0.8s ease-out'
          }}
        />
        {}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '400px',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.1) 20%, rgba(255, 255, 255, 0.3) 40%, rgba(255, 255, 255, 0.6) 60%, rgba(255, 255, 255, 0.85) 80%, rgba(255, 255, 255, 1) 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
        <div 
          className="w-full"
          style={{
            paddingBottom: 'clamp(3rem, 6vw, 6rem)',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 0,
            textAlign: 'right',
            transform: windowSize.width < 768
              ? `translateY(${Math.max(0, (scrollProgress - sectionTriggers[3]) * -sectionConfig.translateYAmplitude)}px) translateY(-40px)`
              : `translateY(${Math.max(0, (scrollProgress - sectionTriggers[3]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[3] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
            position: 'relative',
            zIndex: 2
          }}
        >
          <h2
            style={{
              fontSize: windowSize.width < 768 
                ? `clamp(20px, 5vw, 80px)`
                : calculateFontSize(56, 28, 72),
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              marginBottom: `${calculateSpacing(16)}px`,
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            Travel The World
          </h2>
          <p
            style={{
              fontSize: windowSize.width < 768 
                ? calculateFontSize(22, 14, 28)
                : calculateFontSize(22, 16, 26),
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#ffffff',
              maxWidth: '800px',
              marginLeft: 'auto',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
            }}
          >
            Exploring new places is a defining part of my life, it broadens my perspective through diverse cultures, people, and ways of thinking. Immersing myself in the world's masterpieces and uncovering the boundless possibilities it offers is something I deeply value and genuinely love.
          </p>
        </div>
      </div>

      <div 
        className="relative w-full"
        style={{ 
          minHeight: 'calc(var(--vh, 1vh) * 100)',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'flex-start',
          paddingTop: 'clamp(6rem, 10vw, 12rem)',
          paddingBottom: 'clamp(6rem, 10vw, 12rem)',
          position: 'relative',
          overflow: 'visible',
          zIndex: 10
        }}
      >
        <div 
          className="w-full"
          style={{
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: '0',
            maxWidth: 'none',
            width: '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
            transform: `translateY(${Math.max(0, (scrollProgress - sectionTriggers[6]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: (() => {
              // Start fading in much earlier - when Travel section appears
              const fadeInStart = sectionTriggers[3] - 0.08; // Start fading in when Travel appears (0.38 - 0.08 = 0.30)
              const fadeInEnd = sectionTriggers[3] + 0.06; // Fully visible shortly after Travel appears (0.38 + 0.06 = 0.44)
              const fadeOutStart = sectionTriggers[7] ? sectionTriggers[7] - 0.08 : 0.95; // Start fading out near next section
              
              if (scrollProgress < fadeInStart) return 0;
              if (scrollProgress >= fadeInStart && scrollProgress <= fadeInEnd) {
                // Smooth fade in
                const fadeProgress = (scrollProgress - fadeInStart) / (fadeInEnd - fadeInStart);
                return Math.min(1, fadeProgress);
              }
              if (scrollProgress > fadeInEnd && scrollProgress < fadeOutStart) {
                // Fully visible
                return 1;
              }
              if (scrollProgress >= fadeOutStart) {
                // Smooth fade out
                const fadeOutProgress = (scrollProgress - fadeOutStart) / 0.12;
                return Math.max(0, 1 - fadeOutProgress);
              }
              return 1;
            })(),
            transition: 'transform 0.8s ease-out, opacity 0.5s ease-out',
            position: 'relative',
            zIndex: 2,
            overflow: 'visible'
          }}
        >
          {}
          <div style={{ marginBottom: `${calculateSpacing(40)}px`, paddingRight: 'clamp(1.5rem, 4vw, 4rem)' }}>
            {(() => {
              // Header fade-in starts very early - appears when Travel section is at top
              const headerFadeInStart = sectionTriggers[3] - 0.08; // Start when Travel section appears (0.38 - 0.08 = 0.30)
              const headerFadeInEnd = sectionTriggers[3] + 0.04; // Fully visible shortly after Travel appears (0.38 + 0.04 = 0.42)
              
              let headerOpacity = 0;
              let headerTransform = 'translateY(20px)';
              
              if (scrollProgress >= headerFadeInStart) {
                if (scrollProgress < headerFadeInEnd) {
                  const fadeProgress = (scrollProgress - headerFadeInStart) / (headerFadeInEnd - headerFadeInStart);
                  headerOpacity = Math.min(1, Math.max(0, fadeProgress));
                  headerTransform = `translateY(${20 * (1 - fadeProgress)}px)`;
                } else {
                  headerOpacity = 1;
                  headerTransform = 'translateY(0)';
                }
              }
              
              return (
                <>
                  <h2
                    style={{
                      fontSize: windowSize.width < 768 
                        ? `clamp(20px, 5vw, 80px)`
                        : calculateFontSize(56, 28, 72),
                      fontWeight: 600,
                      lineHeight: 1.1,
                      letterSpacing: '-0.03em',
                      color: '#0a0a0a',
                      marginBottom: `${calculateSpacing(20)}px`,
                      textAlign: 'left',
                      opacity: headerOpacity,
                      transform: headerTransform,
                      transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
                    }}
                  >
                    Capture the Beauty
                  </h2>
                  <p
                    style={{
                      fontSize: windowSize.width < 768 
                        ? calculateFontSize(22, 12, 26)
                        : calculateFontSize(22, 16, 26),
                      fontWeight: 400,
                      lineHeight: 1.6,
                      color: '#525252',
                      maxWidth: '800px',
                      marginBottom: `${calculateSpacing(32)}px`,
                      opacity: headerOpacity,
                      transform: headerTransform,
                      transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
                    }}
                  >
                    Photography allows me to freeze moments in time, finding beauty in the everyday and extraordinary.
                    Each shot tells a story, preserving memories and perspectives that inspire and connect.
                  </p>
                  
                </>
              );
            })()}
          </div>

          {}
          <div style={{ position: 'relative', width: '100%', zIndex: 10, overflow: 'visible' }}>
            <div
              ref={galleryRef}
              style={{
                display: 'flex',
                gap: '20px',
                overflowX: 'auto',
                overflowY: 'visible',
                scrollBehavior: 'smooth',
                paddingTop: '80px',
                paddingBottom: '80px',
                paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: { display: 'none' },
                transform: 'translateZ(0)',
                willChange: 'scroll-position',
                WebkitOverflowScrolling: 'touch'
              }}
              onScroll={(e) => {
                try {
                  if (!e || !e.target) return;
                  const scrollLeft = e.target.scrollLeft || 0;
                  const scrollWidth = (e.target.scrollWidth || 0) - (e.target.clientWidth || 0);
                  // Prevent division by zero and NaN
                  const newScroll = scrollWidth > 0 && !isNaN(scrollLeft) && !isNaN(scrollWidth) 
                    ? Math.min(Math.max(0, scrollLeft / scrollWidth), 1) 
                    : 0;
                  // Throttle updates based on device performance
                  const throttleTime = deviceInfo.scrollThrottle;
                  if (Date.now() - (galleryScrollThrottleRef.current || 0) > throttleTime) {
                    galleryScrollThrottleRef.current = Date.now();
                    setGalleryScroll(newScroll);
                  }
                } catch (error) {
                  // Silently handle any errors to prevent crashes
                  console.error('Gallery scroll error:', error);
                }
              }}
            >
              {galleryItems.map((item, i) => {
                // 图片直接显示，无淡入效果
                const itemOpacity = 1;
                
                // Staggered layout pattern: baseline, up, up (smaller height)
                // Pattern repeats every 3 items: 0=baseline, 1=up, 2=up(top aligned with 1, smaller height)
                const patternIndex = i % 3;
                let verticalOffset = 0;
                let boxHeight = windowSize.width >= 768 ? 400 : 240; // Default height
                
                if (patternIndex === 0) {
                  verticalOffset = 0; // Baseline
                } else if (patternIndex === 1) {
                  verticalOffset = -60; // Up - shifted up from baseline
                } else if (patternIndex === 2) {
                  verticalOffset = -60; // Up - top aligned with second box (same Y position for top alignment)
                  // Height calculated so gap between 3rd bottom and 2nd bottom equals gap between 2nd bottom and 1st bottom (60px)
                  // Box 2 bottom: -60 + 400 = 340px, so box 3 bottom should be at 340 - 60 = 280px
                  // Since box 3 top is at -60px, height = 280 - (-60) = 340px
                  boxHeight = windowSize.width >= 768 ? 340 : 190; // Adjusted height to match gap spacing
                }
                
                const baseTransform = `translateY(${verticalOffset}px)`;
                const isHovered = hoveredGalleryItem === i;
                
                // Calculate final transform
                let finalTransform = baseTransform;
                if (isHovered) {
                  // On hover: base offset + hover lift
                  finalTransform = `translateY(${verticalOffset - 8}px)`;
                }
                
                return (
                <div
                  key={i}
                  style={{
                    minWidth: windowSize.width >= 768 ? '340px' : '200px',
                    width: windowSize.width >= 768 ? '340px' : '200px',
                    height: `${boxHeight}px`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'transparent',
                    boxShadow: isHovered ? '0 8px 30px rgba(0, 0, 0, 0.12)' : '0 4px 20px rgba(0, 0, 0, 0.08)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease, opacity 0.6s ease-out, height 0.3s ease',
                    cursor: 'pointer',
                    flexShrink: 0,
                    opacity: itemOpacity,
                    transform: finalTransform,
                    position: 'relative',
                    zIndex: i + 1,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    willChange: windowSize.width < 768 ? 'auto' : 'transform'
                  }}
                  onMouseEnter={() => {
                    if (windowSize.width >= 768) {
                      setHoveredGalleryItem(i);
                    }
                  }}
                  onMouseLeave={() => {
                    if (windowSize.width >= 768) {
                      setHoveredGalleryItem(null);
                    }
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    backfaceVisibility: windowSize.width < 768 ? 'visible' : 'hidden',
                    WebkitBackfaceVisibility: windowSize.width < 768 ? 'visible' : 'hidden',
                    transform: windowSize.width < 768 ? 'none' : 'translateZ(0)',
                    willChange: windowSize.width < 768 ? 'auto' : 'transform'
                  }}>
                    <img 
                      src={item.image}
                      alt={item.title}
                      loading={galleryImagesPreloaded ? "eager" : (deviceInfo.shouldLazyLoadImages ? "lazy" : "eager")}
                      decoding="async"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        imageRendering: 'auto',
                        WebkitImageRendering: 'auto',
                        backfaceVisibility: windowSize.width < 768 ? 'visible' : 'hidden',
                        WebkitBackfaceVisibility: windowSize.width < 768 ? 'visible' : 'hidden',
                        transform: windowSize.width < 768 ? 'none' : 'translateZ(0)',
                        willChange: windowSize.width < 768 ? 'auto' : 'transform',
                        opacity: 1
                      }}
                      onError={createSafeImageErrorHandler({
                        fallbackBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      })}
                    />
                    {}
                    {isHovered && item.location && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.5), transparent)',
                        padding: windowSize.width < 768 ? '16px 16px 16px 16px' : '24px 20px 20px 20px',
                        color: '#ffffff',
                        fontSize: windowSize.width < 768 ? calculateFontSize(16, 14, 18) : calculateFontSize(18, 16, 20),
                        fontWeight: 600,
                        transition: 'opacity 0.3s ease',
                        animation: 'fadeIn 0.3s ease',
                        zIndex: 10,
                        pointerEvents: 'none',
                        touchAction: 'none'
                      }}>
                        📍 {item.location}
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            {}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '24px'
            }}>
              <button
                onClick={() => {
                  try {
                    if (galleryRef.current) {
                      const scrollAmount = windowSize.width < 768 ? -250 : -400;
                      galleryRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                    }
                  } catch (error) {
                    console.error('Gallery scroll error:', error);
                  }
                }}
                style={{
                  width: windowSize.width < 768 ? '44px' : '40px',
                  height: windowSize.width < 768 ? '44px' : '40px',
                  borderRadius: '50%',
                  border: '1px solid #e5e5e5',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (windowSize.width >= 768) {
                    e.currentTarget.style.borderColor = '#0a0a0a';
                    e.currentTarget.style.background = '#fafafa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (windowSize.width >= 768) {
                    e.currentTarget.style.borderColor = '#e5e5e5';
                    e.currentTarget.style.background = '#ffffff';
                  }
                }}
                onTouchStart={(e) => {
                  if (windowSize.width < 768) {
                    e.currentTarget.style.borderColor = '#0a0a0a';
                    e.currentTarget.style.background = '#fafafa';
                  }
                }}
                onTouchEnd={(e) => {
                  if (windowSize.width < 768) {
                    setTimeout(() => {
                      if (e.currentTarget) {
                        e.currentTarget.style.borderColor = '#e5e5e5';
                        e.currentTarget.style.background = '#ffffff';
                      }
                    }, 150);
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              
              <div style={{
                flex: 1,
                maxWidth: '200px',
                height: '4px',
                background: '#e5e5e5',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.max(10, galleryScroll * 100)}%`,
                  height: '100%',
                  background: '#0a0a0a',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              
              <button
                onClick={() => {
                  try {
                    if (galleryRef.current) {
                      const scrollAmount = windowSize.width < 768 ? 250 : 400;
                      galleryRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                    }
                  } catch (error) {
                    console.error('Gallery scroll error:', error);
                  }
                }}
                style={{
                  width: windowSize.width < 768 ? '44px' : '40px',
                  height: windowSize.width < 768 ? '44px' : '40px',
                  borderRadius: '50%',
                  border: '1px solid #e5e5e5',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (windowSize.width >= 768) {
                    e.currentTarget.style.borderColor = '#0a0a0a';
                    e.currentTarget.style.background = '#fafafa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (windowSize.width >= 768) {
                    e.currentTarget.style.borderColor = '#e5e5e5';
                    e.currentTarget.style.background = '#ffffff';
                  }
                }}
                onTouchStart={(e) => {
                  if (windowSize.width < 768) {
                    e.currentTarget.style.borderColor = '#0a0a0a';
                    e.currentTarget.style.background = '#fafafa';
                  }
                }}
                onTouchEnd={(e) => {
                  if (windowSize.width < 768) {
                    setTimeout(() => {
                      if (e.currentTarget) {
                        e.currentTarget.style.borderColor = '#e5e5e5';
                        e.currentTarget.style.background = '#ffffff';
                      }
                    }, 150);
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="relative w-full"
        style={{ 
          minHeight: 'calc(var(--vh, 1vh) * 100)',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {}
        <video
          ref={competeVideoRef}
          src="https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/compete bg.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload={windowSize.width < 768 ? "none" : "metadata"}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: 0,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[4] - sectionConfig.fadeOffset - 0.03)) * (sectionConfig.fadeInSpeed * 0.8))),
            transition: 'opacity 1.5s ease-out'
          }}
          onError={(e) => {
            try {
              if (e && e.target && !e.target.dataset.errorLogged) {
                e.target.dataset.errorLogged = 'true';
                console.warn('Compete video failed to load, using fallback background');
                if (e.target) {
                  e.target.style.display = 'none';
                }
              }
            } catch (error) {
              // Silently handle error handler errors
            }
          }}
          onLoadStart={() => {
            if (competeVideoRef.current) {
              competeVideoRef.current.dataset.errorLogged = 'false';
            }
          }}
        />
        {}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.2)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
        {}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.85) 20%, rgba(255, 255, 255, 0.6) 40%, rgba(255, 255, 255, 0.3) 60%, rgba(255, 255, 255, 0.1) 80%, transparent 100%)',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
        {}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '400px',
            background: 'linear-gradient(to top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.85) 20%, rgba(255, 255, 255, 0.6) 40%, rgba(255, 255, 255, 0.3) 60%, rgba(255, 255, 255, 0.1) 80%, transparent 100%)',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
        <div 
          className="w-full"
          style={{
            paddingTop: 'clamp(3rem, 6vw, 6rem)',
            paddingBottom: 'clamp(3rem, 6vw, 6rem)',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            maxWidth: '1200px',
            textAlign: 'left',
            transform: `translateY(${Math.max(0, (scrollProgress - sectionTriggers[4]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[4] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
            position: 'absolute',
            bottom: windowSize.width < 768 ? 'clamp(2rem, 5vw, 4rem)' : 0,
            left: 0,
            zIndex: 3
          }}
        >
          <h2
            style={{
              fontSize: windowSize.width < 768 
                ? `clamp(20px, 5vw, 80px)`
                : calculateFontSize(56, 28, 72),
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
              marginBottom: `${calculateSpacing(16)}px`
            }}
          >
            Compete for Greatness
          </h2>
          <p
            style={{
              fontSize: windowSize.width < 768 
                ? calculateFontSize(20, 10, 24)
                : calculateFontSize(20, 14, 24),
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
              maxWidth: '800px'
            }}
          >
            Competitive gaming taught me focus and resilience. It sharpened my ability to make immediate decisions and determine the best solutions under pressure. To me, it's far more than the entertainment many adults define it as—every match is a lesson, every battle log a data point for growth. It taught me teamwork and a relentless pursuit of excellence. The discipline and concentration gaming demands translate directly into how I approach challenges in life.
          </p>
        </div>
      </div>

      <div 
        className="relative w-full"
        style={{ 
          minHeight: 'calc(var(--vh, 1vh) * 100)',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box'
        }}
      >
        {}
        <audio
          ref={musicAudioRef}
          src="https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/music.m4a"
          loop
          preload={windowSize.width < 768 ? "none" : "metadata"}
          volume={0.5}
          style={{ display: 'none' }}
          onError={(e) => {
            // Silently handle audio load errors
            try {
              console.debug('Audio load error:', e);
              // On mobile, don't try to recover - just disable audio
              if (windowSize.width < 768) {
                setIsMusicPlaying(false);
                setHasEnteredMusicSection(false);
              }
            } catch (error) {
              console.debug('Audio error handler error:', error);
            }
          }}
          onLoadedData={() => {
            try {
              if (musicAudioRef.current && typeof musicAudioRef.current.volume !== 'undefined') {
                musicAudioRef.current.volume = 0.5;
              }
            } catch (error) {
              console.debug('Audio loadedData error:', error);
            }
          }}
          onAbort={() => {
            // Handle audio abort on mobile (e.g., when page is backgrounded)
            try {
              if (windowSize.width < 768) {
                setIsMusicPlaying(false);
              }
            } catch (error) {
              console.debug('Audio abort handler error:', error);
            }
          }}
        />
        {}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '400px',
            background: 'linear-gradient(to bottom, rgba(250, 250, 250, 1) 0%, rgba(250, 250, 250, 0.85) 20%, rgba(250, 250, 250, 0.6) 40%, rgba(250, 250, 250, 0.3) 60%, rgba(250, 250, 250, 0.1) 80%, transparent 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
        {hasEnteredMusicSection && (
          <video
            ref={musicVideoRef}
            src="https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/music.MP4"
            autoPlay={false}
            loop
            muted
            playsInline
            preload={windowSize.width < 768 ? "none" : "metadata"}
            crossOrigin="anonymous"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              zIndex: 0,
              opacity: sectionTriggers && sectionTriggers[5] 
                ? Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[5] - sectionConfig.fadeOffset - 0.03)) * (sectionConfig.fadeInSpeed * 0.8)))
                : 0,
              transition: 'opacity 1.5s ease-out',
              // Mobile-specific optimizations
              ...(windowSize.width < 768 ? {
                willChange: 'opacity',
                transform: 'translateZ(0)', // Force GPU acceleration on mobile
                WebkitTransform: 'translateZ(0)',
              } : {})
            }}
            onError={(e) => {
              try {
                if (e && e.target && !e.target.dataset.errorLogged) {
                  e.target.dataset.errorLogged = 'true';
                  console.debug('Video load error, hiding video element');
                  if (e.target) {
                    e.target.style.display = 'none';
                    e.target.style.opacity = '0';
                  }
                  // On mobile, don't retry to prevent crashes
                  if (windowSize.width < 768) {
                    // Set a flag to prevent further attempts
                    if (musicVideoRef.current) {
                      musicVideoRef.current.dataset.loadFailed = 'true';
                    }
                  }
                }
              } catch (error) {
                console.debug('Video error handler error:', error);
              }
            }}
            onLoadStart={() => {
              try {
                if (musicVideoRef.current) {
                  musicVideoRef.current.dataset.errorLogged = 'false';
                  musicVideoRef.current.dataset.loadFailed = 'false';
                }
              } catch (error) {
                console.debug('Video loadStart error:', error);
              }
            }}
            onLoadedMetadata={() => {
              try {
                if (!musicVideoRef.current || !sectionTriggers || !sectionTriggers[5]) return;
                
                // Check if video previously failed to load
                if (musicVideoRef.current.dataset.loadFailed === 'true') {
                  return; // Don't try to play if it previously failed
                }
                
                const video = musicVideoRef.current;
                const isMobile = windowSize.width < 768;
                
                // Set playback rate safely
                if (video && typeof video.playbackRate !== 'undefined') {
                  try {
                    video.playbackRate = 0.7;
                  } catch (error) {
                    console.debug('Playback rate error:', error);
                  }
                }
                
                // On mobile, be much more conservative with autoplay
                if (scrollProgress >= sectionTriggers[5] - 0.05) {
                  if (isMobile) {
                    // On mobile, wait a bit longer and check page visibility
                    setTimeout(() => {
                      try {
                        if (!video || video.dataset.loadFailed === 'true') return;
                        if (typeof document !== 'undefined' && document.hidden) {
                          console.debug('Page hidden, not playing video on mobile');
                          return;
                        }
                        
                        // Only attempt play if video is ready and page is visible
                        if (video.readyState >= 2) {
                          const playPromise = video.play();
                          if (playPromise !== undefined) {
                            playPromise.catch((error) => {
                              console.debug('Video play error (mobile):', error);
                              // Mark as failed to prevent retries
                              if (video) {
                                video.dataset.loadFailed = 'true';
                                video.style.display = 'none';
                              }
                            });
                          }
                        }
                      } catch (error) {
                        console.debug('Mobile video play attempt error:', error);
                      }
                    }, 200); // Delay on mobile to prevent crashes
                  } else {
                    // Desktop: normal play with error handling
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                      playPromise.catch((error) => {
                        console.debug('Video play error:', error);
                        if (video) {
                          video.style.display = 'none';
                        }
                      });
                    }
                  }
                }
              } catch (error) {
                console.debug('Video metadata error:', error);
              }
            }}
            onCanPlay={() => {
              // Additional safety check when video can play
              try {
                const isMobile = windowSize.width < 768;
                if (isMobile && musicVideoRef.current) {
                  // On mobile, ensure video is muted and has proper attributes
                  if (musicVideoRef.current.muted !== true) {
                    musicVideoRef.current.muted = true;
                  }
                  if (!musicVideoRef.current.hasAttribute('playsinline')) {
                    musicVideoRef.current.setAttribute('playsinline', '');
                  }
                }
              } catch (error) {
                console.debug('Video canPlay handler error:', error);
              }
            }}
            onSuspend={() => {
              // Handle video suspension (common on mobile when memory is low)
              try {
                if (windowSize.width < 768 && musicVideoRef.current) {
                  console.debug('Video suspended on mobile, pausing to prevent crashes');
                  if (!musicVideoRef.current.paused) {
                    musicVideoRef.current.pause();
                  }
                }
              } catch (error) {
                console.debug('Video suspend handler error:', error);
              }
            }}
            onStalled={() => {
              // Handle video stalling (network issues)
              try {
                if (windowSize.width < 768 && musicVideoRef.current) {
                  console.debug('Video stalled on mobile');
                  // Don't retry on mobile to prevent crashes
                  if (musicVideoRef.current.dataset.retryCount) {
                    const retryCount = parseInt(musicVideoRef.current.dataset.retryCount) || 0;
                    if (retryCount >= 2) {
                      musicVideoRef.current.dataset.loadFailed = 'true';
                      musicVideoRef.current.style.display = 'none';
                      return;
                    }
                    musicVideoRef.current.dataset.retryCount = (retryCount + 1).toString();
                  } else {
                    musicVideoRef.current.dataset.retryCount = '1';
                  }
                }
              } catch (error) {
                console.debug('Video stall handler error:', error);
              }
            }}
          />
        )}
        <img
          src="https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/music.png"
          alt="Music"
          onError={createSafeImageErrorHandler()}
          loading="lazy"
          decoding="async"
          style={{
            position: 'absolute',
            width: 'calc(min(100vw, 100vh) * 0.85)',
            height: 'calc(min(100vw, 100vh) * 0.85)',
            maxWidth: 'calc(min(100vw, 100vh) * 0.85)',
            maxHeight: 'calc(min(100vw, 100vh) * 0.85)',
            objectFit: 'contain',
            top: windowSize.width < 768 ? 'auto' : (windowSize.width > windowSize.height ? '55%' : 'auto'),
            bottom: windowSize.width < 768 ? 'clamp(6rem, 12vw, 10rem)' : (windowSize.width > windowSize.height ? 'auto' : 'clamp(2rem, 5vw, 4rem)'),
            left: windowSize.width > windowSize.height ? '72%' : '50%',
            transform: windowSize.width > windowSize.height ? 'translate(-50%, -50%)' : 'translateX(-50%)',
            zIndex: 1,
            opacity: sectionTriggers && sectionTriggers[5]
              ? Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[5] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed))
              : 0,
            transition: 'opacity 0.8s ease-out'
          }}
        />
        <div 
          className="w-full"
          style={{
            paddingTop: windowSize.width > windowSize.height ? 'clamp(1.5rem, 3vw, 3rem)' : 'clamp(3rem, 6vw, 6rem)',
            paddingBottom: windowSize.width > windowSize.height ? 'clamp(1.5rem, 3vw, 3rem)' : 'clamp(3rem, 6vw, 6rem)',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            maxWidth: windowSize.width > windowSize.height ? '600px' : '1200px',
            textAlign: windowSize.width > windowSize.height ? 'left' : 'center',
            transform: sectionTriggers && sectionTriggers[5]
              ? (windowSize.width < 768 
                  ? `translate(-50%, calc(40px + ${Math.max(0, (scrollProgress - sectionTriggers[5]) * -sectionConfig.translateYAmplitude)}px))`
                  : windowSize.width > windowSize.height 
                    ? `translateY(calc(-50% - 20px + ${Math.max(0, (scrollProgress - sectionTriggers[5]) * -sectionConfig.translateYAmplitude)}px))`
                    : `translate(-50%, calc(0px + ${Math.max(0, (scrollProgress - sectionTriggers[5]) * -sectionConfig.translateYAmplitude)}px))`)
              : 'translate(-50%, 0)',
            opacity: sectionTriggers && sectionTriggers[5]
              ? Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[5] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed))
              : 0,
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
            position: 'absolute',
            top: windowSize.width > windowSize.height ? '50%' : 'clamp(2rem, 5vw, 4rem)',
            left: windowSize.width > windowSize.height ? '5%' : '50%',
            zIndex: 3,
            maxHeight: windowSize.width > windowSize.height ? 'none' : '40%'
          }}
        >
          <h2
            style={{
              fontSize: windowSize.width <= windowSize.height 
                ? `clamp(20px, 5vw, 80px)`
                : calculateFontSize(56, 28, 72),
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 25%, #6bcf7f 50%, #4d96ff 75%, #9b59b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: `${calculateSpacing(16)}px`
            }}
          >
            Music for Life
          </h2>
          <p
            style={{
              fontSize: windowSize.width <= windowSize.height 
                ? calculateFontSize(20, 14, 28)
                : calculateFontSize(20, 14, 24),
              fontWeight: 400,
              lineHeight: 1.6,
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 25%, #6bcf7f 50%, #4d96ff 75%, #9b59b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              maxWidth: '800px',
              marginLeft: windowSize.width > windowSize.height ? 0 : 'auto',
              marginRight: windowSize.width > windowSize.height ? 0 : 'auto'
            }}
          >
            Music plays a central role in my life. I primarily listen to pop, Christian, sometimes country and a little rap. I value rhythm and beat as key indicators of a great song. Music both reflects and shapes my mood, bringing balance, energy, and joy to my daily life.
          </p>
        </div>
        <button
          onClick={toggleMusic}
          style={{
            position: 'absolute',
            top: windowSize.width > windowSize.height ? '20px' : '20px',
            right: windowSize.width > windowSize.height ? '20px' : '20px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            transition: 'transform 0.2s ease, background 0.2s ease',
            opacity: sectionTriggers && sectionTriggers[5]
              ? Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[5] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed))
              : 0,
          }}
          onMouseEnter={(e) => {
            try {
              if (e && e.currentTarget) {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
              }
            } catch (error) {
              console.debug('Mouse enter error:', error);
            }
          }}
          onMouseLeave={(e) => {
            try {
              if (e && e.currentTarget) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              }
            } catch (error) {
              console.debug('Mouse leave error:', error);
            }
          }}
          onTouchStart={(e) => {
            // Mobile touch feedback
            try {
              if (e && e.currentTarget) {
                e.currentTarget.style.transform = 'scale(0.95)';
              }
            } catch (error) {
              console.debug('Touch start error:', error);
            }
          }}
          onTouchEnd={(e) => {
            try {
              if (e && e.currentTarget) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            } catch (error) {
              console.debug('Touch end error:', error);
            }
          }}
          title={isMusicPlaying ? 'Pause music' : 'Play music'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              animation: isMusicPlaying ? 'rotate 3s linear infinite' : 'none',
              color: '#0a0a0a',
            }}
          >
            {isMusicPlaying ? (
              <>
                <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                <rect x="14" y="4" width="4" height="16" fill="currentColor" />
              </>
            ) : (
              <path d="M8 5v14l11-7z" fill="currentColor" />
            )}
          </svg>
        </button>
        {}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '400px',
            background: 'linear-gradient(to top, rgba(250, 250, 250, 1) 0%, rgba(250, 250, 250, 0.85) 20%, rgba(250, 250, 250, 0.6) 40%, rgba(250, 250, 250, 0.3) 60%, rgba(250, 250, 250, 0.1) 80%, transparent 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      </div>


      <div 
        className="relative w-full"
        style={{ 
          minHeight: 'calc(var(--vh, 1vh) * 100)',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url("${sportBackgroundImage}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
            opacity: scrollProgress >= sectionTriggers[7] - sectionConfig.fadeOffset ? 1 : 0,
            transition: 'opacity 0.3s ease-out'
          }}
        />
        
        {}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.2)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
        
        <div 
          className="w-full"
          style={{
            paddingTop: windowSize.width >= 1024 ? 'clamp(2rem, 4vw, 4rem)' : 'clamp(3rem, 6vw, 6rem)',
            paddingBottom: 'clamp(4rem, 8vw, 8rem)',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'center',
            transform: `translateY(${Math.max(0, (scrollProgress - sectionTriggers[7]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: scrollProgress >= sectionTriggers[7] - sectionConfig.fadeOffset ? 1 : 0,
            transition: 'transform 0.8s ease-out, opacity 0.3s ease-out',
            position: 'relative',
            zIndex: 2
          }}
        >
          <h2
            style={{
              fontSize: windowSize.width < 768 
                ? `clamp(20px, 5vw, 80px)`
                : calculateFontSize(56, 28, 72),
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
              marginBottom: `${calculateSpacing(16)}px`
            }}
          >
            Sport & Teamwork
          </h2>
          <p
            style={{
              fontSize: windowSize.width < 768 
                ? calculateFontSize(20, 12, 26)
                : calculateFontSize(20, 14, 24),
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
              maxWidth: '800px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            Sports taught me the power of collaboration, trust, and collective achievement. Working towards
            shared goals with others has shaped my understanding of leadership, communication, and the
            strength that comes from unified effort.
          </p>
        </div>
      </div>
      
      <div
        style={{
          position: 'fixed',
          bottom: '1.2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.1rem',
          zIndex: 100,
          opacity: scrollProgress > 0.05 ? 0 : 1,
          transition: 'opacity 0.8s ease-out',
          pointerEvents: 'none'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              animation: 'bounceDown 1.5s ease-in-out infinite',
              color: '#525252',
              marginBottom: '-14px'
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              animation: 'bounceDown 1.5s ease-in-out infinite 0.3s',
              color: '#525252'
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        <span
          style={{
            fontSize: '14px',
            color: '#525252',
            fontWeight: 400,
            letterSpacing: '0.05em'
          }}
        >
          Scroll Down
        </span>
      </div>
    </div>
  );
}