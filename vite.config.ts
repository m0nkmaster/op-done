import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  optimizeDeps: {
    // @ffmpeg/ffmpeg bundles its own worker; skip prebundling to avoid Vite trying to rewrite worker imports.
    exclude: ['@ffmpeg/ffmpeg']
  }
});
