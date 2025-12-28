import React, { useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// 3D Icon Component for GLB files
function Icon3D({ url, index, totalIcons, isHovered }) {
  const { scene } = useGLTF(url);
  const groupRef = React.useRef();
  const timeRef = React.useRef(0);
  
  // Clone and enhance the scene - increase brightness
  const clonedScene = React.useMemo(() => {
    if (!scene) return null;
    const cloned = scene.clone();
    cloned.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat.color) {
            // Increase brightness by making colors lighter
            const color = mat.color.clone();
            // Brighten the color by mixing with white
            color.r = Math.min(1, color.r * 1.3);
            color.g = Math.min(1, color.g * 1.3);
            color.b = Math.min(1, color.b * 1.3);
            mat.color = color;
          }
          // Remove emissive to avoid white dots
          mat.emissive = new THREE.Color(0, 0, 0);
          mat.emissiveIntensity = 0;
          // Adjust material properties for better brightness and reflectivity
          mat.metalness = Math.min(mat.metalness || 0.4, 0.6);
          mat.roughness = Math.max(mat.roughness || 0.5, 0.2);
          // Increase overall brightness
          if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
            mat.envMapIntensity = 1.5;
          }
        });
      }
    });
    return cloned;
  }, [scene]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    timeRef.current += delta;
    const time = timeRef.current;
    
    // Gentle floating animation
    const delay = (index / totalIcons) * Math.PI * 2;
    const floatY = Math.sin(time * 0.8 + delay) * 0.1;
    
    // Gentle rotation
    groupRef.current.rotation.y = Math.sin(time * 0.5 + delay) * 0.1;
    groupRef.current.rotation.x = Math.cos(time * 0.4 + delay) * 0.05;
    
    // Floating position
    groupRef.current.position.y = floatY;
    
    // Scale for hover
    const baseScale = 0.6;
    const hoverScale = isHovered ? 1.2 : 1;
    groupRef.current.scale.setScalar(baseScale * hoverScale);
  });

  if (!clonedScene) return null;

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

// 2D Icon Component for PNG files with 3D CSS transforms
function Icon2D({ src, index, totalIcons }) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = React.useRef();
  const animationFrameRef = React.useRef();
  const entranceProgressRef = React.useRef(0);
  const mountedRef = React.useRef(false);

  // Calculate entry direction based on index (different directions)
  const entryAngle = (index / totalIcons) * Math.PI * 2;
  const entryDistance = 150;
  const entryX = Math.cos(entryAngle) * entryDistance;
  const entryY = Math.sin(entryAngle * 0.7) * entryDistance;
  const entryZ = Math.sin(entryAngle * 1.3) * 50;

  React.useEffect(() => {
    mountedRef.current = true;
    // Start entrance animation
    const startTime = Date.now();
    const duration = 1500 + (index * 100); // Staggered entrance
    
    const animateEntrance = () => {
      if (!mountedRef.current) return;
      const elapsed = Date.now() - startTime;
      entranceProgressRef.current = Math.min(elapsed / duration, 1);
      
      // Ease out cubic for smooth entrance
      const eased = 1 - Math.pow(1 - entranceProgressRef.current, 3);
      entranceProgressRef.current = eased;
      
      if (entranceProgressRef.current < 1) {
        requestAnimationFrame(animateEntrance);
      }
    };
    
    animateEntrance();
  }, [index]);

  React.useEffect(() => {
    let time = 0;
    
    const animate = () => {
      time += 0.01;
      const delay = (index / totalIcons) * Math.PI * 2;
      
      // Entrance animation - flow in from different directions
      const entranceEase = entranceProgressRef.current;
      const currentX = entryX * (1 - entranceEase);
      const currentY = entryY * (1 - entranceEase);
      const currentZ = entryZ * (1 - entranceEase);
      
      // Continuous 3D movement in space
      const moveX = Math.sin(time * 0.6 + delay) * 15;
      const moveY = Math.sin(time * 0.8 + delay * 1.2) * 20;
      const moveZ = Math.cos(time * 0.7 + delay * 0.8) * 10;
      
      // 3D rotations
      const rotateY = Math.sin(time * 0.5 + delay) * 8;
      const rotateX = Math.cos(time * 0.4 + delay) * 5;
      const rotateZ = Math.sin(time * 0.3 + delay * 0.5) * 3;
      
      if (containerRef.current) {
        const scale = (isHovered ? 1.15 : 1) * entranceEase;
        containerRef.current.style.transform = `
          translate3d(${currentX + moveX}px, ${currentY + moveY}px, ${currentZ + moveZ}px)
          rotateY(${rotateY}deg)
          rotateX(${rotateX}deg)
          rotateZ(${rotateZ}deg)
          scale(${scale})
        `;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      mountedRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [index, totalIcons, isHovered, entryX, entryY, entryZ]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        willChange: 'transform',
      }}
    >
      <img
        src={src}
        alt=""
        style={{
          width: '80%',
          height: '80%',
          objectFit: 'contain',
          filter: isHovered 
            ? 'brightness(1.2) contrast(1.1) drop-shadow(0 8px 24px rgba(0,0,0,0.3))' 
            : 'brightness(1.05) contrast(1.05) drop-shadow(0 4px 16px rgba(0,0,0,0.2))',
          transition: 'filter 0.3s ease-out',
        }}
      />
    </div>
  );
}

// Icon Item Wrapper Component with animation
function IconItem({ icon, index, size, centerX, centerY, finalX, finalY, animationProgress }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate current position based on animation progress
  // Phase 1 (0-0.4): Rotate and fade in at center
  // Phase 2 (0.4-1): Spread out to final position
  const phase1End = 0.4;
  const phase2Start = 0.4;
  
  let currentX, currentY, currentOpacity, currentRotation, currentScale;
  
  if (animationProgress <= phase1End) {
    // Phase 1: At center, rotating and fading in
    const phase1Progress = animationProgress / phase1End;
    currentX = centerX;
    currentY = centerY;
    currentOpacity = phase1Progress;
    currentRotation = phase1Progress * 360; // Full rotation during fade in
    currentScale = 0.3 + (phase1Progress * 0.7); // Scale from 0.3 to 1
  } else {
    // Phase 2: Spreading out
    const phase2Progress = (animationProgress - phase2Start) / (1 - phase2Start);
    // Ease out for smooth spread
    const easedProgress = 1 - Math.pow(1 - phase2Progress, 3);
    currentX = centerX + (finalX - centerX) * easedProgress;
    currentY = centerY + (finalY - centerY) * easedProgress;
    currentOpacity = 1;
    currentRotation = 360; // Stop rotating after phase 1
    currentScale = 1;
  }
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: size,
        height: size,
        position: 'absolute',
        left: `${currentX}px`,
        top: `${currentY}px`,
        transform: `translate(-50%, -50%) rotate(${currentRotation}deg) scale(${currentScale * (isHovered ? 1.2 : 1)})`,
        opacity: currentOpacity,
        cursor: 'pointer',
        transition: isHovered ? 'transform 0.3s ease-out' : 'none',
        pointerEvents: animationProgress > 0.5 ? 'auto' : 'none',
      }}
    >
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={icon.url}
          alt={icon.name || ''}
          style={{
            width: '80%',
            height: '80%',
            objectFit: 'contain',
            filter: isHovered 
              ? 'brightness(1.2) contrast(1.1) drop-shadow(0 8px 24px rgba(0,0,0,0.3))' 
              : 'brightness(1.05) contrast(1.05) drop-shadow(0 4px 16px rgba(0,0,0,0.2))',
            transition: 'filter 0.3s ease-out',
          }}
        />
      </div>
    </div>
  );
}

// Main Icon Grid Component
export default function IconGrid({ icons, windowSize }) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const containerRef = React.useRef(null);
  
  const calculateIconSize = () => {
    const screenWidth = windowSize.width;
    
    if (screenWidth < 640) {
      return 50;
    } else if (screenWidth < 768) {
      return 60;
    } else if (screenWidth < 1024) {
      return 70;
    } else if (screenWidth < 1440) {
      return 80;
    } else {
      return 90;
    }
  };

  const size = calculateIconSize();
  
  // Calculate center position and container dimensions
  // Initialize with window dimensions as fallback
  const [centerX, setCenterX] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth / 2;
    }
    return 0;
  });
  const [centerY, setCenterY] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight / 2;
    }
    return 0;
  });
  const [containerWidth, setContainerWidth] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 0;
  });
  const [containerHeight, setContainerHeight] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight;
    }
    return 0;
  });
  
  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(rect.width);
        setContainerHeight(rect.height);
        setCenterX(rect.width / 2);
        setCenterY(rect.height / 2);
      } else {
        // Fallback
        const width = window.innerWidth;
        const height = window.innerHeight;
        setContainerWidth(width);
        setContainerHeight(height);
        setCenterX(width / 2);
        setCenterY(height / 2);
      }
    };
    
    // Update immediately
    updateDimensions();
    
    // Also update after a short delay to ensure container is rendered
    const timeout = setTimeout(updateDimensions, 100);
    
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('scroll', updateDimensions);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('scroll', updateDimensions);
    };
  }, []);
  
  // Calculate final positions in honeycomb pattern around the text
  const calculateFinalPosition = (index, total) => {
    if (containerWidth === 0 || containerHeight === 0) {
      return { x: centerX, y: centerY };
    }
    
    // Estimate text area (center area to avoid)
    const textAreaWidth = Math.min(containerWidth * 0.7, 800);
    const textAreaHeight = Math.min(containerHeight * 0.5, 400);
    const padding = size * 1.5;
    const margin = size * 0.8;
    
    // Honeycomb pattern parameters
    // Hexagonal spacing: horizontal = size * sqrt(3), vertical = size * 1.5
    const hexHorizontalSpacing = size * Math.sqrt(3);
    const hexVerticalSpacing = size * 1.5;
    
    // Available area for honeycomb pattern
    const availableWidth = containerWidth - margin * 2;
    const availableHeight = containerHeight - margin * 2;
    
    // Calculate how many hexagons fit
    const colsPerRow = Math.floor(availableWidth / hexHorizontalSpacing);
    const rows = Math.ceil(total / colsPerRow);
    
    // Calculate honeycomb position
    const row = Math.floor(index / colsPerRow);
    const col = index % colsPerRow;
    
    // Honeycomb offset: every other row is offset by half a hexagon width
    const rowOffset = (row % 2) * (hexHorizontalSpacing / 2);
    
    // Calculate base position
    let x = margin + (col * hexHorizontalSpacing) + rowOffset + hexHorizontalSpacing / 2;
    let y = margin + (row * hexVerticalSpacing) + hexVerticalSpacing / 2;
    
    // Ensure icons are outside the text area
    const textLeft = centerX - textAreaWidth / 2;
    const textRight = centerX + textAreaWidth / 2;
    const textTop = centerY - textAreaHeight / 2;
    const textBottom = centerY + textAreaHeight / 2;
    
    // If icon is inside text area, move it outside
    if (x > textLeft && x < textRight && y > textTop && y < textBottom) {
      // Find closest edge and move icon outside
      const distToLeft = x - textLeft;
      const distToRight = textRight - x;
      const distToTop = y - textTop;
      const distToBottom = textBottom - y;
      
      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      
      if (minDist === distToLeft) {
        x = textLeft - padding;
      } else if (minDist === distToRight) {
        x = textRight + padding;
      } else if (minDist === distToTop) {
        y = textTop - padding;
      } else {
        y = textBottom + padding;
      }
    }
    
    // Clamp to container bounds
    x = Math.max(margin + size / 2, Math.min(containerWidth - margin - size / 2, x));
    y = Math.max(margin + size / 2, Math.min(containerHeight - margin - size / 2, y));
    
    return { x, y };
  };
  
  // Start animation when component mounts
  React.useEffect(() => {
    // Wait a bit for dimensions to be calculated
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const duration = 2000; // 2 seconds total animation
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setAnimationProgress(progress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }, 500); // Wait for container dimensions to be set
    
    return () => clearTimeout(timeout);
  }, [containerWidth, containerHeight]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      {icons.map((icon, index) => {
        const finalPos = calculateFinalPosition(index, icons.length);
        
        return (
          <IconItem
            key={index}
            icon={icon}
            index={index}
            size={`${size}px`}
            centerX={centerX}
            centerY={centerY}
            finalX={finalPos.x}
            finalY={finalPos.y}
            animationProgress={animationProgress}
          />
        );
      })}
    </div>
  );
}

