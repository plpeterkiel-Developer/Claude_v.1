import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:3001',
      '/tools': 'http://localhost:3001',
      '/requests': 'http://localhost:3001',
      '/reviews': 'http://localhost:3001',
      '/reports': 'http://localhost:3001',
      '/users': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
});
