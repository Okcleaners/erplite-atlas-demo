import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { pages, site, contact, productDescription } from "../src/public-content.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
// A small build-time React render, using the existing Vite/React dependencies.
// No browser, production server, private data source, or additional framework.
await build({
  root, configFile: false, publicDir: false, plugins: [react()], logLevel: "warn",
  build: { ssr: "src/prerender.jsx", outDir: ".prerender", emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: "prerender.mjs" } } },
});
const { renderHome, renderPage } = await import(pathToFileURL(join(root, ".prerender/prerender.mjs")));
let template = (await readFile(join(dist, "index.html"), "utf8")).replaceAll("\r\n", "\n");
template = template.replaceAll('"./assets/', '"/assets/').replaceAll('"../assets/', '"/assets/');
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const json = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");
const organization = { "@type": "Organization", "@id": `${site}/#organization`, name: "AtlasADE", url: `${site}/`, email: contact };
const website = { "@type": "WebSite", "@id": `${site}/#website`, name: "AtlasADE", url: `${site}/`, publisher: { "@id": organization["@id"] } };
const software = { "@type": "SoftwareApplication", "@id": `${site}/product/#software`, name: "AtlasADE", url: `${site}/product/`, applicationCategory: "BusinessApplication", description: productDescription, publisher: { "@id": organization["@id"] } };
const graph = (page) => ({ "@context": "https://schema.org", "@graph": [organization, website, ...(page?.path === "/product/" ? [software] : [])] });

function metadata(html, page) {
  const canonical = `${site}${page?.path ?? "/"}`;
  if (page) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escape(page.title)}</title>`)
      .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/m, `$1${escape(page.description)}$2`)
      .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/m, `$1${escape(page.title)}$2`)
      .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/m, `$1${escape(page.description)}$2`);
  }
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`);
  const title = html.match(/<title>([^<]*)<\/title>/)[1];
  const description = html.match(/name="description"\s+content="([^"]*)"/)[1];
  return html.replace("</head>", `<meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${site}/atlasade-brand-reference.png" />
    <script type="application/ld+json">${json(graph(page))}</script>
    <noscript><style>#root [style*="opacity:0"]{opacity:1!important;transform:none!important}#root .atlas-workbench{display:block}</style></noscript>
  </head>`);
}

const home = metadata(template).replace('<div id="root"></div>', () => `<div id="root">${renderHome()}</div>`);
if (!home.includes('<main id="main">')) throw new Error("Static homepage rendering failed");
await writeFile(join(dist, "index.html"), home);
// Preserve the existing /app/ entry, with working asset URLs and the home canonical.
await writeFile(join(dist, "app/index.html"), home);
for (const page of pages) {
  let html = metadata(template, page).replace('<div id="root"></div>', () => `<div id="root">${renderPage(page)}</div>`);
  // Product reference pages are plain HTML, styled by the existing stylesheet.
  html = html.replace(/\s*<script type="module"[^>]*><\/script>/g, "");
  const directory = join(dist, page.path.slice(1));
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "index.html"), html);
}
const notFound = { path: "/404.html", title: "Page not found | AtlasADE", heading: "Page not found", description: "The requested AtlasADE page could not be found. Return to the product overview or contact the team.", sections: [] };
let errorHtml = metadata(template, notFound).replace('<div id="root"></div>', () => `<div id="root">${renderPage(notFound)}</div>`);
errorHtml = errorHtml.replace(/\s*<script type="module"[^>]*><\/script>/g, "").replace("</head>", '<meta name="robots" content="noindex" /></head>');
await writeFile(join(dist, "404.html"), errorHtml);
const paths = ["/", ...pages.map((page) => page.path)];
await writeFile(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${site}${path}</loc></url>`).join("")}</urlset>\n`);
// Keep the generated root entry aligned with the existing Pages compatibility copy.
await writeFile(join(root, "index.html"), home);
const total = (await stat(join(dist, "index.html"))).size;
console.log(`Rendered ${paths.length} canonical pages, /app/ compatibility entry, and 404.html; homepage ${total} bytes.`);
