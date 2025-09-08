// astro.config.mjs
import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel/server'   // ✅ único import correcto
import path from 'node:path'

export default defineConfig({
  output: 'server',            // necesario para SSR/API en Vercel
  adapter: vercel(),           // activa el adapter de Vercel
  // (opcional) tus alias de Vite
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
