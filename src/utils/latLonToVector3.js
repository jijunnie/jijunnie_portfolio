import * as THREE from 'three';

/**
 * Converts latitude and longitude to a 3D vector on a sphere
 * @param {number} lat - Latitude in degrees (-90 to 90)
 * @param {number} lon - Longitude in degrees (-180 to 180)
 * @param {number} radius - Radius of the sphere (default: 1)
 * @returns {THREE.Vector3} 3D position vector
 */
export function latLonToVector3(lat, lon, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Converts a 3D vector to latitude and longitude
 * @param {THREE.Vector3} vector - 3D position vector
 * @returns {{lat: number, lon: number}} Latitude and longitude in degrees
 */
export function vector3ToLatLon(vector) {
  const radius = vector.length();
  const lat = 90 - (Math.acos(vector.y / radius) * 180) / Math.PI;
  const lon = ((Math.atan2(vector.z, -vector.x) * 180) / Math.PI) - 180;
  return { lat, lon };
}

