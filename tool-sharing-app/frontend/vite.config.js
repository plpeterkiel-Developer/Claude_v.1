import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls so the browser never hits a CORS preflight in dev
    proxy: {
      '/auth':     { target: 'http://localhost:3001', changeOrigin: true, credentials: true },
      '/tools':    { target: 'http://localhost:3001', changeOrigin: true, credentials: true },
      '/requests': { target: 'http://localhost:3001', changeOrigin: true, credentials: true },
      '/health':   { target: 'http://localhost:3001', changeOrigin: true, credentials: true },
    },
  },
});
