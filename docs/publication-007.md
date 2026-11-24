# AtlasADE public website publication

This is the original Cloudflare Pages cutover record. The deployment below is the retained rollback target for [production promotion 011](publication-011.md), which records the current production baseline.

On November 23, 2026, Cloudflare Pages project `atlasade-website` received the first public release of the approved Quiet Orbit website. The build source is commit `b622dd29025cc9171cf9ed4f5b58aedf168fab08` on `codex/atlas-web-visual-005d`. [Approved GitHub source](https://github.com/Okcleaners/erplite-atlas-demo/commit/b622dd29025cc9171cf9ed4f5b58aedf168fab08)

| Release item | Value |
| --- | --- |
| Public website | [www.atlasade.com](https://www.atlasade.com/) |
| Apex entry | [atlasade.com](https://atlasade.com/) |
| Production deployment | `f9d2ec52-e7a1-490e-beab-101682f7caa8` |
| Cloudflare deployment time | 2026-11-24 06:34:29 UTC, November 23 at 10:34:29 p.m. Pacific |
| Owner-qualified review deployment | `90964fff-6208-4178-b2e2-319ca57e6c16` |
| Knowledge release | `atlasade-1dcab55623fc531e9db8435d63f30f32f898866b2f1fa9295b33469743ed83da` |
| Production ZIP SHA-256 | `a302dddb59d7e76d325b75b924b358c3c2ad616c17518cc631b2b846d37437fe` |

## Build and verification

Use the approved commit with its lockfile, run `npm ci` and `npm run build`, and use `dist/` as the static upload root. The release was built with Node v25.7.0 on Windows. The production build was matched against all 41 qualified preview files by applying the preview build's indexing changes in the verifier. The production deployment's 40 servable files matched by SHA-256. The remaining file, `_headers`, supplies Pages response policy. On the public hostname, independent checks accounted for the existing Cloudflare email obfuscation and analytics added at the edge.

Public Chromium sessions exercised the café sale, cash reconciliation and replay, module explorer, Feature Finder and Help, citations and JavaScript-free documentation. The café is identified as fictional and its tax and operational effects are illustrative. Feature records identify commercial availability and lifecycle separately. All 35 website tests passed. The public sitemap lists 15 canonical pages under HTTPS `www`. The robots file allows ordinary search crawlers and preserves its explicit disallow for GPTBot. The unknown route and `/mcp` return HTTP 404. The existing review deployment remains gated by Cloudflare Access.

## Routing and recovery

Both website hostnames use proxied CNAME records to `atlasade-website.pages.dev`. The zone rule **AtlasADE website canonical HTTPS** redirects the apex and HTTP requests on `www` to HTTPS `www`, preserving paths and queries. The certificate challenge path is exempt.

For a future Cloudflare website rollback, choose the previously accepted production deployment in this Pages project and verify the canonical hostname, response statuses and public content after switching. The protected review deployment belongs to a separate project.

To restore the pre-migration GitHub Pages site, disable the website-specific redirect rule, detach the two custom domains from this Pages project, and restore the previous DNS targets. The prior production site is retained on GitHub Pages from commit `ee5e856888626a2cac64bd0031f53ce0953b275b`. Its archived source, public homepage and assets were verified before cutover. A post-cutover request to the former origin confirmed the same homepage bytes. [Previous successful GitHub Pages deployment](https://github.com/Okcleaners/erplite-atlas-demo/actions/runs/25500356798)

| Name | Prior DNS targets | Prior proxy and TTL |
| --- | --- | --- |
| `atlasade.com` | A `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` | DNS only, 30 minutes |
| `www.atlasade.com` | CNAME `okcleaners.github.io` | DNS only, 30 minutes |

Retain the GitHub Pages custom-domain registration during recovery. Verify public TLS, the apex redirect, and the prior homepage and assets from fresh DNS lookups. The recovery procedure was qualified against the retained origin and documented DNS configuration.

## Deferred owner feedback

- Explore subtle shadows and greater visual depth.
- Use purposeful graphics and motion with reduced-motion accessibility.
- Explore a fuller Business Day experience that reflects verified Atlas operations.
- Consider more merchant-specific interactive experiences.
