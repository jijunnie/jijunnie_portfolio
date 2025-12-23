import { lazy, Suspense } from 'react';

// Lazy load Spline to reduce initial bundle size (4.5MB library)
const Spline = lazy(() => import('@splinetool/react-spline').then(module => ({ default: module.default })));

export default function SplineIcon({ sceneUrl, isHovered }) {
  return (
    <div className="w-full h-full">
      <Suspense fallback={<div className="w-full h-full bg-gray-200/20 animate-pulse" />}>
        <Spline 
          scene={sceneUrl}
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>
    </div>
  );
}

