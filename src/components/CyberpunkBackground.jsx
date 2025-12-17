import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Grid Floor Component
function GridFloor({ position = [0, -2, 0] }) {
  const gridRef = useRef();

  useFrame((state) => {
    if (gridRef.current) {
      // Slow forward scroll
      gridRef.current.position.z = (state.clock.elapsedTime * 0.5) % 10 - 5;
    }
  });

  return (
    <mesh ref={gridRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 50, 50, 50]} />
      <meshBasicMaterial
        color="#60a5fa"
        transparent
        opacity={0.4}
        wireframe
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Floating Wireframe Panel Component
function FloatingPanel({ position, rotation, scale }) {
  const panelRef = useRef();

  useFrame((state) => {
    if (panelRef.current) {
      // Gentle floating motion
      panelRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.3;
      panelRef.current.rotation.z = rotation[2] + Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  const boxGeometry = useMemo(() => new THREE.BoxGeometry(2, 1.5, 0.1), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(boxGeometry), [boxGeometry]);

  return (
    <group ref={panelRef} position={position} rotation={rotation} scale={scale}>
      <mesh>
        <primitive object={boxGeometry} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.2}
          wireframe
        />
      </mesh>
      <lineSegments>
        <primitive object={edgesGeometry} />
        <lineBasicMaterial color="#3b82f6" opacity={0.5} transparent />
      </lineSegments>
    </group>
  );
}

// Light Beam Component
function LightBeam({ position, height = 5 }) {
  const beamRef = useRef();

  useFrame((state) => {
    if (beamRef.current) {
      // Gentle pulse
      const pulse = Math.sin(state.clock.elapsedTime * 0.8) * 0.2 + 0.8;
      beamRef.current.material.opacity = pulse * 0.4;
    }
  });

  return (
    <mesh ref={beamRef} position={position}>
      <cylinderGeometry args={[0.1, 0.15, height, 8]} />
      <meshBasicMaterial
        color="#3b82f6"
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Particle Field Component
function ParticleField({ count = 200 }) {
  const pointsRef = useRef();

    const geometry = useMemo(() => {
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const blue = new THREE.Color(0x3b82f6);
      const lightBlue = new THREE.Color(0x60a5fa);
      const white = new THREE.Color(0xffffff);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        // Random positions in a sphere
        positions[i3] = (Math.random() - 0.5) * 30;
        positions[i3 + 1] = (Math.random() - 0.5) * 20;
        positions[i3 + 2] = (Math.random() - 0.5) * 30;

        // Mix blue, light blue, and white
        const rand = Math.random();
        const color = rand < 0.4 ? blue : rand < 0.7 ? lightBlue : white;
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
      }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      // Slow diagonal drift
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.5;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Scanline Effect Component
function ScanlineEffect() {
  const scanlineRef = useRef();

  useFrame((state) => {
    if (scanlineRef.current) {
      // Moving scanline
      scanlineRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 3;
      scanlineRef.current.material.opacity = Math.abs(Math.sin(state.clock.elapsedTime * 2)) * 0.1;
    }
  });

  return (
    <mesh ref={scanlineRef} position={[0, 0, -5]} rotation={[0, 0, 0]}>
      <planeGeometry args={[50, 0.1]} />
      <meshBasicMaterial
        color="#3b82f6"
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Main Cyberpunk Background Component
export default function CyberpunkBackground({ intensity = 'medium' }) {
  const intensityMap = {
    low: { opacity: 0.2, particleCount: 100 },
    medium: { opacity: 0.4, particleCount: 200 },
    high: { opacity: 0.6, particleCount: 300 }
  };

  const settings = intensityMap[intensity] || intensityMap.medium;

  // Panel positions
  const panels = useMemo(() => [
    { position: [-8, 2, -8], rotation: [0, 0.3, 0], scale: [1, 1, 1] },
    { position: [8, -1, -10], rotation: [0, -0.3, 0.2], scale: [0.8, 0.8, 0.8] },
    { position: [-6, -2, -12], rotation: [0, 0.5, -0.1], scale: [0.6, 0.6, 0.6] },
    { position: [6, 1, -15], rotation: [0, -0.2, 0.1], scale: [0.7, 0.7, 0.7] },
  ], []);

  // Light beam positions
  const beams = useMemo(() => [
    { position: [-5, -1, -5], height: 4 },
    { position: [5, -1, -7], height: 5 },
    { position: [0, -1.5, -10], height: 3 },
  ], []);

  return (
    <group>
      {/* Grid Floor */}
      <GridFloor position={[0, -2, 0]} />
      
      {/* Floating Wireframe Panels */}
      {panels.map((panel, index) => (
        <FloatingPanel
          key={index}
          position={panel.position}
          rotation={panel.rotation}
          scale={panel.scale}
        />
      ))}

      {/* Light Beams */}
      {beams.map((beam, index) => (
        <LightBeam
          key={index}
          position={beam.position}
          height={beam.height}
        />
      ))}

      {/* Particle Field */}
      <ParticleField count={settings.particleCount} />

      {/* Scanline Effect */}
      <ScanlineEffect />

      {/* Ambient Lighting */}
      <ambientLight intensity={0.6} color="#ffffff" />
      
      {/* Blue Rim Lights */}
      <pointLight position={[-10, 5, -5]} intensity={0.6} color="#3b82f6" />
      <pointLight position={[10, 5, -5]} intensity={0.6} color="#3b82f6" />
      <pointLight position={[0, 5, -8]} intensity={0.4} color="#60a5fa" />
    </group>
  );
}

