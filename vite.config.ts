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
      // Add conservative build chunking to keep the initial bundle smaller
      build: {
        // Increase the warning limit slightly to account for dev artifacts, but
        // more importantly add manualChunks to split vendor code.
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id) return undefined;
              if (id.includes('node_modules')) {
                if (id.includes('react')) return 'vendor_react';
                return 'vendor';
              }
            }
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.AIzaSyBAXz20mWH7fYaflvwi-YMMRV3h1vsZKk8),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.AIzaSyBAXz20mWH7fYaflvwi-YMMRV3h1vsZKk8)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
