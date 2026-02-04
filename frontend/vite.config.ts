import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      // Target older browsers for iOS 15 Safari compatibility
      target: ['es2017', 'safari11'],
      // Ensure CSS is extracted
      cssCodeSplit: true,
      // Generate source maps for debugging
      sourcemap: false,
      rollupOptions: {
        output: {
          // Ensure proper chunking
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    css: {
      // PostCSS is auto-configured for Tailwind
    },
  };
});