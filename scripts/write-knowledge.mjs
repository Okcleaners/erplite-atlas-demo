import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { featureDocuments } from "./feature-pages.mjs";
import { agentGuide } from "./agent-guide.mjs";

export async function writeKnowledge(root, release) {
  const documents = await featureDocuments(release);
  documents.set("/agents/", agentGuide(release));
  const files = new Map(release.files);
  for (const [route, html] of documents) files.set(route + "index.html", html);
  for (const [path, bytes] of files) {
    const file = join(root, path.slice(1));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, bytes);
  }
  return [...documents.keys()];
}
