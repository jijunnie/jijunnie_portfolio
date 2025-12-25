import { Suspense, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import React from 'react';

// Error Boundary for icon loading
class IconErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Icon failed to load, showing fallback:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ 
            pointerEvents: 'none',
            background: 'rgba(200, 200, 200, 0.1)',
            borderRadius: '12px'
          }}
        >
          <div className="text-gray-400 text-xs">3D</div>
        </div>
      );
    }

    return this.props.children;
  }
}

function IconModel({ url, isHovered, baseScale = 1, spatialPos = { x: 0, y: 0 } }) {
  const [loadError, setLoadError] = useState(false);
  const modelRef = useRef();
  const groupRef = useRef();
  const [clonedScene, setClonedScene] = useState(null);
  
  // useGLTF must be called unconditionally (React hook rules)
  // Errors will be caught in useEffect
  let scene = null;
  try {
    const gltf = useGLTF(url);
    scene = gltf?.scene;
  } catch (error) {
    // This catch won't work for async loading errors, but helps with immediate errors
    console.warn('GLB hook error:', url, error);
  }
  
  // Smooth interpolation for rotation to prevent glitching
  const targetRotationX = useRef(0);
  const targetRotationY = useRef(0);
  const currentRotationX = useRef(0);
  const currentRotationY = useRef(0);
  const targetPositionY = useRef(0);
  const currentPositionY = useRef(0);
  const smoothedSpatialPos = useRef({ x: 0, y: 0 });

  // Clone scene and enhance materials for better contrast
  React.useEffect(() => {
    if (!scene) {
      // Set error if scene doesn't load after a timeout
      const timeout = setTimeout(() => {
        if (!clonedScene && !loadError) {
          console.warn('GLB icon failed to load:', url);
          setLoadError(true);
        }
      }, 10000); // 10 second timeout
      return () => clearTimeout(timeout);
    }
    
    if (scene && !clonedScene && !loadError) {
      try {
        const cloned = scene.clone();
      cloned.traverse((child) => {
        if (child.isMesh && child.material) {
          // Enhance material properties for better contrast
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          const enhancedMaterials = materials.map((mat) => {
            const newMat = mat.clone();
            
            // Stronger contrast enhancement using a more aggressive curve
            // Map values from [0,1] to create stronger contrast
            const contrastFactor = 1.5; // Higher = more contrast
            
            if (newMat.color) {
              const color = newMat.color;
              
              color.r = ((color.r - 0.5) * contrastFactor) + 0.5;
              color.g = ((color.g - 0.5) * contrastFactor) + 0.5;
              color.b = ((color.b - 0.5) * contrastFactor) + 0.5;
              
              // Clamp to valid range
              color.r = Math.max(0, Math.min(1, color.r));
              color.g = Math.max(0, Math.min(1, color.g));
              color.b = Math.max(0, Math.min(1, color.b));
              
              // Enhance saturation further
              const max = Math.max(color.r, color.g, color.b);
              const min = Math.min(color.r, color.g, color.b);
              if (max > 0 && (max - min) > 0) {
                const saturation = (max - min) / max;
                const targetSaturation = Math.min(saturation * 1.8, 1);
                const scale = targetSaturation / saturation;
                
                color.r = min + (color.r - min) * scale;
                color.g = min + (color.g - min) * scale;
                color.b = min + (color.b - min) * scale;
              }
              
              newMat.color = color;
            }
            
            // Add stronger emissive for more vibrant colors
            if (!newMat.emissive) {
              newMat.emissive = new THREE.Color();
            }
            if (newMat.color) {
              newMat.emissive.copy(newMat.color).multiplyScalar(0.5);
            }
            
            // Adjust material properties
            newMat.metalness = Math.min(newMat.metalness * 0.8, 0.5);
            newMat.roughness = Math.max(newMat.roughness * 0.9, 0.1);
            
            return newMat;
          });
          
          child.material = Array.isArray(child.material) ? enhancedMaterials : enhancedMaterials[0];
        }
      });
      setClonedScene(cloned);
      } catch (error) {
        console.error('Failed to clone icon scene:', error);
        setLoadError(true);
      }
    }
  }, [scene, clonedScene, loadError]);

  useFrame((state, delta) => {
    // Add comprehensive null checks to prevent "Activity" errors
    if (!groupRef.current) return;
    if (!state || !state.clock) return;
    
    const time = state.clock.elapsedTime;
    
    // Ensure rotation and position objects exist
    if (!groupRef.current.rotation) return;
    if (!groupRef.current.position) return;
    
    if (isHovered) {
      // Rotate when hovered - smooth interpolation
      targetRotationY.current = Math.sin(time * 2) * 0.2;
      targetRotationX.current = Math.sin(time * 1.5) * 0.1;
    } else {
      // Smooth spatial position to prevent jittery rotation
      // spatialPos is already smoothed from Portfolio component, but add extra smoothing for icon rotation
      // Use exponential smoothing for stability
      const spatialSmoothingFactor = 0.2; // Lower = smoother (more aggressive smoothing)
      smoothedSpatialPos.current.x += (spatialPos.x - smoothedSpatialPos.current.x) * spatialSmoothingFactor;
      smoothedSpatialPos.current.y += (spatialPos.y - smoothedSpatialPos.current.y) * spatialSmoothingFactor;
      
      // Clamp smoothed values to prevent extreme rotations
      const clampedX = Math.max(-1, Math.min(1, smoothedSpatialPos.current.x));
      const clampedY = Math.max(-1, Math.min(1, smoothedSpatialPos.current.y));
      
      // Dead zone to prevent micro-movements
      const deadZone = 0.03;
      const processedX = Math.abs(clampedX) < deadZone ? 0 : clampedX;
      const processedY = Math.abs(clampedY) < deadZone ? 0 : clampedY;
      
      // Apply spatial effect with reduced multiplier for stability
      const rotationMultiplier = 4.5; // Slightly reduced from 4.8 for more stability
      let rotateX = -processedY * 8 * (rotationMultiplier / 8);
      let rotateY = processedX * 8 * (rotationMultiplier / 8);
      
      // Clamp rotation values to prevent extreme rotations
      const maxRotation = 12; // Maximum rotation in degrees for icons
      rotateX = Math.max(-maxRotation, Math.min(maxRotation, rotateX));
      rotateY = Math.max(-maxRotation, Math.min(maxRotation, rotateY));
      
      targetRotationX.current = (rotateX * Math.PI) / 180;
      targetRotationY.current = (rotateY * Math.PI) / 180;
      
      // Gentle floating animation
      targetPositionY.current = Math.sin(time * 0.8) * 0.1;
    }
    
    // Smooth interpolation (lerp) to prevent glitching
    // Use stronger smoothing for more stability
    const baseLerpFactor = 0.15; // Fixed smoothing factor for consistent behavior
    const lerpFactor = Math.min(baseLerpFactor, 1);
    currentRotationX.current += (targetRotationX.current - currentRotationX.current) * lerpFactor;
    currentRotationY.current += (targetRotationY.current - currentRotationY.current) * lerpFactor;
    currentPositionY.current += (targetPositionY.current - currentPositionY.current) * lerpFactor;
    
    // Apply smoothed values
    groupRef.current.rotation.x = currentRotationX.current;
    groupRef.current.rotation.y = currentRotationY.current;
    groupRef.current.position.y = currentPositionY.current;
  });

  if (loadError) return null;
  if (!clonedScene) return null;

  return (
    <group ref={groupRef}>
      <primitive 
        ref={modelRef} 
        object={clonedScene} 
        scale={0.5 * baseScale}
      />
    </group>
  );
}

export default function GLBIcon({ src, isHovered, scale = 1, spatialPos = { x: 0, y: 0 } }) {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [loadError, setLoadError] = useState(false);
  
  // Check WebGL support on mount with device-specific detection
  React.useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || 
                 canvas.getContext('experimental-webgl') ||
                 canvas.getContext('webgl2');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
      
      // Check for specific device issues
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      
      // Some older devices may have WebGL but poor performance
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        // Log for debugging but don't block
        console.log('WebGL Renderer:', renderer);
      }
    } catch (e) {
      setHasWebGL(false);
      console.warn('WebGL check failed:', e);
    }
  }, []);
  
  // Fallback for devices without WebGL support
  if (!hasWebGL) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ 
          pointerEvents: 'none',
          background: 'rgba(200, 200, 200, 0.1)',
          borderRadius: '12px'
        }}
      >
        <div className="text-gray-400 text-xs">3D</div>
      </div>
    );
  }
  
  return (
    <div 
      className="w-full h-full" 
      style={{ 
        pointerEvents: 'none',
        overflow: 'visible',
        // Add padding inside to give room for hover expansion
        padding: '15%',
        boxSizing: 'border-box'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false // Allow on lower-end devices
        }}
        style={{ 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none',
          overflow: 'visible'
        }}
        frameloop="always"
        dpr={[0.5, 2]} // Adaptive DPR: lower on mobile for better performance
        performance={{ min: 0.5 }} // Allow lower framerate on slower devices
        onError={(error) => {
          console.warn('Canvas error:', error);
          setLoadError(true);
        }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-5, -5, -5]} intensity={0.5} />
        <IconErrorBoundary>
          <Suspense fallback={null}>
            <IconModel url={src} isHovered={isHovered} baseScale={scale} spatialPos={spatialPos} />
          </Suspense>
        </IconErrorBoundary>
      </Canvas>
    </div>
  );
}