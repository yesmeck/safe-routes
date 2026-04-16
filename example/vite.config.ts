import { reactRouter } from "@react-router/dev/vite";
import autoprefixer from "autoprefixer";
import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "vite";
import { safeRoutes } from "safe-routes/vite";

export default defineConfig({
  base: "/blog",
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  plugins: [reactRouter(), safeRoutes()],
  resolve: {
    tsconfigPaths: true,
  },
});
