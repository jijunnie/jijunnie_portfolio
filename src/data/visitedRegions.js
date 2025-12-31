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
    visited: true,
    notes: 'Visited Vancouver, Montreal, and Toronto.',
    color: '#10b981',
  },
  'Singapore': {
    name: 'Singapore',
    type: 'country',
    visited: true,
    notes: 'Visited Singapore.',
    color: '#10b981',
  },
  'Malaysia': {
    name: 'Malaysia',
    type: 'country',
    visited: true,
    notes: 'Visited Malaysia.',
    color: '#10b981',
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
  
  // US States
  'Florida, United States': {
    name: 'Florida, United States',
    type: 'state',
    visited: true,
    isHome: true,
    notes: 'My home. Currently studying at University of Florida.',
    color: '#3b82f6', // blue for home
  },
  'Georgia, United States': {
    name: 'Georgia, United States',
    type: 'state',
    visited: true,
    notes: 'Visited Georgia.',
    color: '#10b981',
  },
  'South Carolina, United States': {
    name: 'South Carolina, United States',
    type: 'state',
    visited: true,
    notes: 'Visited South Carolina.',
    color: '#10b981',
  },
  'North Carolina, United States': {
    name: 'North Carolina, United States',
    type: 'state',
    visited: true,
    notes: 'Visited North Carolina.',
    color: '#10b981',
  },
  'New Jersey, United States': {
    name: 'New Jersey, United States',
    type: 'state',
    visited: true,
    notes: 'Visited New Jersey.',
    color: '#10b981',
  },
  'New York, United States': {
    name: 'New York, United States',
    type: 'state',
    visited: true,
    notes: 'Visited New York.',
    color: '#10b981',
  },
  'California, United States': {
    name: 'California, United States',
    type: 'state',
    visited: true,
    notes: 'Visited Los Angeles and Las Vegas area.',
    color: '#10b981',
  },
  'Nevada, United States': {
    name: 'Nevada, United States',
    type: 'state',
    visited: true,
    notes: 'Visited Las Vegas.',
    color: '#10b981',
  },
  'Texas, United States': {
    name: 'Texas, United States',
    type: 'state',
    visited: true,
    notes: 'Visited Texas.',
    color: '#10b981',
  },
  
  // Canadian Cities/Provinces
  'Vancouver, Canada': {
    name: 'Vancouver, Canada',
    type: 'city',
    visited: true,
    notes: 'Visited Vancouver.',
    color: '#10b981',
  },
  'Montreal, Canada': {
    name: 'Montreal, Canada',
    type: 'city',
    visited: true,
    notes: 'Visited Montreal.',
    color: '#10b981',
  },
  'Toronto, Canada': {
    name: 'Toronto, Canada',
    type: 'city',
    visited: true,
    notes: 'Visited Toronto.',
    color: '#10b981',
  },
  
  // Chinese Provinces/Regions - All Visited
  // Support both with and without "省" character
  '广东, China': {
    name: '广东, China',
    type: 'province',
    visited: true,
    isHometown: true,
    label: 'Visited - Hometown',
    notes: 'My hometown (家乡). Visited.',
    color: '#8b5cf6', // purple for hometown
  },
  '广东省, China': {
    name: '广东省, China',
    type: 'province',
    visited: true,
    isHometown: true,
    label: 'Visited - Hometown',
    notes: 'My hometown (家乡). Visited.',
    color: '#8b5cf6', // purple for hometown
  },
  '广西, China': {
    name: '广西, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 广西.',
    color: '#10b981',
  },
  '广西壮族自治区, China': {
    name: '广西壮族自治区, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 广西.',
    color: '#10b981',
  },
  '湖南, China': {
    name: '湖南, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 湖南.',
    color: '#10b981',
  },
  '湖南省, China': {
    name: '湖南省, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 湖南.',
    color: '#10b981',
  },
  '贵州, China': {
    name: '贵州, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 贵州.',
    color: '#10b981',
  },
  '贵州省, China': {
    name: '贵州省, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 贵州.',
    color: '#10b981',
  },
  '陕西, China': {
    name: '陕西, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 西安 (Xi\'an).',
    color: '#10b981',
  },
  '陕西省, China': {
    name: '陕西省, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 西安 (Xi\'an).',
    color: '#10b981',
  },
  '云南, China': {
    name: '云南, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 云南.',
    color: '#10b981',
  },
  '云南省, China': {
    name: '云南省, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 云南.',
    color: '#10b981',
  },
  '四川, China': {
    name: '四川, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 四川.',
    color: '#10b981',
  },
  '四川省, China': {
    name: '四川省, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 四川.',
    color: '#10b981',
  },
  '香港, China': {
    name: '香港, China',
    type: 'region',
    visited: true,
    label: 'Visited',
    notes: 'Visited 香港 (Hong Kong).',
    color: '#10b981',
  },
  '香港特别行政区, China': {
    name: '香港特别行政区, China',
    type: 'region',
    visited: true,
    label: 'Visited',
    notes: 'Visited 香港 (Hong Kong).',
    color: '#10b981',
  },
  '澳门, China': {
    name: '澳门, China',
    type: 'region',
    visited: true,
    label: 'Visited',
    notes: 'Visited 澳门 (Macau).',
    color: '#10b981',
  },
  '澳门特别行政区, China': {
    name: '澳门特别行政区, China',
    type: 'region',
    visited: true,
    label: 'Visited',
    notes: 'Visited 澳门 (Macau).',
    color: '#10b981',
  },
  '浙江, China': {
    name: '浙江, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 浙江.',
    color: '#10b981',
  },
  '浙江省, China': {
    name: '浙江省, China',
    type: 'province',
    visited: true,
    label: 'Visited',
    notes: 'Visited 浙江.',
    color: '#10b981',
  },
  '上海, China': {
    name: '上海, China',
    type: 'city',
    visited: true,
    label: 'Visited',
    notes: 'Visited 上海 (Shanghai).',
    color: '#10b981',
  },
  '上海市, China': {
    name: '上海市, China',
    type: 'city',
    visited: true,
    label: 'Visited',
    notes: 'Visited 上海 (Shanghai).',
    color: '#10b981',
  },
};

/**
 * Marker locations (lat/lon coordinates)
 */
export const markers = [
  // Home - Florida
  {
    id: 'florida-home',
    lat: 29.6516,
    lon: -82.3248,
    name: 'Florida',
    description: 'My home. Currently studying at University of Florida.',
    visited: true,
    isHome: true,
  },
  // Hometown - 广东
  {
    id: 'guangdong-hometown',
    lat: 23.1291,
    lon: 113.2644,
    name: '广东 (Guangdong)',
    description: 'My hometown (家乡).',
    visited: true,
    isHometown: true,
  },
  // US States and Cities
  {
    id: 'georgia',
    lat: 33.7490,
    lon: -84.3880,
    name: 'Georgia',
    description: 'Visited Georgia.',
    visited: true,
  },
  {
    id: 'south-carolina',
    lat: 34.0007,
    lon: -81.0348,
    name: 'South Carolina',
    description: 'Visited South Carolina.',
    visited: true,
  },
  {
    id: 'north-carolina',
    lat: 35.2271,
    lon: -80.8431,
    name: 'North Carolina',
    description: 'Visited North Carolina.',
    visited: true,
  },
  {
    id: 'new-jersey',
    lat: 40.7178,
    lon: -74.0431,
    name: 'New Jersey',
    description: 'Visited New Jersey.',
    visited: true,
  },
  {
    id: 'new-york',
    lat: 40.7128,
    lon: -74.0060,
    name: 'New York',
    description: 'Visited New York.',
    visited: true,
  },
  {
    id: 'los-angeles',
    lat: 34.0522,
    lon: -118.2437,
    name: 'Los Angeles',
    description: 'Visited Los Angeles, California.',
    visited: true,
  },
  {
    id: 'las-vegas',
    lat: 36.1699,
    lon: -115.1398,
    name: 'Las Vegas',
    description: 'Visited Las Vegas, Nevada.',
    visited: true,
  },
  {
    id: 'texas',
    lat: 30.2672,
    lon: -97.7431,
    name: 'Texas',
    description: 'Visited Texas.',
    visited: true,
  },
  // Canadian Cities
  {
    id: 'vancouver',
    lat: 49.2827,
    lon: -123.1207,
    name: 'Vancouver',
    description: 'Visited Vancouver, Canada.',
    visited: true,
  },
  {
    id: 'montreal',
    lat: 45.5017,
    lon: -73.5673,
    name: 'Montreal',
    description: 'Visited Montreal, Canada.',
    visited: true,
  },
  {
    id: 'toronto',
    lat: 43.6532,
    lon: -79.3832,
    name: 'Toronto',
    description: 'Visited Toronto, Canada.',
    visited: true,
  },
  // Asian Cities
  {
    id: 'singapore',
    lat: 1.3521,
    lon: 103.8198,
    name: 'Singapore',
    description: 'Visited Singapore.',
    visited: true,
  },
  {
    id: 'shanghai',
    lat: 31.2304,
    lon: 121.4737,
    name: '上海 (Shanghai)',
    description: 'Visited 上海 (Shanghai), China.',
    visited: true,
  },
  {
    id: 'hong-kong',
    lat: 22.3193,
    lon: 114.1694,
    name: '香港 (Hong Kong)',
    description: 'Visited 香港 (Hong Kong).',
    visited: true,
  },
  {
    id: 'macau',
    lat: 22.1987,
    lon: 113.5439,
    name: '澳门 (Macau)',
    description: 'Visited 澳门 (Macau).',
    visited: true,
  },
  {
    id: 'xian',
    lat: 34.3416,
    lon: 108.9398,
    name: '西安 (Xi\'an)',
    description: 'Visited 西安 (Xi\'an), China.',
    visited: true,
  },
  // Additional Chinese Provinces
  {
    id: 'guangxi',
    lat: 22.8170,
    lon: 108.3669,
    name: '广西 (Guangxi)',
    description: 'Visited 广西, China.',
    visited: true,
  },
  {
    id: 'hunan',
    lat: 28.2278,
    lon: 112.9388,
    name: '湖南 (Hunan)',
    description: 'Visited 湖南, China.',
    visited: true,
  },
  {
    id: 'guizhou',
    lat: 26.6470,
    lon: 106.6302,
    name: '贵州 (Guizhou)',
    description: 'Visited 贵州, China.',
    visited: true,
  },
  {
    id: 'yunnan',
    lat: 25.0389,
    lon: 102.7183,
    name: '云南 (Yunnan)',
    description: 'Visited 云南, China.',
    visited: true,
  },
  {
    id: 'sichuan',
    lat: 30.6624,
    lon: 104.0633,
    name: '四川 (Sichuan)',
    description: 'Visited 四川, China.',
    visited: true,
  },
  {
    id: 'zhejiang',
    lat: 30.2741,
    lon: 120.1551,
    name: '浙江 (Zhejiang)',
    description: 'Visited 浙江, China.',
    visited: true,
  },
  {
    id: 'malaysia',
    lat: 3.1390,
    lon: 101.6869,
    name: 'Malaysia',
    description: 'Visited Malaysia.',
    visited: true,
  },
];

/**
 * Helper function to normalize Chinese province names
 * Removes "省", "自治区", "特别行政区", "市" etc. for matching
 */
function normalizeChineseName(name) {
  return name
    .replace(/省$/, '')
    .replace(/壮族自治区$/, '')
    .replace(/维吾尔自治区$/, '')
    .replace(/回族自治区$/, '')
    .replace(/自治区$/, '')
    .replace(/特别行政区$/, '')
    .replace(/市$/, '');
}

/**
 * Helper function to check if a region is visited
 * Supports both country names and state/province names with country (e.g., "Florida, United States")
 * Also handles Chinese province name variations (with/without "省")
 */
export function isRegionVisited(regionName) {
  // Direct match
  if (visitedRegions[regionName]?.visited) {
    return true;
  }
  
  // Check if it's a state/province format "State, Country"
  const parts = regionName.split(', ');
  if (parts.length === 2) {
    const [state, country] = parts;
    
    // For Chinese provinces, try normalizing the name
    if (country === 'China') {
      const normalizedState = normalizeChineseName(state);
      const normalizedFormat = `${normalizedState}, ${country}`;
      if (visitedRegions[normalizedFormat]?.visited) {
        return true;
      }
    }
    
    // Try full format first
    if (visitedRegions[regionName]?.visited) {
      return true;
    }
    // Try alternative formats
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
 * Also handles Chinese province name variations (with/without "省")
 */
export function getRegionData(regionName) {
  // Direct match
  if (visitedRegions[regionName]) {
    return visitedRegions[regionName];
  }
  
  // Check if it's a state/province format "State, Country"
  const parts = regionName.split(', ');
  if (parts.length === 2) {
    const [state, country] = parts;
    
    // For Chinese provinces, try normalizing the name
    if (country === 'China') {
      const normalizedState = normalizeChineseName(state);
      const normalizedFormat = `${normalizedState}, ${country}`;
      if (visitedRegions[normalizedFormat]) {
        return visitedRegions[normalizedFormat];
      }
    }
    
    // Try full format
    if (visitedRegions[regionName]) {
      return visitedRegions[regionName];
    }
    // Try alternative formats
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

