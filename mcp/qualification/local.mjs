import { fileURLToPath } from "node:url";
import { runtime, localRelease } from "./runtime.mjs";
import { promote } from "./promote.mjs";

const origin = "http://127.0.0.1:18750";
const { mf, bucket } = await runtime({ port: 18750, origin,
  storage: fileURLToPath(new URL("../../.wrangler/004d-r2/", import.meta.url)),
  publicKnowledge: localRelease("http://127.0.0.1:18749") });
if (process.argv.includes("--seed-reviewed-004c")) {
  // Independently pinned from the reviewed 004C release. Never bootstrap trust from the origin.
  try {
    await promote(bucket, { generation: 0, releaseId: null },
      "atlasade-1dcab55623fc531e9db8435d63f30f32f898866b2f1fa9295b33469743ed83da");
  } finally {
    await mf.dispose();
  }
} else {
  console.log("Local workerd MCP endpoint " + origin + "/mcp");
}
