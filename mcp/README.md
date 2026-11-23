# Atlasade read-only knowledge service

The local Streamable HTTP endpoint is `http://127.0.0.1:18748/mcp`. Supply that URL explicitly in a client on this computer. The website preview serves the approved release at `http://127.0.0.1:18747/agents/`. The canonical URLs returned by tools identify public documentation. Use the same paths on the preview to inspect this local build.

## Run and qualify locally

Use the website's pinned build tools. From the website worktree, install and build the two separate packages.

```sh
npm ci
npm ci --prefix mcp
npm run build:preview
node node_modules/wrangler/bin/wrangler.js dev --local --ip 127.0.0.1 --port 18747 --inspector-port 0
```

In a second terminal run `npm start --prefix mcp`. The local server uses a fixed release origin, listens on IPv4 loopback and accepts same-origin or native HTTP clients. It requires no credentials. The adapter and its dependencies stay outside both website output directories.

Run `npm run check` and `npm test --prefix mcp`. With the above endpoints running and Python MCP SDK 1.26.0 and HTTPX available, run `python mcp/test/reference_client.py` to exercise the four tools and measure modern HTTP responses. The existing website browser suites live under `test/browser/`.

For an independent listing on a supported Inspector Node runtime:

```sh
npx --package=@modelcontextprotocol/inspector@2.16.0 mcp-inspector --cli http://127.0.0.1:18748/mcp --transport http --method tools/list
```

## Protocol and answer contract

The pinned official server SDK implements modern per-request discovery and a stateless legacy initialization path using the same tool factory. Modern clients can pin 2026-07-28 and call `server/discover`, `tools/list`, then `tools/call`. The Python client and Inspector also negotiated 2025-11-25 via `initialize`. A browser address-bar GET returns 405. The adapter uses no long-lived sessions, background notifications or subscriptions. Remote assistants require a separately reachable and explicitly configured endpoint. [MCP transport specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)

| Tool | Input | Result |
| --- | --- | --- |
| `search` | One English query up to 240 characters | Up to eight ranked reading suggestions, each with ID, title, canonical URL, revision, lifecycle, scope and availability status. |
| `fetch` | A current public feature slug | Approved answer in `text`, sources in `citations`, scope, limitations, dependencies, availability, publication status and review metadata. |
| `compare_requirements` | One to eight strings of up to 240 characters each | A separate outcome for each input. A whole authored question, title, alias or recognized inventory question can match. Related keywords alone yield `unverified`. An unmatched compound stays unverified as a whole and can include up to four clause assessments. |
| `related_capabilities` | A current capability ID and optional `demonstrated_in` filter | Approved outgoing one-hop edges with revision and citation. A current record can legitimately have zero edges. |

Every successful tool result carries the full `releaseId` in both structured content and its text representation. Cite the public source URL and retain the record revision. Revalidate before giving a subsequent answer. Unknown or suppressed IDs return a tool error without claim text. Invalid input and unavailable releases are distinguishable from a successful search with zero results.

Six records describe fictional café behavior. Their comparison outcome is `synthetic_demo_only`. Offline card acceptance and all merchant-specific availability remain unverified. In schema v2 the adapter reserves `explicitly_excluded` for an exact merchant-product match whose reviewed answer begins with “Explicitly excluded: ”. The `supported_within_documented_scope` outcome requires an implemented lifecycle and a reviewed answer beginning with “Supported within the documented scope: ”. These conventions are covered by synthetic tests. Neither has been applied to a released record. Review the scope and matched questions before approving any future product determination.

## Release and resource boundaries

Each answer calls the 004B reader. It checks the manifest twice against a fixed public origin, verifies the four declared artifacts, SHA-256 hashes, release identity and revision history, and filters by evidence, withdrawal and the current UTC day. Concurrent local reads may share an in-flight validation. A failed read returns a generic uncertainty error. Internal errors, authoring paths and approval hashes are outside the answer contract. The runtime imports the public schemas and digest helpers independently of the source-release builder.

The adapter enforces an 8 KiB request limit, strict argument schemas, 16 concurrent requests, a 24 KiB logical result ceiling and a 64 KiB serialized response ceiling. The fixed upstream reader allows 16 KiB per manifest, 256 KiB per artifact, a 10-second overall acquisition deadline and no redirects. Responses use `Cache-Control: no-store`, including failures. A disconnected client can retain anything it previously downloaded. In-process rollback history starts when the reader starts. A consistent old origin on a cold start needs an independent trusted release floor to be rejected.

## Cloudflare Worker qualification

The 004D Worker uses an independent, append-only release checkpoint. Its local endpoint, verified runtime configuration, promotion procedure and hosted-preview controls are in the [Worker qualification guide](worker/README.md).

## 004C pilot design

Mount only the exact MCP path on a separate access-controlled preview. The adapter exposes a Web-standard fetch handler. Replace the local Node listener with a Worker entry and give it a trusted origin or read-only service binding to the existing public release. Pin a tested compatibility date supporting Buffer and Node crypto. Keep website build inputs, private Graphify, POS and account credentials outside that binding. [Workers runtime compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

For multiple isolates, bind each request to a trusted current release ID set by the publication process. Validate the ID again before sending answers. Keep request-owned I/O inside its originating request. Rehearse promotion, cold starts, partial rollout, stale origins, expiry and loss of that authority under local workerd before hosted qualification. A cached artifact may be reused by digest only after the current manifest validates. Bypass CDN caching on the MCP route and preserve the existing static release cache rules.

Protect the preview hostname and aliases with Cloudflare Access. Use identity policy for human testers and a narrowly scoped service token for clients that can supply the required headers. Disable alternate public preview entry points. Exercise denial, authenticated access and revocation using a test client. Add per-caller rate limiting ahead of the reader and verify overload responses. An initial pilot could test 60 requests per minute per authenticated caller alongside the local concurrency and size limits. Cloudflare's rate-limiting binding applies per location and is approximate. Record aggregate timing, sizes and failure reasons without logging merchant questions or answer bodies. [Access service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/) · [Workers rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
