# 3D Interactive Globe Component

A production-quality, interactive 3D globe built with React Three Fiber, featuring country borders, visit markers, and an information panel.

## Features

✅ **3D Globe** - Realistic Earth texture with smooth rotation  
✅ **Geographic Borders** - Country borders loaded from TopoJSON  
✅ **Interactive Regions** - Click and hover on countries  
✅ **Visit Markers** - Pins showing visited locations  
✅ **Info Panel** - Side panel displaying region/marker details  
✅ **Visit Status** - Visual distinction between visited/unvisited regions  
✅ **Smooth Controls** - OrbitControls with zoom, rotation, and damping  

## File Structure

```
src/
├── pages/
│   └── Globe.jsx              # Main page component
├── components/
│   └── globe/
│       ├── Globe.jsx          # Earth sphere with texture
│       ├── Borders.jsx        # Country border rendering
│       ├── Marker.jsx         # Location pin markers
│       └── InfoPanel.jsx     # Information display panel
├── utils/
│   └── latLonToVector3.js    # Coordinate conversion utilities
└── data/
    └── visitedRegions.js     # Visited regions and markers data
```

## Installation

The required dependencies are already added to `package.json`:

```bash
npm install
```

Dependencies:
- `three` - 3D graphics library
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for R3F
- `d3-geo` - Geographic projections
- `topojson-client` - TopoJSON data processing

## Usage

The globe page is accessible at `/globe` route. Navigate using the "Travel" icon in the navigation bar.

### Controls

- **Drag** - Rotate the globe
- **Scroll** - Zoom in/out
- **Click Country** - View country details
- **Click Marker** - View location details
- **Hover** - Highlight regions

## Adding New Visited Locations

### Add a Visited Country

Edit `src/data/visitedRegions.js`:

```javascript
export const visitedRegions = {
  'Country Name': {
    name: 'Country Name',
    type: 'country',
    visited: true,
    notes: 'Your notes about this country',
    color: '#10b981', // green for visited
  },
  // ... more countries
};
```

### Add a New Marker

Add to the `markers` array in `src/data/visitedRegions.js`:

```javascript
export const markers = [
  // ... existing markers
  {
    id: 'unique-id',
    name: 'Location Name',
    lat: 40.7128,  // Latitude
    lon: -74.0060, // Longitude
    description: 'Description of this location',
    visited: true,
  },
];
```

## Adding State/Province Level Detail

To add state/province borders:

1. Load state-level TopoJSON data in `Borders.jsx`
2. Update the projection logic to handle nested features
3. Extend `visitedRegions.js` to include state data
4. Update the click handler to distinguish between country and state clicks

Example TopoJSON sources:
- US States: `https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json`
- Canadian Provinces: Available from Natural Earth data

## Customization

### Change Globe Texture

Edit `src/components/globe/Globe.jsx`:

```javascript
const earthTexture = useTexture({
  map: 'your-texture-url.jpg',
});
```

### Adjust Colors

Edit color values in:
- `src/components/globe/Borders.jsx` - Border colors
- `src/components/globe/Marker.jsx` - Marker colors
- `src/data/visitedRegions.js` - Region status colors

### Modify Camera

Edit camera settings in `src/pages/Globe.jsx`:

```javascript
<Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
  {/* ... */}
</Canvas>
```

## Performance Notes

- Borders are memoized to prevent unnecessary re-renders
- TopoJSON data is loaded once and cached
- Markers use efficient geometries
- Suspense boundaries prevent blocking renders

## Troubleshooting

**Globe texture not loading:**
- Check network connection
- Texture URL may be blocked - use a local texture or different CDN

**Borders not showing:**
- TopoJSON data may be loading - wait a few seconds
- Check browser console for errors
- Verify TopoJSON URL is accessible

**Markers not clickable:**
- Ensure markers are within camera view
- Check z-index and pointer events
- Verify lat/lon coordinates are valid

## Future Enhancements

- [ ] Camera fly-to animation on region click
- [ ] Dark mode globe texture option
- [ ] State/province level detail
- [ ] Custom region highlighting
- [ ] Export visited regions as JSON
- [ ] Search functionality for regions

