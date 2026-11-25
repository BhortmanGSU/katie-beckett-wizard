import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` lets the same build run from GitHub Pages, a local folder,
// or inside the desktop app (served from the app:// protocol).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 4000,
    target: 'es2022',
  },
  worker: { format: 'es' },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
} as any);
