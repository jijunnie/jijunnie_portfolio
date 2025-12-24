import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { unlinkSync, existsSync } from 'fs'
import { join } from 'path'

// Plugin to exclude large GLB file from build (must be hosted on CDN)
const excludeLargeFiles = () => {
  return {
    name: 'exclude-large-files',
    closeBundle() {
      try {
        // Remove the large GLB file from dist after build
        const distModelPath = join(process.cwd(), 'dist', 'models', 'cozy_living_room_baked.glb')
        if (existsSync(distModelPath)) {
          unlinkSync(distModelPath)
          console.log('✓ Excluded large GLB file from build (must be hosted on CDN)')
        }
      } catch (error) {
        // Silently fail - don't break the build
        console.warn('⚠ Could not remove large GLB file:', error.message)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), excludeLargeFiles()],
  resolve: {
    // Ensure single React instance to avoid version conflicts
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Force React Three Fiber to use the same React instance
    include: ['react', 'react-dom', '@react-three/fiber', '@react-three/drei'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // IMPORTANT: Keep React Three Fiber with React to avoid version conflicts
          // React Three Fiber must share the same React instance
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/@react-three/fiber') ||
              id.includes('node_modules/@react-three/drei') ||
              id.includes('node_modules/@react-three/postprocessing') ||
              id.includes('node_modules/@react-spring/three')) {
            return 'react-vendor';
          }
          // Split pure Three.js (without React bindings)
          if (id.includes('node_modules/three') && !id.includes('@react-three')) {
            return 'three-vendor';
          }
          // Split Spline libraries
          if (id.includes('node_modules/@splinetool')) {
            return 'spline-vendor';
          }
          // Split other large dependencies
          if (id.includes('node_modules/gsap') || id.includes('node_modules/d3') || id.includes('node_modules/topojson')) {
            return 'utils-vendor';
          }
          // All other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    // Optimize for production
    minify: 'esbuild', // Use esbuild (faster and included with Vite)
    // Note: To remove console.logs, you can use a plugin or keep them for debugging
  },
})