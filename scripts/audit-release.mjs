import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { featureDocuments } from "./feature-pages.mjs";
import { agentGuide } from "./agent-guide.mjs";
import { explorerPath, pages } from "../src/public-content.js";
import { sha256 } from "./knowledge-release.mjs";

export async function auditRelease(root, release) {
  const { manifest, files, capabilities } = release;
  const routes = ["/", "/app/", "/features/", "/agents/", "/day-with-atlasade/", explorerPath,
    ...pages.map(p => p.path), ...capabilities.records.map(r => "/features/" + r.slug + "/")];
  const allowed = new Set(["404.html", "CNAME", "_headers", ".nojekyll", "sitemap.xml", "robots.txt",
    "atlasade-brand-reference.png", "images/cafe-morning.webp", "quiet-orbit.css", "images/quiet-orbit.svg", "favicon.ico",
    "finder/ui.js", "finder/search.js", "finder/style.css", "finder/catalog.schema.json",
    ...routes.map(path => path.slice(1) + "index.html"), ...[...files.keys()].map(path => path.slice(1))]);
  async function inspect(directory = "") {
    for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
      const path = directory + entry.name;
      if (entry.isDirectory()) { await inspect(path + "/"); continue; }
      if (!entry.isFile() || (!allowed.has(path) && !/^assets\/[a-z0-9-]+-[\w-]{8}\.(?:js|css)$/i.test(path)))
        throw new Error("Unexpected compiled asset: " + path);
      if (/\.(?:html|js|css|json|txt|xml|svg)$/.test(path)) {
        const contents = await readFile(join(root,path), "utf8");
        if (/Okcleaners\/|rust_core[\\/]|operator_harness[\\/]|docs[\\/]graphify|approved-revisions\.json|[A-Z]:[\\/]Users[\\/]|-----BEGIN (?:\w+ )*PRIVATE KEY-----/i.test(contents))
          throw new Error("Internal reference in compiled asset: " + path);
      }
    }
  }
  await inspect();
  for (const [path, expected] of files) {
    const bytes = await readFile(join(root, path.slice(1)));
    if (!bytes.equals(Buffer.from(expected))) throw new Error("Release artifact mismatch: " + path);
    const entry = manifest.artifacts.find(item => item.path === path);
    if (entry && (entry.sha256 !== sha256(bytes) || entry.bytes !== bytes.length)) throw new Error("Digest mismatch: " + path);
  }
  const documents = await featureDocuments(release);
  documents.set("/agents/", agentGuide(release));
  for (const [route, expected] of documents) {
    const html = await readFile(join(root, route.slice(1), "index.html"), "utf8");
    const previewHtml = expected.replace("</head>", '<meta name="robots" content="noindex" /></head>');
    if (html !== expected && html !== previewHtml) throw new Error("Release HTML mismatch: " + route);
  }
  for (const r of release.current) {
    for (const citation of r.citations) {
      const url = new URL(citation.url);
      const page = await readFile(join(root, url.pathname.slice(1), "index.html"), "utf8");
      if (!page.includes('id="' + url.hash.slice(1) + '"')) throw new Error("Unresolved public citation: " + url.href);
    }
  }
}
