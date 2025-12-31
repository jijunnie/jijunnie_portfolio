import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import { Camera, Music, Guitar, Trophy, Plane, Gamepad2, Users, X } from 'lucide-react';

// 远程资源基础 URL
const REMOTE_BASE_URL = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/';

// 辅助函数：将本地模型/动画路径转换为远程 URL
const getRemoteModelUrl = (localPath) => {
  if (!localPath) return localPath;
  // 提取文件名（去除前导斜杠和目录）
  const fileName = localPath.replace(/^\/[^\/]+\//, '').replace(/^\//, '');
  return `${REMOTE_BASE_URL}${fileName}`;
};

// 修复纹理路径：将远程URL转换为本地路径
const fixTexturePaths = (scene) => {
  if (!scene) return;
  
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
              // 提取文件名（去除路径和扩展名）
              const fileName = currentSrc.split('/').pop().split('?')[0];
              
              // 尝试使用本地路径
              // 首先尝试/models/textures/目录
              const localPath = `/models/textures/${fileName}`;
              
              // 创建新的纹理加载器
              const loader = new THREE.TextureLoader();
              
              // 尝试加载本地纹理
              loader.load(
                localPath,
                (loadedTexture) => {
                  // 成功加载，替换纹理
                  material[prop] = loadedTexture;
                  material.needsUpdate = true;
                },
                undefined,
                () => {
                  // 加载失败，移除纹理，使用默认材质
                  material[prop] = null;
                  material.needsUpdate = true;
                }
              );
            }
          }
        });
      });
    }
  });
};


// 3D Avatar Component
function Avatar({ animationPath = getRemoteModelUrl('/animations/idle.fbx'), scale = 1.5, position = [0, -0.5, 0] }) {
  const group = useRef();
  const mixer = useRef();
  const currentActionRef = useRef();
  const { scene: baseAvatar } = useGLTF(getRemoteModelUrl('/models/avatar.glb'));
  const fbx = useFBX(animationPath);

  useEffect(() => {
    // 修复纹理路径（如果模型已加载）
    if (baseAvatar) {
      fixTexturePaths(baseAvatar);
    }
  }, [baseAvatar]);

  const clonedAvatar = useMemo(() => {
    if (!baseAvatar) return null;
    const cloned = SkeletonUtils.clone(baseAvatar);
    
    // 修复克隆场景中的纹理路径
    fixTexturePaths(cloned);
    
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
        if (child.material) {
          child.material = child.material.clone();
          child.material.needsUpdate = true;
        }
      }
    });
    return cloned;
  }, [baseAvatar]);

  useEffect(() => {
    if (clonedAvatar && group.current) {
      try {
        mixer.current = new THREE.AnimationMixer(clonedAvatar);
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
    if (!fbx.animations?.length || !mixer.current) return;
    const newAnimation = fbx.animations[0];
    if (!newAnimation) return;
    
    const newAction = mixer.current.clipAction(newAnimation);
    
    // Add null check to prevent "Activity" error
    if (!newAction) return;
    
    newAction.setLoop(THREE.LoopRepeat);
    newAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.3).play();
    currentActionRef.current = newAction;
  }, [animationPath, fbx.animations]);

  useFrame((state, delta) => {
    // Add comprehensive null checks to prevent "Activity" errors
    if (!mixer.current) return;
    if (typeof delta !== 'number' || !isFinite(delta)) return;
    
    try {
      mixer.current.update(delta);
    } catch (error) {
      console.warn('Animation mixer update error:', error);
    }
  });

  if (!clonedAvatar) return null;

  return (
    <group ref={group} position={position} scale={scale}>
      <primitive object={clonedAvatar} />
    </group>
  );
}

useGLTF.preload(getRemoteModelUrl('/models/avatar.glb'));

export default function Interests() {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const dragStartRotation = useRef(0);
  const lastClickTime = useRef(0);
  const dragDistance = useRef(0);
  const carouselRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastRotationTime = useRef(0);

  // Debounced resize handler
  useEffect(() => {
    let resizeTimeout;
    const updateDimensions = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 100);
    };
    
    // Initial set without debounce
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(resizeTimeout);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true);
      setIsAnimating(true);
      
      const animationTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 2700);
      
      return () => clearTimeout(animationTimer);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Memoized responsive values - only recalculate when dimensions change
  const responsive = useMemo(() => {
    const isMobile = dimensions.width < 640;
    const isTablet = dimensions.width >= 640 && dimensions.width < 1024;

    return {
      carouselRadius: isMobile ? 200 : isTablet ? 250 : 300,
      cardWidth: isMobile ? 120 : isTablet ? 130 : 140,
      cardHeight: isMobile ? 160 : isTablet ? 170 : 180,
      carouselHeight: isMobile ? 200 : isTablet ? 220 : 250,
      avatarScale: isMobile ? 1.2 : isTablet ? 1.5 : 1.8,
      avatarPosition: isMobile ? [0, -1.0, 0] : isTablet ? [0, -1.2, 0] : [0, -1.4, 0],
      cameraPosition: isMobile ? [0, 0.8, 3.5] : isTablet ? [0, 0.9, 4] : [0, 1, 4.5],
      cameraFov: isMobile ? 55 : isTablet ? 52 : 50,
      topPadding: isMobile ? 'pt-24' : isTablet ? 'pt-28' : 'pt-32',
      isMobile
    };
  }, [dimensions.width]);

  const interests = useMemo(() => [
    {
      icon: Camera,
      title: "Photography",
      description: "Capturing moments",
      detailedDescription: "Photography is my way of freezing time and capturing the beauty in everyday moments. I love experimenting with different angles, lighting, and compositions to tell compelling visual stories. Whether it's landscapes, portraits, or street photography, each shot is an opportunity to see the world from a unique perspective.",
      emoji: "📸",
      color: "from-cyan-500 via-purple-600 to-pink-500",
      borderColor: "border-cyan-400",
      glowColor: "shadow-cyan-500/50",
      skills: ["Composition", "Lighting", "Post-processing", "Visual Storytelling"]
    },
    {
      icon: Music,
      title: "Singing",
      description: "Expressing emotions",
      detailedDescription: "Singing allows me to express emotions that words alone cannot convey. I enjoy exploring different genres and vocal techniques, from soulful ballads to upbeat pop songs. Music has always been a powerful outlet for creativity and self-expression in my life.",
      emoji: "🎤",
      color: "from-blue-500 via-cyan-400 to-teal-500",
      borderColor: "border-blue-400",
      glowColor: "shadow-blue-500/50",
      skills: ["Vocal Control", "Pitch", "Expression", "Performance"]
    },
    {
      icon: Guitar,
      title: "Guitar",
      description: "Creating music",
      detailedDescription: "Playing guitar is both meditative and exhilarating. I love the versatility of the instrument - from gentle fingerpicking to powerful strumming. Learning new songs and techniques constantly challenges me while providing endless creative satisfaction.",
      emoji: "🎸",
      color: "from-yellow-400 via-orange-500 to-red-500",
      borderColor: "border-yellow-400",
      glowColor: "shadow-yellow-500/50",
      skills: ["Chord Progressions", "Fingerpicking", "Rhythm", "Music Theory"]
    },
    {
      icon: Trophy,
      title: "Badminton",
      description: "Fast competition",
      detailedDescription: "Badminton combines speed, agility, and strategy in an incredibly dynamic sport. I love the quick reflexes required and the satisfaction of a well-executed smash or drop shot. It's a great way to stay active while developing competitive skills and sportsmanship.",
      emoji: "🏸",
      color: "from-green-400 via-emerald-500 to-teal-600",
      borderColor: "border-green-400",
      glowColor: "shadow-green-500/50",
      skills: ["Agility", "Reflexes", "Strategy", "Endurance"]
    },
    {
      icon: Users,
      title: "Basketball",
      description: "Teamwork",
      detailedDescription: "Basketball teaches me the value of teamwork and communication. The fast-paced nature of the game, combined with strategic plays and athletic challenges, makes every match exciting. I enjoy both the individual skill development and the collaborative aspect of team play.",
      emoji: "🏀",
      color: "from-orange-500 via-red-500 to-pink-600",
      borderColor: "border-orange-400",
      glowColor: "shadow-orange-500/50",
      skills: ["Teamwork", "Coordination", "Strategy", "Fitness"]
    },
    {
      icon: Gamepad2,
      title: "Gaming",
      description: "Virtual worlds",
      detailedDescription: "Gaming offers immersive experiences that combine storytelling, problem-solving, and strategic thinking. I enjoy various genres from RPGs to strategy games, each providing unique challenges and creative worlds to explore. It's also a great way to connect with friends online.",
      emoji: "🎮",
      color: "from-purple-500 via-pink-500 to-rose-500",
      borderColor: "border-purple-400",
      glowColor: "shadow-purple-500/50",
      skills: ["Problem Solving", "Strategy", "Quick Thinking", "Coordination"]
    },
    {
      icon: Plane,
      title: "Traveling",
      description: "New cultures",
      detailedDescription: "Traveling broadens my horizons and exposes me to different cultures, cuisines, and perspectives. Each destination offers unique experiences and lessons. I love the adventure of exploring new places, meeting diverse people, and creating memories that last a lifetime.",
      emoji: "✈️",
      color: "from-sky-400 via-blue-500 to-indigo-600",
      borderColor: "border-sky-400",
      glowColor: "shadow-sky-500/50",
      skills: ["Cultural Awareness", "Adaptability", "Planning", "Open-mindedness"]
    }
  ], []);

  const itemsCount = interests.length;
  const angleStep = 360 / itemsCount;

  // Optimized auto-rotation using requestAnimationFrame
  useEffect(() => {
    if (!isDragging && !selectedInterest && hasAnimated && !isAnimating) {
      const animate = (timestamp) => {
        if (!lastRotationTime.current) {
          lastRotationTime.current = timestamp;
        }
        
        const elapsed = timestamp - lastRotationTime.current;
        
        // Update every ~33ms (30fps) instead of 20ms for smoother mobile performance
        if (elapsed >= 33) {
          setRotation(prev => prev + 0.3); // Slightly faster to compensate
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
  }, [isDragging, selectedInterest, hasAnimated, isAnimating]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Unified pointer handlers for better mobile/desktop compatibility
  const handlePointerDown = useCallback((e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setIsDragging(true);
    setStartX(clientX);
    dragStartRotation.current = rotation;
    lastClickTime.current = Date.now();
    dragDistance.current = 0;
  }, [rotation]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startX;
    dragDistance.current = Math.abs(deltaX);
    const rotationDelta = deltaX * 0.5;
    setRotation(dragStartRotation.current + rotationDelta);
  }, [isDragging, startX]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInterestClick = useCallback((e, interest) => {
    e.stopPropagation();
    const clickDuration = Date.now() - lastClickTime.current;
    if (clickDuration < 300 && dragDistance.current < 15) {
      setSelectedInterest(interest);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedInterest(null);
  }, []);

  // Unified event listeners
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

  // Generate keyframe styles once
  const keyframeStyles = useMemo(() => {
    return interests.map((_, index) => {
      const angle = angleStep * index;
      const startAngle = -135;
      const midAngle = startAngle + ((angle - startAngle) * 0.5);
      
      return `
        @keyframes slide-curve-in-${index} {
          0% {
            transform: rotateY(${startAngle}deg) translateZ(${responsive.carouselRadius + 200}px) rotateX(-15deg);
            opacity: 0;
          }
          50% {
            transform: rotateY(${midAngle}deg) translateZ(${responsive.carouselRadius + 100}px) rotateX(-15deg);
            opacity: 0.5;
          }
          70%, 100% {
            transform: rotateY(${angle}deg) translateZ(${responsive.carouselRadius}px) rotateX(-15deg);
            opacity: 1;
          }
        }
      `;
    }).join('\n');
  }, [interests, angleStep, responsive.carouselRadius]);

  return (
    <section className="fixed inset-0 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 overflow-hidden">
      <div className={`relative w-full h-full max-w-6xl mx-auto flex flex-col items-center justify-center ${responsive.topPadding}`}>
        {/* Spinning Cards */}
        <div className="relative z-20 w-full flex items-center justify-center mb-8 sm:mb-12">
          <div
            className="relative cursor-grab active:cursor-grabbing select-none"
            style={{
              perspective: '1000px',
              width: '100%',
              height: `${responsive.carouselHeight}px`,
              maxWidth: '800px'
            }}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
          >
            <div
              ref={carouselRef}
              className={`relative w-full h-full ${isAnimating ? 'animate-carousel-spin' : ''}`}
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateY(${rotation}deg)`,
                transition: isDragging || isAnimating ? 'none' : 'transform 0.05s linear'
              }}
            >
              {interests.map((interest, index) => {
                const Icon = interest.icon;
                const animationDelay = index * 0.15;
                
                return (
                  <div
                    key={index}
                    className={`absolute left-1/2 top-1/2 ${hasAnimated ? '' : 'opacity-0'}`}
                    style={{
                      width: `${responsive.cardWidth}px`,
                      height: `${responsive.cardHeight}px`,
                      marginLeft: `-${responsive.cardWidth / 2}px`,
                      marginTop: `-${responsive.cardHeight / 2}px`,
                      transformStyle: 'preserve-3d',
                      animation: hasAnimated ? `slide-curve-in-${index} 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${animationDelay}s both` : 'none'
                    }}
                    onClick={(e) => handleInterestClick(e, interest)}
                    onTouchEnd={(e) => handleInterestClick(e, interest)}
                  >
                    <div className={`cyberpunk-card w-full h-full rounded-lg bg-gradient-to-br ${interest.color} p-3 flex flex-col items-center justify-center text-white transform hover:scale-110 transition-all duration-300 border-2 ${interest.borderColor} ${interest.glowColor} shadow-2xl relative overflow-hidden`}>
                      {/* Glitch effect overlay */}
                      <div className="absolute inset-0 glitch-overlay pointer-events-none"></div>
                      
                      {/* Corner decorations */}
                      <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-white/50"></div>
                      <div className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 border-white/50"></div>
                      <div className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 border-white/50"></div>
                      <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-white/50"></div>
                      
                      <div className="text-3xl sm:text-4xl mb-1 neon-glow">
                        {interest.emoji}
                      </div>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1 opacity-90 neon-icon" strokeWidth={2.5} />
                      <h3 className="text-xs sm:text-sm font-bold mb-1 text-center leading-tight uppercase tracking-wider cyber-text">
                        {interest.title}
                      </h3>
                      <p className="text-center text-white/90 text-xs leading-tight font-light">
                        {interest.description}
                      </p>
                      
                      {/* Animated border */}
                      <div className="absolute inset-0 border-animation pointer-events-none rounded-lg"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3D Avatar */}
        <div className="relative pointer-events-none z-10 w-full flex items-start justify-center flex-1">
          <div className="w-full h-full max-w-3xl">
            <Canvas
              camera={{ position: responsive.cameraPosition, fov: responsive.cameraFov }}
              gl={{
                antialias: true,
                alpha: true,
                premultipliedAlpha: false,
                powerPreference: "high-performance"
              }}
              style={{ background: 'transparent' }}
            >
              {/* Avatar Lighting */}
              <ambientLight intensity={2} />
              <directionalLight position={[5, 10, 5]} intensity={3} />
              <directionalLight position={[0, 5, 10]} intensity={2.5} />
              <directionalLight position={[-5, 8, -5]} intensity={1.8} color="#a5b4fc" />
              <pointLight position={[10, 3, 5]} intensity={2} color="#fbbf24" />
              <pointLight position={[-10, 3, 5]} intensity={2} color="#60a5fa" />
              <hemisphereLight skyColor="#ffffff" groundColor="#666666" intensity={1.8} />
              
              <Suspense fallback={null}>
                <Avatar scale={responsive.avatarScale} position={responsive.avatarPosition} />
              </Suspense>
              <OrbitControls
                enableZoom={false}
                minPolarAngle={Math.PI / 3.5}
                maxPolarAngle={Math.PI / 2}
                enableDamping
                dampingFactor={0.05}
                enablePan={false}
              />
            </Canvas>
          </div>
        </div>
      </div>

      {/* Instruction Text */}
      <div className="fixed top-20 sm:top-24 left-1/2 transform -translate-x-1/2 z-40 text-center px-4">
        <p className="text-gray-700 font-medium text-xs sm:text-sm bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full shadow-lg">
          {isDragging ? '🔄 Drag to rotate' : '✨ Auto-rotating • Click & drag to control'}
        </p>
      </div>

      {/* Cyberpunk Popup Modal */}
      {selectedInterest && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in cyberpunk-modal-bg"
          onClick={handleCloseModal}
        >
          <div
            className={`relative w-[85vw] h-[85vh] bg-gradient-to-br ${selectedInterest.color} shadow-2xl p-6 sm:p-12 lg:p-16 text-white animate-scale-in-cyber overflow-y-auto rounded-lg border-4 ${selectedInterest.borderColor} ${selectedInterest.glowColor} cyberpunk-modal`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal corner decorations */}
            <div className="absolute top-2 left-2 w-8 h-8 border-l-4 border-t-4 border-cyan-400"></div>
            <div className="absolute top-2 right-2 w-8 h-8 border-r-4 border-t-4 border-cyan-400"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 border-l-4 border-b-4 border-cyan-400"></div>
            <div className="absolute bottom-2 right-2 w-8 h-8 border-r-4 border-b-4 border-cyan-400"></div>
            
            {/* Glitch overlay for modal */}
            <div className="absolute inset-0 glitch-overlay-modal pointer-events-none rounded-lg"></div>
            
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-black/40 hover:bg-cyan-500/40 border-2 border-cyan-400 rounded p-2 sm:p-3 transition-all duration-300 hover:scale-110 z-10 shadow-xl shadow-cyan-500/50 cyber-close-btn"
            >
              <X className="w-5 h-5 sm:w-7 sm:h-7 text-cyan-400" />
            </button>

            <div className="max-w-6xl mx-auto pt-8 sm:pt-12">
              <div className="text-center mb-8 sm:mb-12">
                <div className="text-7xl sm:text-9xl lg:text-[150px] mb-4 sm:mb-8 animate-bounce-cyber neon-glow-large">
                  {selectedInterest.emoji}
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 uppercase tracking-wider cyber-title">{selectedInterest.title}</h2>
              </div>

              <div className="space-y-8 sm:space-y-12">
                <div className="cyber-section">
                  <h3 className="text-2xl sm:text-3xl lg:text-5xl font-semibold mb-4 sm:mb-8 flex items-center gap-2 sm:gap-4 uppercase tracking-wide">
                    <span className="w-2 sm:w-3 h-8 sm:h-12 bg-cyan-400 rounded shadow-lg shadow-cyan-500/50 cyber-bar"></span>
                    ABOUT THIS PASSION
                  </h3>
                  <p className="text-white/95 leading-relaxed text-lg sm:text-xl lg:text-3xl pl-4 sm:pl-8 font-light cyber-text-content">
                    {selectedInterest.detailedDescription}
                  </p>
                </div>

                <div className="cyber-section">
                  <h3 className="text-2xl sm:text-3xl lg:text-5xl font-semibold mb-4 sm:mb-8 flex items-center gap-2 sm:gap-4 uppercase tracking-wide">
                    <span className="w-2 sm:w-3 h-8 sm:h-12 bg-cyan-400 rounded shadow-lg shadow-cyan-500/50 cyber-bar"></span>
                    SKILLS & ATTRIBUTES
                  </h3>
                  <div className="flex flex-wrap gap-3 sm:gap-5 pl-4 sm:pl-8">
                    {selectedInterest.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="cyber-skill-tag bg-black/50 backdrop-blur-sm px-4 py-2 sm:px-8 sm:py-5 rounded border-2 border-cyan-400 text-base sm:text-xl lg:text-2xl font-semibold uppercase tracking-wide hover:bg-cyan-400/20 hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-12 sm:mt-16 text-center">
                <button
                  onClick={handleCloseModal}
                  className="cyber-button bg-black/50 hover:bg-cyan-500/30 px-8 py-3 sm:px-16 sm:py-6 rounded border-2 border-cyan-400 font-bold text-lg sm:text-2xl uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-xl shadow-cyan-500/50"
                >
                  BACK TO INTERESTS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
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
        .cyber-border-box {
          position: relative;
          clip-path: polygon(
            0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px,
            100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px)
          );
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

        /* Pulse Animations */
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-pulse-slow-delayed {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) 2s infinite;
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.1);
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
    </section>
  );
}