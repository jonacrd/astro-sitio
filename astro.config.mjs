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
      // Variables de WhatsApp para desarrollo
      'import.meta.env.WHATSAPP_TOKEN': JSON.stringify(process.env.WHATSAPP_TOKEN || ''),
      'import.meta.env.WHATSAPP_PHONE_ID': JSON.stringify(process.env.WHATSAPP_PHONE_ID || ''),
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
