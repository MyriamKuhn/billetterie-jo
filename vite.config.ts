import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
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
  build: {
    sourcemap: false,
    minify: true,
    commonjsOptions: {       
      include: /node_modules/,
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (!id.includes('node_modules')) return;

          // 1) Unifie TOUS les modules @emotion dans un seul chunk
          if (/[\\/]node_modules[\\/]@emotion[\\/]/.test(id)) {
            return 'emotion';
          }

          // 2) Tes autres gros chunks
          if (/[\\/]node_modules[\\/]react($|[\\/])/.test(id))        return 'react';
          if (/[\\/]node_modules[\\/]@mui[\\/]/.test(id))             return 'mui';
          if (/[\\/]node_modules[\\/]i18next($|[\\/])/.test(id))      return 'i18n';
          if (/[\\/]node_modules[\\/]react-i18next/.test(id))         return 'i18n-react';
          if (/[\\/]node_modules[\\/]zustand/.test(id))               return 'zustand';
          if (/[\\/]node_modules[\\/]@tanstack[\\/]react-query/.test(id)) return 'react-query';
          if (/[\\/]node_modules[\\/]react-hook-form/.test(id))       return 'react-hook-form';
          if (/[\\/]node_modules[\\/]axios/.test(id))                 return 'axios';
          if (/[\\/]node_modules[\\/]dayjs/.test(id))                 return 'dayjs';
          if (/[\\/]node_modules[\\/]react-router-dom/.test(id))      return 'router';
          if (/[\\/]node_modules[\\/]react-helmet/.test(id))          return 'helmet';
          if (/[\\/]node_modules[\\/]react-cookie-consent/.test(id))  return 'cookie-consent';
          if (/[\\/]node_modules[\\/]zod/.test(id))                   return 'zod';

          // 3) Tout le reste dans vendor
          return 'vendor';
        }
      }
    }
  }
});
