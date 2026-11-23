import { build } from "esbuild";
import { Miniflare } from "miniflare";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../worker/", import.meta.url));
function worker(name, contents, env) {
  return {
    config: { name, compatibilityDate: "2026-10-26", env, manifest: {
      mainModule: "worker.mjs", modules: { "worker.mjs": { type: "esm", contents } }
    } },
    dev: { outboundService: { type: "fetcher", handler: () => new Response(null, { status: 403 }) } }
  };
}

async function bundle(entry, clock) {
  const input = clock ? { stdin: { resolveDir: root, contents:
    `import { AsyncLocalStorage } from "node:async_hooks";
     import { createWorker } from "./service.mjs";
     const clock = new AsyncLocalStorage();
     const worker = createWorker(() => new Date(clock.getStore()));
     export default { fetch(req, env) {
       return clock.run(req.headers.get("x-fixture-clock") || ${JSON.stringify(clock)}, () => worker.fetch(req, env));
     } };` } }
    : { entryPoints: [entry] };
  const result = await build({ ...input, absWorkingDir: root, bundle: true, format: "esm",
    platform: "browser", conditions: ["workerd", "worker"], external: ["node:*"], target: "es2022", write: false });
  return result.outputFiles[0].text;
}

export async function runtime({ publicKnowledge, origin, port = 0, storage, instanceOrigins = [origin], clock }) {
  const [main, checkpoint] = await Promise.all([bundle("entry.mjs", clock), bundle("checkpoint-reader.mjs")]);
  const workers = instanceOrigins.map((address, i) => {
    const instance = worker("mcp-" + i, main, {
      MCP_ORIGIN: { type: "text", value: address },
      CHECKPOINT: { type: "worker", worker: "checkpoint-reader" },
      PUBLIC_KNOWLEDGE: { type: "fetcher", handler: publicKnowledge }
    });
    if (instanceOrigins.length > 1) instance.config.triggers = [{ type: "fetch", pattern: new URL(address).hostname + "/*" }];
    return instance;
  });
  workers.push(worker("checkpoint-reader", checkpoint, {
    CHECKPOINT_BUCKET: { type: "r2", name: "trusted-public-release-history" }
  }));
  const mf = new Miniflare({ host: "127.0.0.1", port, cf: false, resourcePersistencePath: storage, workers });
  try {
    await mf.ready;
    return { mf, bucket: await mf.getR2Bucket("CHECKPOINT_BUCKET", "checkpoint-reader") };
  } catch (error) {
    await mf.dispose();
    throw error;
  }
}

const paths = new Set(["/agents/manifest.json", "/agents/capabilities.json", "/agents/graph.json",
  "/agents/schema.json", "/finder/catalog.v1.json"]);

// Development binding to the local website emulator. Never forward client headers or arbitrary URLs.
export function localRelease(origin) {
  const url = new URL(origin);
  if (url.hostname !== "127.0.0.1" || url.protocol !== "http:") throw new Error("Expected loopback release origin");
  return async request => {
    const path = new URL(request.url).pathname;
    if (request.method !== "GET" || !paths.has(path)) return new Response(null, { status: 404 });
    const etag = request.headers.get("if-none-match");
    return fetch(new URL(path, url.origin), { headers: etag ? { "If-None-Match": etag } : {},
      redirect: "error", cache: "no-cache", signal: AbortSignal.timeout(10000) });
  };
}
