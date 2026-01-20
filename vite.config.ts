import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    // Suppress chunk size warning - for real-time games, a single bundle
    // is preferred to avoid loading delays during gameplay.
    // Three.js alone is ~650KB which exceeds the 500KB default.
    chunkSizeWarningLimit: 1200,
  }
});
