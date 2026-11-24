import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";
import { document } from "./page.mjs";

const here = path => new URL(path, import.meta.url);
const text = path => readFile(here(path), "utf8");
const innerSvg = svg => svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>"));
const [sharedCss, css, symbols, models, bundle] = await Promise.all([
  text("../../public/quiet-orbit.css"),
  text("./explorer.css"),
  text("../../public/images/quiet-orbit.svg"),
  text("./storefronts.svg"),
  build({ entryPoints: [fileURLToPath(here("./explorer.mjs"))], bundle: true, format: "iife",
    target: "es2022", minify: true, write: false })
]);
const html = document({ sharedCss, css, symbols: innerSvg(symbols), models: innerSvg(models),
  script: bundle.outputFiles[0].text });
const directory = here("./dist/connected-business-explorer/");
await mkdir(directory, { recursive: true });
await writeFile(new URL("index.html", directory), html);
console.log("Connected Business Explorer: " + Buffer.byteLength(html) + " bytes, " + gzipSync(html).length + " bytes gzip");
