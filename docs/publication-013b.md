# Atlasade Connected Business Explorer production release 013B

On November 24, 2026, Atlasade promoted the owner-approved educational preview from the existing Access-protected review project to the existing production Pages project. The Explorer lets merchants compare the effects of a fictional cash sale at River or Hill on location-level inventory, cash, and the combined report. Availability claims continue to follow the public Feature Finder records.

| Release item | Value |
| --- | --- |
| Canonical Explorer | [Connected Business Explorer](https://www.atlasade.com/connected-business-explorer/) |
| GitHub source branch | [codex/atlas-web-interactive-013b](https://github.com/Okcleaners/erplite-atlas-demo/tree/codex/atlas-web-interactive-013b) |
| Deployed source | [`73f72df485a903f590955a6b7148dd5211529f1d`](https://github.com/Okcleaners/erplite-atlas-demo/commit/73f72df485a903f590955a6b7148dd5211529f1d) |
| Approved prototype | `09310fc16abb798c2790173871f4af9cff5b162b` |
| Previous production source and handoff | `461614980e3382018973656483caf5fdec14a598` and `6d621655a8e74532732d698af3f44560a87d4327` |
| Production Pages deployment | `402e62a6-e9f1-4ef8-8f90-369db36a5e29` in `atlasade-website` |
| Immutable production URL | [402e62a6.atlasade-website.pages.dev](https://402e62a6.atlasade-website.pages.dev/) |
| Protected candidate | `9553dc42-4d5c-433c-a6dd-bb2c521979ee` in `atlasade-preview`, branch `review` |
| Protected review URL | [Explorer review](https://review.atlasade-preview.pages.dev/connected-business-explorer/) |
| Rollback deployment | `8c7a8be5-e265-4d71-9867-81678269d2d3` |
| Public knowledge release | `atlasade-3ec0ffb296a6ab057c42236cd7594388899dfdced4232a8e749fd59504cbb18b` |
| Production ZIP SHA-256 | `ceb19f8f30d611faa58a7fa79c4e741597641d3ce1a85eab2a2942cd5e480713` |
| Protected preview ZIP SHA-256 | `aa74a0f1ce350b1467a89b594acd4f8979db946895a1f5ba9595ae85624c255e` |
| Explorer production HTML SHA-256 | `a56f252cde714144768b90708e6bce6d5ad00ff33e68d1dba5ed79b0b67a0f92` |

## Integration and qualification

- The growing-across-locations card, café footer, and three related Finder records lead to the Explorer. Both primary homepage calls to action remained in place. The Explorer uses the shared Finder navigation, logo, and footer and preserves the original Quiet Orbit storefronts and scenario model.
- The locked build produced 65 files in each upload. The protected artifact differs only by HTML and header noindex markers and header line-ending normalization. The knowledge manifest and all four declared artifacts match release 011 byte for byte. The upload passed the static artifact audit.
- All 44 website tests, four MCP contract tests, and the two-instance local Worker regression passed. The public MCP route returned 404. Both the worker and private Graphify were outside the deployment scope.
- Chromium 149, Firefox 151, and WebKit 26.5 passed the Explorer and site navigation at 320, 390, 768, 1440, and 1920 CSS pixels. Browser checks exercised optional predictions, both stores, combined totals, repeat, duplicate submit, depletion, reset, keyboard focus and activation, reduced motion, and the JavaScript-free worked example. Each browser also passed the café and Finder suites at 390, 768, and 1440 CSS pixels. Firefox's implicit same-origin favicon lookup is allowed in the network assertion. The Explorer has zero page-authored subresource requests.
- At 390 px, the authenticated hosted review posted River and Hill sales, showed the correct prediction and $366.80 combined cash, reset to $350.00, and verified café, location detail, CRM, feedback, noindex metadata, and the approved manifest. The alias and both immutable review deployments returned Access challenges for anonymous requests.
- The live unauthenticated browser verified both homepage actions, the mobile two-store flow, location detail and CRM navigation, the feedback target, and the readable static worked example. All ten module names ranked their designated records first, and the café passed its complete 390 px cash sale, drawer reconciliation to $208.40, and replay.
- The production audit matched all 64 served files on the immutable deployment to the build. On the canonical domain it verified 39 pages, all 64 citations, all 30 capability records and nine graph edges, and 304 responses on the manifest and four artifact validators. Strict TLS and the HTTPS canonical redirects preserved path and query. Public DNS A records and robots policy matched the predeployment values. The robots SHA-256 is `9be0d71306663e96de16b96f85cfcc992c256dde7381accd49b080be663a0ca6`.

## Performance and evidence

| Measurement | Result |
| --- | --- |
| Homepage HTML and initial JavaScript and CSS, gzip level 9 | 139,451 B, up 4 B from 011. Unchanged images are outside this measurement. |
| Standalone Explorer document, gzip level 9 | 11,130 B of 34,774 B raw, including styles, illustrations, and interaction. |
| Feature Finder scripts and catalog, gzip | 13,614 B |
| Feature Finder query to second frame, p95 | 24.6 ms across 80 samples in Chromium at 390 px with 4× CPU slowdown |
| Explorer click to second frame, p95 | 30.0 ms across 80 samples in Chromium at 390 px with 4× CPU slowdown |

Rendered evidence was captured in the local task evidence directory `pos-mac/.codex_tmp/atlas-web-interactive-013b-evidence/`. The `explorer-chromium/` folder contains opening, one-sale, and two-sale screenshots at all five widths and `connected-business-explorer.webm`. The `public-browser/` folder contains fresh production captures, including mobile two-sale and JavaScript-free views. `production-verification.json` and `artifact-verification.json` record the byte and release checks. Use `prototype/connected-business-explorer/browser.py --base <loopback-url> --engine <browser> --output <evidence-dir>` against a locally served `dist-preview/` to reproduce the integrated Explorer run. Add `--media` with Chromium to capture screens and a recording.

## Feedback and limitations

**Help shape Atlasade** opens a preaddressed draft to `jwong@atlasade.com` in the visitor's email app. The invitation asks what helped and which workflows to cover next, with a request to omit customer, payment, and other sensitive details. A configured mail app is needed to open the draft. The release adds no forms, backend, tracking code, or stored business data. The production Cloudflare edge supplies its Web Analytics beacon independently of the site artifact. The hosted café check allowed only that external asset and recorded its canceled navigation-time telemetry requests separately.

Experiment state resets when the document reloads. With scripts disabled the worked example and links remain readable. Qualification used browser engines and emulated viewports. Physical devices and screen readers remain unqualified.

## Rollback and next handoff

1. In Cloudflare **Workers & Pages → atlasade-website → Deployments**, find `8c7a8be5-e265-4d71-9867-81678269d2d3` under **All deployments**. Use **More actions → Rollback to this deployment** and confirm. The action was available after promotion. [Cloudflare Pages rollback documentation](https://developers.cloudflare.com/pages/configuration/rollbacks/)
2. Verify the 011 homepage, café, 30-record Finder, approved manifest, canonical HTTPS behavior, and Access challenge on review. The Explorer URL should return 404 from the restored release. The [immutable 011 deployment](https://8c7a8be5.atlasade-website.pages.dev/) returned the expected manifest and a 404 at the Explorer path after 013B went live.

Begin from the dedicated release branch above. The branch includes this handoff after the deployed source SHA. Build `dist/` for production and `dist-preview/` for the existing Access-protected review. Use [the 011 coverage matrix](public-capability-coverage-011.md) and [catalog guide](feature-finder.md) for product claims, and the repository's [Atlasade visual design](../.agents/skills/atlasade-visual-design/SKILL.md) and [Modern Web Guidance](../.agents/skills/modern-web-guidance/SKILL.md) for future website work.

The final process audit found zero task-owned background processes and no listeners on the three temporary Vite ports. No service was retained.
