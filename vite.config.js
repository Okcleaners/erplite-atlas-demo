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
        if (!/^\/(?:agents|features)(?:\/|$)/.test(path) && path !== "/finder/catalog.v1.json") return next();
        const { loadRelease } = await server.ssrLoadModule("/scripts/knowledge-release.mjs");
        const release = await loadRelease();
        if (release.files.has(path)) {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(release.files.get(path));
          return;
        }
        const { featureDocuments } = await server.ssrLoadModule("/scripts/feature-pages.mjs");
        const route = path.endsWith("/") ? path : path + "/";
        const { agentGuide } = await server.ssrLoadModule("/scripts/agent-guide.mjs");
        const html = route === "/agents/" ? agentGuide(release) : (await featureDocuments(release)).get(route);
        if (!html) return next();
        if (route !== path) { res.writeHead(302, { Location: route }); res.end(); return; }
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(html);
      });
    },
  }],
});
