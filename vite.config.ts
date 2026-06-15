/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// `process` est disponible à l'exécution (Node) sans tirer @types/node dans tout le projet.
declare const process: { env: Record<string, string | undefined> };

// Base path pour GitHub Pages : https://<user>.github.io/wine-tracker/
// Override possible via la variable d'environnement BASE_PATH (ex. '/' pour Netlify/Vercel).
const base = process.env.BASE_PATH ?? '/wine-tracker/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Ma Cave à Vin',
        short_name: 'Ma Cave',
        description: 'Gestion de cave à vin — fonctionne hors-ligne',
        lang: 'fr',
        theme_color: '#7b1e3b',
        background_color: '#faf7f2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
});
