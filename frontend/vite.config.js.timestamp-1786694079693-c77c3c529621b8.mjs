// vite.config.js
import { defineConfig } from "file:///D:/Projects/PAPG-INTERNAL/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Projects/PAPG-INTERNAL/frontend/node_modules/@vitejs/plugin-react-swc/index.js";
import tsconfigPaths from "file:///D:/Projects/PAPG-INTERNAL/frontend/node_modules/vite-tsconfig-paths/dist/index.mjs";
import { resolve } from "path";
import { VitePWA } from "file:///D:/Projects/PAPG-INTERNAL/frontend/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "D:\\Projects\\PAPG-INTERNAL\\frontend";
var vite_config_default = defineConfig({
  base: "./",
  server: {
    historyApiFallback: true,
    proxy: {
      "/api": "http://localhost:5000"
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
      // 👈 ENABLE PWA IN DEV},
      includeAssets: ["favicon.svg", "favicon.ico", "favicon-192x192.png", "favicon-512x512.png"],
      manifest: {
        name: "Manager Payment Aggregator",
        short_name: "Manager Payment Aggregator",
        description: "Manager Payment Aggregator",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "favicon-192x192.png",
            sizes: "192x192",
            type: "favicon-192x192.png"
          },
          {
            src: "favicon-512x512.png",
            sizes: "512x512",
            type: "favicon-512x512.png"
          },
          {
            src: "favicon-512x512.png",
            sizes: "512x512",
            type: "favicon-512x512.png",
            purpose: "any maskable"
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
  optimizeDeps: {
    include: [
      "@emotion/react",
      "@emotion/styled",
      "@mui/system",
      "@mui/material/Popover",
      "@mui/material/*"
    ]
  },
  esbuild: {
    drop: ["console", "debugger"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQcm9qZWN0c1xcXFxQQVBHLUlOVEVSTkFMXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxQcm9qZWN0c1xcXFxQQVBHLUlOVEVSTkFMXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9Qcm9qZWN0cy9QQVBHLUlOVEVSTkFML2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJztcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gJ3ZpdGUtdHNjb25maWctcGF0aHMnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBiYXNlOiAnLi8nLFxuICBzZXJ2ZXI6IHtcbiAgICBoaXN0b3J5QXBpRmFsbGJhY2s6IHRydWUsXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KHtcbiAgICAgIGpzeEltcG9ydFNvdXJjZTogJ0BlbW90aW9uL3JlYWN0JyxcbiAgICAgIGJhYmVsOiB7XG4gICAgICAgIHBsdWdpbnM6IFsnQGVtb3Rpb24vYmFiZWwtcGx1Z2luJ10sXG4gICAgICB9LFxuICAgIH0pLFxuICAgIHRzY29uZmlnUGF0aHMoKSxcbiAgICBWaXRlUFdBKHtcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxuICAgICAgZGV2T3B0aW9uczogeyBlbmFibGVkOiBmYWxzZSB9LCAvLyBcdUQ4M0RcdURDNDggRU5BQkxFIFBXQSBJTiBERVZ9LFxuICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLnN2ZycsICdmYXZpY29uLmljbycsICdmYXZpY29uLTE5MngxOTIucG5nJywgJ2Zhdmljb24tNTEyeDUxMi5wbmcnLF0sXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBuYW1lOiAnTWFuYWdlciBQYXltZW50IEFnZ3JlZ2F0b3InLFxuICAgICAgICBzaG9ydF9uYW1lOiAnTWFuYWdlciBQYXltZW50IEFnZ3JlZ2F0b3InLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01hbmFnZXIgUGF5bWVudCBBZ2dyZWdhdG9yJyxcbiAgICAgICAgdGhlbWVfY29sb3I6ICcjZmZmZmZmJyxcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyNmZmZmZmYnLFxuICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXG4gICAgICAgIHN0YXJ0X3VybDogJy8nLFxuICAgICAgICBpY29uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2Zhdmljb24tMTkyeDE5Mi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgICAgIHR5cGU6ICdmYXZpY29uLTE5MngxOTIucG5nJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2Zhdmljb24tNTEyeDUxMi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgIHR5cGU6ICdmYXZpY29uLTUxMng1MTIucG5nJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2Zhdmljb24tNTEyeDUxMi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgIHR5cGU6ICdmYXZpY29uLTUxMng1MTIucG5nJyxcbiAgICAgICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIH0pLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICcmc3JjJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKSxcbiAgICB9LFxuICB9LFxuICBjbGVhclNjcmVlbjogZmFsc2UsXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICdAZW1vdGlvbi9yZWFjdCcsXG4gICAgICAnQGVtb3Rpb24vc3R5bGVkJyxcbiAgICAgICdAbXVpL3N5c3RlbScsXG4gICAgICAnQG11aS9tYXRlcmlhbC9Qb3BvdmVyJyxcbiAgICAgICdAbXVpL21hdGVyaWFsLyonLFxuICAgIF0sXG4gIH0sXG4gIGVzYnVpbGQ6IHtcbiAgICBkcm9wOiBbJ2NvbnNvbGUnLCAnZGVidWdnZXInXSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFnUyxTQUFTLG9CQUFvQjtBQUM3VCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxtQkFBbUI7QUFDMUIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsZUFBZTtBQUp4QixJQUFNLG1DQUFtQztBQU96QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixRQUFRO0FBQUEsSUFDTixvQkFBb0I7QUFBQSxJQUNwQixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsSUFDVjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxNQUNKLGlCQUFpQjtBQUFBLE1BQ2pCLE9BQU87QUFBQSxRQUNMLFNBQVMsQ0FBQyx1QkFBdUI7QUFBQSxNQUNuQztBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsY0FBYztBQUFBLElBQ2QsUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsWUFBWSxFQUFFLFNBQVMsTUFBTTtBQUFBO0FBQUEsTUFDN0IsZUFBZSxDQUFDLGVBQWUsZUFBZSx1QkFBdUIscUJBQXNCO0FBQUEsTUFDM0YsVUFBVTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBLFFBQ2Isa0JBQWtCO0FBQUEsUUFDbEIsU0FBUztBQUFBLFFBQ1QsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFVBQ0w7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixTQUFTO0FBQUEsVUFDWDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsUUFBUSxRQUFRLGtDQUFXLEtBQUs7QUFBQSxJQUNsQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLGFBQWE7QUFBQSxFQUNiLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNLENBQUMsV0FBVyxVQUFVO0FBQUEsRUFDOUI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
