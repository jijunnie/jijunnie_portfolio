import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX } from '@react-three/drei';
import { Send } from 'lucide-react';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';

// 3D Model Component with seamless animation blending
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

// Hexagon Grid Background Component
function HexagonGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="hexPattern" x="0" y="0" width="100" height="87" patternUnits="userSpaceOnUse">
            <polygon 
              points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" 
              fill="none" 
              stroke="rgba(59, 130, 246, 0.15)" 
              strokeWidth="1"
            />
          </pattern>
        </defs>
        
        {/* Back layer - smaller, lower opacity */}
        <g opacity="0.3" transform="scale(0.6) translate(320, 180)">
          <rect width="1920" height="1080" fill="url(#hexPattern)" />
        </g>
        
        {/* Middle layer */}
        <g opacity="0.5" transform="scale(0.8) translate(120, 68)">
          <rect width="1920" height="1080" fill="url(#hexPattern)" />
        </g>
        
        {/* Front layer - bigger, higher opacity */}
        <g opacity="0.8">
          <rect width="1920" height="1080" fill="url(#hexPattern)" />
        </g>
      </svg>
    </div>
  );
}

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
      
      // Show bubble after avatar appears
      setTimeout(() => {
        setShowBubble(true);
        typeOutBubble("Hi, I am Jijun Nie", false);
      }, 800);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [showSubtitle]);
  
  // Step 4: After 3 seconds, switch to Talking animation (only once for initial sequence)
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
        // Change to idle after input appears
        setTimeout(() => {
          setCurrentAnimation('/animations/idle.fbx');
        }, 500);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isTyping, bubbleText, showChatInput]);
  
  // Monitor typing state for user responses - change to idle when done
  useEffect(() => {
    if (!isTyping && isRespondingToUser) {
      console.log('Typing finished, changing to idle');
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
  
  // Handle chat message with AI-driven responses
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    
    console.log('User sent message, changing to Talking animation');
    setCurrentAnimation('/animations/Talking.fbx');
    
    try {
      const systemPrompt = `You are Jijun Nie's AI avatar. Respond in first person as if you ARE Jijun. Be friendly and conversational.
MY INFO:
- 19 years old (Born: Nov 13, 2006)
- Junior at University of Florida - Industrial & System Engineering, GPA: 3.94/4.00
- Contact: jijun.nie@ufl.edu, (754) 610-4078
EXPERIENCE:
- Variantz Singapore: Web Design & Product Development Specialist - boosted traffic 400%
- Gou Lou Cheong Chinese BBQ: Server
- Head Intern Leader at Variantz
SKILLS:
- Languages: English, Mandarin, Cantonese
- Programming: JavaScript, Python, SQL, Matlab, R
- Tools: SolidWorks, Google Workspace, Canva, SEO/SEM
INTERESTS: Photography, Singing, Guitar, Badminton, Basketball, Gaming, Traveling
Respond in 2-3 sentences as Jijun. Use "I" not "Jijun". Be natural and conversational. Add emojis sparingly.`;
      
      const response = await fetch('http://localhost:3001/api/chat', {
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
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('Got response, starting typing animation');
      setTimeout(() => {
        typeOutBubble(data.response, true);
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
    <section className="relative px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center overflow-hidden bg-white py-8">
      {/* Hexagon Grid Background */}
      <HexagonGrid />
      
      {/* Center Content - Slides up smoothly when avatar appears */}
      <div className={`max-w-6xl mx-auto text-center relative z-10 w-full transition-all duration-[1500ms] ease-out ${
        showAvatar ? 'pt-4' : 'pt-0'
      }`}>
        {/* Title with dissolve effect - smoother transition */}
        <h1 className={`text-4xl sm:text-5xl font-bold mb-3 transition-all duration-[1500ms] ease-out ${
          showTitle ? 'opacity-100 transform-none' : 'opacity-0'
        } ${showAvatar ? '-translate-y-2' : 'translate-y-0'}`}>
          <span className="bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 bg-clip-text text-transparent">
            Welcome to Jijun's World
          </span>
        </h1>
        
        {/* Subtitle with float in from bottom - smoother transition */}
        <div className={`mb-8 transition-all duration-[1500ms] ease-out ${
          showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        } ${showAvatar ? '-translate-y-2' : 'translate-y-0'}`}>
          <p className="text-lg sm:text-xl text-gray-600">
            Student at University of Florida
          </p>
        </div>
        
        {/* Avatar and Chat Section */}
        {showAvatar && (
          <div className="animate-fade-in">
            <div className="flex flex-col items-center justify-center">
              {/* Speech Bubble */}
              <div className="mb-4 relative px-4" style={{ minHeight: '70px' }}>
                {showBubble && (bubbleText || typingBubbleText) && (
                  <div className="animate-fade-in flex justify-center">
                    <div className="relative inline-block">
                      <div 
                        className="bg-white rounded-3xl px-5 py-3 shadow-xl relative"
                        style={{
                          minWidth: '120px',
                          maxWidth: '600px',
                          border: '3px solid #3b82f6',
                        }}
                      >
                        <p className="text-gray-800 font-medium text-left whitespace-pre-wrap break-words text-sm sm:text-base">
                          {typingBubbleText || bubbleText}
                          {typingBubbleText && typingBubbleText !== bubbleText && (
                            <span className="animate-blink">|</span>
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
                        <path 
                          d="M 0 0 L 15 15 L 30 0 Z" 
                          fill="white" 
                          stroke="#3b82f6" 
                          strokeWidth="3"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 3D Model Viewer - CENTERED AND PROPERLY SIZED */}
              <div className="w-full max-w-lg flex justify-center" style={{ height: '380px' }}>
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
            
            {/* Chat Input - EQUAL SPACING */}
            <div className="mt-4">
              {showChatInput && (
                <div className={`max-w-2xl mx-auto transition-all duration-500 ${
                  showChatInput ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask me anything..."
                      disabled={isLoading}
                      className="flex-1 border-2 border-blue-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-600 text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? '...' : <Send size={18} />}
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
          from { opacity: 0; }
          to { opacity: 1; }
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