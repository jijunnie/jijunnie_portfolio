import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX, Float, Text, Sphere, Box, Torus, RoundedBox, MeshDistortMaterial, MeshWobbleMaterial, Trail, Sparkles } from '@react-three/drei';
import { Send } from 'lucide-react';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
// ============================================
// 3D BACKGROUND COMPONENT - VANILLA THREE.JS
// ============================================
function ThreeBackground() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    
    // ===== SCENE SETUP =====
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true, 
      alpha: false 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 1);
    
    // ===== CREATE PARTICLES =====
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 15;
      posArray[i + 1] = (Math.random() - 0.5) * 15;
      posArray[i + 2] = (Math.random() - 0.5) * 15;
      
      const colorChoice = Math.random();
      if (colorChoice < 0.33) {
        colorsArray[i] = 0.231;
        colorsArray[i + 1] = 0.510;
        colorsArray[i + 2] = 0.965;
      } else if (colorChoice < 0.66) {
        colorsArray[i] = 0.545;
        colorsArray[i + 1] = 0.361;
        colorsArray[i + 2] = 0.965;
      } else {
        colorsArray[i] = 0.925;
        colorsArray[i + 1] = 0.282;
        colorsArray[i + 2] = 0.600;
      }
    }
    
    particlesGeometry.setAttribute(
      'position', 
      new THREE.BufferAttribute(posArray, 3)
    );
    particlesGeometry.setAttribute(
      'color', 
      new THREE.BufferAttribute(colorsArray, 3)
    );
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // ===== CREATE GEOMETRIC SHAPES =====
    const geometries = [];
    const shapes = [
      new THREE.IcosahedronGeometry(0.5, 0),
      new THREE.OctahedronGeometry(0.4, 0),
      new THREE.TetrahedronGeometry(0.4, 0),
      new THREE.TorusGeometry(0.3, 0.15, 8, 16),
      new THREE.DodecahedronGeometry(0.4, 0),
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
    ];
    
    const colors = [0x3b82f6, 0x8b5cf6, 0xec4899, 0x6366f1, 0xa855f7, 0x06b6d4];
    
    for (let i = 0; i < 15; i++) {
      const geometry = shapes[Math.floor(Math.random() * shapes.length)];
      const material = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        wireframe: true,
        transparent: true,
        opacity: 0.4,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.x = (Math.random() - 0.5) * 20;
      mesh.position.y = (Math.random() - 0.5) * 20;
      mesh.position.z = (Math.random() - 0.5) * 10 - 5;
      
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      
      mesh.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
        },
        floatSpeed: Math.random() * 0.002 + 0.001,
        floatOffset: Math.random() * Math.PI * 2,
        initialY: mesh.position.y,
      };
      
      geometries.push(mesh);
      scene.add(mesh);
    }
    
    camera.position.z = 5;
    
    // ===== MOUSE INTERACTION =====
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    const clock = new THREE.Clock();
    
    // ===== ANIMATION LOOP =====
    const animate = () => {
      requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();
      
      targetX += (mouseX - targetX) * 0.02;
      targetY += (mouseY - targetY) * 0.02;
      
      particlesMesh.rotation.y = targetX * 0.5 + elapsedTime * 0.05;
      particlesMesh.rotation.x = targetY * 0.3;
      
      geometries.forEach((mesh) => {
        mesh.rotation.x += mesh.userData.rotationSpeed.x;
        mesh.rotation.y += mesh.userData.rotationSpeed.y;
        
        mesh.position.y = mesh.userData.initialY + 
          Math.sin(elapsedTime * mesh.userData.floatSpeed * 50 + mesh.userData.floatOffset) * 0.3;
      });
      
      camera.position.x = Math.sin(elapsedTime * 0.1) * 0.5;
      camera.position.y = Math.cos(elapsedTime * 0.1) * 0.3;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // ===== HANDLE WINDOW RESIZE =====
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // ===== CLEANUP =====
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      geometries.forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      renderer.dispose();
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}
// 3D Avatar Component with seamless animation blending
function Avatar({ animationPath, scale = 1.6, position = [0, -1.5, 0] }) {
  const group = useRef();
  const mixer = useRef();
  const currentActionRef = useRef();
  const fadeTimeRef = useRef(0);
  
  const { scene: baseAvatar, error } = useGLTF('/models/avatar.glb');
  
  useEffect(() => {
    if (error) {
      console.error('Error loading avatar:', error);
    }
  }, [error]);
  
  const fbx = useFBX(animationPath);
  
  const clonedAvatar = React.useMemo(() => {
    if (!baseAvatar) return null;
    const cloned = SkeletonUtils.clone(baseAvatar);
    
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
    });
    
    return cloned;
  }, [baseAvatar]);
  
  useEffect(() => {
    if (clonedAvatar && group.current) {
      mixer.current = new THREE.AnimationMixer(clonedAvatar);
      fadeTimeRef.current = 0;
    }
    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
      }
    };
  }, [clonedAvatar]);
  
  useEffect(() => {
    if (!fbx.animations?.length || !mixer.current) return;
    
    const newAnimation = fbx.animations[0];
    const newAction = mixer.current.clipAction(newAnimation);
    
    newAction.setLoop(THREE.LoopRepeat);
    newAction.clampWhenFinished = false;
    newAction.enabled = true;
    
    if (currentActionRef.current && currentActionRef.current !== newAction) {
      const fadeDuration = 0.5;
      
      currentActionRef.current.fadeOut(fadeDuration);
      newAction.reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .fadeIn(fadeDuration)
        .play();
      
      fadeTimeRef.current = fadeDuration;
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
  }, [animationPath, fbx.animations]);
  
  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });
  
  if (!clonedAvatar) return null;
  
  return (
    <group ref={group} position={position} scale={scale} dispose={null}>
      <primitive object={clonedAvatar} />
    </group>
  );
}
useGLTF.preload('/models/avatar.glb');
export default function Home() {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('/animations/Waving.fbx');
  const [bubbleText, setBubbleText] = useState('');
  const [typingBubbleText, setTypingBubbleText] = useState('');
  const [showBubble, setShowBubble] = useState(false);
  const [showChatInput, setShowChatInput] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRespondingToUser, setIsRespondingToUser] = useState(false);
  
  // Step 1: Title dissolve in
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTitle(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Step 2: Subtitle float in from bottom after title appears
  useEffect(() => {
    if (!showTitle) return;
    
    const timer = setTimeout(() => {
      setShowSubtitle(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [showTitle]);
  
  // Step 3: Avatar appears with waving animation after subtitle
  useEffect(() => {
    if (!showSubtitle) return;
    
    const timer = setTimeout(() => {
      setShowAvatar(true);
      setCurrentAnimation('/animations/Waving.fbx');
      
      setTimeout(() => {
        setShowBubble(true);
        typeOutBubble("Hi, I am Jijun Nie", false);
      }, 800);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [showSubtitle]);
  
  // Step 4: After 3 seconds, switch to Talking animation
  useEffect(() => {
    if (!showAvatar) return;
    
    const timer = setTimeout(() => {
      setCurrentAnimation('/animations/Talking.fbx');
      
      setTimeout(() => {
        typeOutBubble("Chat with me to know more about me!", false);
      }, 600);
    }, 3800);
    
    return () => clearTimeout(timer);
  }, [showAvatar]);
  
  // Step 5: Show input box when second message finishes typing
  useEffect(() => {
    if (!isTyping && bubbleText === "Chat with me to know more about me!" && !showChatInput) {
      const timer = setTimeout(() => {
        setShowChatInput(true);
        setTimeout(() => {
          setCurrentAnimation('/animations/idle.fbx');
        }, 500);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isTyping, bubbleText, showChatInput]);
  
  // Monitor typing state for user responses
  useEffect(() => {
    if (!isTyping && isRespondingToUser) {
      const timer = setTimeout(() => {
        setCurrentAnimation('/animations/idle.fbx');
        setIsRespondingToUser(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isTyping, isRespondingToUser]);
  
  // Typing animation for speech bubble
  const typeOutBubble = (text, isUserResponse = false) => {
    setBubbleText('');
    setTypingBubbleText('');
    setIsTyping(true);
    
    if (isUserResponse) {
      setIsRespondingToUser(true);
    }
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setTypingBubbleText(text.slice(0, index + 1));
        index++;
      } else {
        setBubbleText(text);
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 50);
  };
  
  // Handle chat message with AI-driven responses using Claude API
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    
    setCurrentAnimation('/animations/Talking.fbx');
    
    try {
      const systemPrompt = `You are Jijun Nie. Answer ONLY what the user asks in 1-2 short sentences. Be brief, friendly, and direct.
Quick facts (share only if relevant to their question):
- I'm 19 years old (do NOT mention exact birthday)
- UF Junior studying Industrial & System Engineering going in supply chain and logistic path(3.94 GPA)
- I spend free time learning new things on my own such as HTML/CSS, Data Analytics, Digital Marketing and more..
- I have certificate in Google Data Analytics, Google Project Management, Google Digital Marketing, Solidwork... 
- Work: Variantz Singapore (Web Design & Product Development Specialist - boosted traffic 400%), oversee two company website, 
- Also worked at Gou Lou Cheong Chinese BBQ as Server back in 2019-2024
- For school extracurricular activities, I am the President of Chinese Student Association(CSA) at UF leading 6 committes, 5 seasonal cultural events each with 300+ attendees. 
- Head Intern Leader at Variantz 
- Skills: JavaScript, Python, SQL, Matlab, R, SolidWorks, Google Workspace, Canva, SEO/SEM
- Languages: fluent in English, Mandarin, Cantonese
- Interests: Photography, Singing, Guitar, Badminton, Basketball, Gaming, Traveling
- Contact: jijun.nie@ufl.edu, (754) 610-4078
- I am Asian, US.permanent resident/greencard holder, authorize to work in the U.S. No any illegal histories. No disabilities. 
- I have a brother who is younger than me born in 2011. 
- I was borned and raised in China and migrated to the U.S. at age of 12, my hometown in china is Jiangmen, Guangdong
- My hometown in the U.S is Parkland Florida. 
- My high school is Marjory Stoneman Douglas High School, I was ranked top 5% of a class size of 850. 
- I am open to opportunities in supply chain, system engineering, Web development, sales, product management and others along the line. 
- I am a Christian
- My favorite artist is Taylor Swift follow by Ariana Grande and Jay Chou. My favorite English song  is ALL too Well(Ten minute version), Chinese song: "起风了" Favorite album: Red(Taylor's Version)
- My favorite cuisine: Chinese and Indian. My favorite Movie: The Eras Tour Movie. My favorite food: Sushi & hotpot. My favorite color: Red
IMPORTANT RULES:
- Only answer the specific question asked
- Keep responses to 1-2 sentences maximum
- Don't volunteer extra information unless directly asked
- Be conversational and natural
- Use "I" not "Jijun"
- Add emojis sparingly (only when it feels natural)
- You must not say you are AI assistant, you are Jijun Nie
- If asked about age or birthday, just say "I'm 19 years old" - do NOT give the exact date`;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          systemPrompt: systemPrompt
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      const aiResponse = data.response || 
                        "I'm not sure how to respond to that. Feel free to ask me something else!";
      
      setTimeout(() => {
        typeOutBubble(aiResponse, true);
      }, 400);
      
    } catch (error) {
      console.error('Chat error details:', error);
      setTimeout(() => {
        typeOutBubble("I'm having trouble connecting right now. Feel free to email me at jijun.nie@ufl.edu! 📧", true);
      }, 400);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <section className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50" style={{ height: '100dvh' }}>
      {/* 3D Background */}
      <ThreeBackground />
      {/* Center Content */}
      <div className="max-w-6xl mx-auto text-center relative z-10 w-full h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 pt-16">
        {/* Title with 3D effect */}
        <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-3 transition-all duration-[2500ms] ease-out ${
          showTitle ? 'opacity-100 transform-none' : 'opacity-0'
        }`}
        style={{
          transform: showTitle ? 'translateZ(50px)' : 'translateZ(0)',
          textShadow: '0 10px 30px rgba(59, 130, 246, 0.3), 0 20px 60px rgba(139, 92, 246, 0.2)',
          perspective: '1000px',
        }}>
          <span 
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.4))',
              animation: showTitle ? 'floatText 3s ease-in-out infinite' : 'none',
              display: 'inline',
              wordBreak: 'keep-all',
              whiteSpace: 'nowrap',
            }}
          >
            Welcome to Jijun's World
          </span>
        </h1>
        {/* Subtitle with 3D effect */}
        <div className={`mb-4 sm:mb-6 transition-all duration-[2500ms] ease-out ${
          showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{
          transform: showSubtitle ? 'translateZ(30px)' : 'translateZ(0)',
          textShadow: '0 5px 15px rgba(100, 116, 139, 0.2)',
        }}>
          <p 
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 font-medium"
            style={{
              animation: showSubtitle ? 'floatText 3s ease-in-out infinite 0.5s' : 'none',
              filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))',
            }}
          >
            Student at University of Florida
          </p>
        </div>
        
        {/* Avatar and Chat Section */}
        {showAvatar && (
          <div className="animate-fade-in flex-1 flex flex-col justify-center min-h-0">
            <div className="flex flex-col items-center justify-center">
              {/* Speech Bubble */}
              <div className="mb-2 sm:mb-4 relative px-2 sm:px-4" style={{ minHeight: '60px' }}>
                {showBubble && (bubbleText || typingBubbleText) && (
                  <div className="animate-fade-in flex justify-center">
                    <div className="relative inline-block max-w-[90vw]">
                      <div 
                        className="bg-white/95 backdrop-blur-xl rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-2xl relative"
                        style={{
                          minWidth: '120px',
                          maxWidth: '600px',
                          border: '2px solid transparent',
                          backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
                          backgroundOrigin: 'border-box',
                          backgroundClip: 'padding-box, border-box',
                        }}
                      >
                        <p className="text-gray-800 font-medium text-left whitespace-pre-wrap break-words text-sm sm:text-base">
                          {typingBubbleText || bubbleText}
                          {typingBubbleText && typingBubbleText !== bubbleText && (
                            <span className="animate-blink text-blue-500">|</span>
                          )}
                        </p>
                      </div>
                      <svg 
                        className="absolute -bottom-3 left-8" 
                        width="30" 
                        height="15" 
                        viewBox="0 0 30 15"
                        style={{ overflow: 'visible' }}
                      >
                        <defs>
                          <linearGradient id="bubbleTailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                        <path 
                          d="M 0 0 L 15 15 L 30 0 Z" 
                          fill="rgba(255,255,255,0.95)" 
                          stroke="url(#bubbleTailGradient)" 
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 3D Model Viewer */}
              <div className="w-full max-w-lg flex justify-center h-[250px] sm:h-[320px] md:h-[380px]">
                <Canvas 
                  camera={{ position: [0, 0, 5], fov: 50 }}
                  gl={{ 
                    antialias: true, 
                    alpha: true,
                    premultipliedAlpha: false,
                    powerPreference: "high-performance"
                  }}
                  style={{ background: 'transparent', width: '100%', height: '100%' }}
                >
                  <ambientLight intensity={1.5} />
                  <directionalLight position={[5, 8, 5]} intensity={2.5} />
                  <directionalLight position={[0, 3, 8]} intensity={2} />
                  <directionalLight position={[-5, 5, -5]} intensity={1.2} color="#a5b4fc" />
                  <pointLight position={[8, 2, 3]} intensity={1} color="#fbbf24" />
                  <pointLight position={[-8, 2, 3]} intensity={1} color="#60a5fa" />
                  <hemisphereLight skyColor="#ffffff" groundColor="#b0b0b0" intensity={1.2} />
                  
                  <Suspense fallback={null}>
                    <Avatar animationPath={currentAnimation} />
                  </Suspense>
                  
                  <OrbitControls 
                    enableZoom={false}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 2}
                    enableDamping
                    dampingFactor={0.05}
                    enablePan={false}
                  />
                </Canvas>
              </div>
            </div>
            
            {/* Chat Input */}
            <div className="mt-2 sm:mt-4 px-2 sm:px-4 pb-4 sm:pb-6">
              {showChatInput && (
                <div className={`max-w-2xl mx-auto transition-all duration-500 ${
                  showChatInput ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}>
                  <div className="flex space-x-2 sm:space-x-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        onFocus={(e) => {
                          // Prevent iOS zoom and scroll on focus
                          e.target.style.fontSize = '16px';
                        }}
                        placeholder="Ask me anything..."
                        disabled={isLoading}
                        className="w-full bg-white/90 backdrop-blur-xl border-2 border-gray-200 rounded-xl px-3 sm:px-5 py-2 sm:py-3 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-purple-400 text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg transition-all duration-300 hover:shadow-xl"
                        style={{
                          backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
                          backgroundOrigin: 'border-box',
                          backgroundClip: 'padding-box, border-box',
                          border: '2px solid transparent',
                          fontSize: '16px', // Prevents iOS zoom
                        }}
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:shadow-xl hover:shadow-purple-300/50 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg group overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative">
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send size={20} />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes floatText {
    0%, 100% { 
      transform: translateY(0px) translateZ(0px);
    }
    50% { 
      transform: translateY(-10px) translateZ(20px);
    }
  }
  
  .animate-blink {
    animation: blink 1s infinite;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.8s ease-out forwards;
  }
`}</style>
    </section>
  );
}