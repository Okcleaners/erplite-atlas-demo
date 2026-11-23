import { checkpointURL, latestCheckpoint } from "./checkpoint.mjs";

export default {
  async fetch(request, env) {
    const headers = { "Cache-Control": "no-store" };
    if (request.url !== checkpointURL || request.method !== "GET") return new Response(null, { status: 404, headers });
    try {
      const head = await latestCheckpoint(env.CHECKPOINT_BUCKET);
      if (head) return Response.json(head, { headers });
    } catch { /* An unreadable latest generation must never fall back to its predecessor. */ }
    return new Response(null, { status: 503, headers });
  }
};
