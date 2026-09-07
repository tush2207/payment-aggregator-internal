// vite.config.js
import { defineConfig } from "file:///D:/Projects/PAPG-INTERNAL/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Projects/PAPG-INTERNAL/frontend/node_modules/@vitejs/plugin-react-swc/index.js";
import tsconfigPaths from "file:///D:/Projects/PAPG-INTERNAL/frontend/node_modules/vite-tsconfig-paths/dist/index.mjs";
import { resolve } from "path";
import { VitePWA } from "file:///D:/Projects/PAPG-INTERNAL/frontend/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "D:\\Projects\\PAPG-INTERNAL\\frontend";
var vite_config_default = defineConfig(({ mode }) => {
  const isProd = mode === "prod" || mode === "production";
  return {
    base: "/",
    server: {
      port: 5173,
      open: false,
      historyApiFallback: true,
      proxy: {
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
          secure: false
        }
      }
    },
    plugins: [
      react({
        jsxImportSource: "@emotion/react",
        babel: {
          plugins: ["@emotion/babel-plugin"]
        }
      }),
      tsconfigPaths(),
      VitePWA({
        registerType: "autoUpdate",
        devOptions: { enabled: false },
        includeAssets: ["favicon.svg", "favicon.ico", "favicon-192x192.png", "favicon-512x512.png"],
        manifest: {
          name: "Central Bank of India - Payment Aggregator Portal",
          short_name: "PAPG Portal",
          description: "Payment Aggregator Request Automation Portal",
          theme_color: "#004c8f",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "favicon-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "favicon-512x512.png",
              sizes: "512x512",
              type: "image/png"
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        "&src": resolve(__vite_injected_original_dirname, "src")
      }
    },
    clearScreen: false,
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: !isProd,
      chunkSizeWarningLimit: 1e3,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-ui": [
              "@mui/material",
              "@mui/icons-material",
              "@emotion/react",
              "@emotion/styled"
            ],
            "vendor-utils": ["axios", "dayjs", "xlsx", "file-saver"]
          }
        }
      }
    },
    optimizeDeps: {
      include: [
        "@emotion/react",
        "@emotion/styled",
        "@mui/system",
        "@mui/material",
        "@mui/icons-material"
      ]
    },
    esbuild: {
      drop: isProd ? ["console", "debugger"] : []
    },
    define: {
      __APP_ENV__: JSON.stringify(mode)
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQcm9qZWN0c1xcXFxQQVBHLUlOVEVSTkFMXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxQcm9qZWN0c1xcXFxQQVBHLUlOVEVSTkFMXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9Qcm9qZWN0cy9QQVBHLUlOVEVSTkFML2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJztcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gJ3ZpdGUtdHNjb25maWctcGF0aHMnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGlzUHJvZCA9IG1vZGUgPT09ICdwcm9kJyB8fCBtb2RlID09PSAncHJvZHVjdGlvbic7XG5cbiAgcmV0dXJuIHtcbiAgICBiYXNlOiAnLycsXG5cbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHBvcnQ6IDUxNzMsXG4gICAgICBvcGVuOiBmYWxzZSxcbiAgICAgIGhpc3RvcnlBcGlGYWxsYmFjazogdHJ1ZSxcbiAgICAgIHByb3h5OiB7XG4gICAgICAgICcvYXBpJzoge1xuICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCh7XG4gICAgICAgIGpzeEltcG9ydFNvdXJjZTogJ0BlbW90aW9uL3JlYWN0JyxcbiAgICAgICAgYmFiZWw6IHtcbiAgICAgICAgICBwbHVnaW5zOiBbJ0BlbW90aW9uL2JhYmVsLXBsdWdpbiddLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgICB0c2NvbmZpZ1BhdGhzKCksXG4gICAgICBWaXRlUFdBKHtcbiAgICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gICAgICAgIGRldk9wdGlvbnM6IHsgZW5hYmxlZDogZmFsc2UgfSxcbiAgICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLnN2ZycsICdmYXZpY29uLmljbycsICdmYXZpY29uLTE5MngxOTIucG5nJywgJ2Zhdmljb24tNTEyeDUxMi5wbmcnXSxcbiAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICBuYW1lOiAnQ2VudHJhbCBCYW5rIG9mIEluZGlhIC0gUGF5bWVudCBBZ2dyZWdhdG9yIFBvcnRhbCcsXG4gICAgICAgICAgc2hvcnRfbmFtZTogJ1BBUEcgUG9ydGFsJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BheW1lbnQgQWdncmVnYXRvciBSZXF1ZXN0IEF1dG9tYXRpb24gUG9ydGFsJyxcbiAgICAgICAgICB0aGVtZV9jb2xvcjogJyMwMDRjOGYnLFxuICAgICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjZmZmZmZmJyxcbiAgICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXG4gICAgICAgICAgc3RhcnRfdXJsOiAnLycsXG4gICAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiAnZmF2aWNvbi0xOTJ4MTkyLnBuZycsXG4gICAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiAnZmF2aWNvbi01MTJ4NTEyLnBuZycsXG4gICAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgXSxcblxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICcmc3JjJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKSxcbiAgICAgIH0sXG4gICAgfSxcblxuICAgIGNsZWFyU2NyZWVuOiBmYWxzZSxcblxuICAgIGJ1aWxkOiB7XG4gICAgICBvdXREaXI6ICdkaXN0JyxcbiAgICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXG4gICAgICBzb3VyY2VtYXA6ICFpc1Byb2QsXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgJ3ZlbmRvci1yZWFjdCc6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAgICd2ZW5kb3ItdWknOiBbXG4gICAgICAgICAgICAgICdAbXVpL21hdGVyaWFsJyxcbiAgICAgICAgICAgICAgJ0BtdWkvaWNvbnMtbWF0ZXJpYWwnLFxuICAgICAgICAgICAgICAnQGVtb3Rpb24vcmVhY3QnLFxuICAgICAgICAgICAgICAnQGVtb3Rpb24vc3R5bGVkJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAndmVuZG9yLXV0aWxzJzogWydheGlvcycsICdkYXlqcycsICd4bHN4JywgJ2ZpbGUtc2F2ZXInXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICBpbmNsdWRlOiBbXG4gICAgICAgICdAZW1vdGlvbi9yZWFjdCcsXG4gICAgICAgICdAZW1vdGlvbi9zdHlsZWQnLFxuICAgICAgICAnQG11aS9zeXN0ZW0nLFxuICAgICAgICAnQG11aS9tYXRlcmlhbCcsXG4gICAgICAgICdAbXVpL2ljb25zLW1hdGVyaWFsJyxcbiAgICAgIF0sXG4gICAgfSxcblxuICAgIGVzYnVpbGQ6IHtcbiAgICAgIGRyb3A6IGlzUHJvZCA/IFsnY29uc29sZScsICdkZWJ1Z2dlciddIDogW10sXG4gICAgfSxcblxuICAgIGRlZmluZToge1xuICAgICAgX19BUFBfRU5WX186IEpTT04uc3RyaW5naWZ5KG1vZGUpLFxuICAgIH0sXG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1MsU0FBUyxvQkFBb0I7QUFDN1QsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sbUJBQW1CO0FBQzFCLFNBQVMsZUFBZTtBQUN4QixTQUFTLGVBQWU7QUFKeEIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxTQUFTLFNBQVMsVUFBVSxTQUFTO0FBRTNDLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUVOLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLG9CQUFvQjtBQUFBLE1BQ3BCLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxRQUNWO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUVBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxRQUNKLGlCQUFpQjtBQUFBLFFBQ2pCLE9BQU87QUFBQSxVQUNMLFNBQVMsQ0FBQyx1QkFBdUI7QUFBQSxRQUNuQztBQUFBLE1BQ0YsQ0FBQztBQUFBLE1BQ0QsY0FBYztBQUFBLE1BQ2QsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFFBQ2QsWUFBWSxFQUFFLFNBQVMsTUFBTTtBQUFBLFFBQzdCLGVBQWUsQ0FBQyxlQUFlLGVBQWUsdUJBQXVCLHFCQUFxQjtBQUFBLFFBQzFGLFVBQVU7QUFBQSxVQUNSLE1BQU07QUFBQSxVQUNOLFlBQVk7QUFBQSxVQUNaLGFBQWE7QUFBQSxVQUNiLGFBQWE7QUFBQSxVQUNiLGtCQUFrQjtBQUFBLFVBQ2xCLFNBQVM7QUFBQSxVQUNULFdBQVc7QUFBQSxVQUNYLE9BQU87QUFBQSxZQUNMO0FBQUEsY0FDRSxLQUFLO0FBQUEsY0FDTCxPQUFPO0FBQUEsY0FDUCxNQUFNO0FBQUEsWUFDUjtBQUFBLFlBQ0E7QUFBQSxjQUNFLEtBQUs7QUFBQSxjQUNMLE9BQU87QUFBQSxjQUNQLE1BQU07QUFBQSxZQUNSO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFFQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxRQUFRLFFBQVEsa0NBQVcsS0FBSztBQUFBLE1BQ2xDO0FBQUEsSUFDRjtBQUFBLElBRUEsYUFBYTtBQUFBLElBRWIsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsV0FBVztBQUFBLE1BQ1gsV0FBVyxDQUFDO0FBQUEsTUFDWix1QkFBdUI7QUFBQSxNQUN2QixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixjQUFjO0FBQUEsWUFDWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsWUFDekQsYUFBYTtBQUFBLGNBQ1g7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxZQUNGO0FBQUEsWUFDQSxnQkFBZ0IsQ0FBQyxTQUFTLFNBQVMsUUFBUSxZQUFZO0FBQUEsVUFDekQ7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUVBLGNBQWM7QUFBQSxNQUNaLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFFQSxTQUFTO0FBQUEsTUFDUCxNQUFNLFNBQVMsQ0FBQyxXQUFXLFVBQVUsSUFBSSxDQUFDO0FBQUEsSUFDNUM7QUFBQSxJQUVBLFFBQVE7QUFBQSxNQUNOLGFBQWEsS0FBSyxVQUFVLElBQUk7QUFBQSxJQUNsQztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
