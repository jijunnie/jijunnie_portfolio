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
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    // Ensure single React instance to avoid version conflicts
    dedupe: ['react', 'react-dom'],
    // Preserve symlinks to avoid module resolution issues
    preserveSymlinks: false,
  },
  optimizeDeps: {
    // Force React Three Fiber to use the same React instance
    include: [
      'react', 
      'react-dom', 
      'react/jsx-runtime',
      '@react-three/fiber', 
      '@react-three/drei',
      '@react-three/postprocessing',
      '@react-spring/three'
    ],
    // Exclude problematic packages from optimization
    exclude: [],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB
    commonjsOptions: {
      // Ensure proper CommonJS handling
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        // Ensure proper module format
        format: 'es',
        // Ensure React loads before other chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks(id) {
          // Keep all react-related packages together
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          // Keep three.js together
          if (id.includes('node_modules/three') ||
              id.includes('node_modules/@react-three')) {
            return 'three-vendor';
          }
        },
      },
    },
    // Optimize for production
    minify: 'esbuild', // Use esbuild (faster and included with Vite)
    // Note: To remove console.logs, you can use a plugin or keep them for debugging
  },
})