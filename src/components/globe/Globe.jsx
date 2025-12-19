import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Globe({ radius = 2, rotationRef, onHoverChange }) {
  const meshRef = useRef();
  const isHoveredRef = useRef(false);
  
  // Load Earth texture - using a reliable CDN
  const earthTexture = useTexture({
    map: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
  });

  // Gentle rotation animation - stops when hovered
  useFrame(() => {
    if (meshRef.current && !isHoveredRef.current) {
      meshRef.current.rotation.y += 0.001;
      // Update rotation ref if provided
      if (rotationRef) {
        rotationRef.current = meshRef.current.rotation.y;
      }
    } else if (meshRef.current && rotationRef) {
      // Keep rotation ref updated even when stopped
      rotationRef.current = meshRef.current.rotation.y;
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      receiveShadow
      onPointerOver={() => {
        isHoveredRef.current = true;
        if (onHoverChange) onHoverChange(true);
      }}
      onPointerOut={() => {
        isHoveredRef.current = false;
        if (onHoverChange) onHoverChange(false);
      }}
    >
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial
        map={earthTexture.map}
        roughness={0.6}
        metalness={0.2}
        transparent={false}
        color={0xc8d8f0} // Slightly darker blue tint
        emissive={0x2a3f5a} // Reduced emissive for better contrast
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}
