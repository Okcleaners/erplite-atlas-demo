import { cpSync, existsSync, mkdirSync, rmSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(repoRoot, "dist");
const nestedIndex = join(distDir, "app", "index.html");
const distIndex = join(distDir, "index.html");
const distAssets = join(distDir, "assets");
const rootAssets = join(repoRoot, "assets");
const publicDir = join(repoRoot, "public");

if (existsSync(nestedIndex)) {
  copyFileSync(nestedIndex, distIndex);
}

if (!existsSync(distIndex)) {
  throw new Error("Vite build did not produce an index.html for Pages.");
}

const rootSafeHtml = readFileSync(distIndex, "utf8").replaceAll("../assets/", "./assets/");
writeFileSync(distIndex, rootSafeHtml);
writeFileSync(join(repoRoot, "index.html"), rootSafeHtml);

if (existsSync(rootAssets)) {
  rmSync(rootAssets, { recursive: true, force: true });
}

mkdirSync(rootAssets, { recursive: true });
cpSync(distAssets, rootAssets, { recursive: true });

for (const fileName of ["CNAME", ".nojekyll", "atlasade-brand-reference.png"]) {
  const publicFile = join(publicDir, fileName);
  if (existsSync(publicFile)) {
    copyFileSync(publicFile, join(repoRoot, fileName));
  }
}
