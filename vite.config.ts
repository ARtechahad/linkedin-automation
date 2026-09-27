import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'AgencyOps: International Client Handling Suite',
          short_name: 'AgencyOps',
          description: 'Standard Operating Procedure and workflow automation for web development sales, staging, and delivery.',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          navigateFallbackDenylist: [/^\/api/],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          runtimeCaching: [
            {
              // 1. Critical Project Metadata & SOP Cache for International Travel Connectivity
              urlPattern: ({ url }) => 
                url.pathname.startsWith('/api/projects') ||
                url.pathname.startsWith('/api/portal') ||
                url.pathname.startsWith('/api/leads') ||
                url.pathname.startsWith('/api/commissions') ||
                url.pathname.startsWith('/api/invoices'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'project-metadata-travel-cache',
                networkTimeoutSeconds: 3, // 3s fallback if spotty airplane or international hotel WiFi
                expiration: {
                  maxEntries: 120,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days of offline retention
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // 2. Offline Database Status & Agency Settings Cache
              urlPattern: ({ url }) =>
                url.pathname.startsWith('/api/database/status') ||
                url.pathname.startsWith('/api/agency'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'agency-status-travel-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 3, // 3 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // 3. Web Fonts and Static CDN assets
              urlPattern: ({ url }) =>
                url.origin.includes('fonts.googleapis.com') ||
                url.origin.includes('fonts.gstatic.com') ||
                url.pathname.endsWith('.woff2') ||
                url.pathname.endsWith('.woff'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'typography-travel-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            }
          ]
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            'vendor-motion': ['motion'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var to prevent WebSocket dropouts
      hmr: isHmrDisabled ? false : true,
      watch: isHmrDisabled ? null : {},
    },
  };
});
