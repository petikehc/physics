import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `BASE_PATH` lets the same build be served from a sub-path (e.g. GitHub Pages).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
  server: { host: true },
  preview: { host: true },
});
