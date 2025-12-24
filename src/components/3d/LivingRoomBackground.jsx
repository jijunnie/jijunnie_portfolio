import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function LivingRoomModel({ mousePos, deviceOrientation, isMobile }) {
  // Load from Cloudflare R2 CDN in production, local file in development
  const cdnBaseUrl = 'https://c05a89ab56cf617eda04249538afeb45.r2.cloudflarestorage.com/my-3d-assets';
  const modelUrl = import.meta.env.PROD
    ? import.meta.env.VITE_MODEL_CDN_URL || `${cdnBaseUrl}/cozy_living_room_baked.glb`
    : '/models/cozy_living_room_baked.glb';
  
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef();
  const [clonedScene, setClonedScene] = useState(null);

  // Clone scene to avoid mutating the original
  useEffect(() => {
    if (scene && !clonedScene) {
      const cloned = scene.clone();
      setClonedScene(cloned);
    }
  }, [scene, clonedScene]);

  useFrame(() => {
    if (groupRef.current) {
      // Apply spatial rotation based on mouse or device orientation
      const spatialPos = isMobile ? deviceOrientation : mousePos;
      
      // Calculate rotation based on spatial position
      // Use a subtle rotation effect for the background
      const rotateX = -spatialPos.y * 3; // Reduced intensity for background
      const baseRotationY = -20; // Fixed rotation around Y axis (20 degrees clockwise)
      const rotateY = spatialPos.x * 3 + baseRotationY;
      
      groupRef.current.rotation.x = (rotateX * Math.PI) / 180;
      groupRef.current.rotation.y = (rotateY * Math.PI) / 180;
    }
  });

  if (!clonedScene) return null;

  return (
    <group ref={groupRef}>
      <primitive 
        object={clonedScene} 
        scale={[3, 3, 3]} // Adjust scale to fit the viewport
        position={[-0.5, -3, -1.2]} // Center the model, shifted down and slightly right, moved backward
      />
    </group>
  );
}

export default function LivingRoomBackground({ mousePos, deviceOrientation, isMobile }) {
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 0, // Behind everything
        overflow: 'hidden'
      }}
    >
      <Canvas
        camera={{ position: [0, 1, 6], fov: 60 }}
        gl={{ 
          alpha: true, 
          antialias: true, 
          preserveDrawingBuffer: false,
          powerPreference: "high-performance"
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          pointerEvents: 'none'
        }}
        frameloop="always"
        dpr={[1, 2]} // Limit pixel ratio for performance
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} />
        <directionalLight position={[-5, 5, -5]} intensity={0.9} />
        <directionalLight position={[0, -5, 0]} intensity={0.4} />
        <pointLight position={[0, 5, 0]} intensity={0.5} />
        <Suspense fallback={null}>
          <LivingRoomModel 
            mousePos={mousePos} 
            deviceOrientation={deviceOrientation}
            isMobile={isMobile}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

