import React, { useRef, useEffect, Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useFBX } from '@react-three/drei';
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

export default function About() {
  const [currentAnimation, setCurrentAnimation] = useState('/animations/idle.fbx');
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 1920, height: 1080 };
  });
  const [modelCenterY, setModelCenterY] = useState(0);
  const [singingModelCenterY, setSingingModelCenterY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const [modelsVisible, setModelsVisible] = useState(false);
  const [mainTitleVisible, setMainTitleVisible] = useState(false);
  const [titleTypingText, setTitleTypingText] = useState('');
  const [titleComplete, setTitleComplete] = useState(false);
  const [subtitlePrefixVisible, setSubtitlePrefixVisible] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [currentIdentityIndex, setCurrentIdentityIndex] = useState(0);
  const [pageOpacity, setPageOpacity] = useState(0);
  const [scriptVisible, setScriptVisible] = useState(false);
  
  const containerRef = useRef(null);
  
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
    { url: '/icons2/blender.png', name: 'Blender' },
    { url: '/icons2/canva.png', name: 'Canva' },
    { url: '/icons2/capcut.png', name: 'CapCut' },
    { url: '/icons2/chanjing.png', name: 'ChanJing' },
    { url: '/icons2/chatgpt.png', name: 'ChatGPT' },
    { url: '/icons2/claude.png', name: 'Claude' },
    { url: '/icons2/coursera.png', name: 'Coursera' },
    { url: '/icons2/cursor.png', name: 'Cursor' },
    { url: '/icons2/dji.png', name: 'DJI' },
    { url: '/icons2/google.png', name: 'Google' },
    { url: '/icons2/jimengai.png', name: 'JiMengAI' },
    { url: '/icons2/meitu.png', name: 'Meitu' },
    { url: '/icons2/microsoft.png', name: 'Microsoft' },
    { url: '/icons2/react.png', name: 'React' },
    { url: '/icons2/solidwork.png', name: 'SolidWorks' },
    { url: '/icons2/spline.png', name: 'Spline' },
    { url: '/icons2/SQL.png', name: 'SQL' },
    { url: '/icons2/three.js.png', name: 'Three.js' },
    { url: '/icons2/vite.png', name: 'Vite' },
    { url: '/icons2/vscode.png', name: 'VS Code' },
  ];
  
  useEffect(() => {
    setPageOpacity(1);
    setModelsVisible(true);
  }, []);
  
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
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollTop / docHeight, 1);
      setScrollProgress(progress);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
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
    
    if (screenWidth < 640) {
      return `${minSize * 0.85}px`;
    } else if (screenWidth < 768) {
      const scale = 0.7;
      return `${Math.max(minSize, baseSize * scale)}px`;
    } else if (screenWidth < 1024) {
      const scale = 0.85;
      return `${baseSize * scale}px`;
    } else if (screenWidth < 1440) {
      const scale = 0.8;
      return `${baseSize * scale}px`;
    } else if (screenWidth < 1920) {
      const scale = 0.85;
      return `${baseSize * scale}px`;
    } else {
      const scale = 0.9;
      return `${Math.min(maxSize, baseSize * scale)}px`;
    }
  };
  
  const calculateSpacing = (baseValue) => {
    const screenWidth = windowSize.width;
    
    if (screenWidth < 640) {
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
  
  const avatarTransform = `translateY(${scrollProgress * 15}%) scale(${1 - scrollProgress * 0.15})`;
  // Avatar completely disappears before "Learning Beyond Classroom" section appears (fades from 0.03 to 0.05)
  const avatarOpacity = modelsVisible ? Math.max(0, 1 - Math.max(0, (scrollProgress - 0.03) * 50)) : 0;
  
  const textTransform = `translateX(${mousePosition.x * 10}px) translateY(${mousePosition.y * 10}px)`;

  const sectionConfig = {
    fadeInSpeed: isDesktop ? 8 : 12,
    fadeOffset: isDesktop ? 0.03 : 0.01,
    translateYAmplitude: isDesktop ? 40 : 25
  };
  
  const sectionTriggers = [0.08, 0.20, 0.32, 0.44, 0.56, 0.68, 0.76, 0.84];

  return (
    <div ref={containerRef} className="w-full" style={{ minHeight: '800vh', width: '100%', maxWidth: '100vw', position: 'relative', top: 0, left: 0, display: 'block', visibility: 'visible', opacity: 1, background: '#fafafa', overflowX: 'hidden' }}>
      <style>{`
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
      `}</style>
      
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
              width: `${windowSize.width >= 768 ? Math.max(windowSize.width * 0.32, 200) : Math.max(windowSize.width * 0.375, 200)}px`,
              height: `${availableHeight}px`,
              minWidth: '200px',
              minHeight: '100px',
              paddingBottom: '10%',
              zIndex: 5,
              filter: 'drop-shadow(0 10px 40px rgba(0, 0, 0, 0.08))',
              transform: avatarTransform,
              opacity: Math.max(0, avatarOpacity),
              transition: 'transform 0.3s ease-out, opacity 1.2s ease-in',
              pointerEvents: scrollProgress >= 0.2 ? 'none' : 'auto'
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
            transition: 'opacity 1.2s ease-in',
            paddingLeft: windowSize.width >= 768 ? 'clamp(0.5rem, 1.5vw, 1.5rem)' : 'clamp(1rem, 2vw, 2rem)',
            paddingTop: windowSize.width >= 768 ? 'clamp(4rem, 6vw, 8rem)' : 'clamp(2rem, 4vw, 4rem)',
            paddingBottom: 'clamp(4rem, 8vw, 8rem)',
            transform: `${windowSize.width >= 768 ? 'translate(-6rem, -5%)' : 'translateY(-5%)'} translateY(${scrollProgress * -30}px)`,
            position: 'relative',
            zIndex: 10,
            marginLeft: windowSize.width >= 768 ? '32%' : `${Math.max(windowSize.width * 0.375, 200) + 16}px`,
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
              opacity: mainTitleVisible ? (1 - scrollProgress * 0.4) : 0,
              transform: `${mainTitleVisible ? 'translateY(0)' : 'translateY(8px)'} ${textTransform}`,
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
              marginBottom: `${calculateSpacing(16)}px`
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
              fontSize: calculateFontSize(28, 12, 36),
              fontWeight: 400,
              lineHeight: 1.4,
              color: '#525252',
              minHeight: '1.4em',
              transform: textTransform,
              transition: 'transform 0.6s ease-out'
            }}
          >
            <span
              style={{
                opacity: subtitlePrefixVisible ? (1 - scrollProgress * 0.4) : 0,
                transition: 'opacity 0.6s ease-out'
              }}
            >
              I am a{' '}
            </span>
            <span style={{ 
              fontWeight: 500, 
              color: '#171717',
              opacity: 1 - scrollProgress * 0.4
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
              opacity: scriptVisible ? (1 - scrollProgress * 0.4) : 0,
              transform: `${scriptVisible ? 'translateY(0)' : 'translateY(8px)'} ${textTransform}`,
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
              paddingLeft: `${calculateSpacing(24)}px`,
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
        
        {splineSize.containerWidth > 0 && splineSize.containerHeight > 0 && (
          <div 
            className="absolute pointer-events-auto"
            style={{
              right: '2%',
              bottom: '2%',
              width: `${splineSize.containerWidth}px`,
              height: `${splineSize.containerHeight}px`,
              transform: `translateY(${scrollProgress * 60}px) scale(${1 - scrollProgress * 0.1})`,
              opacity: modelsVisible ? Math.max(0, avatarOpacity) : 0,
              zIndex: 0,
              pointerEvents: scrollProgress >= 0.2 ? 'none' : 'auto',
              willChange: 'transform',
              transition: 'transform 0.6s ease-out, opacity 1.2s ease-in',
              overflow: 'visible'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                transformOrigin: 'center center',
                overflow: 'visible'
              }}
            >
              <Suspense fallback={null}>
                <Spline 
                  scene="https://prod.spline.design/RiI1HgjSIb8MFplx/scene.splinecode"
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
          minHeight: '100vh',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {/* Radial blur background effect - creates blur from center */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            pointerEvents: 'none',
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[0] - sectionConfig.fadeOffset)) * (sectionConfig.fadeInSpeed * 1.5))),
            background: 'radial-gradient(circle at center, rgba(250, 250, 250, 0.98) 0%, rgba(250, 250, 250, 0.9) 15%, rgba(250, 250, 250, 0.7) 30%, rgba(250, 250, 250, 0.5) 45%, rgba(250, 250, 250, 0.3) 60%, rgba(250, 250, 250, 0.1) 75%, rgba(250, 250, 250, 0) 100%)'
          }}
        />
        <div 
          className="w-full flex flex-col items-center justify-center"
          style={{
            paddingTop: 'clamp(3rem, 6vw, 6rem)',
            paddingBottom: 'clamp(3rem, 6vw, 6rem)',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            transform: `translateY(${Math.max(0, (scrollProgress - sectionTriggers[0]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[0] - sectionConfig.fadeOffset)) * (sectionConfig.fadeInSpeed * 1.5))),
            transition: 'transform 0.8s ease-out, opacity 0.5s ease-out',
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
              fontSize: calculateFontSize(64, 32, 80),
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
              fontSize: calculateFontSize(22, 16, 28),
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
            zIndex: 1,
            overflow: 'visible'
          }}
        >
          {learningIcons.map((icon, i) => {
            const sectionProgress = Math.max(0, Math.min(1, (scrollProgress - (sectionTriggers[0] - sectionConfig.fadeOffset)) / 0.05));
            const fadeOutProgress = Math.max(0, Math.min(1, (scrollProgress - (sectionTriggers[1] - 0.05)) / 0.08));
            
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
            const finalY = centerY + Math.sin(angle) * spiralRadius * sectionProgress;
            
            // Scale animation
            const scale = 0.3 + (sectionProgress * 0.7);
            
            const iconSize = windowSize.width < 640 ? 44 : 
                            windowSize.width < 768 ? 52 :
                            windowSize.width < 1024 ? 60 : 70;
            
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
                  animation: iconOpacity > 0 ? `float-${orbitIndex} 3s ease-in-out infinite` : 'none',
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
      </div>

      <div 
        className="relative w-full"
        style={{ 
          minHeight: '100vh',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div 
          className="w-full"
          style={{
            paddingTop: 'clamp(2rem, 4vw, 4rem)',
            paddingBottom: 'clamp(3rem, 6vw, 6rem)',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            maxWidth: '1400px',
            marginLeft: 'auto',
            marginRight: 'auto',
            transform: `translateY(${Math.max(0, (scrollProgress - sectionTriggers[1]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[1] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out'
          }}
        >
          <div style={{ textAlign: 'left', marginBottom: `${calculateSpacing(60)}px` }}>
            <h2
              style={{
                fontSize: calculateFontSize(56, 28, 72),
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: '#0a0a0a',
                marginBottom: `${calculateSpacing(16)}px`
              }}
            >
              Develop With Creativity
            </h2>
            <p
              style={{
                fontSize: calculateFontSize(20, 14, 24),
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#525252',
                maxWidth: '700px'
              }}
            >
              I thrive on improving processes through innovation, optimization, and systematic thinking—
              turning complexity into elegant solutions that drive real impact.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: windowSize.width >= 1024 ? 'repeat(3, 1fr)' : windowSize.width >= 640 ? 'repeat(2, 1fr)' : '1fr',
            gap: `${calculateSpacing(32)}px`
          }}>
            {[
              { title: 'Innovation', description: 'Transforming ideas into breakthrough solutions that challenge the status quo' },
              { title: 'Optimization', description: 'Refining processes to achieve maximum efficiency and measurable results' },
              { title: 'Systems Thinking', description: 'Understanding interconnections to create holistic, sustainable improvements' }
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
                  fontSize: calculateFontSize(28, 20, 32),
                  fontWeight: 600,
                  color: '#0a0a0a',
                  marginBottom: `${calculateSpacing(12)}px`
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: calculateFontSize(16, 13, 18),
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
            bottom: windowSize.width < 640 ? '1rem' : '2rem',
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
      </div>

      <div 
        className="relative w-full"
        style={{ 
          minHeight: '100vh',
          background: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* 3D Avatar at the top */}
        {windowSize.width > 0 && (
          <div 
            className="absolute left-0 right-0 overflow-hidden flex items-center"
            style={{
              top: 0,
              height: '75%',
              width: '100%',
              zIndex: 10,
              justifyContent: windowSize.width >= 768 ? 'flex-start' : 'center',
              paddingLeft: windowSize.width >= 768 ? 'clamp(1.5rem, 4vw, 4rem)' : '0'
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
                overflow: 'hidden'
              }}
            >
              <ambientLight intensity={1.5} />
              <directionalLight position={[5, 8, 5]} intensity={2.5} />
              <directionalLight position={[0, 3, 8]} intensity={2} />
              <directionalLight position={[-5, 5, -5]} intensity={1.2} color="#a5b4fc" />
              <pointLight position={[8, 2, 3]} intensity={1} color="#fbbf24" />
              <pointLight position={[-8, 2, 3]} intensity={1} color="#60a5fa" />
              <hemisphereLight skyColor="#ffffff" groundColor="#b0b0b0" intensity={1.2} />
              
              <Suspense fallback={null}>
                <Avatar 
                  animationPath="/animations/Singing.fbx"
                  scale={avatarScale}
                  position={[windowSize.width >= 768 ? -3.5 : 0, -singingModelCenterY - 0.5, 0]}
                  onBoundingBoxCalculated={setSingingModelCenterY}
                  noRotation={true}
                  rotation={[0, 10 * (Math.PI / 180), -5 * (Math.PI / 180)]}
                />
              </Suspense>
            </Canvas>
          </div>
        )}
        
        {/* Text at the bottom 25% */}
        <div 
          className="absolute left-0 right-0"
          style={{
            bottom: 0,
            height: '25%',
            paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
            paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
            paddingBottom: 'clamp(3rem, 6vw, 6rem)',
            paddingTop: 'clamp(2rem, 4vw, 4rem)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
            maxWidth: '1200px',
            width: '100%',
            textAlign: 'left',
            transform: `translateY(${Math.max(0, (scrollProgress - sectionTriggers[2]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[2] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
            zIndex: 5
          }}
        >
          <h2
            style={{
              fontSize: calculateFontSize(56, 28, 72),
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#0a0a0a',
              marginBottom: `${calculateSpacing(16)}px`
            }}
          >
            Sing Out the Voices
          </h2>
          <p
            style={{
              fontSize: calculateFontSize(20, 14, 24),
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#525252',
              maxWidth: '700px'
            }}
          >
            Music is my emotional outlet and creative expression. Through singing, I connect with stories,
            convey emotions, and share experiences that words alone cannot capture.
          </p>
        </div>
      </div>

      <div 
        className="relative w-full"
        style={{ 
          minHeight: '100vh',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center'
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
            transform: `translateY(${Math.max(0, (scrollProgress - sectionTriggers[3]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[3] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out'
          }}
        >
          <h2
            style={{
              fontSize: calculateFontSize(56, 28, 72),
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#0a0a0a',
              marginBottom: `${calculateSpacing(16)}px`
            }}
          >
            Capture the Beauty
          </h2>
          <p
            style={{
              fontSize: calculateFontSize(20, 14, 24),
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#525252',
              maxWidth: '800px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            Photography allows me to freeze moments in time, finding beauty in the everyday and extraordinary.
            Each shot tells a story, preserving memories and perspectives that inspire and connect.
          </p>
        </div>
      </div>

      <div 
        className="relative w-full"
        style={{ 
          minHeight: '100vh',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center'
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
              fontSize: calculateFontSize(56, 28, 72),
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
              fontSize: calculateFontSize(20, 14, 24),
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
          minHeight: '80vh',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center'
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
              fontSize: calculateFontSize(56, 28, 72),
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
              fontSize: calculateFontSize(20, 14, 24),
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
          minHeight: '80vh',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center'
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
            textAlign: 'right',
            transform: `translateY(${Math.max(0, (scrollProgress - sectionTriggers[6]) * -sectionConfig.translateYAmplitude)}px)`,
            opacity: Math.min(1, Math.max(0, (scrollProgress - (sectionTriggers[6] - sectionConfig.fadeOffset)) * sectionConfig.fadeInSpeed)),
            transition: 'transform 0.8s ease-out, opacity 0.8s ease-out'
          }}
        >
          <h2
            style={{
              fontSize: calculateFontSize(56, 28, 72),
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#0a0a0a',
              marginBottom: `${calculateSpacing(16)}px`
            }}
          >
            Travel
          </h2>
          <p
            style={{
              fontSize: calculateFontSize(20, 14, 24),
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#525252',
              maxWidth: '800px',
              marginLeft: 'auto'
            }}
          >
            Exploring new places expands my perspective and fuels curiosity. Each destination teaches me about
            different cultures, ways of thinking, and the boundless possibilities that exist beyond familiar horizons.
          </p>
        </div>
      </div>

      <div 
        className="relative w-full"
        style={{ 
          minHeight: '80vh',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center'
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
              fontSize: calculateFontSize(56, 28, 72),
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
              fontSize: calculateFontSize(20, 14, 24),
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