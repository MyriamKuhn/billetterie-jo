import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Vite configuration
export default defineConfig({
  // Plugins to apply
  plugins: [react()],
  // Dev server settings
  server: { port: 3000 },
  // Module resolution
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  // Vitest configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: false,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/setupTests.ts'],
    },
  },
  // Build options
  build: {
    sourcemap: false,
    minify: true,
    commonjsOptions: {       
      include: /node_modules/,
      transformMixedEsModules: true,
    },
    // Custom chunking strategy
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          // Only consider node_modules for splitting
          if (!id.includes('node_modules')) return;

          // Group all @emotion packages into a single chunk
          if (/[\\/]node_modules[\\/]@emotion[\\/]/.test(id)) {
            return 'emotion';
          }

          // React core libraries
          if (/[\\/]node_modules[\\/]react($|[\\/])/.test(id))        return 'react';
          // Material‑UI
          if (/[\\/]node_modules[\\/]@mui[\\/]/.test(id))             return 'mui';
          // i18next core
          if (/[\\/]node_modules[\\/]i18next($|[\\/])/.test(id))      return 'i18n';
          // react‑i18next binding
          if (/[\\/]node_modules[\\/]react-i18next/.test(id))         return 'i18n-react';
          // Zustand state management
          if (/[\\/]node_modules[\\/]zustand/.test(id))               return 'zustand';
          // React Query
          if (/[\\/]node_modules[\\/]@tanstack[\\/]react-query/.test(id)) return 'react-query';
          // React Hook Form
          if (/[\\/]node_modules[\\/]react-hook-form/.test(id))       return 'react-hook-form';
          // Axios HTTP client
          if (/[\\/]node_modules[\\/]axios/.test(id))                 return 'axios';
          // Day.js date library
          if (/[\\/]node_modules[\\/]dayjs/.test(id))                 return 'dayjs';
          // React Router
          if (/[\\/]node_modules[\\/]react-router-dom/.test(id))      return 'router';
          // React Helmet
          if (/[\\/]node_modules[\\/]react-helmet/.test(id))          return 'helmet';
          // Cookie consent component
          if (/[\\/]node_modules[\\/]react-cookie-consent/.test(id))  return 'cookie-consent';
          // Zod validation library
          if (/[\\/]node_modules[\\/]zod/.test(id))                   return 'zod';
          // QR scanner library
          if (/[\\/]node_modules[\\/]html5-qrcode[\\/]/.test(id))     return 'qr-scanner';
          // XLSX export library
          if (/[\\/]node_modules[\\/]xlsx[\\/]/.test(id))             return 'xlsx';
          // Stripe SDK
          if (/[\\/]node_modules[\\/]@stripe[\\/]/.test(id))          return 'stripe';
          // MUI Data Grid
          if (/[\\/]node_modules[\\/]@mui[\\/]x-data-grid[\\/]/.test(id)) return 'mui-data-grid';
          // MUI Date Pickers
          if (/[\\/]node_modules[\\/]@mui[\\/]x-date-pickers[\\/]/.test(id)) return 'mui-date-pickers';
          // QR code React component
          if (/[\\/]node_modules[\\/]qrcode\.react[\\/]/.test(id))    return 'qrcode-react';

          // Everything else goes into a generic "vendor" chunk
          return 'vendor';
        }
      }
    }
  }
});
