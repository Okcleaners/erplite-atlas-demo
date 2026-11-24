import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";
import { explorerPath } from "../../src/public-content.js";

const here = path => new URL(path, import.meta.url);
const text = path => readFile(here(path), "utf8");
const innerSvg = svg => svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>"));
const bundle = async (entry, options) => (await build({
  entryPoints: [fileURLToPath(here(entry))], bundle: true, write: false, ...options
})).outputFiles[0].text;

export async function writeExplorer(root, { website = false } = {}) {
  const [sharedCss, css, symbols, models, script, template] = await Promise.all([
    text("../../public/quiet-orbit.css"),
    text("./explorer.css"),
    text("../../public/images/quiet-orbit.svg"),
    text("./storefronts.svg"),
    bundle("./explorer.mjs", { format: "iife", target: "es2022", minify: true }),
    // Compile the shared café TypeScript fixture at build time, including on Node 22.12.
    bundle("./page.mjs", { platform: "node", format: "esm", target: "node22" })
  ]);
  const { document } = await import("data:text/javascript;base64," + Buffer.from(template).toString("base64"));
  const html = document({ sharedCss, css, symbols: innerSvg(symbols), models: innerSvg(models), script, website });
  const directory = join(root, explorerPath.slice(1));
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "index.html"), html);
  console.log("Connected Business Explorer: " + Buffer.byteLength(html) + " bytes, " + gzipSync(html).length + " bytes gzip");
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  await writeExplorer(fileURLToPath(here("./dist/")));
