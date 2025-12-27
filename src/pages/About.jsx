import React, { useRef, useEffect, Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useFBX } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import Spline from '@splinetool/react-spline';

// 3D Avatar Component
function Avatar({ animationPath, scale = 1.6, position = [0, -1.5, 0], onBoundingBoxCalculated }) {
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
          .fadeIn(0.5)
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
  
  const backwardRotation = 15 * (Math.PI / 180);
  
  return (
    <group 
      ref={group} 
      position={position} 
      scale={scale} 
      rotation={[backwardRotation, 0, 0]}
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

export default function About() {
  const [currentAnimation, setCurrentAnimation] = useState('/animations/idle.fbx');
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 1920, height: 1080 };
  });
  const [modelCenterY, setModelCenterY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const [mainTitleVisible, setMainTitleVisible] = useState(false);
  const [subtitlePrefixVisible, setSubtitlePrefixVisible] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [currentIdentityIndex, setCurrentIdentityIndex] = useState(0);
  const [pageOpacity, setPageOpacity] = useState(0);
  const [scriptVisible, setScriptVisible] = useState(false);
  
  const containerRef = useRef(null);
  
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
  
  useEffect(() => {
    setPageOpacity(1);
  }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setMainTitleVisible(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setSubtitlePrefixVisible(true);
    }, 1600);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setScriptVisible(true);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);
  
  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollTop / docHeight, 1);
      setScrollProgress(progress);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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
          
          const charDelay = 140;
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
          state.timeoutId = setTimeout(typeCharacter, 90);
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
    }, 800);
    
    return () => {
      clearTimeout(initialTimeout);
      if (state.timeoutId) clearTimeout(state.timeoutId);
    };
  }, [subtitlePrefixVisible]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
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

    const initialTimeout = setTimeout(() => {
      triggerWaving();
    }, 1000);
    timeoutIds.push(initialTimeout);

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, []);

  
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
  
  // Calculate proportional font sizes based on screen width
  // Desktop gets bigger, mobile gets smaller
  const calculateFontSize = (baseSize, minSize, maxSize) => {
    const screenWidth = windowSize.width;
    
    // Use viewport-based scaling with wider range
    if (screenWidth < 640) {
      // Mobile: smaller sizes
      return `${minSize * 0.85}px`; // Make mobile even smaller
    } else if (screenWidth < 768) {
      // Small tablet: slightly larger than mobile
      const scale = 0.7;
      return `${Math.max(minSize, baseSize * scale)}px`;
    } else if (screenWidth < 1024) {
      // Tablet: medium sizes
      const scale = 0.85;
      return `${baseSize * scale}px`;
    } else if (screenWidth < 1440) {
      // Small desktop: slightly smaller than base
      const scale = 0.9;
      return `${baseSize * scale}px`;
    } else if (screenWidth < 1920) {
      // Medium desktop: slightly smaller than base
      const scale = 0.95;
      return `${baseSize * scale}px`;
    } else {
      // Large desktop: base size (reduced from 1.2x)
      return `${Math.min(maxSize, baseSize)}px`;
    }
  };
  
  // Calculate proportional spacing
  const calculateSpacing = (baseValue) => {
    const screenWidth = windowSize.width;
    
    if (screenWidth < 640) {
      // Mobile: smaller spacing
      return baseValue * 0.6;
    } else if (screenWidth < 768) {
      return baseValue * 0.7;
    } else if (screenWidth < 1024) {
      return baseValue * 0.85;
    } else if (screenWidth < 1440) {
      return baseValue * 0.95;
    } else if (screenWidth < 1920) {
      return baseValue;
    } else {
      // Large desktop: bigger spacing
      return baseValue * 1.2;
    }
  };
  
  const avatarScale = calculateScale();
  
  const navBarTop = 16;
  const navBarHeight = windowSize.width >= 768 ? 64 : 56;
  const navBarTotalHeight = navBarTop + navBarHeight;
  const availableHeight = Math.max(windowSize.height - navBarTotalHeight, 100);
  
  const isDesktop = windowSize.width >= 768;
  const desktopYOffset = isDesktop ? -0.5 : 0;
  const avatarPosition = [0, -modelCenterY + desktopYOffset, 0];
  
  const calculateSplineSize = () => {
    const screenWidth = windowSize.width;
    
    // Base dimensions at 1920px width
    const baseWidth = 1920;
    const baseContainerSize = 600;
    
    // Calculate scale factor based on screen width
    const scaleFactor = screenWidth / baseWidth;
    const containerSize = baseContainerSize * scaleFactor;
    
    return {
      containerWidth: containerSize,
      containerHeight: containerSize,
      // CSS transform scale to actually resize the Spline model
      modelScale: scaleFactor
    };
  };
  
  const splineSize = calculateSplineSize();
  
  // Calculate dynamic transforms based on scroll
  const avatarTransform = `translateY(${scrollProgress * 30}%) scale(${1 - scrollProgress * 0.3})`;
  const avatarOpacity = 1 - scrollProgress * 1.2;
  
  const textTransform = `translateX(${mousePosition.x * 10}px) translateY(${mousePosition.y * 10}px)`;
  
  const connectionLineHeight = `${scrollProgress * 100}%`;
  
  return (
    <div ref={containerRef} className="w-full" style={{ minHeight: '200vh', width: '100%', maxWidth: '100vw', position: 'relative', top: 0, left: 0, display: 'block', visibility: 'visible', opacity: 1, background: '#fafafa', overflowX: 'hidden' }}>
      
      {/* Animated connection line */}
      <div 
        style={{
          position: 'fixed',
          left: '37.5%',
          top: `${navBarTotalHeight}px`,
          width: '2px',
          height: connectionLineHeight,
          background: 'linear-gradient(180deg, transparent 0%, #171717 20%, #171717 80%, transparent 100%)',
          transformOrigin: 'top',
          transition: 'height 0.1s ease-out',
          zIndex: 1,
          opacity: scrollProgress > 0.05 ? 1 : 0
        }}
      >
        {/* Animated dot at the end */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#171717',
          boxShadow: '0 0 20px rgba(23, 23, 23, 0.5)'
        }} />
      </div>
      
      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
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
      
      <div className="relative w-full" style={{ minHeight: '100vh', paddingTop: `${navBarTotalHeight}px` }}>
        {availableHeight > 0 && windowSize.width > 0 && (
          <div 
            className="fixed left-0 overflow-hidden flex items-end justify-center"
            style={{
              top: `${navBarTotalHeight}px`,
              bottom: 0,
              width: `${Math.max(windowSize.width * 0.375, 200)}px`,
              height: `${availableHeight}px`,
              minWidth: '200px',
              minHeight: '100px',
              paddingBottom: '10%',
              zIndex: 5,
              filter: 'drop-shadow(0 10px 40px rgba(0, 0, 0, 0.08))',
              transform: avatarTransform,
              opacity: Math.max(0, avatarOpacity),
              transition: 'transform 0.1s ease-out, opacity 0.1s ease-out'
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
                gl.setClearColor('#ffffff', 0);
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
          className="w-full flex flex-col justify-center"
          style={{
            minHeight: `calc(100vh - ${navBarTotalHeight}px)`,
            opacity: pageOpacity,
            transition: 'opacity 0.8s ease-in',
            paddingLeft: windowSize.width >= 768 ? 'clamp(0.5rem, 1.5vw, 1.5rem)' : 'clamp(1rem, 2vw, 2rem)',
            paddingRight: 'clamp(2rem, 4vw, 4rem)',
            paddingBottom: 'clamp(4rem, 8vw, 8rem)',
            transform: `${windowSize.width >= 768 ? 'translate(-4rem, -5%)' : 'translateY(-5%)'} translateY(${scrollProgress * -50}px)`,
            position: 'relative',
            zIndex: 10,
            marginLeft: windowSize.width >= 768 ? '37.5%' : `${Math.max(windowSize.width * 0.375, 200) + 16}px`,
            maxWidth: windowSize.width >= 768 ? '50%' : `${windowSize.width - Math.max(windowSize.width * 0.375, 200) - 32}px`
          }}
        >
          <h1
            style={{
              fontSize: calculateFontSize(80, 28, 100),
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#0a0a0a',
              opacity: mainTitleVisible ? (1 - scrollProgress * 0.8) : 0,
              transform: `${mainTitleVisible ? 'translateY(0)' : 'translateY(8px)'} ${textTransform}`,
              transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
              marginBottom: `${calculateSpacing(16)}px`
            }}
          >
            Hi, I am Jijun Nie
          </h1>
          
          <div
            style={{
              fontSize: calculateFontSize(28, 12, 36),
              fontWeight: 400,
              lineHeight: 1.4,
              color: '#525252',
              minHeight: '1.4em',
              transform: textTransform,
              transition: 'transform 0.3s ease-out'
            }}
          >
            <span
              style={{
                opacity: subtitlePrefixVisible ? (1 - scrollProgress * 0.8) : 0,
                transition: 'opacity 0.3s ease-out'
              }}
            >
              I am a{' '}
            </span>
            <span style={{ 
              fontWeight: 500, 
              color: '#171717',
              opacity: 1 - scrollProgress * 0.8 
            }}>{typingText}</span>
          </div>
          
          <div
            style={{
              marginTop: `${calculateSpacing(40)}px`,
              maxWidth: `${calculateSpacing(600)}px`,
              fontSize: calculateFontSize(20, 12, 24),
              fontWeight: 400,
              lineHeight: 1.7,
              color: '#525252',
              opacity: scriptVisible ? (1 - scrollProgress * 0.8) : 0,
              transform: `${scriptVisible ? 'translateY(0)' : 'translateY(8px)'} ${textTransform}`,
              transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
              paddingLeft: `${calculateSpacing(24)}px`,
              borderLeft: `${calculateSpacing(2)}px solid #e5e5e5`
            }}
          >
            <p>
              Your personal script about yourself will appear here. This text will fade in after the subtitle appears.
            </p>
          </div>
        </div>
        
        {splineSize.containerWidth > 0 && splineSize.containerHeight > 0 && (
          <div 
            className="absolute pointer-events-auto"
            style={{
              right: '3%',
              bottom: '3%',
              width: `${splineSize.containerWidth}px`,
              height: `${splineSize.containerHeight}px`,
              transform: `translateY(${scrollProgress * 100}px) scale(${1 - scrollProgress * 0.2})`,
              opacity: 1 - scrollProgress * 1.5,
              zIndex: 0,
              pointerEvents: 'auto',
              willChange: 'transform',
              transition: 'transform 0.1s ease-out, opacity 0.1s ease-out'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                transform: `scale(${splineSize.modelScale})`,
                transformOrigin: 'center center'
              }}
            >
              <Suspense fallback={null}>
                <Spline 
                  scene="https://prod.spline.design/RiI1HgjSIb8MFplx/scene.splinecode"
                  style={{
                    width: '100%',
                    height: '100%'
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
          minHeight: '100vh',
          paddingBottom: 'clamp(4rem, 8vw, 8rem)',
          background: '#ffffff',
          paddingTop: '5rem'
        }}
      >
        <div 
          className="w-full flex flex-col justify-center"
          style={{
            minHeight: `calc(100vh - ${navBarTotalHeight}px)`,
            paddingLeft: windowSize.width >= 768 ? 'clamp(0.5rem, 1.5vw, 1.5rem)' : 'clamp(1rem, 2vw, 2rem)',
            paddingRight: 'clamp(2rem, 4vw, 4rem)',
            transform: `${windowSize.width >= 768 ? 'translate(-4rem, 0)' : 'translate(0, 0)'} translateY(${Math.max(0, (scrollProgress - 0.3) * -100)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - 0.3) * 3)),
            transition: 'transform 0.1s ease-out, opacity 0.3s ease-out',
            position: 'relative',
            zIndex: 10,
            marginLeft: windowSize.width >= 768 ? '37.5%' : `${Math.max(windowSize.width * 0.375, 200) + 16}px`,
            maxWidth: windowSize.width >= 768 ? '50%' : `${windowSize.width - Math.max(windowSize.width * 0.375, 200) - 32}px`
          }}
        >
          <h2
            style={{
              fontSize: calculateFontSize(64, 24, 80),
              fontWeight: 500,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: '#0a0a0a',
              marginBottom: `${calculateSpacing(40)}px`,
              transform: `translateY(${Math.max(0, (0.5 - scrollProgress) * 50)}px)`,
              transition: 'transform 0.3s ease-out'
            }}
          >
            More About Me
          </h2>
          
          <div
            style={{
              fontSize: calculateFontSize(20, 12, 24),
              fontWeight: 400,
              lineHeight: 1.8,
              color: '#525252',
              maxWidth: `${calculateSpacing(700)}px`
            }}
          >
            <p style={{ 
              marginBottom: `${calculateSpacing(32)}px`, 
              paddingLeft: `${calculateSpacing(24)}px`,
              borderLeft: `${calculateSpacing(2)}px solid #e5e5e5`,
              transform: `translateY(${Math.max(0, (0.5 - scrollProgress) * 60)}px)`,
              opacity: Math.min(1, Math.max(0, (scrollProgress - 0.35) * 3)),
              transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
            }}>
              This is a new section where you can add more content about yourself. 
              You can include your background, interests, achievements, or anything else you'd like to share.
            </p>
            <p style={{ 
              paddingLeft: `${calculateSpacing(24)}px`,
              borderLeft: `${calculateSpacing(2)}px solid #e5e5e5`,
              transform: `translateY(${Math.max(0, (0.6 - scrollProgress) * 70)}px)`,
              opacity: Math.min(1, Math.max(0, (scrollProgress - 0.4) * 3)),
              transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
            }}>
              Feel free to customize this section with your own content, images, or any other elements 
              that help tell your story.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}