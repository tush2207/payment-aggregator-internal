import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'prod' || mode === 'production';

  return {
    base: '/',

    server: {
      port: 5173,
      open: false,
      historyApiFallback: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
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
        devOptions: { enabled: false },
        includeAssets: ['favicon.svg', 'favicon.ico', 'favicon-192x192.png', 'favicon-512x512.png'],
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
      chunkSizeWarningLimit: 1000,
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
      ],
    },

    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
    },

    define: {
      __APP_ENV__: JSON.stringify(mode),
    },
  };
});
