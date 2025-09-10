import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel/serverless'
import tailwind from '@astrojs/tailwind'
import path from 'node:path'

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [react(), tailwind()],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
        '@components': path.resolve('./src/components'),
        '@pages': path.resolve('./src/pages'),
        '@lib': path.resolve('./src/lib'),
      },
    },
  },
})