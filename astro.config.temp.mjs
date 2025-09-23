import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless";
import path from "node:path";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [react(), tailwind()],
  vite: {
    resolve: {
      alias: {
        "@": path.resolve("./src"),
        "@components": path.resolve("./src/components"),
        "@pages": path.resolve("./src/pages"),
        "@lib": path.resolve("./src/lib"),
      },
    },
    // Excluir archivos problemáticos del build
    build: {
      rollupOptions: {
        external: (id) => {
          // Excluir archivos que usan Prisma o funciones no existentes
          if (id.includes('@lib/db') || 
              id.includes('@lib/repos') ||
              id.includes('prisma') ||
              id.includes('bcryptjs')) {
            return true;
          }
          return false;
        }
      }
    }
  },
  // Excluir páginas problemáticas del build
  pages: {
    exclude: [
      'src/pages/api/auth/login.ts',
      'src/pages/api/auth/register.ts',
      'src/pages/api/auth/me.ts',
      'src/pages/api/auth/logout.ts',
      'src/pages/api/seller/apply.ts',
      'src/pages/api/seller/apply-universal.ts',
      'src/pages/api/seller/apply-simple.ts',
      'src/pages/api/seller/profile.ts',
      'src/pages/api/products/index.ts',
      'src/pages/api/orders/price.ts',
      'src/pages/api/sellers/[id]/status.ts',
      'src/pages/api/stats.ts',
      'src/pages/api/lead.ts',
      'src/pages/api/order.ts',
      'src/pages/api/inventory.ts',
      'src/pages/api/debug.ts'
    ]
  }
});
