import { Suspense, useRef, useEffect, useState, Component } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Preload 3D background model at module level (runs immediately when file loads)
const backgroundModelUrl = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/cozy_living_room_baked.glb';
try {
  useGLTF.preload(backgroundModelUrl);
  console.log('✅ Preloaded 3D background in LivingRoomBackground component:', backgroundModelUrl);
} catch (error) {
  console.warn('⚠️ Failed to preload 3D background in LivingRoomBackground component:', error);
}

// Error Boundary for 3D model loading
class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    console.warn('3D Model Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('3D Model failed to load, continuing without background:', error);
  }

  render() {
    if (this.state.hasError) {
      // Return null to gracefully degrade - page will work without 3D background
      return null;
    }

    return this.props.children;
  }
}

function LivingRoomModel({ spatialPos, isMobile }) {
  // Load from Cloudflare R2 CDN - always use CDN URL, no local files
  const modelUrl = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/cozy_living_room_baked.glb';
  
  // Log the URL for debugging
  useEffect(() => {
    console.log('🔵 Loading 3D model from:', modelUrl);
  }, [modelUrl]);
  
  // Best practice: Direct useGLTF usage - streams from R2, CDN-cached globally
  // useGLTF must be called unconditionally (React hook rules)
  const gltf = useGLTF(modelUrl);
  const scene = gltf?.scene;
  
  const groupRef = useRef();
  const clonedSceneRef = useRef(null);
  const autoRotateRef = useRef(0);
  
  // Smooth interpolation for rotation to prevent glitching
  const targetRotationX = useRef(0);
  const targetRotationY = useRef(0);
  const currentRotationX = useRef(0);
  const currentRotationY = useRef(0);
  
  // Clone scene once to avoid mutating the original
  useEffect(() => {
    if (scene && !clonedSceneRef.current) {
      try {
        clonedSceneRef.current = scene.clone();
        console.log('✅ Scene cloned successfully, model ready to render');
        
        // Initialize rotation immediately so model is visible from the start
        if (groupRef.current) {
          const baseRotationY = -20;
          const baseRad = (baseRotationY * Math.PI) / 180;
          groupRef.current.rotation.x = 0;
          groupRef.current.rotation.y = baseRad;
          currentRotationX.current = 0;
          currentRotationY.current = baseRad;
          targetRotationX.current = 0;
          targetRotationY.current = baseRad;
        }
      } catch (error) {
        console.error('❌ Failed to clone scene:', error);
      }
    } else if (!scene) {
      console.warn('⚠️ Scene is null - GLB may still be loading or failed to load');
    }
  }, [scene]);

  useFrame((state, delta) => {
    if (!groupRef.current || !clonedSceneRef.current) return;
    
    // Slow auto-rotation (Apple/Vision Pro style)
    autoRotateRef.current += delta * 0.1; // Slow continuous rotation
    
    // spatialPos is already normalized (-1 to 1) and combined from Portfolio component
    // It includes mouse movement for all screens, and device orientation for iPad/mobile
    // Apply spatial rotation similar to panels and icons for consistent effect
    const baseRotationY = -20; // Fixed base rotation in degrees
    const autoRotationY = autoRotateRef.current * 0.5; // Slow auto-rotate in degrees
    
    let spatialRotateX = 0;
    let spatialRotateY = 0;
    
    // Use spatialPos for all screen sizes (already combines mouse + device orientation on mobile/iPad)
    if (spatialPos && typeof spatialPos.x === 'number' && typeof spatialPos.y === 'number') {
      // Apply consistent rotation intensity matching panels and icons
      const rotationMultiplier = 5; // Match panel rotation intensity
      spatialRotateX = -spatialPos.y * rotationMultiplier;
      spatialRotateY = spatialPos.x * rotationMultiplier;
      
      // Clamp rotation values to prevent extreme rotations
      const maxRotation = 15; // Maximum rotation in degrees
      spatialRotateX = Math.max(-maxRotation, Math.min(maxRotation, spatialRotateX));
      spatialRotateY = Math.max(-maxRotation, Math.min(maxRotation, spatialRotateY));
    }
    
    // Calculate target rotations in radians
    targetRotationX.current = (spatialRotateX * Math.PI) / 180;
    targetRotationY.current = ((baseRotationY + autoRotationY + spatialRotateY) * Math.PI) / 180;
    
    // Smooth interpolation (lerp) to prevent glitching
    // Use stronger smoothing for mobile devices
    const baseLerpFactor = isMobile ? 0.12 : Math.min(delta * 8, 1);
    const lerpFactor = Math.min(baseLerpFactor, 1);
    currentRotationX.current += (targetRotationX.current - currentRotationX.current) * lerpFactor;
    currentRotationY.current += (targetRotationY.current - currentRotationY.current) * lerpFactor;
    
    // Apply smoothed rotations
    groupRef.current.rotation.x = currentRotationX.current;
    groupRef.current.rotation.y = currentRotationY.current;
  });

  if (!clonedSceneRef.current) return null;

  return (
    <group ref={groupRef}>
      <primitive 
        object={clonedSceneRef.current} 
        scale={[3, 3, 3]}
        position={[-0.5, -4, -2]}
      />
    </group>
  );
}

export default function LivingRoomBackground({ spatialPos, isMobile }) {
  const [canvasError, setCanvasError] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const handlersRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  
  // Ensure background model is preloaded as early as possible
  useEffect(() => {
    try {
      useGLTF.preload(backgroundModelUrl);
      console.log('✅ Ensured 3D background preload in component:', backgroundModelUrl);
    } catch (error) {
      console.warn('⚠️ Failed to ensure 3D background preload in component:', error);
    }
  }, []);
  
  // Check WebGL support on mount with device-specific optimizations
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || 
                 canvas.getContext('experimental-webgl') ||
                 canvas.getContext('webgl2');
      if (!gl) {
        setHasWebGL(false);
        console.warn('⚠️ WebGL not supported, 3D background will not render');
        return;
      }
      
      // Device-specific optimizations
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      
      // Log device info for debugging
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        console.log('🔵 WebGL Renderer:', renderer, 'iOS:', isIOS, 'Android:', isAndroid);
      }
    } catch (e) {
      setHasWebGL(false);
      console.warn('⚠️ WebGL check failed:', e);
    }
  }, []);

  // Track scroll for depth blur effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle unhandled promise rejections (like CORS errors from GLB loading)
  // Catch and handle gracefully without breaking the app
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      const errorMessage = event.reason?.message || '';
      const errorStack = event.reason?.stack || '';
      
      if (errorMessage.includes('cozy_living_room_baked') || 
          errorMessage.includes('r2.dev') ||
          errorMessage.includes('CORS') ||
          errorMessage.includes('Failed to fetch') ||
          errorStack.includes('cozy_living_room_baked') ||
          errorStack.includes('r2.dev')) {
        console.warn('⚠️ GLB model CORS/fetch error detected:', event.reason);
        console.warn('⚠️ This is likely a CORS configuration issue on your R2 bucket');
        console.warn('⚠️ Canvas will continue to render, but model may not load');
        // Prevent the error from showing as uncaught
        event.preventDefault();
        // Don't hide canvas - let it try to render anyway
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  // Cleanup canvas event listeners
  useEffect(() => {
    return () => {
      if (handlersRef.current) {
        const { gl, handleContextLost, handleContextRestored, handleError } = handlersRef.current;
        if (gl?.domElement) {
          gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
          gl.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
        }
        window.removeEventListener('error', handleError);
      }
    };
  }, []);

  // If canvas has errored or WebGL not supported, don't render it
  if (canvasError || !hasWebGL) {
    return null;
  }

  return (
    <>
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          overflow: 'hidden'
        }}
      >
        <Canvas
          camera={{ position: [0, 1, 6], fov: 45 }}
          gl={{ 
            alpha: true, 
            antialias: true, 
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false, // Allow on lower-end devices
            stencil: false, // Disable stencil buffer for better performance
            depth: true
          }}
          style={{ 
            position: 'absolute',
            inset: 0,
            width: '100%', 
            height: '100%',
            pointerEvents: 'none'
          }}
          frameloop="always"
          dpr={[0.5, 2]} // Adaptive DPR: lower on mobile for better performance
          performance={{ min: 0.5 }} // Allow lower framerate on slower devices
          onCreated={({ gl }) => {
            console.log('✅ Canvas created successfully');
            
            const handleContextLost = (event) => {
              event.preventDefault();
              console.warn('⚠️ WebGL context lost');
              // Don't hide canvas - it might recover
            };
            
            const handleContextRestored = () => {
              console.log('✅ WebGL context restored');
              setCanvasError(false);
            };
            
            // Only catch errors specifically related to this canvas
            const handleError = (error) => {
              // Only hide if it's a critical WebGL error
              if (error.message?.includes('WebGL') || error.message?.includes('context')) {
                console.warn('⚠️ Canvas WebGL error:', error);
              }
            };
            
            gl.domElement.addEventListener('webglcontextlost', handleContextLost);
            gl.domElement.addEventListener('webglcontextrestored', handleContextRestored);
            
            handlersRef.current = {
              gl,
              handleContextLost,
              handleContextRestored,
              handleError
            };
          }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, 5, -5]} intensity={0.9} />
          <directionalLight position={[0, -5, 0]} intensity={0.4} />
          <ModelErrorBoundary>
            <Suspense fallback={null}>
              <LivingRoomModel 
                spatialPos={spatialPos}
                isMobile={isMobile}
              />
              <Environment preset="city" />
            </Suspense>
          </ModelErrorBoundary>
        </Canvas>
      </div>
      
      {/* Glass UI overlay with depth blur on scroll */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          backdropFilter: `blur(${Math.min(scrollY * 0.02, 10)}px)`,
          WebkitBackdropFilter: `blur(${Math.min(scrollY * 0.02, 10)}px)`,
          background: 'rgba(255, 255, 255, 0.02)',
          transition: 'backdrop-filter 0.3s ease-out',
        }}
      />
    </>
  );
}
