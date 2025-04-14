import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          widget: resolve(__dirname, 'widget/index.html')
        }
      }
    },
    server: {
      port: 5173,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    },
    define: {
      // Make env variables available to the client
      'import.meta.env.VITE_BACKEND_BASE_URL': JSON.stringify(env.VITE_BACKEND_BASE_URL || 'http://localhost:3001')
    }
  };
});