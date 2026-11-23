import { readBoundedBody } from "../scripts/bounded-body.mjs";
import { createMcpHandler, readRequestBody, isJsonContentType } from "@modelcontextprotocol/server";
import { knowledgeServer } from "./tools.mjs";

const maxBody = 8 * 1024;

function failure(status, code, message, id = null) {
  return Response.json({ jsonrpc: "2.0", id, error: { code, message } }, { status });
}

// expectedOrigin is supplied by the operator. Request headers never select an upstream.
export function knowledgeHandler(reader, expectedOrigin) {
  const expectedHost = new URL(expectedOrigin).host;
  const sdk = createMcpHandler(() => knowledgeServer(reader), {
    responseMode: "auto", legacy: "stateless", maxRequestBodySize: maxBody, maxSubscriptions: 0
  });
  let active = 0;
  async function dispatch(request) {
    const url = new URL(request.url);
    if (url.host !== expectedHost || (request.headers.has("host") && request.headers.get("host") !== expectedHost) ||
        (request.headers.has("origin") && request.headers.get("origin") !== expectedOrigin))
      return failure(403, -32600, "Origin or host rejected.");
    if (url.pathname !== "/mcp" || url.search) return new Response(null, { status: 404 });
    if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
    if (!isJsonContentType(request.headers.get("content-type") ?? "")) return failure(415, -32600, "JSON required.");
    const body = await readRequestBody(request, maxBody);
    if (body.tooLarge) return failure(413, -32600, "Request is too large.");
    let message;
    try { message = JSON.parse(body.text); } catch { return failure(400, -32700, "Invalid JSON."); }
    if (!message || typeof message !== "object" || Array.isArray(message))
      return failure(400, -32600, "Expected one JSON-RPC message.");
    return sdk.fetch(request, { parsedBody: message });
  }
  return {
    close: sdk.close,
    async fetch(request) {
      if (active >= 16) return new Response("Busy", { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "1" } });
      active++;
      try {
        const response = await dispatch(request);
        const headers = new Headers(response.headers);
        headers.set("Cache-Control", "no-store");
        headers.set("X-Content-Type-Options", "nosniff");
        // The legacy SDK can return SSE headers before the tool finishes. Hold the
        // concurrency slot until the terminal message and bound the actual wire bytes.
        const body = response.body ? await readBoundedBody(response, 64 * 1024) : null;
        return new Response(body, { status: response.status, headers });
      } catch {
        return new Response("Request unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
      } finally {
        active--;
      }
    }
  };
}
