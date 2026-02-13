import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Grótta Stats',
        short_name: 'Grótta',
        description: 'Handball stat tracker for Grótta',
        theme_color: '#1e2327',
        background_color: '#1e2327',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/grotta-stats/',
        scope: '/grotta-stats/',
        icons: [
          {
            src: '/assets/grotta-logo.png',
            sizes: '512x512',
            type: 'image/webp',
          },
          {
            src: '/assets/grotta-logo.png',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'maskable',
          },
          {
            src: '/assets/grotta-logo.png',
            sizes: '192x192',
            type: 'image/webp',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
});
