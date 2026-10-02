import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/app': path.resolve(__dirname, './src'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'es2020',
    cssTarget: 'chrome80',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/js/[name]-[hash:8].js',
        chunkFileNames: 'assets/js/[name]-[hash:8].js',
        assetFileNames: (assetInfo) => {
          const info = (assetInfo.name as string) ?? '';
          const ext = info.split('.').pop()?.toLowerCase() ?? '';
          if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'ico'].includes(ext)) {
            return 'assets/img/[name]-[hash:8][extname]';
          }
          if (['woff2', 'woff', 'ttf', 'otf', 'eot'].includes(ext)) {
            return 'assets/fonts/[name]-[hash:8][extname]';
          }
          if (['css'].includes(ext)) {
            return 'assets/css/[name]-[hash:8][extname]';
          }
          return 'assets/[name]-[hash:8][extname]';
        },
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'vendor-editor';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@heroicons') || id.includes('lucide-react') || id.includes('react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('zustand')) {
              return 'vendor-state';
            }
            if (id.includes('sonner')) {
              return 'vendor-ui';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'sonner', 'clsx'],
  },
})
