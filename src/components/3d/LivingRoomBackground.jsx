import { Suspense, useRef, useEffect, useState, Component } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

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

function LivingRoomModel({ externalMousePos, deviceOrientation, isMobile }) {
  // Load from Cloudflare R2 CDN - streams directly from R2, no local bundle size
  const cdnBaseUrl = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev';
  const modelUrl = import.meta.env.PROD
    ? import.meta.env.VITE_MODEL_CDN_URL || `${cdnBaseUrl}/cozy_living_room_baked.glb`
    : '/models/cozy_living_room_baked.glb';
  
  // Best practice: Direct useGLTF usage - streams from R2, CDN-cached globally
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef();
  const clonedSceneRef = useRef(null);
  const autoRotateRef = useRef(0);
  
  // Clone scene once to avoid mutating the original
  useEffect(() => {
    if (scene && !clonedSceneRef.current) {
      try {
        clonedSceneRef.current = scene.clone();
      } catch (error) {
        console.warn('Failed to clone scene:', error);
      }
    }
  }, [scene]);

  // Get mouse position from Three.js viewport (normalized -1 to 1)
  const { viewport, mouse } = useThree();
  
  useFrame((state, delta) => {
    if (!groupRef.current || !clonedSceneRef.current) return;
    
    // Slow auto-rotation (Apple/Vision Pro style)
    autoRotateRef.current += delta * 0.1; // Slow continuous rotation
    
    // Parallax tied to cursor (subtle effect)
    const mouseX = externalMousePos?.x !== undefined 
      ? (externalMousePos.x / window.innerWidth) * 2 - 1 
      : mouse.x;
    const mouseY = externalMousePos?.y !== undefined
      ? -(externalMousePos.y / window.innerHeight) * 2 + 1
      : mouse.y;
    
    // Combine auto-rotation with mouse parallax
    const baseRotationY = -20; // Fixed base rotation
    const autoRotationY = autoRotateRef.current * 0.5; // Slow auto-rotate
    const parallaxY = mouseX * 0.1; // Subtle parallax from cursor
    const parallaxX = mouseY * 0.05; // Subtle vertical parallax
    
    // Apply rotations
    groupRef.current.rotation.x = parallaxX;
    groupRef.current.rotation.y = (baseRotationY + autoRotationY + parallaxY) * (Math.PI / 180);
    
    // Mobile: use device orientation if available
    if (isMobile && deviceOrientation) {
      if (typeof deviceOrientation.x === 'number' && typeof deviceOrientation.y === 'number') {
        groupRef.current.rotation.x = -deviceOrientation.y * 0.1;
        groupRef.current.rotation.y = (baseRotationY + autoRotationY + deviceOrientation.x * 0.1) * (Math.PI / 180);
      }
    }
  });

  if (!clonedSceneRef.current) return null;

  return (
    <group ref={groupRef}>
      <primitive 
        object={clonedSceneRef.current} 
        scale={[3, 3, 3]}
        position={[-0.5, -3, -1.2]}
      />
    </group>
  );
}

export default function LivingRoomBackground({ mousePos, deviceOrientation, isMobile }) {
  const [canvasError, setCanvasError] = useState(false);
  const handlersRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  // Track scroll for depth blur effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle unhandled promise rejections (like CORS errors from GLB loading)
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
        console.warn('GLB model failed to load (likely CORS issue), continuing without 3D background');
        setCanvasError(true);
        event.preventDefault();
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

  // If canvas has errored, don't render it
  if (canvasError) {
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
            powerPreference: "high-performance"
          }}
          style={{ 
            position: 'fixed',
            inset: 0,
            width: '100%', 
            height: '100%',
            pointerEvents: 'none',
            zIndex: -1
          }}
          frameloop="always"
          dpr={[1, 2]}
          onCreated={({ gl }) => {
            const handleContextLost = (event) => {
              event.preventDefault();
              console.warn('WebGL context lost, disabling 3D background');
              setCanvasError(true);
            };
            
            const handleContextRestored = () => {
              console.log('WebGL context restored');
              setCanvasError(false);
            };
            
            const handleError = (error) => {
              console.warn('Canvas error, disabling 3D background:', error);
              setCanvasError(true);
            };
            
            gl.domElement.addEventListener('webglcontextlost', handleContextLost);
            gl.domElement.addEventListener('webglcontextrestored', handleContextRestored);
            window.addEventListener('error', handleError);
            
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
                externalMousePos={mousePos}
                deviceOrientation={deviceOrientation}
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
