import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  resolve: {
    alias: {
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    exclude: ['lucide-react'],
    esbuildOptions: {
      resolveExtensions: ['.jsx', '.js', '.ts', '.tsx'],
    },
  },
  build: {
    outDir: 'dist',
    // Vite automatically copies files from public/ to dist/ during build
    // This includes the _redirects file needed for Cloudflare Pages SPA routing
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    chunkSizeWarningLimit: 2000, // 2MB - avoid Vercel/build warning for large chunks (index, xlsx, etc.)
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks
          if (id.includes('node_modules')) {
            // React core libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react/jsx-runtime')) {
              return 'react-vendor';
            }
            
            // Supabase client
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            
            // PDF generation libraries (large)
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            
            // Excel/Spreadsheet libraries
            if (id.includes('xlsx')) {
              return 'xlsx-vendor';
            }
            
            // Rich text editor (large)
            if (id.includes('react-quill') || id.includes('quill')) {
              return 'editor-vendor';
            }
            
            // Drag and drop
            if (id.includes('react-dnd') || id.includes('dnd-core')) {
              return 'dnd-vendor';
            }
            
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            
            // Icons library (can be large)
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            
            // Toast notifications
            if (id.includes('react-hot-toast')) {
              return 'toast-vendor';
            }
            
            // Vercel blob
            if (id.includes('@vercel/blob')) {
              return 'vercel-vendor';
            }
            
            // All other vendor libraries
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    host: '127.0.0.1', // avoid uv_interface_addresses errors in restricted environments
    port: 5173,
    strictPort: true, // fail if port in use so --open always opens the correct URL
    open: true, // open browser to the actual server URL when server starts
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    // Proxy /api to deployed Vercel app only when VITE_VERCEL_URL is set (e.g. in .env)
    // If not set, /api requests 404 locally and the app shows a clear error; Create Link works on the live deployment
    ...(process.env.VITE_VERCEL_URL
      ? {
          proxy: {
            '/api': {
              target: process.env.VITE_VERCEL_URL.startsWith('http')
                ? process.env.VITE_VERCEL_URL
                : `https://${process.env.VITE_VERCEL_URL}`,
              changeOrigin: true,
              secure: true,
            },
          },
        }
      : {}),
  },
});
