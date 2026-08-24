import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  server: {
    historyApiFallback: true,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false }, // 👈 ENABLE PWA IN DEV},
      includeAssets: ['favicon.svg', 'favicon.ico', 'favicon-192x192.png', 'favicon-512x512.png',],
      manifest: {
        name: 'Manager Payment Aggregator',
        short_name: 'Manager Payment Aggregator',
        description: 'Manager Payment Aggregator',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon-192x192.png',
            sizes: '192x192',
            type: 'favicon-192x192.png',
          },
          {
            src: 'favicon-512x512.png',
            sizes: '512x512',
            type: 'favicon-512x512.png',
          },
          {
            src: 'favicon-512x512.png',
            sizes: '512x512',
            type: 'favicon-512x512.png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '&src': resolve(__dirname, 'src'),
    },
  },
  clearScreen: false,
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/system',
      '@mui/material/Popover',
      '@mui/material/*',
    ],
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
});
