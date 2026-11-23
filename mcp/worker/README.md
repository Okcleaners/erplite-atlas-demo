# Local Worker qualification

The MCP Worker exposes one POST endpoint and the same four 004C tools. The Worker has two read-only service bindings. `PUBLIC_KNOWLEDGE` serves the approved website release. `CHECKPOINT` is a private Worker that can only return the current approved checkpoint. Only that second Worker has an R2 binding. Neither Worker exposes a publication method.

## What makes an answer current

1. Read the current checkpoint from the private binding. Check its schema, generation, predecessor and complete release ID. An empty store, malformed head or unavailable reader prevents an answer.
2. Use the 004B reader against the fixed release binding. The first manifest must name the independently approved ID. The reader verifies artifact sizes and SHA-256 digests, validates the schemas, recomputes the release identity, and revalidates the manifest after acquisition.
3. Read the checkpoint again. A changed generation, release ID or predecessor invalidates the operation. Apply the UTC evidence deadline after that check, then produce the 004C tool result. Withdrawn and expired records cannot contribute answers or edges.
4. Each operation owns its I/O and has a ten-second acquisition deadline. The adapter never serves a previous successful answer after an error. The 16-request limit is local to an isolate. Each current call reads four artifacts afresh and can use an ETag on its second manifest read. No global promise, release snapshot or mutable answer cache crosses requests.

The final checkpoint observation defines the point at which the answer was current. A client can receive or retain that answer after a subsequent promotion. Revalidate on the next answer. The checkpoint confirms a publisher's approval of specific bytes. Merchant-product approval and commercial availability still come from the reviewed record.

## Promotion and trust

Each generation occupies a unique key under `knowledge-checkpoints/v1/` in a dedicated R2 bucket. Fixed-width reverse generation numbers make the latest record the first result of a strongly consistent prefix list. The private reader checks the listed object's version, size, key and bounded JSON. It rejects a corrupt head without searching backward. [R2 consistency](https://developers.cloudflare.com/r2/reference/consistency/) · [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)

The local operator fixture accepts an expected predecessor and an independently approved full release digest. It checks the existing lineage, rejects previously approved IDs, then conditionally creates the next key. Competing writers cannot both create that generation. This helper runs outside the Worker bundles. The seeded baseline digest is fixed in the local rehearsal and is never learned from the public origin.

For a hosted pilot, the release owner should review the predecessor, new digest, record revisions and withdrawal notices as one promotion. Stage and validate the compiled release, then append the checkpoint through a separately authorized publisher. The mismatched interval fails closed. Correct a bad release by issuing a newly reviewed successor. Protect the history prefix against overwrite and deletion, disable lifecycle deletion, restrict bucket administration and audit publisher and configuration changes. Deleting the head or restoring the entire trusted store to an earlier snapshot compromises freshness. Exercise a restore against an independent publication audit before allowing it to serve. [R2 bucket locks](https://developers.cloudflare.com/r2/buckets/bucket-locks/)

## Reproduce locally

From the website worktree, use `npm ci` and `npm ci --prefix mcp`. The Worker harness uses the exact esbuild, Miniflare and workerd versions already in the website development lockfile.

```sh
npm run check
npm test --prefix mcp
npm run test:worker
```

For interactive local clients, build the preview with `npm run build:preview`. Start the website emulator in one terminal.

```sh
node node_modules/wrangler/bin/wrangler.js dev --local --ip 127.0.0.1 --port 18749 --inspector-port 0
```

For a fresh local R2 directory, run the explicit seed command once before starting the MCP emulator. An ordinary start preserves the existing checkpoint and an empty authority fails closed.

```sh
node mcp/qualification/local.mjs --seed-reviewed-004c
node mcp/qualification/local.mjs
```

The MCP endpoint is `http://127.0.0.1:18750/mcp`. Run `python mcp/test/reference_client.py --port 18750` with the Python MCP SDK and HTTPX. The benchmark reports the duration inside the Worker handler, including its binding calls, separately from client round-trip time. Local development timers can advance during CPU work. Hosted Worker CPU and edge network performance require separate measurements. [Workers timers](https://developers.cloudflare.com/workers/runtime-apis/performance/)

The qualification suite starts two separately routed workerd instances, a private checkpoint reader and disposable emulated R2. Its fixture-only bundle can vary the UTC clock across requests to the same warm isolate. The normal Worker entry uses the runtime clock. The synthetic publisher, test clock and filesystem helpers are absent from both normal Worker entrypoints.

## Hosted preview requirements

| Component | Required configuration |
| --- | --- |
| MCP Worker | Bundle `mcp/worker/entry.mjs` as an ES module. Use the locally qualified compatibility date `2026-10-26`. Set `MCP_ORIGIN` to the single approved HTTPS preview origin. Route only the MCP path. Bypass CDN caching and preserve `no-store` on successes and errors. |
| Knowledge service | Bind `PUBLIC_KNOWLEDGE` to a read-only service serving the existing compiled website release. Honor conditional requests on the stable manifest, reject redirects, and bypass stale-on-error responses. The local harness forwards only five fixed paths to the local site emulator. |
| Checkpoint reader | Bundle `mcp/worker/checkpoint-reader.mjs` as a private service with `CHECKPOINT_BUCKET` on the dedicated bucket. Bind it as `CHECKPOINT` to the MCP Worker. Give it no public route, custom domain, workers.dev URL or version-preview URL. |
| Operator | Use a separate identity and approval process to append checkpoints. Keep publisher credentials, approval files and test controls outside all public artifacts. |
| Preview perimeter | Require Cloudflare Access on the MCP hostname and the website preview, including agent JSON, schema, legacy catalog and asset paths. Protect or disable Pages aliases, workers.dev, version-preview URLs and other direct routes. Use service-token policies for approved clients that support the headers. Verify anonymous denial, authenticated retrieval and token revocation on every enabled hostname. |
| Abuse controls | Apply edge rate limiting before the MCP handler. Start pilot testing at 60 requests per minute per authenticated identity, with separate limits for tool discovery and answer-bearing operations where practical. Return 429 and retry guidance. Isolate concurrency and per-location rate limits are not global quotas. Monitor aggregate validation failures, deadlines, CPU, request counts and response sizes without logging user questions or answers. |

The hosted pilot needs two Worker entrypoints, one strongly consistent bucket, two service bindings and the existing public-release origin or its read-only asset adapter. The public website can retain its current hosting. Hosted Access policy, bucket locks, storage permissions, route inventory and propagation across real Cloudflare locations require independent acceptance. [Service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/) · [Access service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/) · [Workers rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

## Recorded local results

Wrangler 4.153.0, Miniflare 5.20261023.0-beta and workerd 1.20261023.1 ran locally on Windows. The MCP Inspector 2.16.0 and Python SDK 1.26.0 used the 2025-11-25 initialization handshake. The TypeScript client 2.4.0 pinned 2026-07-28 and used discovery. Each client listed and invoked all four tools.

In the completed benchmark, each tool had two warmups and 30 measured sequential calls. The elapsed times include the local R2, the private reader and the website emulator. No model ran.

| Tool | Worker p50 | Worker p95 | Loopback round-trip p95 | Decoded JSON response bytes |
| --- | ---: | ---: | ---: | ---: |
| Search | 92 ms | 104 ms | 116.94 ms | 1,086 |
| Fetch | 114 ms | 135 ms | 168.58 ms | 2,756 |
| Compare requirements | 109 ms | 125 ms | 141.40 ms | 5,562 |
| Related capabilities | 123 ms | 130 ms | 148.01 ms | 1,512 |

The two-isolate suite held 16 simultaneous acquisitions on one instance. The seventeenth received 429, the other instance answered, and all 16 held requests completed on the correct release. A full emulator restart preserved the independent checkpoint and rejected a consistent older origin on both cold instances. An earlier benchmark during concurrent local qualification received a fail-closed tool error. The standalone benchmark completed all 120 measured calls. These samples establish neither a hosted latency target nor a saturated throughput limit.

All 39 production website files, including all five JavaScript files, were byte-identical to the 004C build. The browser suite measured Feature Finder at 24.3 ms p95 on its 4× CPU profile and the compressed search budget at 5,457 bytes.

## HTTP qualification boundary

On this Windows host, an HTTP/1.1 request carrying the MCP version header and requesting identity encoding could receive unchunked bytes with a chunked header. The same observation reproduced with a standalone Node HTTP server returning five bytes with an explicit content length. Gzip-capable reference clients completed the tested exchanges. Verify identity encoding and normal compression on an independent host before expanding the preview audience. The local results do not isolate the host component responsible.
