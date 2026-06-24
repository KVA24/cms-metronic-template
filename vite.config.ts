import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 1000,
    minify: false,
    sourcemap: false,

    // Code splitting optimization
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
          ],

          // Charts
          'chart-vendor': ['recharts', 'apexcharts'],

          // Form & validation
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],

          // State management
          'state-vendor': [
            'zustand',
            '@tanstack/react-table',
            '@tanstack/react-query',
          ],

          // Utils
          'utils-vendor': ['clsx', 'tailwind-merge', 'date-fns', 'sonner'],
        },

        // Asset file naming
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';

          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];

          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            extType = 'images';
          } else if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            extType = 'fonts';
          }

          return `assets/${extType}/[name]-[hash][extname]`;
        },

        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },

    // Compression
    cssCodeSplit: true,

    // Target modern browsers for smaller bundle
    target: 'es2020',

    // Optimize CSS
    cssMinify: true,
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'recharts',
    ],
    exclude: ['highcharts'],
  },

  server: {
    port: 5173,
    open: true,
    cors: true,
  },

  // Performance hints
  esbuild: {
    // Remove console.log in production
    // drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});
