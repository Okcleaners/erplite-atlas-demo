import { createServer } from "node:http";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";
import { currentKnowledge } from "../scripts/read-current-knowledge.mjs";
import { knowledgeHandler } from "./handler.mjs";

export async function serveLocal(reader, port = 0) {
  let handler;
  let origin;
  const server = createServer({ headersTimeout: 10000, requestTimeout: 15000, maxHeaderSize: 8192 }, async (req, res) => {
    try {
      if (req.url !== "/mcp") {
        res.writeHead(404, { "Cache-Control": "no-store" }).end();
        return;
      }
      const headers = new Headers(Object.entries(req.headersDistinct).flatMap(
        ([key, values]) => values.map(value => [key, value])
      ));
      const reqBody = !["GET", "HEAD"].includes(req.method) ? { body: Readable.toWeb(req), duplex: "half" } : {};
      const response = await handler.fetch(new Request(origin + "/mcp", { method: req.method, headers, ...reqBody }));
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) Readable.fromWeb(response.body).on("error", () => res.destroy()).pipe(res);
      else res.end();
    } catch {
      if (!res.headersSent) res.writeHead(400, { "Cache-Control": "no-store" });
      res.end();
    }
  });
  server.maxConnections = 48;
  server.setTimeout(15000, socket => socket.destroy());
  await new Promise((resolve, reject) => server.once("error", reject).listen(port, "127.0.0.1", resolve));
  origin = "http://127.0.0.1:" + server.address().port;
  handler = knowledgeHandler(reader, origin);
  return {
    url: origin + "/mcp",
    async close() {
      server.closeAllConnections();
      await Promise.all([handler.close(), new Promise(resolve => server.close(resolve))]);
    }
  };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const app = await serveLocal(currentKnowledge("http://127.0.0.1:18747"), 18748);
  console.log("Public knowledge MCP listening at " + app.url);
}
