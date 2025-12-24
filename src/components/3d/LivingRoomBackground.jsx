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
  
  // Clone scene once to avoid mutating the original
  useEffect(() => {
    if (scene && !clonedSceneRef.current) {
      try {
        clonedSceneRef.current = scene.clone();
        console.log('✅ Scene cloned successfully, model ready to render');
        
        // Initialize rotation immediately so model is visible from the start
        if (groupRef.current) {
          const baseRotationY = -20;
          groupRef.current.rotation.x = 0;
          groupRef.current.rotation.y = (baseRotationY * Math.PI) / 180;
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
    
    // mousePos and deviceOrientation are already normalized (-1 to 1) from Portfolio component
    // Apply spatial rotation similar to panels and icons
    const baseRotationY = -20; // Fixed base rotation in degrees
    const autoRotationY = autoRotateRef.current * 0.5; // Slow auto-rotate in degrees
    
    let spatialRotateX = 0;
    let spatialRotateY = 0;
    
    // Desktop: use mouse position for spatial effect (always check, even if 0,0)
    if (!isMobile && externalMousePos) {
      if (typeof externalMousePos.x === 'number' && typeof externalMousePos.y === 'number') {
        spatialRotateX = -externalMousePos.y * 5; // Match panel rotation intensity
        spatialRotateY = externalMousePos.x * 5;
      }
    }
    // Mobile/iPad: use device orientation when available
    else if (isMobile && deviceOrientation) {
      if (typeof deviceOrientation.x === 'number' && typeof deviceOrientation.y === 'number') {
        spatialRotateX = -deviceOrientation.y * 5;
        spatialRotateY = deviceOrientation.x * 5;
      }
    }
    
    // Always apply rotations (even if spatial values are 0, model will still be visible with base + auto rotation)
    groupRef.current.rotation.x = (spatialRotateX * Math.PI) / 180;
    groupRef.current.rotation.y = ((baseRotationY + autoRotationY + spatialRotateY) * Math.PI) / 180;
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
            position: 'absolute',
            inset: 0,
            width: '100%', 
            height: '100%',
            pointerEvents: 'none'
          }}
          frameloop="always"
          dpr={[1, 2]}
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
