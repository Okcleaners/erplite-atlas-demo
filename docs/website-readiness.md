# Atlas website Cloudflare readiness

Task: ATLAS-WEBSITE-CLOUDFLARE-001. Repository-only preparation. No deployment authorization is implied by these files.

## Build and architecture

The existing React/Vite design, motion components, and interactive module map are retained. The original `vite build && node scripts/sync-pages-root.mjs` stages run first. A small Vite server build then renders the same React homepage with ReactDOMServer at build time. The client hydrates that HTML. No production server, browser automation, new framework, API, database, or POS connection is added.

Anchor navigation works without JavaScript. Module descriptions have a native HTML details fallback; the existing interactive map takes over after hydration. A noscript stylesheet makes the existing motion entry states readable without JavaScript. The four reference pages are plain HTML using the existing compiled stylesheet, without a JavaScript entry point.

Requirements: Node 22.12+ (or a compatible newer Node release), npm, and the committed lockfile. Wrangler is pinned exactly to 4.152.0 with compatibility date 2026-10-26, supported by its bundled local runtime. Use `npm ci` for a fresh environment. The original checkout's unrelated local changes are outside this migration branch.

Commands:

```sh
npm run build          # complete production HTML in dist/
npm run build:preview  # production build plus isolated noindex dist-preview/
npm test               # generated HTML audit and real local Workers asset HTTP tests
npm run check          # preview/production build and all tests
```

The original sync script intentionally updates the tracked root `index.html` and `assets/` compatibility copies. Review and commit those generated files with their source changes. Build caches and both dist directories are ignored. Do not upload the repository root.

## Generated page inventory

| URL | Purpose | Sitemap |
| --- | --- | --- |
| `/` | Existing homepage, fully rendered, with alpha context and reference links | Yes |
| `/product/` | Product purpose, intended audience, and ERP Lite limits | Yes |
| `/deployment/` | Website/POS separation and deployment questions | Yes |
| `/availability/` | Limited alpha access, status labels, compatibility and pricing caveats | Yes |
| `/faq/` | Problem-led stock, customer history, day close, and guidance questions | Yes |
| `/app/` | Existing compatibility entry; canonical points to `/` | No |
| `/404.html` | Navigable error document with noindex | No |

The HTTP server owns the status code. A 404 document is not a catch-all homepage. Wrangler uses `not_found_handling: none`; tests require genuine 404 responses for unknown pages, unknown nested routes, missing assets, and source/document paths. No SPA rewrite is configured. Vite appType is mpa so its local preview also returns real 404 responses.

## Public claims and review queue

New public copy uses the existing public statements at source commit `ee5e856888626a2cac64bd0031f53ce0953b275b`: `src/main.jsx` (purpose, intended merchant audience, alpha access, owner control, informational website, no login/payment collection, ERP replacement disclaimer) and the existing privacy/terms sections. The new deployment FAQ distinguishes website hosting from merchant deployment. It does not announce a supported cloud POS product or an installation.

The accepted planning baseline authorizes explicit availability qualifications and the distinction between local operation and offline card acceptance. No new runtime feature has been certified by this website work. No feature is newly labelled shipped. Product-map descriptions are preserved with a visible alpha notice; broad existing statements still require founder review before publication.

Do not publish additional workflow guarantees until all of the following have current evidence and explicit public wording approval:

| Pending claim | Required review |
| --- | --- |
| Cash checkout, change calculation, receipts | Current offered release and demonstrated operator workflow |
| Tracked-stock enforcement, receiving, counts, adjustments | Supported release, stock policies, and operator workflow |
| Customer lookup, purchase history, follow-up | Offered package, data scope, and staff-facing behavior |
| Day close, unresolved work, reporting | Current supported end-to-end operator workflow |
| Card recovery, refunds, voids, settlement | Exact supported provider/device/region and live-processing scope |
| Mac installations, peripherals, offline operation | Supported package, hardware list, connectivity and installation scope |
| Cloud POS, online ordering, multi-location operation | Demonstration versus supported commercial availability |
| Assistant guidance, content drafts, posting, integrations | Exact included feature, limits, and approved availability |
| Pricing, offers, performance, certifications, customer outcomes | Founder-approved factual evidence; none invented |

Internal evidence and implementation details must stay out of public HTML, JSON-LD, assets, and the public repository. Use a separate private release/claim register for engineering proof. This document records only public-source provenance and open marketing questions.

Organization/WebSite JSON-LD contains the public brand, URL, and published contact email. SoftwareApplication on `/product/` states product direction and limited alpha access. No offers, prices, ratings, reviews, supported OS list, software version, download URL, or unverified integrations are emitted. JSON-LD matches visible copy; rich-result eligibility is not claimed.

## Indexing and crawler policy

Production canonical base: `https://www.atlasade.com`. Preserve the existing title/description and Open Graph text. Social images use absolute URLs. The sitemap includes only the five canonical HTML pages, without manufactured modification dates.

Search access is explicit for OAI-SearchBot, Googlebot, and Bingbot. The wildcard rule retains the existing effective public crawl access (the previous robots endpoint was 404). GPTBot training policy remains an **open owner decision**; this branch does not silently impose the previously proposed training opt-out. Search access is not training consent and robots directives are not access controls. Confirm the desired GPTBot/other training-crawler policy before production approval.

Production `_headers` adds noindex only to Workers host patterns, not the primary custom domain. Preview output has a universal X-Robots-Tag noindex rule and a noindex meta tag in every HTML file, independent of hostname. Preview robots permits retrieval so a crawler can see noindex. Production and preview output are separate and tested together. A preview is public reviewed marketing content, not a way to publish private data.

Inspect actual Cloudflare Search/Agent/Training policies, managed robots additions, WAF rules, rate limits, bot challenges, and security events once built-in-browser access works. Validate real crawler access separately from user-agent smoke tests. Do not disable security globally or trust user-agent strings as crawler identity.

## Cloudflare boundary and future GitHub setup

No Cloudflare account API mutation or deployment is part of `check` or `test`. Wrangler may fetch its public default request metadata during startup; this is not account access. HTTP tests use local workerd via Wrangler with loopback binding, temporary configuration, no remote resources, and no persistent bindings.

The repository Wrangler configuration points only to `dist-preview`; production workers.dev is disabled and there are no routes, production domains, credentials, databases, service bindings, or application secrets. The Worker name is provisional until account inventory confirms that it will not duplicate infrastructure.

After account inventory and separate deployment authorization, restrict the GitHub integration to `Okcleaners/erplite-atlas-demo`, select production branch `main`, use `npm run build:preview` as the preview build and `npx wrangler preview` as the Preview command. Do not configure `wrangler deploy` to run for unreviewed changes. Production output selection and deployment require a separately reviewed configuration and cutover plan. Keep the existing GitHub Pages workflow enabled and unchanged during preview testing.

Recommend a `main` ruleset requiring pull requests, an approving reviewer, the Website readiness check, resolved conversations, no force pushes, no deletion, and restricted bypass. Review approval availability for a single-owner repository before enabling a rule nobody can satisfy. No ruleset was changed by this branch. Branch protection and Cloudflare production controls remain prerequisites for reliable reviewed publishing.

## Verification limits and measurement

The automated suite reads generated HTML with no JavaScript execution, checks content, metadata, schema, links/fragments, assets, sitemap/robots, preview separation, and runs real local Workers asset HTTP checks. These are not hosted Cloudflare proof or desktop/mobile visual proof. Browser hydration, animations, interactive selection, keyboard navigation, desktop/mobile layout, and screenshot comparison remain required when the built-in browser is available.

After approved publication: verify Search Console and Bing Webmaster Tools, submit the sitemap, and monitor canonical/index status, non-branded impressions/clicks, crawler 4xx/5xx/challenges, and qualified inquiries. Classify ChatGPT visits from referrer/utm_source when supplied, retaining unknown attribution. An inquiry-link click is not a confirmed inquiry. No analytics vendor, tracker, private user payload, or external dependency is added here.

Use a repeatable public-only discovery test set: unavailable stock; customer purchase history; unfinished work before close; local operation versus offline card payment; current availability. In clean sessions with no private context, require publicly retrievable citations and correct limitations. Measure answer accuracy separately from search inclusion; neither indexing nor citation is guaranteed. Preview noindex deliberately prevents using the preview to claim search-indexing success.

## Local validation record

Validated in the isolated migration worktree with Node 25.7.0 and npm 11.10.1. Existing React/Vite dependencies and the exact pinned Wrangler executable were reused to avoid a second dependency tree. The lockfile was generated by npm using system certificate trust with TLS verification enabled. A fresh npm ci installation and the Node 22 GitHub job have not run locally.

`npm run check` builds production and preview artifacts and runs ten automated test groups. Both local Workers asset configurations and Vite preview are exercised over HTTP. `git diff --check` is required before commit. The existing GitHub Pages workflow, sync script, and public product-map data are unchanged. No remote deployment, account mutation, DNS operation, subscription operation, push, or merge is part of this validation.
