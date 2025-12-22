import Spline from '@splinetool/react-spline';

export default function SplineIcon({ sceneUrl, isHovered }) {
  return (
    <div className="w-full h-full">
      <Spline 
        scene={sceneUrl}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

