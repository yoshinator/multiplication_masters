import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as { version?: string }

const appVersion = packageJson.version ?? '0.0.0'
const gitSha = process.env.VITE_APP_GIT_SHA ?? 'dev'

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_GIT_SHA__: JSON.stringify(gitSha),
  },
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
