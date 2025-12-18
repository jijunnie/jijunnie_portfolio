/**
 * Visited regions data structure
 * Each entry contains region information and visit status
 */
export const visitedRegions = {
  // Countries
  'United States': {
    name: 'United States',
    type: 'country',
    visited: true,
    notes: 'Born and raised. Currently studying at University of Florida.',
    color: '#10b981', // green
  },
  'China': {
    name: 'China',
    type: 'country',
    visited: true,
    notes: 'Family heritage and cultural connections.',
    color: '#10b981',
  },
  'Canada': {
    name: 'Canada',
    type: 'country',
    visited: false,
    notes: '',
    color: '#6b7280', // gray
  },
  'United Kingdom': {
    name: 'United Kingdom',
    type: 'country',
    visited: false,
    notes: '',
    color: '#6b7280',
  },
  'Japan': {
    name: 'Japan',
    type: 'country',
    visited: false,
    notes: '',
    color: '#6b7280',
  },
  'France': {
    name: 'France',
    type: 'country',
    visited: false,
    notes: '',
    color: '#6b7280',
  },
  'Germany': {
    name: 'Germany',
    type: 'country',
    visited: false,
    notes: '',
    color: '#6b7280',
  },
  'Australia': {
    name: 'Australia',
    type: 'country',
    visited: false,
    notes: '',
    color: '#6b7280',
  },
};

/**
 * Marker locations (lat/lon coordinates)
 */
export const markers = [];

/**
 * Helper function to check if a region is visited
 * Supports both country names and state/province names with country (e.g., "Florida, United States")
 */
export function isRegionVisited(regionName) {
  // Direct match
  if (visitedRegions[regionName]?.visited) {
    return true;
  }
  
  // Check if it's a state/province format "State, Country"
  const parts = regionName.split(', ');
  if (parts.length === 2) {
    // Try full format first
    if (visitedRegions[regionName]?.visited) {
      return true;
    }
    // Try alternative formats
    const [state, country] = parts;
    const altFormat = `${state}, ${country}`;
    if (visitedRegions[altFormat]?.visited) {
      return true;
    }
  }
  
  return false;
}

/**
 * Helper function to get region data
 * Supports both country names and state/province names with country (e.g., "Florida, United States")
 */
export function getRegionData(regionName) {
  // Direct match
  if (visitedRegions[regionName]) {
    return visitedRegions[regionName];
  }
  
  // Check if it's a state/province format "State, Country"
  const parts = regionName.split(', ');
  if (parts.length === 2) {
    // Try full format
    if (visitedRegions[regionName]) {
      return visitedRegions[regionName];
    }
    // Try alternative formats
    const [state, country] = parts;
    const altFormat = `${state}, ${country}`;
    if (visitedRegions[altFormat]) {
      return visitedRegions[altFormat];
    }
  }
  
  // Default fallback
  return {
    name: regionName.includes(', ') ? regionName.split(', ')[0] : regionName,
    type: regionName.includes(', ') ? 'state' : 'country',
    visited: false,
    notes: '',
    color: '#6b7280',
  };
}

