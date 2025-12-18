import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

export default function RotatingBackground() {
  const backgroundRef = useRef();

  // Continuous rotation independent of globe hover state
  useFrame(() => {
    if (backgroundRef.current) {
      backgroundRef.current.rotation.y += 0.0005; // Slow continuous rotation
    }
  });

  return (
    <group ref={backgroundRef}>
      {/* Multiple star layers for better galaxy effect */}
      <Stars radius={400} depth={80} count={20000} factor={12} fade speed={0.5} />
      <Stars radius={350} depth={50} count={15000} factor={10} fade speed={0.8} />
      <Stars radius={300} depth={30} count={10000} factor={8} fade speed={1} />
    </group>
  );
}

