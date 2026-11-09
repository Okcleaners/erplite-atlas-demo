import { cp, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const preview = resolve(root, "dist-preview");
// Validate the fixed disposable output path before recursively replacing it.
if (dirname(preview) !== root || preview !== join(root, "dist-preview")) throw new Error("Unsafe preview output path");
await rm(preview, { recursive: true, force: true });
await cp(join(root, "dist"), preview, { recursive: true });
async function mark(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await mark(path);
    else if (entry.name.endsWith(".html")) {
      const html = await readFile(path, "utf8");
      await writeFile(path, html.replace("</head>", '<meta name="robots" content="noindex" /></head>'));
    }
  }
}
await mark(preview);
await writeFile(join(preview, "_headers"), "/*\n  X-Robots-Tag: noindex\n  X-Content-Type-Options: nosniff\n");
console.log("Prepared isolated dist-preview with noindex in every HTML response and asset header. Production dist unchanged.");
