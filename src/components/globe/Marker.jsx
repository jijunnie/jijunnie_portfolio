import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { latLonToVector3 } from '../../utils/latLonToVector3';

export default function Marker({ lat, lon, name, description, visited, onClick, radius = 2.05, globeRotationRef, isGlobeHovered }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const position = latLonToVector3(lat, lon, radius);

  // Floating animation and rotation sync with globe (stops when globe is hovered)
  useFrame((state) => {
    if (groupRef.current) {
      // Set base position
      groupRef.current.position.x = position.x;
      groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 2 + lat) * 0.05;
      groupRef.current.position.z = position.z;
      
      // Sync rotation with globe (stops when hovered)
      if (globeRotationRef?.current !== undefined && !isGlobeHovered) {
        groupRef.current.rotation.y = globeRotationRef.current;
      } else if (globeRotationRef?.current !== undefined) {
        // Keep current rotation when hovered
        groupRef.current.rotation.y = globeRotationRef.current;
      }
    }
  });

  const color = visited ? '#10b981' : '#ef4444';
  const scale = hovered ? 1.3 : 1;

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick({ name, description, lat, lon, visited });
      }}
    >
      {/* Pin - Brighter for visited places */}
      <Sphere args={[0.03, 16, 16]} scale={scale}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={visited ? (hovered ? 1.2 : 0.8) : (hovered ? 0.8 : 0.5)}
        />
      </Sphere>
      
      {/* Always show label for visited places, or on hover */}
      {(visited || hovered) && (
        <Text
          position={[0, 0.15, 0]}
          fontSize={visited ? 0.1 : 0.08}
          color={visited ? "#90EE90" : "#ffffff"}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={visited ? 0.03 : 0.02}
          outlineColor="#000000"
        >
          {name}
        </Text>
      )}
      
      {/* Enhanced glow effect for visited places */}
      <Sphere args={[visited ? 0.06 : 0.05, 16, 16]}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={visited ? 0.5 : (hovered ? 0.3 : 0)}
          emissive={color}
          emissiveIntensity={visited ? 1 : 0.5}
        />
      </Sphere>
    </group>
  );
}

