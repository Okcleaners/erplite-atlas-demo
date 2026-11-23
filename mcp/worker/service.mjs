import { currentKnowledge } from "../../scripts/read-current-knowledge.mjs";
import { readBoundedBody } from "../../scripts/bounded-body.mjs";
import { knowledgeHandler } from "../handler.mjs";
import { checkpointURL, validateCheckpoint } from "./checkpoint.mjs";

async function checkpoint(binding, signal) {
  const res = await binding.fetch(checkpointURL, { signal, redirect: "manual", cache: "no-store" });
  if (res.status !== 200) throw new Error("Checkpoint unavailable");
  return validateCheckpoint(JSON.parse((await readBoundedBody(res, 512)).toString("utf8")));
}

export function createWorker(now = () => new Date()) {
  const handlers = new WeakMap();
  return {
    async fetch(request, env) {
      const start = performance.now();
      let handler = handlers.get(env);
      if (!handler) {
        handler = knowledgeHandler({
          async read() {
            const signal = AbortSignal.timeout(10000);
            const before = await checkpoint(env.CHECKPOINT, signal);
            // Request-owned streams and pending fetches must stay in this workerd request.
            return currentKnowledge("https://public-knowledge.internal", {
              now, signal, expectedReleaseId: before.releaseId,
              fetchPublic: (url, options) => env.PUBLIC_KNOWLEDGE.fetch(url.href, { ...options, redirect: "manual" }),
              async confirmCurrent() {
                const after = await checkpoint(env.CHECKPOINT, signal);
                if (after.generation !== before.generation || after.releaseId !== before.releaseId ||
                    after.previousReleaseId !== before.previousReleaseId) throw new Error("Checkpoint advanced");
              }
            }).read();
          }
        }, env.MCP_ORIGIN, { legacyJson: true });
        handlers.set(env, handler);
      }
      const response = await handler.fetch(request);
      response.headers.set("Server-Timing", "worker;dur=" + (performance.now() - start).toFixed(2));
      return response;
    }
  };
}
