# Website dependency security gate 001

Baseline: `90b2451`, PR #1. Reviewed 2026-11-09 UTC. Seven npm package findings (2 moderate, 5 high) expand to 20 advisory IDs. Miniflare and Wrangler are inherited findings through Undici, not extra distinct advisories.

## Package resolution and dependency chains

| Package | Severity before | Installed before | Resolved | Dependency chain |
| --- | --- | --- | --- | --- |
| miniflare | moderate | 5.20261019.2-beta | 5.20261023.0-beta | wrangler → miniflare |
| nanoid | high | 3.3.12 | 3.3.20 | vite → postcss → nanoid |
| postcss | high | 8.5.14 | 8.5.32 | vite → postcss |
| source-map-js | high | 1.2.1 | 1.2.2 | vite → postcss → source-map-js |
| undici | high | 7.29.1 | 7.30.1 | wrangler → miniflare → undici |
| vite | high | 8.0.10 | 8.1.6 | vite |
| wrangler | moderate | 4.152.0 | 4.153.0 | wrangler |

Vite 8.1.6 is the first release in the existing 8.0/8.1 line that fixes all seven reported Vite advisories. Wrangler 4.153.0 is the first compatible successor whose Miniflare dependency pins Undici 7.30.1. Compatible transitive patch updates are resolved in the lockfile. No new framework, forced fix, audit exception, npm override, or dependency suppression is used. React, ReactDOM, Framer Motion, Lucide, the Vite/sync/static-render pipeline, and production hosting remain unchanged in scope.

## Advisory inventory and current reachability

| Advisory / CVE | Affected installed package | First patched version for relevant line | Assessment |
| --- | --- | --- | --- |
| [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) / CVE-2026-67214 | nanoid 3.3.12 | 3.3.16 | Build API present through PostCSS, but its Nano ID call uses a fixed positive size of 6, not an attacker-controlled negative size. No current trigger found. |
| [GHSA-2m5v-pch6-74hx](https://github.com/advisories/GHSA-2m5v-pch6-74hx) / CVE-2026-109383 | undici 7.29.1 | 7.30.1 | Requires function-valued TLS options passed through Agent tls rather than connect. The project configures no custom TLS verification callback. Vendor-internal optional TLS paths are patched through Undici. |
| [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) / CVE-2026-67213 | nanoid 3.3.12 | 3.3.18 | Requires a custom generator configured with size zero. No such call in website/build code; PostCSS uses a fixed positive size. No current trigger found. |
| [GHSA-4qv8-2p9j-2685](https://github.com/advisories/GHSA-4qv8-2p9j-2685) / CVE-2026-109924 | undici 7.29.1 | 7.30.1 | Requires an EventSource connection to a hostile SSE peer. No website or test EventSource client exists. Vendor-internal tooling paths were not proven absent; dependency patched rather than excepted. |
| [GHSA-4w7w-5xrc-9h26](https://github.com/advisories/GHSA-4w7w-5xrc-9h26) / CVE-2026-109829 | undici 7.29.1 | 7.30.1 | Requires an originless Agent, shared cache, and redirect-before-cache interceptor composition. The project configures none of these. Vendor internals are not blanket-exempted; patched transitively. |
| [GHSA-55wc-3pg8-jfw6](https://github.com/advisories/GHSA-55wc-3pg8-jfw6) / CVE-2026-87029 | undici 7.29.1 | 7.30.1 | Requires the decompress interceptor composed with a downstream throwing handler such as dump. No such composition in project code. Tooling dependency patched, without assuming vendor APIs cannot be reached. |
| [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm) / CVE-2026-112942 | vite 8.0.10 | 8.1.6 | Windows editor path check bypass can compose with command escaping bugs. Relevant to a running development server/editor middleware; not a public static-asset execution path. |
| [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) / CVE-2026-93749 | source-map-js 1.2.1 | 1.2.2 | Requires a hostile indexed source map with huge section offsets. No input map upload endpoint or authored external map annotation exists; conditional build-time denial of service if hostile map input is introduced. |
| [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv) / CVE-2026-112943 | vite 8.0.10 | 8.1.6 | Windows editor command escaping, malicious filename/environment or alternate data stream. Relevant to development editor actions; no editor invocation in CI or static assets hosting. |
| [GHSA-9fm3-97px-rjf6](https://github.com/advisories/GHSA-9fm3-97px-rjf6) / CVE-2026-109932 | undici 7.29.1 | 7.30.1 | Requires a WebSocket client connected to a hostile peer that sends PING frames without reading PONGs. No website WebSocket client exists. Local tooling/inspector paths remain a conditional tool risk and are patched. |
| [GHSA-9jrq-w75r-8gcw](https://github.com/advisories/GHSA-9jrq-w75r-8gcw) / CVE-2026-112945 | vite 8.0.10 | 8.1.6 | Requires custom/middleware-mode transformIndexHtml using the unchanged request URL and an inline module. This site uses appType mpa, no custom request transform, and build-time rendering, so those preconditions are absent. |
| [GHSA-f72v-6w45-q472](https://github.com/advisories/GHSA-f72v-6w45-q472) / CVE-2026-109841 | undici 7.29.1 | 7.30.1 | Requires fetch with a Subresource Integrity value using a non-lowercase algorithm token. No project server-side fetch integrity option exists. Tooling dependency patched; browser-native fetch is a separate implementation. |
| [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff) / CVE-2026-53571 | vite 8.0.10 | 8.0.16 | Windows development fs.deny bypass through alternate paths. The public site serves only generated files, not the Vite development filesystem. Patch protects developer tooling. |
| [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) / CVE-2026-69153 | postcss 8.5.14 | 8.5.23 | Requires processing hostile CSS with a previous-map annotation while from is unset. Vite sets from to the source path; no CSS upload/parser service or authored map annotation exists. Conditional build risk, no current trigger found. |
| [GHSA-qrxm-fqhp-jwvm](https://github.com/advisories/GHSA-qrxm-fqhp-jwvm) / CVE-2026-87018 | undici 7.29.1 | 7.30.1 | A malicious HTTPS peer renegotiating TLS 1.2 can crash a client. Conditional risk for outbound tooling requests; not a visitor-triggered API in this static architecture. |
| [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) / CVE-2026-73646 | postcss 8.5.14 | 8.5.18 | Earlier traversal variant can process a hostile CSS map even with from set. Trusted repository CSS has no previous-map annotation. A malicious source/dependency change could affect a build; no visitor-facing CSS transformation service exists. |
| [GHSA-r825-w8mm-5pxw](https://github.com/advisories/GHSA-r825-w8mm-5pxw) / CVE-2026-112944 | vite 8.0.10 | 8.1.6 | Editor CLI flag interpretation requires malicious filesystem names and affected editor/WSL conditions. No editor is invoked by the build, tests, or production static hosting. |
| [GHSA-rq7h-c2jc-7f22](https://github.com/advisories/GHSA-rq7h-c2jc-7f22) / CVE-2026-112946 | vite 8.0.10 | 8.1.6 | Development file exposure requires matching root-relative imports and host filesystem paths on non-Windows. Current imports do not match this pattern. Build and static preview do not expose the Vite development filesystem middleware. |
| [GHSA-v6wh-96g9-6wx3](https://github.com/advisories/GHSA-v6wh-96g9-6wx3) / CVE-2026-53632 | vite 8.0.10 | 8.0.16 | Windows development open-in-editor middleware can cause outbound SMB/NTLM authentication. A malicious browser page may reach loopback; loopback binding alone is not a complete mitigation. No editor middleware runs in static hosting or normal CI builds. |
| [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c) / CVE-2026-109869 | undici 7.29.1 | 7.30.1 | A malicious/compromised response with excessive content encodings can crash a fetch client. Wrangler/Miniflare performs outbound tooling requests, so conditional tooling exposure is relevant. No Node fetch server runs on the deployed static website. |

Exact titles, affected ranges, patched branches, original/resolved versions, and complete dependency chains are in [the machine-readable inventory](dependency-security-001.json). Advisory records are linked individually above; package versions and dependency requirements were checked against npm registry manifests.

## Production, build, and development boundaries

All seven reported packages are development dependencies in the lockfile. The production dependency closure does not include them. The browser bundle uses the unchanged application libraries. Workers Static Assets receives only generated HTML/CSS/JavaScript/images: no Worker script, Node server, source-map upload, CSS parsing endpoint, proxy, user input processing, database, or service binding is configured. No production browser or server execution path to these vulnerable Node APIs was found in this architecture. This is a source/configuration assessment, not a claim that an audit proves all code safe.

Build/CI can process repository and dependency CSS/source maps. It runs in a fresh runner with read-only repository permissions and no application secrets. Hostile code changes must still be reviewed; dependency patching does not make arbitrary PR scripts trustworthy. The current CSS contains no sourceMappingURL or import directives, and Vite supplies source filenames to PostCSS. No project custom Nano ID generator, EventSource client, TLS callback, shared redirect cache, or decompression interceptor is configured. Vendor tool internals may use network APIs; latent paths are patched instead of accepted as false positives.

Development-only Vite editor and filesystem vulnerabilities matter on developer machines, especially Windows. Binding to loopback does not remove malicious-browser-page threats. The project does not run vite dev in production or CI. The local Vite preview and Workers asset-server HTTP checks exercise generated assets, without editor actions or real network exploit payloads.

## Host runtime boundary

The local validation host is Node 25.7.0 with bundled Undici 7.21.0. Its built-in implementation falls within the advisory ranges; updating the npm Undici dependency does not replace Node built-ins. Project tests use global fetch only for controlled loopback HTTP responses. They do not fetch untrusted remote URLs, use TLS, EventSource/WebSocket, integrity options, or custom interceptors through that built-in API. The CLI/tooling npm Undici copy is patched to 7.30.1. No Node server or Node built-in fetch is deployed to Workers Static Assets.

Keep supported build/development Node releases security-patched. Do not expand use of host global fetch to untrusted remote content until that host runtime is patched. Host Node/OS installation changes are outside this PR; no system settings or TLS verification were weakened. CI records its Node and bundled Undici versions so the host distinction remains explicit, rather than hidden by a clean npm audit.

## Verification and remaining gates

Fresh independent npm ci in the existing migration worktree succeeded. Only the worktree dependency junction was removed; the original main checkout and its dependencies were not modified. Local npm run check passed the existing ten test groups on the patched Vite and Wrangler versions, including raw HTML, metadata, links/assets, preview noindex, genuine 404 responses, and both local asset servers. Preview command availability was checked with wrangler preview --help, without creating a deployment. Full and production-only lockfile audits report zero findings.

The readiness workflow now fails on npm audit findings at low severity or above and runs a fresh install, production/preview builds, and the full suite. Fresh GitHub CI evidence will be recorded on PR #1 for the updated commit. There are no unpatched findings in the npm dependency gate and no suppressions. Browser layout/hydration/animation checks, public claims/GPTBot policy, branch protection, Cloudflare account inventory, and separate merge/deployment approval remain release gates.
