import React, { useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as topojson from 'topojson-client';
import { getRegionData, isRegionVisited } from '../../data/visitedRegions';

// Simple sphere projection - filled regions slightly closer than borders for better hover detection
function project(lat, lon, radius = 1.651) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

export default function FilledRegions({ onRegionClick, selectedRegion, hoveredRegion, setHoveredRegion, globeRotationRef, isGlobeHovered }) {
  const [countriesTopology, setCountriesTopology] = useState(null);
  const [usStatesData, setUsStatesData] = useState(null);
  const [chinaProvincesData, setChinaProvincesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const groupRef = React.useRef();
  const hoverTimeoutRef = React.useRef(null);

  // Load TopoJSON/GeoJSON data for countries, US states, and China provinces
  React.useEffect(() => {
    Promise.all([
      // Countries
      fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .catch(err => {
          console.error('Failed to load countries TopoJSON:', err);
          return null;
        }),
      // US States
      fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .catch(() => null),
      // China Provinces - use same source as Borders
      fetch('https://raw.githubusercontent.com/longwosion/geojson-map-china/master/china.json')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .catch(() => {
          // Alternative source for China
          return fetch('https://raw.githubusercontent.com/deldersveld/topojson/master/countries/china/china-provinces.json')
            .then(res => res.ok ? res.json() : null)
            .catch(() => null);
        })
    ]).then(([countries, usStates, china]) => {
      setCountriesTopology(countries);
      setUsStatesData(usStates);
      setChinaProvincesData(china);
      setLoading(false);
    });
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to process a single region
  const processRegion = (feature, regionName, regions, countryName = null) => {
    const fullRegionName = countryName ? `${regionName}, ${countryName}` : regionName;
    const isVisited = isRegionVisited(fullRegionName);
    const isSelected = selectedRegion === fullRegionName;
    const isHovered = hoveredRegion === fullRegionName;

    // Process coordinates based on geometry type
    if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates.forEach((ring, ringIndex) => {
        if (ringIndex === 0) { // Only outer ring
          const vertices = ring.map(([lon, lat]) => {
            const [x, y, z] = project(lat, lon);
            return { x, y, z };
          });

          if (vertices.length < 3) return;

          const positions = [];
          const indices = [];
          
          vertices.forEach(v => {
            positions.push(v.x, v.y, v.z);
          });

          for (let i = 1; i < vertices.length - 1; i++) {
            indices.push(0, i, i + 1);
          }

          if (positions.length > 0 && indices.length > 0) {
            regions.push({
              key: `region-${fullRegionName}-${ringIndex}`,
              positions,
              indices,
              regionName: fullRegionName,
              displayName: regionName,
              countryName: countryName || regionName,
              isVisited,
              isSelected,
              isHovered,
            });
          }
        }
      });
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach((polygon, polyIndex) => {
        polygon.forEach((ring, ringIndex) => {
          if (ringIndex === 0) { // Only outer ring
            const vertices = ring.map(([lon, lat]) => {
              const [x, y, z] = project(lat, lon);
              return { x, y, z };
            });

            if (vertices.length < 3) return;

            const positions = [];
            const indices = [];
            
            vertices.forEach(v => {
              positions.push(v.x, v.y, v.z);
            });

            for (let i = 1; i < vertices.length - 1; i++) {
              indices.push(0, i, i + 1);
            }

            if (positions.length > 0 && indices.length > 0) {
              regions.push({
                key: `region-${fullRegionName}-${polyIndex}-${ringIndex}`,
                positions,
                indices,
                regionName: fullRegionName,
                displayName: regionName,
                countryName: countryName || regionName,
                isVisited,
                isSelected,
                isHovered,
              });
            }
          }
        });
      });
    }
  };

  // Process filled regions
  const regions = useMemo(() => {
    const regions = [];

    // Process countries
    if (countriesTopology) {
      const countries = topojson.feature(countriesTopology, countriesTopology.objects.countries);
      countries.features.forEach((feature, index) => {
        const countryName = feature.properties.NAME || feature.properties.name || `Country ${index}`;
        processRegion(feature, countryName, regions);
      });
    }

    // Process US States
    if (usStatesData) {
      let usFeatures;
      if (usStatesData.type === 'Topology' && usStatesData.objects) {
        const usObject = usStatesData.objects.states || Object.values(usStatesData.objects)[0];
        if (usObject) {
          usFeatures = topojson.feature(usStatesData, usObject);
        }
      } else if (usStatesData.type === 'FeatureCollection') {
        usFeatures = usStatesData;
      }
      
      if (usFeatures && usFeatures.features) {
        usFeatures.features.forEach((feature) => {
          const props = feature.properties || {};
          const stateName = props.name || props.NAME || 'Unknown State';
          processRegion(feature, stateName, regions, 'United States');
        });
      }
    }

    // Process China Provinces
    if (chinaProvincesData) {
      let chinaFeatures;
      if (chinaProvincesData.type === 'Topology' && chinaProvincesData.objects) {
        const chinaObject = chinaProvincesData.objects.provinces 
          || chinaProvincesData.objects.china 
          || Object.values(chinaProvincesData.objects)[0];
        if (chinaObject) {
          chinaFeatures = topojson.feature(chinaProvincesData, chinaObject);
        }
      } else if (chinaProvincesData.type === 'FeatureCollection') {
        chinaFeatures = chinaProvincesData;
      } else if (chinaProvincesData.features) {
        chinaFeatures = chinaProvincesData;
      }
      
      if (chinaFeatures && chinaFeatures.features) {
        chinaFeatures.features.forEach((feature) => {
          const props = feature.properties || {};
          const provinceName = props.name || props.NAME || props.province 
            || props.NAME_CHN || props.NAME_EN || props.name_zh || props.name_en || 'Unknown Province';
          processRegion(feature, provinceName, regions, 'China');
        });
      }
    }

    return regions;
  }, [countriesTopology, usStatesData, chinaProvincesData, selectedRegion, hoveredRegion]);

  // Rotate regions with the globe (stops when globe is hovered)
  useFrame(() => {
    if (groupRef.current && globeRotationRef?.current !== undefined && !isGlobeHovered) {
      groupRef.current.rotation.y = globeRotationRef.current;
    } else if (groupRef.current && globeRotationRef?.current !== undefined) {
      groupRef.current.rotation.y = globeRotationRef.current;
    }
  });


  // Pre-compute geometries for all regions
  const regionGeometries = useMemo(() => {
    if (!regions || regions.length === 0) return new Map();
    
    const geometries = new Map();
    regions.forEach((region) => {
      try {
        const geom = new THREE.BufferGeometry();
        const positionArray = new Float32Array(region.positions);
        geom.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
        if (region.indices && region.indices.length > 0) {
          const indexArray = new Uint16Array(region.indices);
          geom.setIndex(new THREE.BufferAttribute(indexArray, 1));
        }
        geom.computeVertexNormals();
        geometries.set(region.key, geom);
      } catch (error) {
        console.warn(`Failed to create geometry for region ${region.key}:`, error);
      }
    });
    return geometries;
  }, [regions]);

  if (loading || regions.length === 0) return null;

  return (
    <group ref={groupRef}>
      {regions.map((region) => {
        const geometry = regionGeometries.get(region.key);
        if (!geometry) return null;

        // Green for visited regions, blue for selected, gray for others
        const color = region.isSelected
          ? '#3b82f6' // blue for selected
          : region.isVisited
          ? '#059669' // darker green for visited regions
          : '#4b5563'; // gray for non-visited regions

        const opacity = region.isSelected
          ? 0.5
          : region.isVisited
          ? 0.3 // Higher opacity for visited regions to make green more visible
          : 0.12; // Lower opacity for non-visited regions

        // Stable hover handlers with debouncing
        const handlePointerOver = (e) => {
          e.stopPropagation();
          // Clear any pending timeout
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          // Immediately set hover state for instant feedback
          setHoveredRegion(region.regionName);
          document.body.style.cursor = 'pointer';
        };

        const handlePointerOut = (e) => {
          e.stopPropagation();
          // Clear any pending timeout
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          // Small delay before clearing hover to prevent flickering
          hoverTimeoutRef.current = setTimeout(() => {
            // Only clear if we're not hovering over another region
            if (hoveredRegion === region.regionName) {
              setHoveredRegion(null);
              document.body.style.cursor = 'default';
            }
          }, 50);
        };

        return (
          <mesh
            key={region.key}
            geometry={geometry}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={(e) => {
              e.stopPropagation();
              // Clear timeout on click
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
              if (onRegionClick) {
                onRegionClick(region.regionName);
              }
            }}
          >
            <meshStandardMaterial
              color={color}
              transparent
              opacity={opacity}
              emissive={region.isVisited && !region.isSelected ? '#059669' : '#000000'}
              emissiveIntensity={region.isVisited && !region.isSelected ? 0.3 : 0} // Subtle glow for visited regions
              side={THREE.DoubleSide}
              // Ensure material is visible and catches pointer events
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

