// Suppress FBXLoader texture warnings (these are harmless - FBX files load fine)
// MUST be at the very top before any imports to catch warnings early
(function() {
  if (typeof console === 'undefined') return;
  
  const suppressFBXWarning = (message) => {
    if (!message) return false;
    const msg = String(message);
    // Match the exact warning pattern: "FBXLoader: Image type "..." is not supported."
    return (msg.includes('FBXLoader') && 
            msg.includes('Image type') && 
            (msg.includes('is not supported') || msg.includes('not supported'))) ||
           // Also catch variations
           msg.match(/FBXLoader.*Image type.*not supported/i);
  };
  
  const wrapConsoleMethod = (original, methodName) => {
    if (!original) return;
    const wrapped = function(...args) {
      // Check first argument (most common case) and all arguments
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

import React, { useRef, useEffect, Suspense, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import Spline from '@splinetool/react-spline';

// 3D Avatar Component
function Avatar({ animationPath, scale = 1.6, position = [0, -1.5, 0], onBoundingBoxCalculated, noRotation = false, rotation = null }) {
  const group = useRef();
  const mixer = useRef();
  const currentActionRef = useRef();
  
  const { scene: baseAvatar, error } = useGLTF('/models/avatar.glb');
  
  useEffect(() => {
    if (error) {
      console.error('Error loading avatar:', error);
    }
  }, [error]);
  
  const fbx = useFBX(animationPath);
  
  const clonedAvatar = React.useMemo(() => {
    if (!baseAvatar) return null;
    
    let cloned;
    try {
      cloned = SkeletonUtils.clone(baseAvatar);
    } catch (error) {
      console.error('SkeletonUtils.clone failed:', error);
      cloned = baseAvatar.clone(true);
    }
    
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
  }, [baseAvatar, onBoundingBoxCalculated]);
  
  useEffect(() => {
    if (clonedAvatar && group.current) {
      try {
        mixer.current = new THREE.AnimationMixer(clonedAvatar);
        console.log('✓ Animation mixer created');
      } catch (error) {
        console.warn('Failed to create animation mixer:', error);
        mixer.current = null;
      }
    }
    return () => {
      if (mixer.current) {
        try {
          mixer.current.stopAllAction();
        } catch (error) {
          console.warn('Error stopping animation actions:', error);
        }
      }
    };
  }, [clonedAvatar]);
  
  useEffect(() => {
    if (!fbx.animations?.length || !mixer.current || !clonedAvatar) return;
    
    const newAnimation = fbx.animations[0];
    if (!newAnimation || !newAnimation.tracks || newAnimation.tracks.length === 0) {
      console.warn('No valid animation tracks found');
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
        console.warn('Failed to create action');
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
      console.error('❌ Error setting up animation:', error);
    }
  }, [animationPath, fbx.animations, clonedAvatar]);
  
  useFrame((state, delta) => {
    if (!mixer.current) return;
    if (typeof delta !== 'number' || !isFinite(delta)) return;
    
    try {
      mixer.current.update(delta);
    } catch (error) {
      console.warn('Animation mixer update error:', error);
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

useGLTF.preload('/models/avatar.glb');

function CameraDrift() {
  useFrame(({ camera }) => {
    const time = Date.now() * 0.0001;
    camera.rotation.y = Math.sin(time * 0.1) * 0.008;
    camera.rotation.x = Math.cos(time * 0.15) * 0.005;
  });
  return null;
}

// Neon Wave and Particle Background Component
function NeonWaveBackground({ scrollProgress, sectionTrigger, fadeOffset, fadeInSpeed }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timeRef = useRef(0);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // Use fixed viewport height to prevent content shift
    const fixedHeight = fixedViewportHeight.current || window.innerHeight;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = fixedHeight;

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = Math.floor((width * height) / 15000); // Adaptive particle count
      for (let i = 0; i < particleCount; i++) {
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

    initParticles();

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
      ctx.shadowBlur = 25;
      ctx.shadowColor = color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let x = 0; x <= width; x += 1.5) {
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
      ctx.clearRect(0, 0, width, height);
      
      timeRef.current += 0.02;

      // Calculate opacity based on scroll
      const opacity = Math.min(1, Math.max(0, (scrollProgress - (sectionTrigger - fadeOffset)) * fadeInSpeed)) * 0.7;
      
      if (opacity > 0) {
        ctx.globalAlpha = opacity;

        // Draw multiple wave layers with different colors and speeds - clearer
        const waveColors = [
          'rgba(138, 43, 226, 0.85)',  // Purple - brighter
          'rgba(59, 130, 246, 0.8)',   // Blue - brighter
          'rgba(147, 51, 234, 0.75)',  // Violet - brighter
          'rgba(79, 70, 229, 0.7)',   // Indigo - brighter
        ];

        // Draw waves at different Y positions - original 3 waves
        const wavePositions = [height * 0.3, height * 0.5, height * 0.7];
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

        // Draw additional flowing waves - original 3 waves
        for (let i = 0; i < 3; i++) {
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

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scrollProgress, sectionTrigger, fadeOffset, fadeInSpeed]);

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

// Throttle function for performance optimization
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

// Debounce function for performance optimization
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
  
  const [currentAnimation, setCurrentAnimation] = useState('/animations/idle.fbx');
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const initialHeight = window.innerHeight;
      // Set fixed height on initial load
      fixedViewportHeight.current = initialHeight;
      return { width: window.innerWidth, height: initialHeight };
    }
    return { width: 1920, height: 1080 };
  });
  const [modelCenterY, setModelCenterY] = useState(0);
  const [singingModelCenterY, setSingingModelCenterY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const previousScrollProgress = useRef(0);
  const scrollDirection = useRef('down'); // 'up' or 'down'
  
  const [modelsVisible, setModelsVisible] = useState(false);
  const [mainTitleVisible, setMainTitleVisible] = useState(false);
  const [titleTypingText, setTitleTypingText] = useState('');
  const [titleComplete, setTitleComplete] = useState(false);
  const [subtitlePrefixVisible, setSubtitlePrefixVisible] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [currentIdentityIndex, setCurrentIdentityIndex] = useState(0);
  const [pageOpacity, setPageOpacity] = useState(0);
  const [pageReady, setPageReady] = useState(false);
  const [scriptVisible, setScriptVisible] = useState(false);
  const [galleryScroll, setGalleryScroll] = useState(0);
  const [hoveredGalleryItem, setHoveredGalleryItem] = useState(null);
  
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
  
  useFBX('/animations/idle.fbx');
  useFBX('/animations/Waving.fbx');
  useFBX('/animations/Singing.fbx');
  
  // Define all icons from icons2 folder (all PNG files)
  const learningIcons = [
    { url: '/icons2/asana.png', name: 'Asana' },
    { url: '/icons2/three.js.png', name: 'Three.js' },
    { url: '/icons2/google.png', name: 'Google' },
    { url: '/icons2/capcut.png', name: 'CapCut' },
    { url: '/icons2/solidwork.png', name: 'SolidWorks' },
    { url: '/icons2/chatgpt.png', name: 'ChatGPT' },
    { url: '/icons2/claude.png', name: 'Claude' },
    { url: '/icons2/coursera.png', name: 'Coursera' },
    { url: '/icons2/cursor.png', name: 'Cursor' },
    { url: '/icons2/dji.png', name: 'DJI' },
    { url: '/icons2/canva.png', name: 'Canva' },
    { url: '/icons2/jimengai.png', name: 'JiMengAI' },
    { url: '/icons2/microsoft.png', name: 'Microsoft' },
    { url: '/icons2/vite.png', name: 'Vite' },
    { url: '/icons2/react.png', name: 'React' },
    { url: '/icons2/spline.png', name: 'Spline' },
    { url: '/icons2/chanjing.png', name: 'ChanJing' },
    { url: '/icons2/meitu.png', name: 'Meitu' },
    { url: '/icons2/blender.png', name: 'Blender' },
    { url: '/icons2/SQL.png', name: 'SQL' },
    { url: '/icons2/vscode.png', name: 'VS Code' },
  ];
  
  // Sing Out Voices carousel images
  const carouselImages = useMemo(() => [
    '/images/sing1.jpg',
    '/images/sing2.JPG',
    '/images/sing3.JPG',
    '/images/sing4.jpg',
    '/images/sing5.JPG',
    '/images/sing6.jpg',
    '/images/sing7.jpg'
  ], []);
  
  const carouselItemsCount = carouselImages.length;
  const angleStep = 360 / carouselItemsCount;
  
  // Responsive values for interests carousel
  const responsiveCarousel = useMemo(() => {
    const isMobile = windowSize.width < 640;
    const isTablet = windowSize.width >= 640 && windowSize.width < 1024;
    return {
      carouselRadius: isMobile ? 200 : isTablet ? 250 : 240,
      cardWidth: isMobile ? 120 : isTablet ? 130 : 110,
      cardHeight: isMobile ? 160 : isTablet ? 170 : 150,
      carouselHeight: isMobile ? 200 : isTablet ? 220 : 200,
      avatarScale: isMobile ? 2.4 : isTablet ? 3.0 : 3.6,
      avatarPosition: isMobile ? [0, -2.5, 0] : isTablet ? [0, -2.6, 0] : [0, -2.7, 0],
      cameraPosition: isMobile ? [0, 0.8, 3.5] : isTablet ? [0, 0.9, 4] : [0, 1, 4.5],
      cameraFov: isMobile ? 55 : isTablet ? 52 : 50,
    };
  }, [windowSize.width]);
  
  useEffect(() => {
    const isMobile = windowSize.width < 768;
    
    // Set page ready immediately to prevent flash
    setPageReady(true);
    
    // On mobile, use a simpler, faster initialization to avoid lag
    if (isMobile) {
      // Immediate opacity for mobile to prevent flash
      setPageOpacity(1);
      // Delay 3D models slightly on mobile to improve initial load
      setTimeout(() => {
        setModelsVisible(true);
      }, 100);
    } else {
      // Desktop: use double RAF for smooth transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPageOpacity(1);
          setModelsVisible(true);
        });
      });
    }
  }, [windowSize.width]);
  
  const titleTypingRef = useRef({ currentIndex: 0, timeoutId: null });
  
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
        state.timeoutId = setTimeout(typeTitle, 60);
      } else {
        setTitleComplete(true);
      }
    };
    
    const timer = setTimeout(() => {
      typeTitle();
    }, 100);
    
    return () => {
      clearTimeout(timer);
      if (titleTypingRef.current.timeoutId) {
        clearTimeout(titleTypingRef.current.timeoutId);
      }
    };
  }, [mainTitleVisible]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setMainTitleVisible(true);
    }, 300);
    return () => clearTimeout(timer);
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
    // Disable mouse tracking on mobile to improve performance
    if (windowSize.width < 768) {
      return;
    }
    
    const handleMouseMove = throttle((e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      // Use fixed viewport height to prevent content shift
      const fixedHeight = fixedViewportHeight.current || window.innerHeight;
      const y = (e.clientY / fixedHeight - 0.5) * 2;
      setMousePosition({ x, y });
    }, 16); // ~60fps
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [windowSize.width]);
  
  useEffect(() => {
    const isMobile = windowSize.width < 768;
    // Use longer throttle on mobile to reduce updates and prevent lag
    const throttleTime = isMobile ? 100 : 16; // 100ms on mobile, 16ms on desktop
    
    const handleScroll = throttle(() => {
      if (!containerRef.current) return;
      
      const scrollTop = window.scrollY;
      // Use fixed viewport height to prevent content shift
      const fixedHeight = fixedViewportHeight.current || window.innerHeight;
      const docHeight = document.documentElement.scrollHeight - fixedHeight;
      // Prevent division by zero and NaN
      const progress = docHeight > 0 ? Math.min(Math.max(0, scrollTop / docHeight), 1) : 0;
      
      
      // Only update if progress changed significantly on mobile to reduce re-renders
      if (isMobile && Math.abs(progress - previousScrollProgress.current) < 0.01) {
        return;
      }
      
      // Determine scroll direction
      if (progress < previousScrollProgress.current) {
        scrollDirection.current = 'up';
      } else if (progress > previousScrollProgress.current) {
        scrollDirection.current = 'down';
      }
      
      previousScrollProgress.current = progress;
      setScrollProgress(progress);
    }, throttleTime);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Clean up throttle function
      if (handleScroll.cancel) {
        handleScroll.cancel();
      }
    };
  }, [windowSize.width]); // isMobile is derived from windowSize.width, so we don't need it in deps
  
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
  
  // Set viewport height and handle mobile address bar collapse
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateViewportHeight = () => {
        const currentVh = window.innerHeight;
        
        // On first load, always use current viewport height
        // After that, only update if viewport gets LARGER (prevents shrinking when address bar hides)
        if (fixedViewportHeight.current === null) {
          const vh = currentVh * 0.01;
          fixedViewportHeight.current = currentVh;
          
          // Set CSS variables
          document.documentElement.style.setProperty('--vh', `${vh}px`);
          document.documentElement.style.setProperty('--fixed-vh', `${vh}px`);
          document.documentElement.style.setProperty('--fixed-vh-px', `${currentVh}px`);
          
          // Update window size state
          setWindowSize({ width: window.innerWidth, height: currentVh });
        }
      };
      
      // Set immediately on mount
      updateViewportHeight();
      
      // Set again after short delay for iOS Safari
      const timeoutId = setTimeout(updateViewportHeight, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, []);
  
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
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize, { passive: true });
      return () => {
        window.removeEventListener('resize', handleResize);
        // Clean up debounce function
        if (handleResize.cancel) {
          handleResize.cancel();
        }
      };
    }
  }, []);

  useEffect(() => {
    setCurrentAnimation('/animations/idle.fbx');
    
    let timeoutIds = [];

    const scheduleNextWaving = () => {
      const randomDelay = Math.random() * (15000 - 6000) + 6000;
      const nextTimeout = setTimeout(() => {
        triggerWaving();
      }, randomDelay);
      timeoutIds.push(nextTimeout);
    };

    const triggerWaving = () => {
      setCurrentAnimation('/animations/Waving.fbx');
      const wavingTimeout = setTimeout(() => {
        setCurrentAnimation('/animations/idle.fbx');
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
      const boxWidth = windowSize.width >= 768 ? 340 : 250;
      const scrollAmount = boxWidth * 0.65; // Scroll more to show less of first box
      // Use setTimeout to ensure the gallery is fully rendered before scrolling
      setTimeout(() => {
        if (galleryRef.current) {
          galleryRef.current.scrollLeft = scrollAmount;
        }
      }, 100);
    }
  }, [windowSize.width]);

  // Preload travel video - delay on mobile to improve initial load
  useEffect(() => {
    const isMobile = windowSize.width < 768;
    const videoUrl = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/IMG_0496.MP4';
    
    const preloadVideo = () => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      // Preload the video
      video.load();
    };
    
    if (isMobile) {
      // Delay video preload on mobile to improve initial page load
      setTimeout(preloadVideo, 2000);
    } else {
      preloadVideo();
    }
  }, [windowSize.width]);

  // Control video playback based on scroll position
  useEffect(() => {
    const travelSectionTrigger = 0.38; // sectionTriggers[3]
    const developSectionTrigger = 0.20; // sectionTriggers[1]
    
    const shouldPlayTravel = scrollProgress >= travelSectionTrigger - 0.05 && scrollProgress <= travelSectionTrigger + 0.15;
    const shouldPlayDevelop = scrollProgress >= developSectionTrigger - 0.05 && scrollProgress <= developSectionTrigger + 0.15;
    
    if (travelVideoRef.current) {
      if (shouldPlayTravel) {
        travelVideoRef.current.play().catch(err => {
          console.warn('Video autoplay prevented:', err);
        });
      } else {
        travelVideoRef.current.pause();
      }
    }
    
    if (developVideoRef.current) {
      if (shouldPlayDevelop) {
        developVideoRef.current.play().catch(err => {
          console.warn('Develop video autoplay prevented:', err);
        });
      } else {
        developVideoRef.current.pause();
      }
    }
  }, [scrollProgress]);
  
  // Sing Out Voices carousel initialization - trigger animation when section starts appearing, then auto-rotate
  useEffect(() => {
    const sectionStart = 0.32; // sectionTriggers[2] - Sing Out Voices section
    const sectionEnd = 0.38; // sectionTriggers[3]
    const fadeOffset = windowSize.width >= 768 ? 0.05 : 0.03; // sectionConfig.fadeOffset
    const fadeInStart = sectionStart - fadeOffset; // When section starts appearing
    
    // Trigger animation when section starts appearing (not at midpoint)
    if (scrollProgress >= fadeInStart && !hasAnimated) {
      // Use timer-based approach for reliability
      const timer = setTimeout(() => {
        setHasAnimated(true);
        setIsAnimating(true);
        
        // Store animation timer in ref so it persists even if effect re-runs
        animationTimerRef.current = setTimeout(() => {
          setIsAnimating(false);
          animationTimerRef.current = null;
        }, 2700);
      }, 100);
      
      // Only clear the outer timer, not the animationTimerRef (it needs to complete)
      return () => {
        clearTimeout(timer);
      };
    }
  }, [scrollProgress, hasAnimated, windowSize.width]);
  
  // Cleanup animation timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, []);
  
  // Fallback: If user scrolls past section without triggering, still enable auto-rotation
  useEffect(() => {
    const sectionEnd = 0.38; // sectionTriggers[3]
    // If we're well past the section and haven't animated, just enable auto-rotation
    if (scrollProgress > sectionEnd + 0.1 && !hasAnimated) {
      setHasAnimated(true);
      setIsAnimating(false); // Skip the initial animation, go straight to auto-rotation
    }
  }, [scrollProgress, hasAnimated]);
  
  // Auto-rotation for Sing Out Voices carousel - continuous rotation when not dragging
  useEffect(() => {
    if (!isDragging && hasAnimated && !isAnimating) {
      const animate = (timestamp) => {
        if (!lastRotationTime.current) {
          lastRotationTime.current = timestamp;
        }
        
        const elapsed = timestamp - lastRotationTime.current;
        
        // Update every ~33ms (30fps) instead of 20ms for smoother mobile performance
        if (elapsed >= 33) {
          setCarouselRotation(prev => prev + 0.3); // Slightly faster to compensate
          lastRotationTime.current = timestamp;
        }
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        lastRotationTime.current = 0;
      };
    }
  }, [isDragging, hasAnimated, isAnimating]);
  
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
  
  // Navigation bar is fixed at top-4 (16px) in App.jsx, so it doesn't move when address bar collapses
  // We use fixed values here to ensure content positioning is consistent
  const navBarTop = 16; // Fixed: matches 'top-4' in App.jsx
  const navBarHeight = windowSize.width >= 768 ? 64 : 56;
  const navBarTotalHeight = navBarTop + navBarHeight; // Fixed: 72px (mobile) or 80px (desktop)
  // availableHeight uses fixed viewport height, so it won't change when address bar collapses
  const availableHeight = Math.max(windowSize.height - navBarTotalHeight, 100);
  
  const isDesktop = windowSize.width >= 768;
  const desktopYOffset = isDesktop ? -0.5 : 0;
  const avatarPosition = [0, -modelCenterY + desktopYOffset, 0];
  
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
    fadeInSpeed: isDesktop ? 8 : 10,  // Adjusted for better mobile animation
    fadeOffset: isDesktop ? 0.05 : 0.05,  // Same fadeOffset for mobile to match desktop
    translateYAmplitude: isDesktop ? 40 : 35  // Increased for better mobile animation
  };
  
  const sectionTriggers = [0.08, 0.20, 0.32, 0.38, 0.56, 0.68, 0.76, 0.84];
  
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
  const isMobile = windowSize.width < 768;
  const textTransform = useMemo(() => {
    if (isMobile) {
      // Disable mouse tracking on mobile to improve performance
      return 'translateX(0px) translateY(0px)';
    }
    const maxTranslateX = 20; // Maximum horizontal translation in pixels
    const limitedX = Math.max(-maxTranslateX, Math.min(maxTranslateX, mousePosition.x * 10));
    return `translateX(${limitedX}px) translateY(${mousePosition.y * 10}px)`;
  }, [isMobile, mousePosition.x, mousePosition.y]);

  return (
    <div ref={containerRef} className="w-full" style={{ minHeight: 'calc(var(--vh, 1vh) * 800)', width: '100%', maxWidth: '100vw', position: 'relative', top: 0, left: 0, display: 'block', visibility: 'visible', opacity: 1, background: '#fafafa', overflowX: 'hidden', overflowY: 'visible' }}>
      <style>{`
        /* Prevent horizontal scrolling globally */
        * {
          max-width: 100%;
        }
        /* Fix for mobile address bar collapse - prevent content shift */
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
          /* Prevent overscroll bounce */
          overscroll-behavior-y: none;
          /* Use fixed viewport height to prevent shift */
          min-height: 100vh;
          min-height: calc(var(--vh, 1vh) * 100);
          min-height: -webkit-fill-available;
        }
        
        /* Main container uses fixed vh */
        #root {
          width: 100%;
          min-height: 100vh;
          min-height: calc(var(--vh, 1vh) * 100);
          min-height: -webkit-fill-available;
        }
        
        /* Prevent horizontal scrolling globally */
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes bounceDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Prevent flash on initial load - hide content until ready */
        .about-page-content:not(.ready) {
          opacity: 0 !important;
          visibility: hidden;
        }
        .about-page-content.ready {
          opacity: 1;
          visibility: visible;
          transition: opacity 0.3s ease-in, visibility 0s linear 0s;
        }
        /* Optimize for mobile - faster transition */
        @media (max-width: 767px) {
          .about-page-content.ready {
            transition: opacity 0.2s ease-in, visibility 0s linear 0s;
          }
        }
        
        /* Interests Carousel Styles */
        /* Neon Glow Effects */
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

        /* Cyberpunk Card Effects */
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

        /* Cyberpunk Text Effects */
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

        /* Cyberpunk UI Elements */
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

        /* Modal Effects */
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

        /* Carousel Animation */
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
      
      {/* Disable decorative particles on mobile for better performance */}
      {windowSize.width >= 768 && [...Array(6)].map((_, i) => (
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
              left: windowSize.width >= 768 ? '0' : '-20px',  // Shift left on mobile
              top: windowSize.width >= 768 ? `${navBarTotalHeight}px` : `${navBarTotalHeight - 20}px`,  // Shift up on mobile
              bottom: 'auto',  // Changed: Don't anchor to bottom
              width: `${windowSize.width >= 768 ? Math.max(windowSize.width * 0.32, 200) : Math.max(windowSize.width * 0.375, 200)}px`,
              maxWidth: '100vw',
              height: `${availableHeight}px`,
              minWidth: '200px',
              minHeight: '100px',
              paddingBottom: windowSize.width >= 768 ? '10%' : '5%',
              zIndex: 5,
              filter: 'drop-shadow(0 10px 40px rgba(0, 0, 0, 0.08))',
              transform: windowSize.width >= 768 
                ? avatarTransform 
                : `${avatarTransform} translateY(-${windowSize.height * 0.15}px)`,
              opacity: avatarOpacity,
              transition: 'transform 0.3s ease-out, opacity 0.6s ease-out',
              pointerEvents: 'auto',
              background: 'transparent'
            }}
          >
            <Canvas 
              camera={{ position: [0, 0, 5], fov: 50, up: [0, 1, 0] }}
              gl={{ 
                antialias: true, 
                alpha: true,
                premultipliedAlpha: false,
                powerPreference: "high-performance",
                preserveDrawingBuffer: true,
                failIfMajorPerformanceCaveat: false
              }}
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0);
              }}
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
          </div>
        )}
        
        <div 
          className={`w-full flex flex-col justify-center about-page-content ${pageReady ? 'ready' : ''}`}
          style={{
            minHeight: `calc(calc(var(--vh, 1vh) * 100) - ${navBarTotalHeight}px)`,
            opacity: pageOpacity,
            transition: 'opacity 1.2s ease-in',
            paddingLeft: windowSize.width >= 768 
              ? 'clamp(0.5rem, 1.5vw, 1.5rem)' 
              : windowSize.width < 480 
                ? '0' 
                : 'clamp(0.25rem, 1vw, 0.5rem)',
            paddingTop: windowSize.width >= 768 
              ? 'clamp(4rem, 6vw, 8rem)' 
              : windowSize.width < 480 
                ? 'clamp(0.25rem, 1.5vw, 0.75rem)'  // Shift up on mobile
                : 'clamp(0.5rem, 2.5vw, 1.5rem)',  // Shift up on mobile
            paddingBottom: windowSize.width < 480 
              ? 'clamp(2rem, 4vw, 3rem)' 
              : 'clamp(4rem, 8vw, 8rem)',
            paddingRight: windowSize.width < 480 ? 'clamp(0.75rem, 2vw, 1rem)' : '0',
            transform: windowSize.width >= 768 
              ? `translateY(-5%) translateY(${scrollProgress * -30}px)`
              : `translateY(-18%) translateY(${scrollProgress * -30}px)`,  // Shift up more on mobile
            position: 'relative',
            zIndex: 10,
            marginLeft: windowSize.width >= 768 
              ? '32%' 
              : windowSize.width < 480 
                ? `${Math.max(windowSize.width * 0.375, 200) - 40}px`  // Shift left more on mobile
                : `${Math.max(windowSize.width * 0.375, 200) - 36}px`,  // Shift left more on mobile
            maxWidth: windowSize.width >= 768 
              ? '50%' 
              : windowSize.width < 480 
                ? `${Math.max(windowSize.width - Math.max(windowSize.width * 0.375, 200) - 8, windowSize.width * 0.9)}px` 
                : `${windowSize.width - Math.max(windowSize.width * 0.375, 200) - 16}px`,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <h1
            style={{
              fontSize: windowSize.width < 768 
                ? `clamp(22px, 5.2vw, 80px)`  // Slightly smaller text on mobile
                : calculateFontSize(80, 28, 100),
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#0a0a0a',
              opacity: mainTitleVisible ? (windowSize.width >= 768 
                ? (1 - scrollProgress * 0.4) 
                : Math.max(0, 1 - scrollProgress * 0.6)) : 0,  // Faster fade out on mobile
              transform: `${mainTitleVisible ? 'translateY(0)' : 'translateY(8px)'} ${textTransform}`,
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out, fontSize 0.3s ease-out',
              marginBottom: `${calculateSpacing(16)}px`,
              whiteSpace: 'nowrap',
              overflow: 'hidden'
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
              fontSize: windowSize.width < 768 
                ? `clamp(13px, 2.8vw, 28px)`  // Slightly smaller subtitle on mobile
                : calculateFontSize(28, 12, 36),
              fontWeight: 400,
              lineHeight: 1.4,
              color: '#525252',
              minHeight: '1.4em',
              transform: textTransform,
              transition: 'transform 0.6s ease-out, fontSize 0.3s ease-out',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}
          >
            <span
              style={{
                opacity: subtitlePrefixVisible ? (windowSize.width >= 768 
                  ? (1 - scrollProgress * 0.4) 
                  : Math.max(0, 1 - scrollProgress * 0.6)) : 0,  // Faster fade out on mobile
                transition: 'opacity 0.6s ease-out'
              }}
            >
              I am a{' '}
            </span>
            <span style={{ 
              fontWeight: 500, 
              color: '#171717',
              opacity: windowSize.width >= 768 
                ? (1 - scrollProgress * 0.4) 
                : Math.max(0, 1 - scrollProgress * 0.6)  // Faster fade out on mobile
            }}>{typingText}</span>
          </div>
          
          <div
            style={{
              marginTop: `${calculateSpacing(40)}px`,
              maxWidth: windowSize.width < 480 
                ? `${Math.min(calculateSpacing(600), windowSize.width * 0.9)}px` 
                : windowSize.width < 640 
                  ? `${Math.min(calculateSpacing(600), windowSize.width * 0.85)}px` 
                  : `${calculateSpacing(600)}px`,
              fontSize: windowSize.width < 768 
                ? calculateFontSize(20, 11, 24)  // Slightly smaller description text on mobile
                : calculateFontSize(20, 12, 24),
              fontWeight: 400,
              lineHeight: 1.7,
              color: '#525252',
              opacity: scriptVisible ? (windowSize.width >= 768 
                ? (1 - scrollProgress * 0.4) 
                : Math.max(0, 1 - scrollProgress * 0.6)) : 0,  // Faster fade out on mobile
              transform: `${scriptVisible ? 'translateY(0)' : 'translateY(8px)'} ${textTransform}`,
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out, fontSize 0.3s ease-out',
              paddingLeft: windowSize.width < 480 ? `${calculateSpacing(16)}px` : `${calculateSpacing(24)}px`,
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
              right: windowSize.width >= 768 ? '2%' : 'auto',
              left: windowSize.width >= 768 ? 'auto' : '50%',
              bottom: windowSize.width >= 768 ? '0%' : '15%',  // Shift up on mobile
              top: windowSize.width >= 768 ? 'auto' : 'auto',
              width: windowSize.width >= 768 
                ? `${splineSize.containerWidth}px`
                : `${Math.max(splineSize.containerWidth, windowSize.width * 0.9)}px`,
              height: windowSize.width >= 768 
                ? `${splineSize.containerHeight}px`
                : `${Math.max(splineSize.containerHeight, windowSize.width * 0.9)}px`,
              minWidth: windowSize.width < 768 ? `${windowSize.width * 0.8}px` : 'auto',
              minHeight: windowSize.width < 768 ? `${windowSize.width * 0.8}px` : 'auto',
              transform: windowSize.width >= 768 
                ? `${avatarTransform} translateY(40px)`
                : `translateX(-50%) translateY(40px) ${avatarTransform}`,
              opacity: avatarOpacity,
              zIndex: 0,
              pointerEvents: 'auto',
              willChange: 'transform',
              transition: 'transform 0.6s ease-out, opacity 0.6s ease-out',
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
              <Suspense fallback={null}>
                <Spline 
                  scene={windowSize.width >= 768 
                    ? "https://prod.spline.design/RiI1HgjSIb8MFplx/scene.splinecode"
                    : "https://prod.spline.design/LYnE7DUy1dfNnCfp/scene.splinecode"}
                  style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'visible'
                  }}
                  onLoad={() => console.log('Spline scene loaded')}
                  onError={(error) => console.error('Spline error:', error)}
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
          overflow: 'hidden',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box'
        }}
      >
        <div 
          className="w-full flex flex-col items-center justify-center"
          style={{
            paddingTop: 'clamp(3rem, 6vw, 6rem)',
            paddingBottom: 'clamp(3rem, 6vw, 6rem)',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            transform: `translateY(${Math.max(0, (scrollProgress - sectionTriggers[0]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: (() => {
              // Use faster fade speed when scrolling up, but slower overall
              const fadeSpeed = scrollDirection.current === 'up' ? sectionConfig.fadeInSpeed * 2.0 : sectionConfig.fadeInSpeed * 1.2;
              const fadeIn = Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[0] - sectionConfig.fadeOffset)) * fadeSpeed));
              const fadeOut = Math.max(0, Math.min(1, (scrollProgress - (sectionTriggers[1] - 0.08)) / 0.07));
              return fadeIn * (1 - fadeOut);
            })(),
            transition: windowSize.width >= 768 
              ? 'transform 0.8s ease-out, opacity 0.5s ease-out'
              : 'transform 0.6s ease-out, opacity 0.4s ease-out',  // Faster transition on mobile
            maxWidth: '900px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'center',
            position: 'relative',
            zIndex: 10
          }}
        >
          <h2
            style={{
              fontSize: windowSize.width < 768 
                ? `clamp(20px, 5vw, 80px)`
                : calculateFontSize(64, 32, 80),
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#0a0a0a',
              marginBottom: `${calculateSpacing(20)}px`,
              textAlign: 'center'
            }}
          >
            Learning Beyond Classroom
          </h2>
          
          <p
            style={{
              fontSize: windowSize.width < 768 
                ? calculateFontSize(20, 10, 24)
                : calculateFontSize(22, 16, 28),
              fontWeight: 400,
              lineHeight: 1.5,
              color: '#525252',
              maxWidth: '700px',
              textAlign: 'center',
              marginBottom: 0,
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            I enjoy expanding my skill set beyond the classroom by turning curiosity into hands-on execution during free times. I continuously integrate new tools and methods with previously learned skills, using each project to strengthen fundamentals while uncovering how cross-disciplinary skills can compound into scalable, high-impact solutions.
          </p>
        </div>
        
        {/* Floating icons with orbital animation */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 5,
            overflow: 'visible'
          }}
        >
          {learningIcons.map((icon, i) => {
            const sectionProgress = Math.max(0, Math.min(1, (scrollProgress - (sectionTriggers[0] - sectionConfig.fadeOffset)) / 0.05));
            const fadeOutProgress = Math.max(0, Math.min(1, (scrollProgress - (sectionTriggers[1] - 0.08)) / 0.07));
            
            const iconOpacity = sectionProgress * (1 - fadeOutProgress);
            
            // Create multiple orbital paths - ensure equal distribution across 4 orbits
            // Use round-robin distribution: icon 0→orbit0, icon 1→orbit1, icon 2→orbit2, icon 3→orbit3, icon 4→orbit0, etc.
            const orbitIndex = i % 4;
            
            // Count how many icons are in this orbit
            const iconsInThisOrbit = Math.floor((learningIcons.length - orbitIndex + 3) / 4);
            
            // Calculate which icon this is within its orbit (0-based)
            const itemInOrbit = Math.floor(i / 4);
            
            const totalInOrbit = iconsInThisOrbit;
            
            // Different orbit radii and positions
            const orbitConfigs = [
              { x: 23, y: 20, radius: 180, rotation: 0 },     // Top left orbit
              { x: 77, y: 20, radius: 180, rotation: 90 },    // Top right orbit
              { x: 23, y: 80, radius: 180, rotation: 180 },   // Bottom left orbit
              { x: 77, y: 80, radius: 180, rotation: 270 }    // Bottom right orbit
            ];
            
            const config = orbitConfigs[orbitIndex];
            const baseRadius = windowSize.width < 640 ? config.radius * 0.5 : 
                              windowSize.width < 768 ? config.radius * 0.65 :
                              windowSize.width < 1024 ? config.radius * 0.8 : config.radius;
            
            // Spiral outward as items increase - made smaller at final state
            const spiralRadius = (baseRadius + (itemInOrbit * 40)) * 0.75;
            
            // Angle based on position in orbit
            const angleOffset = (itemInOrbit / totalInOrbit) * 360;
            const angle = (config.rotation + angleOffset + sectionProgress * 180) * (Math.PI / 180);
            
            // Calculate position
            const centerX = (windowSize.width * config.x) / 100;
            const centerY = (windowSize.height * config.y) / 100;
            
            const finalX = centerX + Math.cos(angle) * spiralRadius * sectionProgress;
            let finalY = centerY + Math.sin(angle) * spiralRadius * sectionProgress;
            
            // Special adjustment for Meitu icon to shift it up
            if (icon.name === 'Meitu') {
              finalY -= 50;
            }
            
            // Special adjustment for Blender icon to shift it down
            if (icon.name === 'Blender') {
              finalY += 80;
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
                  pointerEvents: iconOpacity > 0.3 ? 'auto' : 'none',
                  cursor: 'pointer',
                  filter: `blur(${(1 - sectionProgress) * 8}px) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))`,
                  animationName: iconOpacity > 0 ? `float-${orbitIndex}` : 'none',
                  animationDuration: iconOpacity > 0 ? '3s' : 'none',
                  animationTimingFunction: iconOpacity > 0 ? 'ease-in-out' : 'none',
                  animationIterationCount: iconOpacity > 0 ? 'infinite' : 'none',
                  animationDelay: `${itemInOrbit * 0.2}s`
                }}
                title={icon.name}
              >
                <img 
                  src={icon.url} 
                  alt={icon.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2) rotate(5deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* Gradient fade at bottom for blending with Develop With Creativity section */}
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
        {/* Video Background */}
        <video
          ref={developVideoRef}
          src="/images/develop bg.mp4"
          autoPlay={false}
          loop
          muted
          playsInline
          preload="auto"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: 0,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[1] - sectionConfig.fadeOffset - 0.03)) * (sectionConfig.fadeInSpeed * 0.8))),
            transition: 'opacity 1.5s ease-out'
          }}
        />
        {/* Gradient fade at top for blending with previous section */}
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
            paddingTop: 'clamp(4rem, 8vw, 8rem)',
            paddingBottom: 'clamp(3rem, 6vw, 6rem)',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            maxWidth: '1400px',
            marginLeft: 'auto',
            marginRight: 'auto',
            transform: `translateY(${-100 + Math.max(0, (scrollProgress - sectionTriggers[1]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[1] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
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
                  ? calculateFontSize(18, 9, 22)
                  : calculateFontSize(20, 14, 24),
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#ffffff',
                maxWidth: '700px',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)'
              }}
            >
              I also enjoy designing and developing web experiences that blend creative, thoughtful design with clear, user‑centered thinking. I care deeply about usability, accessibility, and performance of my projects, turning complex problems into elegant products that people enjoy using.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: windowSize.width >= 1024 ? 'repeat(3, 1fr)' : windowSize.width >= 640 ? 'repeat(2, 1fr)' : '1fr',
            gap: `${calculateSpacing(32)}px`
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
                    ? calculateFontSize(14, 11, 16)
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
            bottom: windowSize.width < 640 ? '0.5rem' : '1rem',
            width: windowSize.width < 640 ? 'clamp(120px, 25vw, 150px)' : 
                   windowSize.width < 768 ? 'clamp(150px, 30vw, 200px)' :
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
                scene="https://prod.spline.design/o2BjYpYprFxeYswd/scene.splinecode"
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
        {/* Gradient fade at bottom for blending with Sing Out Voices section */}
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
            const fadeOffset = windowSize.width >= 768 ? 0.05 : 0.03; // sectionConfig.fadeOffset
            const fadeInStart = sectionStart - fadeOffset;
            const fadeInEnd = sectionStart + 0.03;
            
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
        {/* Gradient fade at top for blending with Develop With Creativity section */}
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
        
        {/* Sing Out Voices Text - Mobile/Tablet */}
        {windowSize.width < 1024 && (
          <div 
            style={{
              position: 'absolute',
              top: windowSize.width < 640 ? 'clamp(9rem, 16vw, 11rem)' : 'clamp(10rem, 18vw, 12rem)',
              left: '50%',
              textAlign: 'center',
              maxWidth: '800px',
              width: '90%',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              zIndex: 20,
              transform: `translateX(-50%) translateY(${Math.max(0, (scrollProgress - sectionTriggers[2]) * -sectionConfig.translateYAmplitude)}px)`,
              opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[2] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
              transition: 'transform 0.8s ease-out, opacity 0.8s ease-out'
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
                  ? calculateFontSize(20, 10, 24)
                  : calculateFontSize(20, 14, 24),
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
        
        {/* Spinning Cards Carousel */}
        <div 
          className="relative z-20 w-full flex items-center justify-center"
          style={{
            position: 'absolute',
            top: windowSize.width >= 1024 ? '42%' : windowSize.width < 640 ? 'clamp(24rem, 50vw, 30rem)' : 'clamp(26rem, 54vw, 32rem)',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${Math.max(0, (scrollProgress - sectionTriggers[2]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[2] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
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
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        
        {/* Singing Avatar - Below Carousel */}
        <div
          style={{
            position: 'absolute',
            bottom: windowSize.width >= 1024 ? '3vh' : windowSize.width >= 640 ? '13vh' : '8vh',
            left: '50%',
            transform: `translateX(-50%) translateY(${Math.max(0, (scrollProgress - sectionTriggers[2]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[2] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
            width: windowSize.width >= 1024 ? '620px' : windowSize.width >= 640 ? '550px' : '450px',
            height: windowSize.width >= 1024 ? '450px' : windowSize.width >= 640 ? '400px' : '350px',
            zIndex: 15,
            pointerEvents: 'none',
            overflow: 'visible',
            clipPath: 'none'
          }}
        >
          <Suspense fallback={null}>
            <Canvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              {/* Responsive lighting based on breakpoints */}
              {windowSize.width >= 1024 ? (
                // Desktop lighting
                <>
                  <ambientLight intensity={1.2} />
                  <directionalLight position={[10, 10, 5]} intensity={2.4} />
                  <directionalLight position={[-5, 5, -3]} intensity={1.0} />
                  <pointLight position={[-10, -10, -5]} intensity={1.5} />
                  <pointLight position={[5, 8, 3]} intensity={0.8} />
                </>
              ) : windowSize.width >= 640 ? (
                // Tablet lighting
                <>
                  <ambientLight intensity={1.3} />
                  <directionalLight position={[8, 8, 4]} intensity={2.2} />
                  <directionalLight position={[-4, 4, -2]} intensity={1.1} />
                  <pointLight position={[-8, -8, -4]} intensity={1.6} />
                  <pointLight position={[4, 6, 2]} intensity={0.9} />
                </>
              ) : (
                // Mobile lighting
                <>
                  <ambientLight intensity={1.4} />
                  <directionalLight position={[6, 6, 3]} intensity={2.0} />
                  <directionalLight position={[-3, 3, -2]} intensity={1.2} />
                  <pointLight position={[-6, -6, -3]} intensity={1.7} />
                  <pointLight position={[3, 5, 2]} intensity={1.0} />
                </>
              )}
              <Avatar
                animationPath="/animations/Singing.fbx"
                scale={windowSize.width >= 1024 ? 1.4 : windowSize.width >= 640 ? 1.3 : 1.15}
                position={[0, -1.5, 0]}
              />
            </Canvas>
          </Suspense>
        </div>
        
        {/* Sing Out Voices Text - Desktop */}
        {windowSize.width >= 1024 && (
          <div 
            style={{
              position: 'absolute',
              top: '18%',
              left: '50%',
              textAlign: 'center',
              maxWidth: '1000px',
              width: '95%',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              zIndex: 20,
              transform: `translate(-50%, -50%) translateY(${Math.max(0, (scrollProgress - sectionTriggers[2]) * -sectionConfig.translateYAmplitude)}px)`,
              opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[2] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
              transition: 'transform 0.8s ease-out, opacity 0.8s ease-out'
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
                ? calculateFontSize(20, 10, 24)
                : calculateFontSize(20, 14, 24),
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

        {/* Gradient fade at bottom for blending with travel section - more intense at boundary */}
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
        {/* Gradient fade at top for blending with Singing section - more intense at boundary, always visible */}
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
        {/* Video Background */}
        <video
          ref={travelVideoRef}
          src="https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/IMG_0496.MP4"
          autoPlay={false}
          loop
          muted
          playsInline
          preload="auto"
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
        {/* Gradient fade at bottom for blending with next section */}
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
            transform: `translateY(${Math.max(0, (scrollProgress - sectionTriggers[3]) * -sectionConfig.translateYAmplitude)}px)`,
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
                ? calculateFontSize(20, 10, 24)
                : calculateFontSize(20, 14, 24),
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
          {/* Header Section */}
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
                        ? calculateFontSize(20, 10, 24)
                        : calculateFontSize(20, 14, 24),
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

          {/* Horizontal Scrollable Gallery */}
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
                  const scrollLeft = e.target.scrollLeft;
                  const scrollWidth = e.target.scrollWidth - e.target.clientWidth;
                  // Prevent division by zero and NaN
                  const newScroll = scrollWidth > 0 && !isNaN(scrollLeft) && !isNaN(scrollWidth) 
                    ? Math.min(Math.max(0, scrollLeft / scrollWidth), 1) 
                    : 0;
                  setGalleryScroll(newScroll);
                } catch (error) {
                  // Silently handle any errors to prevent crashes
                  console.error('Gallery scroll error:', error);
                }
              }}
            >
              {[
                { title: 'Photo 1', description: 'Capturing the beauty of moments', image: '/aboutImage/1.jpg', location: 'Daytona Beach, Florida' },
                { title: 'Photo 2', description: 'Capturing the beauty of moments', image: '/aboutImage/2.jpg', location: 'Marina Bay Sands, Singapore' },
                { title: 'Photo 3', description: 'Capturing the beauty of moments', image: '/aboutImage/3.JPG', location: 'Niagara Falls, Canada' },
                { title: 'Photo 4', description: 'Capturing the beauty of moments', image: '/aboutImage/4.jpg', location: '大三巴, Macau' },
                { title: 'Photo 5', description: 'Capturing the beauty of moments', image: '/aboutImage/5.JPG', location: 'Gardens by the Bay, Singapore' },
                { title: 'Photo 6', description: 'Capturing the beauty of moments', image: '/aboutImage/6.JPG', location: 'My Home, South Florida' },
                { title: 'Photo 7', description: 'Capturing the beauty of moments', image: '/aboutImage/7.jpg.JPG', location: 'Universal Studios Singapore' },
                { title: 'Photo 8', description: 'Capturing the beauty of moments', image: '/aboutImage/8.jpg', location: '九寨沟, Sichuan' },
                { title: 'Photo 9', description: 'Capturing the beauty of moments', image: '/aboutImage/9.jpg', location: 'Bayside Marketplace, Miami' },
                { title: 'Photo 10', description: 'Capturing the beauty of moments', image: '/aboutImage/10.jpg', location: '佛山, 广东' },
                { title: 'Photo 11', description: 'Capturing the beauty of moments', image: '/aboutImage/11.jpg', location: 'Random Library, 佛山' },
                { title: 'Photo 12', description: 'Capturing the beauty of moments', image: '/aboutImage/12.JPG', location: 'My Home, South Florida' },
                { title: 'Photo 13', description: 'Capturing the beauty of moments', image: '/aboutImage/13.JPG', location: 'Deerfield Beach, Florida' },
                { title: 'Photo 14', description: 'Capturing the beauty of moments', image: '/aboutImage/14.jpg', location: 'Manhattan, New York' },
                { title: 'Photo 15', description: 'Capturing the beauty of moments', image: '/aboutImage/15.JPG', location: 'Everglades, Florida' },
                { title: 'Photo 16', description: 'Capturing the beauty of moments', image: '/aboutImage/16.jpg', location: 'Marina Bay Sands, Singapore' },
                { title: 'Photo 17', description: 'Capturing the beauty of moments', image: '/aboutImage/17.jpg', location: 'Marina Bay Sands, Singapore' },
                { title: 'Photo 18', description: 'Capturing the beauty of moments', image: '/aboutImage/18.JPG', location: 'Daytona Beach, Florida' },
                { title: 'Photo 19', description: 'Capturing the beauty of moments', image: '/aboutImage/19.JPG', location: 'Niagara Falls, Canada' },
                { title: 'Photo 20', description: 'Capturing the beauty of moments', image: '/aboutImage/20.JPG', location: 'Downtown Miami' },
                { title: 'Photo 21', description: 'Capturing the beauty of moments', image: '/aboutImage/21.JPG', location: 'Everglades, Florida' },
                { title: 'Photo 22', description: 'Capturing the beauty of moments', image: '/aboutImage/22.jpg', location: 'Kuala Lumpur, Malaysia' },
                { title: 'Photo 23', description: 'Capturing the beauty of moments', image: '/aboutImage/23.JPG', location: 'Boca Raton, Florida' },
                { title: 'Photo 24', description: 'Capturing the beauty of moments', image: '/aboutImage/24.JPG', location: 'Fort Canning Park, Singapore' },
                { title: 'Photo 25', description: 'Capturing the beauty of moments', image: '/aboutImage/25.JPG', location: 'South Beach, Florida' },
                { title: 'Photo 26', description: 'Capturing the beauty of moments', image: '/aboutImage/26.JPG', location: 'Toronto, Canada' },
                { title: 'Photo 27', description: 'Capturing the beauty of moments', image: '/aboutImage/27.png', location: '香格里拉, 云南' },
                { title: 'Photo 28', description: 'Capturing the beauty of moments', image: '/aboutImage/28.JPG', location: '香格里拉, 云南' },
              ].map((item, i) => {
                // 图片直接显示，无淡入效果
                const itemOpacity = 1;
                
                // Staggered layout pattern: baseline, up, up (smaller height)
                // Pattern repeats every 3 items: 0=baseline, 1=up, 2=up(top aligned with 1, smaller height)
                const patternIndex = i % 3;
                let verticalOffset = 0;
                let boxHeight = windowSize.width >= 768 ? 400 : 300; // Default height
                
                if (patternIndex === 0) {
                  verticalOffset = 0; // Baseline
                } else if (patternIndex === 1) {
                  verticalOffset = -60; // Up - shifted up from baseline
                } else if (patternIndex === 2) {
                  verticalOffset = -60; // Up - top aligned with second box (same Y position for top alignment)
                  // Height calculated so gap between 3rd bottom and 2nd bottom equals gap between 2nd bottom and 1st bottom (60px)
                  // Box 2 bottom: -60 + 400 = 340px, so box 3 bottom should be at 340 - 60 = 280px
                  // Since box 3 top is at -60px, height = 280 - (-60) = 340px
                  boxHeight = windowSize.width >= 768 ? 340 : 240; // Adjusted height to match gap spacing
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
                    minWidth: windowSize.width >= 768 ? '340px' : '250px',
                    width: windowSize.width >= 768 ? '340px' : '250px',
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
                    willChange: 'transform'
                  }}
                  onMouseEnter={() => {
                    setHoveredGalleryItem(i);
                  }}
                  onMouseLeave={() => {
                    setHoveredGalleryItem(null);
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'translateZ(0)',
                    willChange: 'transform'
                  }}>
                    <img 
                      src={item.image} 
                      alt={item.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        imageRendering: 'auto',
                        WebkitImageRendering: 'auto',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                        willChange: 'transform',
                        opacity: 1
                      }}
                      loading="lazy"
                      onError={(e) => {
                        try {
                          // Fallback to gradient if image fails to load
                          if (e && e.target && e.target.parentElement) {
                            e.target.style.display = 'none';
                            e.target.parentElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                          }
                        } catch (error) {
                          // Silently handle errors to prevent crashes
                          console.error('Image error handler failed:', error);
                        }
                      }}
                    />
                    {/* Location overlay on hover */}
                    {isHovered && item.location && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.5), transparent)',
                        padding: '24px 20px 20px 20px',
                        color: '#ffffff',
                        fontSize: calculateFontSize(18, 16, 20),
                        fontWeight: 600,
                        transition: 'opacity 0.3s ease',
                        animation: 'fadeIn 0.3s ease'
                      }}>
                        📍 {item.location}
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            {/* Navigation Controls */}
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
                      galleryRef.current.scrollBy({ left: -400, behavior: 'smooth' });
                    }
                  } catch (error) {
                    console.error('Gallery scroll error:', error);
                  }
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid #e5e5e5',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0a0a0a';
                  e.currentTarget.style.background = '#fafafa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e5e5';
                  e.currentTarget.style.background = '#ffffff';
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
                      galleryRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                    }
                  } catch (error) {
                    console.error('Gallery scroll error:', error);
                  }
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid #e5e5e5',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0a0a0a';
                  e.currentTarget.style.background = '#fafafa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e5e5';
                  e.currentTarget.style.background = '#ffffff';
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
          boxSizing: 'border-box'
        }}
      >
        <div 
          className="w-full"
          style={{
            paddingTop: 'clamp(3rem, 6vw, 6rem)',
            paddingBottom: 'clamp(3rem, 6vw, 6rem)',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'left',
            transform: `translateY(${Math.max(0, (scrollProgress - sectionTriggers[4]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[4] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out'
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
            Compete for Greatness
          </h2>
          <p
            style={{
              fontSize: windowSize.width < 768 
                ? calculateFontSize(20, 10, 24)
                : calculateFontSize(20, 14, 24),
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#525252',
              maxWidth: '800px'
            }}
          >
            Competitive gaming taught me focus, resilience, and strategic thinking. It shaped my never-give-up
            mentality—every match is a lesson in adaptation, teamwork, and the relentless pursuit of excellence.
            The discipline and concentration from gaming translate directly into how I approach challenges in life.
          </p>
        </div>
      </div>

      <div 
        className="relative w-full"
        style={{ 
          minHeight: 'calc(var(--vh, 1vh) * 80)',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box'
        }}
      >
        <div 
          className="w-full"
          style={{
            paddingTop: 'clamp(3rem, 6vw, 6rem)',
            paddingBottom: 'clamp(3rem, 6vw, 6rem)',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'center',
            transform: `translateY(${Math.max(0, (scrollProgress - sectionTriggers[5]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[5] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out'
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
            Music for Life
          </h2>
          <p
            style={{
              fontSize: windowSize.width < 768 
                ? calculateFontSize(20, 10, 24)
                : calculateFontSize(20, 14, 24),
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#525252',
              maxWidth: '800px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            Music is the soundtrack to my journey—fueling creativity, providing comfort, and energizing my pursuits.
            From indie melodies to powerful anthems, every genre adds color to my life's narrative.
          </p>
        </div>
      </div>


      <div 
        className="relative w-full"
        style={{ 
          minHeight: 'calc(var(--vh, 1vh) * 80)',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box'
        }}
      >
        <div 
          className="w-full"
          style={{
            paddingTop: 'clamp(3rem, 6vw, 6rem)',
            paddingBottom: 'clamp(4rem, 8vw, 8rem)',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'center',
            transform: `translateY(${Math.max(0, (scrollProgress - sectionTriggers[7]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[7] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out'
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
            Sport & Teamwork
          </h2>
          <p
            style={{
              fontSize: windowSize.width < 768 
                ? calculateFontSize(20, 10, 24)
                : calculateFontSize(20, 14, 24),
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#525252',
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
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
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
              marginBottom: '-8px'
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