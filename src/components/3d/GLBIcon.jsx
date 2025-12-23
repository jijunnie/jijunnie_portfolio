import { Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import React from 'react';

function IconModel({ url, isHovered, baseScale = 1, mousePos = { x: 0, y: 0 } }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef();
  const groupRef = useRef();
  const [clonedScene, setClonedScene] = useState(null);

  // Clone scene and enhance materials for better contrast
  React.useEffect(() => {
    if (scene && !clonedScene) {
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
    }
  }, [scene, clonedScene]);

  useFrame((state) => {
    if (groupRef.current && modelRef.current) {
      const time = state.clock.elapsedTime;
      
      if (isHovered) {
        // Rotate when hovered
        groupRef.current.rotation.y = Math.sin(time * 2) * 0.2;
        groupRef.current.rotation.x = Math.sin(time * 1.5) * 0.1;
      } else {
        // Apply mouse spatial effect with same intensity as panels
        const rotateX = -mousePos.y * 8 * 0.6;
        const rotateY = mousePos.x * 8 * 0.6;
        groupRef.current.rotation.x = (rotateX * Math.PI) / 180;
        groupRef.current.rotation.y = (rotateY * Math.PI) / 180;
        
        // Gentle floating animation
        groupRef.current.position.y = Math.sin(time * 0.8) * 0.1;
      }
    }
  });

  if (!clonedScene) return null;

  return (
    <group ref={groupRef}>
      <primitive 
        ref={modelRef} 
        object={clonedScene} 
        scale={isHovered ? 0.6 * baseScale : 0.5 * baseScale}
      />
    </group>
  );
}

export default function GLBIcon({ src, isHovered, scale = 1, mousePos = { x: 0, y: 0 } }) {
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
        gl={{ alpha: true, antialias: true }}
        style={{ 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none',
          overflow: 'visible'
        }}
        frameloop="always"
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-5, -5, -5]} intensity={0.5} />
        <Suspense fallback={null}>
          <IconModel url={src} isHovered={isHovered} baseScale={scale} mousePos={mousePos} />
        </Suspense>
      </Canvas>
    </div>
  );
}