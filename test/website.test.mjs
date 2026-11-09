import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { resolve, join, dirname, extname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { pages, site } from "../src/public-content.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path, variant = "dist") => readFile(join(root, variant, path), "utf8");
const pageFiles = ["index.html", ...pages.map((page) => `${page.path.slice(1)}index.html`)];
const attribute = (tag, key) => tag.match(new RegExp(`\\b${key}="([^"]*)"`))?.[1];
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "g"))].map((match) => match[0]);
const visibleText = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
const canonical = (html) => attribute(tags(html, "link").find((tag) => attribute(tag, "rel") === "canonical"), "href");

test("the original Vite and sync build stages run before static rendering", async () => {
  const pkg = JSON.parse(await readFile(join(root, "package.json")));
  assert.equal(pkg.scripts.build, "vite build && node scripts/sync-pages-root.mjs && node scripts/build-public.mjs");
  assert.equal(pkg.devDependencies.wrangler, "4.152.0");
  const lock = JSON.parse(await readFile(join(root, "package-lock.json")));
  assert.equal(lock.packages["node_modules/wrangler"].version, pkg.devDependencies.wrangler);
  assert.equal(lock.packages["node_modules/react"].version, "19.2.6");
  assert.equal(lock.packages["node_modules/vite"].version, "8.0.10");
});

test("raw homepage has useful content, limitations, and JavaScript-free navigation", async () => {
  const html = await read("index.html");
  const text = visibleText(html);
  for (const phrase of ["Run your business", "Sales Register", "Inventory", "Privacy Policy", "Alpha product overview", "commercially released"]) assert.ok(text.includes(phrase), phrase);
  assert.match(html, /<nav aria-label="Primary navigation">[\s\S]*?<a href="#home"/);
  assert.match(html, /<a class="button primary" href="#alpha">/);
  assert.match(html, /<details>/);
  assert.match(html, /<summary>Inventory<\/summary>/);
  assert.ok(!html.includes('id="root"></div>'));
  assert.match(html, /<noscript><style>.*opacity:1!important/);
  assert.match(html, /type="module"[^>]*src="\/assets\//);
  const source = await readFile(join(root, "src/main.jsx"), "utf8");
  assert.match(source, /hydrateRoot\(root, <App \/>\)/);
});

test("every canonical page has substantial readable HTML, unique metadata, and matching schema", async () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const path of pageFiles) {
    const html = await read(path);
    assert.ok(visibleText(html).split(" ").length > 180, path);
    assert.equal(tags(html, "h1").length, 1, path);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = attribute(tags(html, "meta").find((tag) => attribute(tag, "name") === "description"), "content");
    assert.ok(title && description, path);
    titles.add(title); descriptions.add(description);
    const expectedPath = path === "index.html" ? "/" : `/${path.replace(/index.html$/, "")}`;
    assert.equal(canonical(html), `${site}${expectedPath}`);
    assert.equal(tags(html, "link").filter((tag) => attribute(tag, "rel") === "canonical").length, 1);
    assert.equal(attribute(tags(html, "meta").find((tag) => attribute(tag, "property") === "og:url"), "content"), canonical(html));
    assert.equal(attribute(tags(html, "meta").find((tag) => attribute(tag, "property") === "og:image"), "content"), `${site}/atlasade-brand-reference.png`);
    assert.equal(attribute(tags(html, "meta").find((tag) => attribute(tag, "name") === "twitter:card"), "content"), "summary_large_image");
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema["@context"], "https://schema.org");
    for (const type of ["Organization", "WebSite"]) assert.ok(schema["@graph"].some((node) => node["@type"] === type));
    assert.ok(!/"(offers|price|aggregateRating|review|downloadUrl|softwareVersion)"/.test(JSON.stringify(schema)));
    if (path.startsWith("product/")) assert.ok(schema["@graph"].some((node) => node["@type"] === "SoftwareApplication"));
    if (path !== "index.html") assert.ok(!html.includes('type="module"'), path);
  }
  assert.equal(titles.size, pageFiles.length);
  assert.equal(descriptions.size, pageFiles.length);
});

test("all generated internal links, fragments, stylesheets, scripts, and images resolve", async () => {
  const files = [...pageFiles, "app/index.html", "404.html"];
  for (const path of files) {
    const html = await read(path);
    const current = path === "index.html" ? "/" : `/${path.replace(/index.html$/, "")}`;
    for (const name of ["a", "link", "script", "img"]) for (const tag of tags(html, name)) {
      const reference = attribute(tag, name === "a" || name === "link" ? "href" : "src");
      if (!reference || /^(mailto:|tel:)/.test(reference)) continue;
      const url = new URL(reference.replaceAll("&amp;", "&"), `${site}${current}`);
      if (url.origin !== site) continue;
      let target = decodeURIComponent(url.pathname).slice(1);
      if (!target || target.endsWith("/")) target += "index.html";
      const buffer = await readFile(join(root, "dist", target));
      assert.ok(buffer.length > 0, `${path} -> ${reference}`);
      if (url.hash && extname(target) === ".html") {
        const id = decodeURIComponent(url.hash.slice(1));
        assert.ok(tags(buffer.toString(), "[a-z][a-z0-9]*").some((node) => attribute(node, "id") === id), `${path} -> missing ${reference}`);
      }
    }
  }
});

test("preview exclusion never changes the production artifact", async () => {
  for (const path of [...pageFiles, "app/index.html"]) {
    assert.doesNotMatch(await read(path), /name="robots" content="noindex"/);
    assert.match(await read(path, "dist-preview"), /name="robots" content="noindex"/);
  }
  const production = await read("_headers");
  assert.doesNotMatch(production, /^\/\*\n\s+X-Robots-Tag: noindex/m);
  assert.match(production, /https:\/\/:worker\.:account\.workers\.dev\/\*/);
  assert.match(await read("_headers", "dist-preview"), /^\/\*\n\s+X-Robots-Tag: noindex/m);
  assert.equal(canonical(await read("index.html", "dist-preview")), `${site}/`);
});

test("robots explicitly allows search; sitemap has only real canonical pages", async () => {
  const robots = (await read("robots.txt")).replaceAll("\r\n", "\n");
  for (const bot of ["OAI-SearchBot", "Googlebot", "Bingbot"]) assert.ok(robots.includes(`User-agent: ${bot}\nAllow: /`));
  assert.ok(robots.includes(`Sitemap: ${site}/sitemap.xml`));
  assert.ok(!robots.includes("Disallow: /"));
  const sitemap = await read("sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(urls, [`${site}/`, ...pages.map((page) => `${site}${page.path}`)]);
  assert.ok(!sitemap.includes("workers.dev") && !sitemap.includes("/app/") && !sitemap.includes("404"));
});

test("the upload boundary contains only site assets and no source, review docs, or environment files", async () => {
  async function inspect(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      assert.ok(!/^(src|scripts|docs|node_modules|\.git|\.env.*|\.dev.vars.*|package.*\.json|wrangler.*)$/.test(entry.name), entry.name);
      if (entry.isDirectory()) await inspect(join(path, entry.name));
    }
  }
  await inspect(join(root, "dist"));
  const config = JSON.parse(await readFile(join(root, "wrangler.jsonc")));
  assert.equal(config.assets.directory, "./dist-preview");
  assert.equal(config.assets.not_found_handling, "none");
  assert.equal(config.workers_dev, false);
  for (const key of ["main", "routes", "d1_databases", "kv_namespaces", "services", "vars"]) assert.ok(!(key in config), key);
});

async function unusedPort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function localAssets(variant, check) {
  const temp = await mkdtemp(join(tmpdir(), "atlas-website-http-"));
  const cli = process.env.WRANGLER_BIN || join(root, "node_modules/wrangler/bin/wrangler.js");
  const version = JSON.parse(await readFile(resolve(dirname(cli), "../package.json"))).version;
  assert.equal(version, "4.152.0", "HTTP tests must use the pinned Wrangler release");
  const port = await unusedPort();
  const config = join(temp, "wrangler.json");
  await writeFile(config, JSON.stringify({ name: "atlas-website-local-test", compatibility_date: JSON.parse(await readFile(join(root, "wrangler.jsonc"))).compatibility_date, workers_dev: false, assets: { directory: join(root, variant), not_found_handling: "none" } }));
  const child = spawn(process.execPath, [cli, "dev", "--local", "--ip", "127.0.0.1", "--port", String(port), "--inspector-port", "0", "--config", config], {
    cwd: temp, env: { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "true" }, stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (data) => { log = (log + data).slice(-6000); });
  child.stderr.on("data", (data) => { log = (log + data).slice(-6000); });
  try {
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(`Local Wrangler exited: ${log}`);
      try { const response = await fetch(base); if (response.status === 200) { ready = true; break; } } catch {}
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    assert.ok(ready, `Local Wrangler did not start: ${log}`);
    await check(base);
  } finally {
    child.kill();
    await new Promise((resolve) => { if (child.exitCode !== null) resolve(); else child.once("exit", resolve); });
    // Fixed generated temp prefix; never clean an arbitrary supplied path.
    assert.ok(temp.startsWith(join(tmpdir(), "atlas-website-http-")));
    await rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

test("actual Workers asset HTTP behavior: production pages, redirects, assets, and genuine 404s", { timeout: 45000 }, async () => {
  await localAssets("dist", async (base) => {
    for (const path of ["/", ...pages.map((page) => page.path), "/app/", "/robots.txt", "/sitemap.xml", "/atlasade-brand-reference.png"]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      assert.notEqual(response.headers.get("x-robots-tag"), "noindex", path);
      if (path.endsWith("/")) assert.match(await response.text(), /Alpha product overview/);
    }
    const redirect = await fetch(base + "/product", { redirect: "manual" });
    assert.ok([301, 307, 308].includes(redirect.status));
    assert.equal(new URL(redirect.headers.get("location"), base).pathname, "/product/");
    for (const path of ["/not-a-real-page", "/product/not-a-real-page", "/assets/missing.js", "/src/App.jsx", "/docs/website-readiness.md"]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 404, path);
      assert.ok(!(await response.text()).includes("Run your business"));
    }
    const head = await fetch(base + "/product/", { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    const html = await (await fetch(base)).text();
    for (const tag of [...tags(html, "script"), ...tags(html, "link")]) {
      const path = attribute(tag, "src") || (attribute(tag, "rel") === "stylesheet" && attribute(tag, "href"));
      if (path) assert.equal((await fetch(base + path)).status, 200, path);
    }
  });
});

test("actual preview HTTP behavior: noindex and crawler-readable content", { timeout: 45000 }, async () => {
  await localAssets("dist-preview", async (base) => {
    for (const path of ["/", ...pages.map((page) => page.path), "/app/"]) {
      const response = await fetch(base + path, { headers: { "User-Agent": "OAI-SearchBot/1.4" } });
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get("x-robots-tag"), "noindex", path);
      assert.match(await response.text(), /name="robots" content="noindex"/);
    }
    assert.equal((await fetch(base + "/not-a-real-page")).status, 404);
    assert.equal((await fetch(base + "/robots.txt")).status, 200);
  });
});


test("Vite local preview also keeps unknown pages as 404", { timeout: 15000 }, async () => {
  const { preview } = await import("vite");
  const port = await unusedPort();
  const server = await preview({ root, preview: { host: "127.0.0.1", port, strictPort: true, open: false } });
  try {
    for (const path of ["/", "/product/", "/faq/"]) assert.equal((await fetch(`http://127.0.0.1:${port}${path}`)).status, 200, path);
    for (const path of ["/not-a-real-page", "/product/not-a-real-page", "/assets/missing.js"]) assert.equal((await fetch(`http://127.0.0.1:${port}${path}`)).status, 404, path);
  } finally {
    server.httpServer.closeAllConnections();
    await new Promise((resolve) => server.httpServer.close(resolve));
  }
});
