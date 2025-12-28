import { Suspense, useRef, useEffect, useState, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';

// Preload 3D background model at module level - CRITICAL for instant display
const backgroundModelUrl = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/cozy_living_room_baked.glb';

// Preload immediately when module loads (before any component renders)
try {
  useGLTF.preload(backgroundModelUrl);
  console.log('✅ Preloaded 3D background at module level');
} catch (error) {
  console.warn('⚠️ Failed to preload 3D background at module level:', error);
}

// Also preload in browser cache using fetch for maximum reliability
if (typeof window !== 'undefined') {
  fetch(backgroundModelUrl, { method: 'HEAD', cache: 'force-cache' }).catch(() => {});
}

// Error Boundary
class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('3D Model failed to load:', error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// Core 3D Model Component (Fixed for Instant Rotation)
function LivingRoomModel({ mousePosRef, deviceOrientationRef, isMobile, onModelReady }) {
  const modelUrl = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/cozy_living_room_baked.glb';
  const gltf = useGLTF(modelUrl);
  const groupRef = useRef();
  const clonedSceneRef = useRef(null);
  const autoRotateRef = useRef(0);
  
  // Clone scene once (avoid re-cloning on re-renders)
  useEffect(() => {
    if (gltf?.scene && !clonedSceneRef.current) {
      clonedSceneRef.current = gltf.scene.clone();
      console.log('✅ 3D model loaded and ready');
      
      // Initialize rotation (pre-convert to radians for performance)
      if (groupRef.current) {
        const baseRotationY = -20 * Math.PI / 180;
        groupRef.current.rotation.set(0, baseRotationY, 0);
      }
      
      // Notify parent that model is ready
      if (onModelReady && typeof onModelReady === 'function') {
        onModelReady();
      }
    }
  }, [gltf]);

  // Frame loop (runs every frame ~60x/second)
  useFrame((state, delta) => {
    if (!groupRef.current || !clonedSceneRef.current) return;
    
    // Subtle auto-rotation (kept for polish, no impact on mouse response)
    autoRotateRef.current += delta * 0.1;
    const autoRotationY = autoRotateRef.current * 0.5 * Math.PI / 180;
    const baseRotationY = -20 * Math.PI / 180;
    
    let rotateX = 0;
    let rotateY = 0;
    
    // Desktop: Instant, continuous mouse response (NO LAG)
    if (!isMobile && mousePosRef?.current) {
      const mousePos = mousePosRef.current;
      if (typeof mousePos.x === 'number' && typeof mousePos.y === 'number') {
        // Normalize mouse position (-1 to 1 range, centered at 0)
        // Ensures consistent rotation across screen sizes
        const normX = mousePos.x;
        const normY = mousePos.y;
        
        // Direct rotation mapping (5° max for natural movement)
        rotateX = normY * 5 * Math.PI / 180;
        rotateY = normX * 5 * Math.PI / 180;
        
        // Clamp rotation to prevent extreme values
        rotateX = Math.max(-0.26, Math.min(0.26, rotateX)); // ±15°
        rotateY = Math.max(-0.26, Math.min(0.26, rotateY)); // ±15°
      }
    }
    // Mobile: Stable device orientation with improved smoothing
    else if (isMobile && deviceOrientationRef?.current) {
      const deviceOrientation = deviceOrientationRef.current;
      if (typeof deviceOrientation.x === 'number' && typeof deviceOrientation.y === 'number') {
        // Device orientation is already smoothed in the handler
        // Apply gentle multiplier for natural movement
        const deviceMultiplier = 2.5 * Math.PI / 180; // Slightly reduced for stability
        
        rotateX = deviceOrientation.y * deviceMultiplier;
        rotateY = deviceOrientation.x * deviceMultiplier;
        
        // Clamp to prevent extreme rotations
        rotateX = Math.max(-0.2, Math.min(0.2, rotateX)); // ±11.5°
        rotateY = Math.max(-0.2, Math.min(0.2, rotateY)); // ±11.5°
      }
    }
    
    // APPLY ROTATION INSTANTLY (no lerp/delay)
    groupRef.current.rotation.x = rotateX;
    groupRef.current.rotation.y = baseRotationY + autoRotationY + rotateY;
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

// Main Background Component (Fixed with proper mouse handling)
function LivingRoomBackground({ mousePosRef, deviceOrientationRef, isMobile }) {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const handlersRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (!gl) {
        setHasWebGL(false);
        console.warn('⚠️ WebGL not supported');
      }
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  // Track scroll for depth blur (unchanged)
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle CORS errors gracefully (unchanged)
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      const errorMessage = event.reason?.message || '';
      if (errorMessage.includes('cozy_living_room_baked') || errorMessage.includes('r2.dev')) {
        console.warn('⚠️ GLB model loading error:', event.reason);
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  // Cleanup WebGL handlers (unchanged)
  useEffect(() => {
    return () => {
      if (handlersRef.current?.gl?.domElement) {
        const { gl, handleContextLost, handleContextRestored } = handlersRef.current;
        gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
        gl.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      }
    };
  }, []);

  if (!hasWebGL) return null;

  return (
    <>
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0, overflow: 'hidden' }}
      >
        <Canvas
          camera={{ position: [0, 1, 6], fov: 45 }}
          gl={{ 
            alpha: true, 
            antialias: true,
            powerPreference: "high-performance",
            stencil: false,
            preserveDrawingBuffer: false, // Better performance
            failIfMajorPerformanceCaveat: false
          }}
          style={{ 
            position: 'absolute',
            inset: 0,
            width: '100%', 
            height: '100%',
            pointerEvents: 'none'
          }}
          dpr={[1, typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1]} // Adaptive DPR, max 2x for performance
          performance={{ min: 0.8, max: 0.9 }} // Balanced performance
          frameloop="always" // Always render for smooth rotation
          onCreated={({ gl }) => {
            console.log('✅ Canvas created');
            
            const handleContextLost = (event) => {
              event.preventDefault();
              console.warn('⚠️ WebGL context lost');
            };
            
            const handleContextRestored = () => {
              console.log('✅ WebGL context restored');
            };
            
            gl.domElement.addEventListener('webglcontextlost', handleContextLost);
            gl.domElement.addEventListener('webglcontextrestored', handleContextRestored);
            
            handlersRef.current = { gl, handleContextLost, handleContextRestored };
          }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, 5, -5]} intensity={0.9} />
          <directionalLight position={[0, -5, 0]} intensity={0.4} />
          
          <ModelErrorBoundary>
            <Suspense fallback={null}>
              <LivingRoomModel 
                mousePosRef={mousePosRef}
                deviceOrientationRef={deviceOrientationRef}
                isMobile={isMobile}
                onModelReady={() => setModelReady(true)}
              />
              <Environment preset="city" />
            </Suspense>
          </ModelErrorBoundary>
        </Canvas>
      </div>
      
      {/* Glass overlay (unchanged) */}
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

// Wrapper Component (Critical Fix: Continuous Mouse Tracking with Ref)
// Use this component in your app (replaces direct usage of LivingRoomBackground)
export default function LivingRoomBackgroundWithMouseTracking() {
  // ✅ Ref (not state) for mouse position (synchronous, no React batching)
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const deviceOrientationRef = useRef({ x: 0, y: 0 });

  // Detect mobile devices (basic check)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Mobile|Android|iOS/.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track mouse movement CONTINUOUSLY (no debounce/throttle)
  useEffect(() => {
    if (isMobile) return; // Skip for mobile
    
    const handleMouseMove = (e) => {
      // Normalize mouse position to -1 → 1 range (centered at screen middle)
      // This ensures consistent rotation across all screen sizes
      mousePosRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1, // Left = -1, Right = 1
        y: -(e.clientY / window.innerHeight) * 2 + 1 // Top = 1, Bottom = -1 (flipped for natural rotation)
      };
    };

    // Passive listener = better performance (no event blocking)
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // Cleanup
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  // Mobile device orientation - STABLE with improved smoothing
  useEffect(() => {
    if (!isMobile) return;
    
    // Smoothing state
    const smoothedOrientation = { x: 0, y: 0 };
    const smoothingFactor = 0.15; // Lower = smoother (prevents jitter)
    const deadZone = 0.05; // Ignore tiny movements
    
    let lastUpdateTime = 0;
    const minUpdateInterval = 16; // ~60fps max update rate
    
    const handleOrientation = (e) => {
      const now = performance.now();
      if (now - lastUpdateTime < minUpdateInterval) return;
      lastUpdateTime = now;
      
      // Normalize and clamp values
      const rawX = Math.max(-1, Math.min(1, (e.gamma || 0) / 30));
      const rawY = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 30));
      
      // Apply exponential smoothing to reduce jitter
      smoothedOrientation.x = smoothedOrientation.x + (rawX - smoothedOrientation.x) * smoothingFactor;
      smoothedOrientation.y = smoothedOrientation.y + (rawY - smoothedOrientation.y) * smoothingFactor;
      
      // Apply dead zone to ignore micro-movements
      const processedX = Math.abs(smoothedOrientation.x) < deadZone ? 0 : smoothedOrientation.x;
      const processedY = Math.abs(smoothedOrientation.y) < deadZone ? 0 : smoothedOrientation.y;
      
      deviceOrientationRef.current = {
        x: processedX,
        y: processedY
      };
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }
    
    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [isMobile]);

  return (
    <LivingRoomBackground 
      mousePosRef={mousePosRef} // Pass ref for continuous updates (no lag)
      deviceOrientationRef={deviceOrientationRef}
      isMobile={isMobile}
    />
  );
}

// Required for useGLTF (preload fix)
useGLTF.preload(backgroundModelUrl);