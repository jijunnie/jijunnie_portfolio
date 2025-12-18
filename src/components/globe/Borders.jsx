import React, { useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as topojson from 'topojson-client';
import { getRegionData, isRegionVisited } from '../../data/visitedRegions';

// Simple sphere projection
function project(lat, lon, radius = 1.66) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

export default function Borders({ onRegionClick, selectedRegion, hoveredRegion, setHoveredRegion, globeRotationRef, isGlobeHovered }) {
  const [countriesTopology, setCountriesTopology] = useState(null);
  const [usStatesData, setUsStatesData] = useState(null);
  const [canadaProvincesData, setCanadaProvincesData] = useState(null);
  const [chinaProvincesData, setChinaProvincesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const groupRef = React.useRef();

  // Load TopoJSON/GeoJSON data for countries and specific states/provinces
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
      // US States - using us-atlas package
      fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .catch(() => {
          // Fallback for US states
          return fetch('https://raw.githubusercontent.com/d3/d3-geo/master/test/data/us-states.json')
            .then(res => res.ok ? res.json() : null)
            .catch(() => null);
        }),
      // Canada Provinces
      fetch('https://raw.githubusercontent.com/deldersveld/topojson/master/countries/canada/canada-provinces.json')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .catch(() => {
          // Alternative source for Canada
          return fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries/CAN.geo.json')
            .then(res => res.ok ? res.json() : null)
            .catch(() => null);
        }),
      // China Provinces
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
    ]).then(([countries, usStates, canada, china]) => {
      setCountriesTopology(countries);
      setUsStatesData(usStates);
      setCanadaProvincesData(canada);
      setChinaProvincesData(china);
      setLoading(false);
    });
  }, []);

  // Process borders for both countries and states/provinces
  const borders = useMemo(() => {
    const borders = [];

    // Process country borders
    if (countriesTopology) {
      const countries = topojson.feature(countriesTopology, countriesTopology.objects.countries);
      
      countries.features.forEach((feature, index) => {
        const coordinates = feature.geometry.coordinates;
        const countryName = feature.properties.NAME || feature.properties.name || `Country ${index}`;
        const isVisited = isRegionVisited(countryName);
        const isSelected = selectedRegion === countryName;
        const isHovered = hoveredRegion === countryName;

        // Process coordinates based on geometry type
        if (feature.geometry.type === 'Polygon') {
          coordinates.forEach(ring => {
            const points = ring.map(([lon, lat]) => project(lat, lon, 1.66)); // Slightly above globe
            borders.push({
              key: `country-${countryName}-${borders.length}`,
              points,
              regionName: countryName,
              type: 'country',
              isVisited,
              isSelected,
              isHovered,
            });
          });
        } else if (feature.geometry.type === 'MultiPolygon') {
          coordinates.forEach(polygon => {
            polygon.forEach(ring => {
              const points = ring.map(([lon, lat]) => project(lat, lon, 1.66));
              borders.push({
                key: `country-${countryName}-${borders.length}`,
                points,
                regionName: countryName,
                type: 'country',
                isVisited,
                isSelected,
                isHovered,
              });
            });
          });
        }
      });
    }

    // Helper function to process state/province borders
    const processStateProvinceBorders = (data, countryName, countryCode) => {
      if (!data) return;
      
      let features;
      
      // Handle TopoJSON format
      if (data.type === 'Topology' && data.objects) {
        // Try different object names
        const objKey = data.objects.states 
          || data.objects.provinces 
          || data.objects['admin_1_states_provinces']
          || Object.keys(data.objects)[0];
        
        if (objKey && data.objects[objKey]) {
          features = topojson.feature(data, data.objects[objKey]);
        }
      } else if (data.type === 'FeatureCollection') {
        // Already in GeoJSON format
        features = data;
      } else if (data.features) {
        // Direct features array
        features = data;
      }
      
      if (features && features.features) {
        features.features.forEach((feature, index) => {
          const coordinates = feature.geometry.coordinates;
          const props = feature.properties || {};
          
          // Extract name based on common property names
          const regionName = props.name || props.NAME || props.NAME_1 || props.name_en 
            || props.NAME_CHN || props.province || props.state || `Region ${index}`;
          
          // Only process if it belongs to the target country
          const featureCountry = props.country || props.country_code || props.ADMIN || props.NAME_EN || '';
          const isTargetCountry = countryCode 
            ? (featureCountry.toLowerCase().includes(countryCode.toLowerCase()) || 
               props.adm0_a3 === countryCode)
            : true;
          
          if (!isTargetCountry && countryCode) return;
          
          // Process coordinates based on geometry type
          if (feature.geometry.type === 'Polygon') {
            coordinates.forEach(ring => {
              const points = ring.map(([lon, lat]) => project(lat, lon, 1.655));
              const fullRegionName = `${regionName}, ${countryName}`;
              borders.push({
                key: `state-${countryCode}-${regionName}-${borders.length}`,
                points,
                regionName: fullRegionName,
                type: 'state',
                stateName: regionName,
                countryName,
                isVisited: isRegionVisited(fullRegionName),
                isSelected: selectedRegion === fullRegionName,
                isHovered: hoveredRegion === fullRegionName,
              });
            });
          } else if (feature.geometry.type === 'MultiPolygon') {
            coordinates.forEach(polygon => {
              polygon.forEach(ring => {
                const points = ring.map(([lon, lat]) => project(lat, lon, 1.655));
                borders.push({
                  key: `state-${countryCode}-${regionName}-${borders.length}`,
                  points,
                  regionName: `${regionName}, ${countryName}`,
                  type: 'state',
                  stateName: regionName,
                  countryName,
                  isVisited: false,
                  isSelected: false,
                  isHovered: false,
                });
              });
            });
          }
        });
      }
    };

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
          const coordinates = feature.geometry.coordinates;
          const props = feature.properties || {};
          const stateName = props.name || props.NAME || 'Unknown State';
          
          const processRing = (ring) => {
            const points = ring.map(([lon, lat]) => project(lat, lon, 1.655));
            const fullRegionName = `${stateName}, United States`;
            borders.push({
              key: `us-state-${stateName}-${borders.length}`,
              points,
              regionName: fullRegionName,
              type: 'state',
              stateName,
              countryName: 'United States',
              isVisited: isRegionVisited(fullRegionName),
              isSelected: selectedRegion === fullRegionName,
              isHovered: hoveredRegion === fullRegionName,
            });
          };
          
          if (feature.geometry.type === 'Polygon') {
            coordinates.forEach(processRing);
          } else if (feature.geometry.type === 'MultiPolygon') {
            coordinates.forEach(polygon => polygon.forEach(processRing));
          }
        });
      }
    }

    // Process Canada Provinces
    processStateProvinceBorders(canadaProvincesData, 'Canada', 'CAN');

    // Process China Provinces - handle different GeoJSON structure
    if (chinaProvincesData) {
      let chinaFeatures;
      
      // Handle TopoJSON
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
          const coordinates = feature.geometry.coordinates;
          const props = feature.properties || {};
          const provinceName = props.name || props.NAME || props.province 
            || props.NAME_CHN || props.NAME_EN || 'Unknown Province';
          
          const processRing = (ring) => {
            const points = ring.map(([lon, lat]) => project(lat, lon, 1.655));
            const fullRegionName = `${provinceName}, China`;
            borders.push({
              key: `china-province-${provinceName}-${borders.length}`,
              points,
              regionName: fullRegionName,
              type: 'state',
              stateName: provinceName,
              countryName: 'China',
              isVisited: isRegionVisited(fullRegionName),
              isSelected: selectedRegion === fullRegionName,
              isHovered: hoveredRegion === fullRegionName,
            });
          };
          
          if (feature.geometry.type === 'Polygon') {
            coordinates.forEach(processRing);
          } else if (feature.geometry.type === 'MultiPolygon') {
            coordinates.forEach(polygon => polygon.forEach(processRing));
          }
        });
      }
    }

    return borders;
  }, [countriesTopology, usStatesData, canadaProvincesData, chinaProvincesData, selectedRegion, hoveredRegion]);

  // Rotate borders with the globe (stops when globe is hovered)
  useFrame(() => {
    if (groupRef.current && globeRotationRef?.current !== undefined && !isGlobeHovered) {
      groupRef.current.rotation.y = globeRotationRef.current;
    } else if (groupRef.current && globeRotationRef?.current !== undefined) {
      // Keep current rotation when hovered (don't update)
      groupRef.current.rotation.y = globeRotationRef.current;
    }
  });

  if (loading) return null;

  return (
    <group ref={groupRef}>
      {borders.map((border) => {
        // Different styling for countries vs states/provinces
        const isCountry = border.type === 'country';
        
        // Check if this border's region is currently hovered (from filled region or border hover)
        const isCurrentlyHovered = hoveredRegion === border.regionName;
        
        // Only highlight when hovered (from filled region hover), no default highlighting
        const color = border.isSelected
          ? '#3b82f6' // blue for selected
          : isCurrentlyHovered
          ? '#8b5cf6' // purple for hovered
          : isCountry
          ? '#64748b' // darker gray for countries (less visible)
          : '#94a3b8'; // darker gray for states/provinces (less visible)

        const lineWidth = border.isSelected 
          ? (isCountry ? 3.5 : 2.5)
          : isCurrentlyHovered 
          ? (isCountry ? 3 : 2.5) // Thicker for hovered
          : (isCountry ? 1.2 : 0.9); // Thinner, less visible default lines for all borders

        // Only make countries clickable, not states/provinces
        const isClickable = border.type === 'country';
        
        // For state/province borders, show highlight when hovered via filled region
        if (!isClickable) {
          return (
            <group key={border.key}>
              <Line
                points={border.points}
                color={color}
                lineWidth={lineWidth}
              />
            </group>
          );
        }
        
        return (
          <Line
            key={border.key}
            points={border.points}
            color={color}
            lineWidth={lineWidth}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredRegion(border.regionName);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredRegion(null);
              document.body.style.cursor = 'default';
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (onRegionClick) {
                onRegionClick(border.regionName);
              }
            }}
          />
        );
      })}
    </group>
  );
}

