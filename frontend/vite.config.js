import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    sourcemap: mode === 'development'
  }
}));
