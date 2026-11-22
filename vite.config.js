import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  appType: "mpa",
  base: "./",
  build: {
    rollupOptions: {
      input: ["app/index.html", "day-with-atlasade/index.html"],
    },
  },
  plugins: [react(), {
    name: "feature-directory-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url.split("?")[0];
        if (!/^\/features(?:\/|$)/.test(path)) return next();
        const { featureDocuments } = await server.ssrLoadModule("/scripts/feature-pages.mjs");
        const route = path.endsWith("/") ? path : path + "/";
        const html = (await featureDocuments()).get(route);
        if (!html) return next();
        if (route !== path) { res.writeHead(302, { Location: route }); res.end(); return; }
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(html);
      });
    },
  }],
});
