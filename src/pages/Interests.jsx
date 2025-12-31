import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import { Lock } from 'lucide-react';

// 远程资源基础 URL
const REMOTE_BASE_URL = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/';

// 辅助函数：将本地模型/动画路径转换为远程 URL
const getRemoteModelUrl = (localPath) => {
  if (!localPath) return localPath;
  // 提取文件名（去除前导斜杠和目录）
  const fileName = localPath.replace(/^\/[^\/]+\//, '').replace(/^\//, '');
  return `${REMOTE_BASE_URL}${fileName}`;
};

// 修复纹理路径：将远程URL转换为本地路径
// 使用WeakSet来跟踪已经修复过的场景，防止重复修复
const fixedScenes = new WeakSet();

const fixTexturePaths = (scene) => {
  if (!scene || fixedScenes.has(scene)) return; // 已经修复过，跳过
  fixedScenes.add(scene);
  
  scene.traverse((child) => {
    if (child.isMesh && child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      
      materials.forEach((material) => {
        const textureProperties = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'];
        
        textureProperties.forEach((prop) => {
          if (material[prop]) {
            const texture = material[prop];
            const currentSrc = texture.image?.src || texture.image?.currentSrc || texture.source?.data?.src;
            
            // 检查是否是错误的远程路径（包含mixamo-mini或r2.dev/home）
            if (currentSrc && (
              currentSrc.includes('mixamo-mini') ||
              currentSrc.includes('r2.dev/home') ||
              currentSrc.includes('.fbm/')
            )) {
              // 直接移除无效纹理，使用默认材质（避免异步加载导致的问题）
              material[prop] = null;
              material.needsUpdate = true;
            }
          }
        });
      });
    }
  });
};


// 3D Avatar Component
function Avatar({ animationPath = getRemoteModelUrl('/animations/Singing.fbx'), scale = 1.5, position = [0, -0.5, 0] }) {
  const group = useRef();
  const mixer = useRef();
  const currentActionRef = useRef();
  const { scene: baseAvatar } = useGLTF(getRemoteModelUrl('/models/avatar.glb'));
  const fbx = useFBX(animationPath);

  useEffect(() => {
    // 修复纹理路径（如果模型已加载）- 只执行一次
    if (baseAvatar) {
      fixTexturePaths(baseAvatar);
    }
  }, [baseAvatar]);

  const clonedAvatar = useMemo(() => {
    if (!baseAvatar) return null;
    const cloned = SkeletonUtils.clone(baseAvatar);
    
    // 修复克隆场景中的纹理路径
    fixTexturePaths(cloned);
    
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
        if (child.material) {
          child.material = child.material.clone();
          child.material.needsUpdate = true;
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
    
    // Add null check to prevent "Activity" error
    if (!newAction) return;
    
    newAction.setLoop(THREE.LoopRepeat);
    newAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.3).play();
    currentActionRef.current = newAction;
  }, [animationPath, fbx.animations]);

  useFrame((state, delta) => {
    // Add comprehensive null checks to prevent "Activity" errors
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
    <group ref={group} position={position} scale={scale}>
      <primitive object={clonedAvatar} />
    </group>
  );
}

useGLTF.preload(getRemoteModelUrl('/models/avatar.glb'));

export default function Interests() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Resize handler
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    // Initial set
    updateDimensions();
    
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Memoized responsive values
  const responsive = useMemo(() => {
    const isMobile = dimensions.width < 640;
    const isTablet = dimensions.width >= 640 && dimensions.width < 1024;

    return {
      avatarScale: isMobile ? 0.8 : isTablet ? 1.0 : 1.2,
      avatarPosition: isMobile ? [0, -1.0, 0] : isTablet ? [0, -1.2, 0] : [0, -1.4, 0],
      cameraPosition: isMobile ? [0, 0.8, 3.5] : isTablet ? [0, 0.9, 4] : [0, 1, 4.5],
      cameraFov: isMobile ? 55 : isTablet ? 52 : 50,
    };
  }, [dimensions.width]);

  return (
    <section className="fixed inset-0 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 overflow-hidden">
      {/* Gray Overlay with Lock Icon and Message */}
      <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
        <div className="text-center px-4">
          <Lock className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-6" />
          <p className="text-gray-300 text-lg sm:text-xl md:text-2xl font-medium">
            The Music Page is revamping, please check back later!
          </p>
        </div>
      </div>

      {/* 3D Avatar with Singing Animation */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="w-full h-full max-w-3xl overflow-hidden">
          <Canvas
            camera={{ position: responsive.cameraPosition, fov: responsive.cameraFov }}
            gl={{
              antialias: true,
              alpha: true,
              premultipliedAlpha: false,
              powerPreference: "high-performance"
            }}
            style={{ background: 'transparent' }}
          >
            {/* Avatar Lighting */}
            <ambientLight intensity={2} />
            <directionalLight position={[5, 10, 5]} intensity={3} />
            <directionalLight position={[0, 5, 10]} intensity={2.5} />
            <directionalLight position={[-5, 8, -5]} intensity={1.8} color="#a5b4fc" />
            <pointLight position={[10, 3, 5]} intensity={2} color="#fbbf24" />
            <pointLight position={[-10, 3, 5]} intensity={2} color="#60a5fa" />
            <hemisphereLight skyColor="#ffffff" groundColor="#666666" intensity={1.8} />
            
            <Suspense fallback={null}>
              <Avatar scale={responsive.avatarScale} position={responsive.avatarPosition} />
            </Suspense>
            <OrbitControls
              enableZoom={false}
              minPolarAngle={Math.PI / 3.5}
              maxPolarAngle={Math.PI / 2}
              enableDamping
              dampingFactor={0.05}
              enablePan={false}
            />
          </Canvas>
        </div>
      </div>
    </section>
  );
}
