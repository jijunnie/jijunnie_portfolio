import React, { useRef, useEffect, Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';

// 3D Avatar Component
function Avatar({ animationPath, scale = 1.6, position = [0, -1.5, 0] }) {
  const group = useRef();
  const mixer = useRef();
  const currentActionRef = useRef();
  
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
    
    if (!newAction) return;
    
    newAction.setLoop(THREE.LoopRepeat);
    newAction.clampWhenFinished = false;
    newAction.enabled = true;
    
    if (currentActionRef.current && currentActionRef.current !== newAction) {
      const fadeDuration = 0.5;
      
      if (currentActionRef.current) {
        currentActionRef.current.fadeOut(fadeDuration);
      }
      
      newAction.reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .fadeIn(fadeDuration)
        .play();
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
    <group ref={group} position={position} scale={scale} dispose={null}>
      <primitive object={clonedAvatar} />
    </group>
  );
}

useGLTF.preload('/models/avatar.glb');

export default function About() {
  const [currentAnimation, setCurrentAnimation] = useState('/animations/Waving.fbx');
  
  // Preload animations to prevent flashing on first visit
  useFBX('/animations/Waving.fbx');
  useFBX('/animations/idle.fbx');
  
  // Switch from waving to idle after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentAnimation('/animations/idle.fbx');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-white via-slate-50 to-blue-50">
      <div className="flex h-full">
        {/* Left side - 3D Model */}
        <div className="w-1/2 h-full">
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
              <Avatar animationPath={currentAnimation} scale={1.8} position={[0, -1.2, 0]} />
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
        
        {/* Right side - Content area (empty for now) */}
        <div className="w-1/2 h-full">
          {/* Content can be added here later */}
        </div>
      </div>
    </div>
  );
}
