import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['mathbuilders.png'],
      manifest: {
        name: 'Math Builders',
        short_name: 'Math Builders',
        description:
          'Master multiplication tables with interactive exercises on Math Builders.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/mathbuilders.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/mathbuilders.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/mathbuilders.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
