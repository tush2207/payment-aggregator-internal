import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'prod' || mode === 'production';

  return {
    base: '/',

    server: {
      host: '0.0.0.0',
      port: 5173,
      open: false,
      historyApiFallback: true,
      proxy: (() => {
        const createProxy = (target = 'http://localhost:8000') => ({
          target,
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            // When user refreshes page in browser, headers accept text/html -> serve index.html for SPA router
            if (req.headers.accept && req.headers.accept.includes('text/html')) {
              return '/index.html';
            }
          },
        });

        return {
          '/api': createProxy(),
          '/applications': createProxy(),
          '/get-all-applications': createProxy(),
          '/get-single-applications': createProxy(),
          '/all-manage-aggregator': createProxy(),
          '/single-manage-aggregator': createProxy(),
          '/manage-aggregator': createProxy(),
          '/all-payment-aggregator': createProxy(),
          '/single-payment-aggregator': createProxy(),
          '/payment-aggregator': createProxy(),
          '/locations': createProxy(),
          '/zones': createProxy(),
          '/regions': createProxy(),
          '/branches': createProxy(),
          '/files': createProxy(),
          '/helpdesk': createProxy(),
          '/auth': createProxy(),
          '/token': createProxy(),
          '/health': createProxy(),
          '/application-notifications': createProxy(),
          '/generate-purchase-order': createProxy(),
        };
      })(),
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
        devOptions: { enabled: true },
        includeAssets: ['favicon.svg', 'favicon.ico', 'favicon-192x192.png', 'favicon-512x512.png'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-assets-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\/api\/(?:all-manage-aggregator|applications\/all-manage-aggregator|annexures\/all)/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-metadata-cache',
                networkTimeoutSeconds: 2,
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 10, // 10 minutes
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        manifest: {
          name: 'Central Bank of India - Payment Aggregator Portal',
          short_name: 'PAPG Portal',
          description: 'Payment Aggregator Request Automation Portal',
          theme_color: '#004c8f',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'favicon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'favicon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
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

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProd,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': [
              '@mui/material',
              '@mui/icons-material',
              '@emotion/react',
              '@emotion/styled',
            ],
            'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
            'vendor-utils': ['axios', 'dayjs', 'xlsx', 'file-saver'],
          },
        },
      },
    },

    optimizeDeps: {
      include: [
        '@emotion/react',
        '@emotion/styled',
        '@mui/system',
        '@mui/material',
        '@mui/icons-material',
        '@mui/x-data-grid',
        '@mui/x-date-pickers',
        '@reduxjs/toolkit',
        'react',
        'react-dom',
        'react-redux',
        'react-router-dom',
        'axios',
        'dayjs',
        'formik',
        'yup',
        'file-saver',
        'xlsx',
      ],
    },

    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      include: ['src/**/*.{test,spec}.{js,jsx}'],
    },

    define: {
      __APP_ENV__: JSON.stringify(mode),
    },
  };
});
