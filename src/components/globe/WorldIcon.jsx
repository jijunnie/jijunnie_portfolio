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
        roughness={0.7}
        metalness={0.0}
        emissive={0x4a90e2}
        emissiveIntensity={0.25}
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
  const [canvasKey, setCanvasKey] = React.useState(0);
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);
  
  // Handle window resize for responsive sizing
  React.useEffect(() => {
    const handleResize = () => {
      setScreenSize(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle visibility change and WebGL context loss to ensure globe always renders
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Force re-render when tab becomes visible
        setTimeout(() => {
          setCanvasKey(prev => prev + 1);
        }, 100);
      }
    };
    
    const handleContextLost = (e) => {
      e.preventDefault();
      // Force re-render on context loss
      setCanvasKey(prev => prev + 1);
    };
    
    const handleContextRestored = () => {
      // Force re-render when context is restored
      setCanvasKey(prev => prev + 1);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Find canvas element in the container
    const findCanvas = () => {
      if (containerRef.current) {
        const canvas = containerRef.current.querySelector('canvas');
        if (canvas) {
          canvasRef.current = canvas;
          canvas.addEventListener('webglcontextlost', handleContextLost);
          canvas.addEventListener('webglcontextrestored', handleContextRestored);
          return canvas;
        }
      }
      return null;
    };
    
    // Try to find canvas immediately and also after a short delay
    let canvas = findCanvas();
    const findCanvasTimeout = setTimeout(() => {
      canvas = findCanvas();
    }, 100);
    
    // Periodic check to ensure canvas is still rendering
    const checkInterval = setInterval(() => {
      if (canvasRef.current) {
        const gl = canvasRef.current.getContext('webgl') || canvasRef.current.getContext('webgl2');
        if (!gl || gl.isContextLost()) {
          setCanvasKey(prev => prev + 1);
        }
      } else {
        // Try to find canvas again if not found
        findCanvas();
      }
    }, 5000); // Check every 5 seconds
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(findCanvasTimeout);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('webglcontextlost', handleContextLost);
        canvasRef.current.removeEventListener('webglcontextrestored', handleContextRestored);
      }
      clearInterval(checkInterval);
    };
  }, [canvasKey]); // Re-run when canvasKey changes to re-attach listeners
  
  // Calculate responsive size: base size is responsive to screen size
  // On hover, scale up from 0.8x to 1x using transform for center expansion
  const scaleFactor = screenSize < 640 ? 0.7 : screenSize < 1024 ? 0.85 : 1.0;
  const baseSize = size * scaleFactor;
  const scale = isHovered ? 1.0 : 0.8;
  
  return (
    <div 
      ref={containerRef}
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
        key={canvasKey}
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false
        }}
        onCreated={({ gl, scene, camera }) => {
          // Ensure WebGL context is properly initialized
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          // Store canvas reference
          const canvas = gl.domElement;
          if (canvas) {
            canvasRef.current = canvas;
          }
        }}
        style={{ width: '100%', height: '100%', transformOrigin: 'center center' }}
      >
        {/* Bright but soft lighting to avoid white dots */}
        <ambientLight intensity={4.8} />
        {/* Hemisphere light for soft directional brightness without harsh highlights */}
        <hemisphereLight 
          skyColor={0xffffff} 
          groundColor={0x888888} 
          intensity={3.0} 
        />
        {/* Very soft directional lights from multiple angles with low intensity */}
        <directionalLight position={[5, 5, 5]} intensity={1.0} />
        <directionalLight position={[-5, 5, 5]} intensity={1.0} />
        <directionalLight position={[0, 0, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <RotatingGlobe size={0.95} />
        </Suspense>
      </Canvas>
    </div>
  );
}

