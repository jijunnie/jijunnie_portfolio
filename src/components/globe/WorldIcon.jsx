import React, { useRef, Suspense } from 'react';
import { useFrame, Canvas } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

function RotatingGlobe({ size = 1 }) {
  const meshRef = useRef();

  // Load Earth texture
  const earthTexture = useTexture({
    map: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
  });

  // Continuous rotation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  // Custom shader to create stylized vibrant colors (bright blue oceans, bright green land)
  const materialRef = useRef();
  React.useEffect(() => {
    if (materialRef.current && earthTexture.map) {
      const originalOnBeforeCompile = materialRef.current.onBeforeCompile;
      materialRef.current.onBeforeCompile = (shader) => {
        // Add custom fragment shader to create vibrant stylized colors
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <output_fragment>',
          `
          // Create vibrant stylized Earth colors
          vec3 color = outgoingLight;
          
          // Detect ocean areas (dark blue colors - low red/green, higher blue)
          float isOcean = step(0.0, 0.4 - color.r) * step(0.0, 0.4 - color.g) * step(0.3, color.b);
          
          // Detect land areas (brown/green/beige colors - higher red and/or green)
          float isLand = step(0.3, color.r) * step(0.2, max(color.g, color.r)) * step(0.0, 0.6 - color.b);
          
          // Very light blue for oceans
          vec3 lightBlue = vec3(0.7, 0.9, 1.0); // Very light blue/sky blue
          
          // Bright lime green for land
          vec3 vibrantGreen = vec3(0.4, 0.9, 0.3); // Bright lime green
          
          // Apply colors: oceans get very light blue, land gets bright green
          color = mix(color, lightBlue, isOcean * 0.95);
          color = mix(color, vibrantGreen, isLand * 0.9);
          
          gl_FragColor = vec4(color, diffuseColor.a);
          `
        );
        if (originalOnBeforeCompile) originalOnBeforeCompile(shader);
      };
    }
  }, [earthTexture.map]);

  return (
    <mesh ref={meshRef} scale={size} position={[0, 0, 0]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        ref={materialRef}
        map={earthTexture.map}
        roughness={0.6}
        metalness={0.15}
        emissive={0x000000}
        emissiveIntensity={0}
        color={0xffffff}
      />
    </mesh>
  );
}

export default function WorldIcon({ size = 20, className = '' }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [screenSize, setScreenSize] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1024;
  });
  
  // Handle window resize for responsive sizing
  React.useEffect(() => {
    const handleResize = () => {
      setScreenSize(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Calculate responsive size: base size is responsive to screen size
  // On hover, scale up from 0.8x to 1x using transform for center expansion
  const scaleFactor = screenSize < 640 ? 0.7 : screenSize < 1024 ? 0.85 : 1.0;
  const baseSize = size * scaleFactor;
  const scale = isHovered ? 1.0 : 0.8;
  
  return (
    <div 
      className={`relative ${className}`}
      style={{ 
        width: `${baseSize}px`, 
        height: `${baseSize}px`,
        cursor: 'pointer',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        transition: 'transform 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: 0,
        verticalAlign: 'middle',
        lineHeight: 0
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', transformOrigin: 'center center' }}
      >
        {/* Maximum brightness - ultra bright balanced lighting */}
        <ambientLight intensity={3.0} />
        {/* Multiple directional lights from all angles for ultra bright balanced brightness */}
        <directionalLight position={[3, 3, 3]} intensity={2.0} />
        <directionalLight position={[-3, 3, 3]} intensity={2.0} />
        <directionalLight position={[3, -3, 3]} intensity={1.8} />
        <directionalLight position={[-3, -3, 3]} intensity={1.8} />
        <directionalLight position={[0, 4, 0]} intensity={1.9} />
        <directionalLight position={[0, -4, 0]} intensity={1.6} />
        <directionalLight position={[4, 0, 0]} intensity={1.9} />
        <directionalLight position={[-4, 0, 0]} intensity={1.9} />
        <directionalLight position={[0, 0, 4]} intensity={1.8} />
        <directionalLight position={[0, 0, -4]} intensity={1.8} />
        <Suspense fallback={null}>
          <RotatingGlobe size={0.95} />
        </Suspense>
      </Canvas>
    </div>
  );
}

