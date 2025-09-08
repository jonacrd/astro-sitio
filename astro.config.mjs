import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import path from 'node:path';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
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
});
