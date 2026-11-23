import { createServer } from "node:http";
import { gzipSync } from "node:zlib";

// Record exactly what node:http hands to its loopback socket for this five-byte fixture.
const server = createServer((req, res) => {
  const chunks = [];
  const socket = req.socket;
  const write = socket.write;
  socket.write = function (data, encoding, callback) {
    chunks.push(Buffer.from(data, typeof encoding === "string" ? encoding : undefined));
    return write.call(this, data, encoding, callback);
  };
  const gzip = req.headers["accept-encoding"] === "gzip";
  const body = gzip ? gzipSync("hello") : Buffer.from("hello");
  const chunked = req.headers["x-fixture-framing"] === "chunked";
  res.sendDate = false;
  res.writeHead(200, { "Content-Type": "application/json", Connection: "close",
    ...(gzip ? { "Content-Encoding": "gzip" } : {}),
    ...(chunked ? { "Transfer-Encoding": "chunked" } : { "Content-Length": body.length }) });
  res.on("finish", () => {
    console.log(JSON.stringify({ sent: Buffer.concat(chunks).toString("hex"), peerPort: socket.remotePort }));
  });
  req.resume();
  res.end(body);
});
server.listen(0, "127.0.0.1", () => console.log(server.address().port));
