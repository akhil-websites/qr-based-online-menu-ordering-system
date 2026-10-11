import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure this is correct for Netlify

  build: {
    chunkSizeWarningLimit: 10000, // Avoids warnings but does not fix the issue
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('lodash')) return 'lodash-vendor';
            if (id.includes('chart.js')) return 'charts-vendor';
            return 'vendor';
          }
        },
      },
    },
  },
});
