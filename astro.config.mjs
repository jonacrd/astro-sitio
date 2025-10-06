import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless"; // 👈 volver a serverless
import path from "node:path";

export default defineConfig({
  site: "https://astro-sitio.vercel.app", // 👈 URL de producción para Open Graph
  output: "server",
  adapter: vercel(),
  integrations: [react(), tailwind()],
  vite: {
    define: {
      'import.meta.env.DELIVERY_ENABLED': JSON.stringify('true'),
    },
    resolve: {
      alias: {
        "@": path.resolve("./src"),
        "@components": path.resolve("./src/components"),
        "@pages": path.resolve("./src/pages"),
        "@lib": path.resolve("./src/lib"),
      },
    },
  },
});
