import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "당구 캡처 메모",
        short_name: "당구메모",
        lang: "ko",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#fbfaf6",
        theme_color: "#1a1a1a",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,ico,woff2}"],
      },
    }),
  ],
  test: {
    environment: "jsdom",
  },
});
