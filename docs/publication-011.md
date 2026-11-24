# Atlasade production promotion 011

The 011 deployment is the rollback target for the current [013B production release](publication-013b.md).

On November 24, 2026, the owner-approved Feature Finder release was promoted to the existing Cloudflare Pages production project. The canonical site is [www.atlasade.com](https://www.atlasade.com/). The production source remains the exact protected-preview candidate. This documentation follows that source commit on the release branch.

| Release item | Value |
| --- | --- |
| Production project | `atlasade-website` |
| Release branch | `codex/atlas-web-feature-coverage-011` |
| Deployed source | [`461614980e3382018973656483caf5fdec14a598`](https://github.com/Okcleaners/erplite-atlas-demo/commit/461614980e3382018973656483caf5fdec14a598) |
| Browser compatibility parent | `bd50d418fcd3ac28ee33da419b7ca232f660c7f5` |
| Cloudflare production deployment | `8c7a8be5-e265-4d71-9867-81678269d2d3` |
| Immutable production URL | [8c7a8be5.atlasade-website.pages.dev](https://8c7a8be5.atlasade-website.pages.dev/) |
| Public knowledge release | `atlasade-3ec0ffb296a6ab057c42236cd7594388899dfdced4232a8e749fd59504cbb18b` |
| Production ZIP SHA-256 | `f9baeccfe6740a7c58d88c089fa13279283505889f1d3ff301dec6e3abc370a1` |
| Protected review deployment | `6a5f1220-4d65-4a73-94b2-1c61dd161cb0` in `atlasade-preview`, branch `review` |
| Review URL | [Access-protected Feature Finder](https://review.atlasade-preview.pages.dev/features/) |
| Rollback deployment | `f9d2ec52-e7a1-490e-beab-101682f7caa8` |

## Qualification and production checks

- GitHub returned the exact approved source SHA. Git verified compatibility commit 010 as its ancestor. Both repository-scoped skills and the shared Quiet Orbit and café runtime files match that compatibility source. The fixed manifest request and response-body deadline, fallback, and history checks passed in Chromium, Firefox, and WebKit on the exact candidate. The original HTTP/1.0 loopback fixture stalled in Firefox and WebKit during the repeat. The rerun used a local HTTP/1.1 fixture with explicit response lengths and the same assertions.
- A fresh locked install and `npm run check` passed all 36 tests. The 64 production bundle files matched their approved review counterparts after applying the preview-only indexing markers. On the new immutable deployment, all 63 servable files matched the production build byte for byte. The remaining file, `_headers`, configures response policy.
- The public hostname returned all 38 canonical pages and resolved all 64 citations in the 30 feature records. The manifest and its four artifacts matched the production bundle, including sizes and SHA-256 digests. All five stable artifact URLs returned 304 for their current validators. The public graph has 30 capability nodes and 9 demo links.
- All ten official module names ranked their designated records first on the public Finder. CRM aliases and a purchase-history question showed the scoped CRM answer and linked to the canonical detail page and FAQ. The compound CRM and stock-transfer question returned uncertainty. All ten modules remained visible in the live homepage explorer.
- Desktop and emulated 320 px and 390 px Finder checks passed. At 390 px, the fictional café completed the cash sale, expanded the receipt, traced inventory and finance, blocked a short drawer count, reconciled `$208.40`, and replayed to a closed register. The public test used browser viewport emulation.
- Both hostnames returned the same public DNS A records before and after promotion. Strict HTTPS certificate verification succeeded on both names. Apex HTTPS and www HTTP redirected to www HTTPS with path and query intact. The public robots file matched its predeployment SHA-256 `9be0d71306663e96de16b96f85cfcc992c256dde7381accd49b080be663a0ca6`. Canonical pages carried no production noindex markers. The review alias and immutable review URL still challenged anonymous requests, and the authorized review showed the same approved release. The public `/mcp` route returned 404.

## Rollback

1. Open **Workers & Pages → atlasade-website → Deployments**. In **All deployments**, find production deployment `f9d2ec52-e7a1-490e-beab-101682f7caa8` and choose **More actions → Rollback to this deployment**. Confirm the prior production deployment in the Cloudflare prompt.
2. Verify the prior production manifest release `atlasade-1dcab55623fc531e9db8435d63f30f32f898866b2f1fa9295b33469743ed83da`, the seven-entry Finder, café launch, HTTPS canonical redirect, and protected review Access. The [prior immutable deployment](https://f9d2ec52.atlasade-website.pages.dev/) returned that release after promotion, and its rollback action was available in the dashboard. Pages rollback operates on the current production pointer while retaining the existing domain and review configuration. [Cloudflare Pages rollback documentation](https://developers.cloudflare.com/pages/configuration/rollbacks/)

## Next website handoff

Use the deployed source SHA above as the production comparison point. The tip of the release branch records the handoff and may include newer documentation. The working baseline includes both repository skills, the compatibility tests, the [public coverage matrix](public-capability-coverage-011.md), and the [catalog maintenance guide](feature-finder.md). Build `dist/` from an explicitly approved production source and use `dist-preview/` for Access-protected review. Public product claims retain their documented demo, roadmap, or unverified availability scope.
