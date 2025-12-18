import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Globe from '../components/globe/Globe';
import Borders from '../components/globe/Borders';
import FilledRegions from '../components/globe/FilledRegions';
import Marker from '../components/globe/Marker';
import InfoPanel from '../components/globe/InfoPanel';
import RotatingBackground from '../components/globe/RotatingBackground';
import { markers } from '../data/visitedRegions';

export default function GlobePage() {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [isGlobeHovered, setIsGlobeHovered] = useState(false);
  const globeRotationRef = useRef(0);

  const handleRegionClick = (regionName) => {
    setSelectedRegion(regionName);
    setSelectedMarker(null);
    setInfoPanelOpen(true);
  };

  const handleMarkerClick = (markerData) => {
    setSelectedMarker(markerData);
    setSelectedRegion(null);
    setInfoPanelOpen(true);
  };

  const handleClosePanel = () => {
    setInfoPanelOpen(false);
    setSelectedRegion(null);
    setSelectedMarker(null);
  };

  return (
    <section className="fixed inset-0 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 overflow-hidden">
      {/* 3D Globe Canvas */}
      <Canvas
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, 6], fov: 50 }}
      >
        {/* Balanced Lighting with better contrast */}
        <ambientLight intensity={1.2} />
        {/* Front lights - primary light source */}
        <directionalLight position={[5, 2, 5]} intensity={3} />
        <directionalLight position={[-5, 2, 5]} intensity={2.5} />
        {/* Back lights - fill lights */}
        <directionalLight position={[5, 0, -5]} intensity={1.8} />
        <directionalLight position={[-5, 0, -5]} intensity={1.8} />
        {/* Top and bottom lights */}
        <directionalLight position={[0, 5, 0]} intensity={1.5} />
        <directionalLight position={[0, -5, 0]} intensity={1.2} />
        {/* Side lights for complete coverage */}
        <pointLight position={[10, 0, 0]} intensity={1.5} />
        <pointLight position={[-10, 0, 0]} intensity={1.5} />
        <pointLight position={[0, 0, 10]} intensity={1.5} />
        <pointLight position={[0, 0, -10]} intensity={1.2} />

        {/* Rotating Background - continues rotating even when globe is hovered */}
        <RotatingBackground />

        {/* Globe */}
        <Suspense fallback={null}>
          <Globe radius={2} rotationRef={globeRotationRef} onHoverChange={setIsGlobeHovered} />
        </Suspense>

        {/* Filled Regions - Clickable areas inside borders */}
        <Suspense fallback={null}>
          <FilledRegions
            onRegionClick={handleRegionClick}
            selectedRegion={selectedRegion}
            hoveredRegion={hoveredRegion}
            setHoveredRegion={setHoveredRegion}
            globeRotationRef={globeRotationRef}
            isGlobeHovered={isGlobeHovered}
          />
        </Suspense>

        {/* Country Borders */}
        <Suspense fallback={null}>
          <Borders
            onRegionClick={handleRegionClick}
            selectedRegion={selectedRegion}
            hoveredRegion={hoveredRegion}
            setHoveredRegion={setHoveredRegion}
            globeRotationRef={globeRotationRef}
            isGlobeHovered={isGlobeHovered}
          />
        </Suspense>

        {/* Markers */}
        <Suspense fallback={null}>
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              lat={marker.lat}
              lon={marker.lon}
              name={marker.name}
              description={marker.description}
              visited={marker.visited}
              onClick={handleMarkerClick}
              globeRotationRef={globeRotationRef}
              isGlobeHovered={isGlobeHovered}
            />
          ))}
        </Suspense>

        {/* Camera Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={10}
          autoRotate={false}
          autoRotateSpeed={0.5}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Info Panel */}
      {infoPanelOpen && (
        <InfoPanel
          region={selectedRegion}
          marker={selectedMarker}
          onClose={handleClosePanel}
        />
      )}

      {/* Instructions Overlay */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm">
          <p className="text-center">
            🖱️ Click on countries or markers to see details • 🎯 Drag to rotate • 🔍 Scroll to zoom
          </p>
        </div>
      </div>
    </section>
  );
}

