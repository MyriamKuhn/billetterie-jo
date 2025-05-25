import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
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
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (!id.includes('node_modules')) {
            return;
          }

          // React et React-DOM
          if (id.match(/\/node_modules\/react($|\/)/)) {
            return 'react';
          }

          // MUI core et icons
          if (id.match(/\/node_modules\/@mui\/material/)) {
            return 'mui-core';
          }
          if (id.match(/\/node_modules\/@mui\/icons-material/)) {
            return 'mui-icons';
          }
          if (id.match(/\/node_modules\/@mui\/x-data-grid/)) {
            return 'mui-datagrid';
          }

          // i18n
          if (id.match(/\/node_modules\/i18next/)) {
            return 'i18n-core';
          }
          if (id.match(/\/node_modules\/react-i18next/)) {
            return 'i18n-react';
          }

          // State management
          if (id.match(/\/node_modules\/zustand/)) {
            return 'zustand';
          }

          // Network / forms / validation
          if (id.match(/\/node_modules\/axios/)) {
            return 'axios';
          }
          if (id.match(/\/node_modules\/react-hook-form/)) {
            return 'react-hook-form';
          }
          if (id.match(/\/node_modules\/zod/)) {
            return 'zod';
          }

          // Router
          if (id.match(/\/node_modules\/react-router-dom/)) {
            return 'router';
          }

          // Helmet / head manager
          if (id.match(/\/node_modules\/react-helmet/)) {
            return 'helmet';
          }

          // TanStack Query (si tu ne l’as pas déjà extrait)
          if (id.match(/\/node_modules\/\@tanstack\/react-query/)) {
            return 'react-query';
          }

          // Tout le reste dans un chunk "vendor"
          return 'vendor';
        }
      }
    }
  }
});