# AtlasADE Public Website

This repository publishes the AtlasADE public website for `atlasade.com`.

The site is a React + Vite single-page homepage with the original ERP-Lite Operational Atlas demo integrated as the second major scroll section. The Atlas section is powered by the preserved `atlas-data.json` module and lifecycle content.

## Current production and handoff

The canonical site is [www.atlasade.com](https://www.atlasade.com/) on Cloudflare Pages project `atlasade-website`. Production deployment `402e62a6-e9f1-4ef8-8f90-369db36a5e29` serves source `73f72df485a903f590955a6b7148dd5211529f1d` from `codex/atlas-web-interactive-013b`. It includes the Connected Business Explorer and the 011 Finder catalog of 30 records across all 10 product-map modules.

Begin website handoff from [production release 013B](docs/publication-013b.md) for the exact source, knowledge release, validation, and rollback. The [coverage matrix](docs/public-capability-coverage-011.md) records public claim scope. The separate `atlasade-preview` Pages project hosts the [Access-protected Explorer review](https://review.atlasade-preview.pages.dev/connected-business-explorer/).

## Connected Business Explorer

Visit [Connected Business Explorer](https://www.atlasade.com/connected-business-explorer/) to try a fictional café sale at River or Hill and compare selling-location stock and cash with the combined report. The regular website build includes the Explorer and its JavaScript-free worked example. The [prototype guide](prototype/connected-business-explorer/README.md) documents the underlying experiment and local qualification.

## A Day With Atlasade

Open `/day-with-atlasade/` to work the River & Oak counter through one fictional cash sale. The café has its own readable HTML walkthrough and uses the same receipt for cashier, operator, finance and closing views. See [the café day and Cloudflare Pages preview setup](docs/cafe-day.md) for the scenario, local checks and access controls.

## Local Development

```bash
npm ci
npm run dev
```

## Production Build

```bash
npm run build
```

Cloudflare Pages production uses the static files in `dist/`. `npm run build:preview` also generates `dist-preview/` with noindex meta tags and response headers for protected review.

The GitHub Pages compatibility workflow still runs on pushes to `main`. The current production baseline and handoff are on the website release branch. `public/CNAME` and Vite’s relative base support the existing compatibility build. See [the original Cloudflare cutover](docs/publication-007.md) for that recovery history.

## Static HTML and Cloudflare readiness

The build preserves Vite and `scripts/sync-pages-root.mjs`, then renders the existing React homepage at build time and hydrates it in the browser. Essential text and links are present without JavaScript. Four plain HTML reference pages cover product purpose, deployment questions, availability, and FAQs. The same compiled stylesheet preserves the existing design.

Run `npm run check` to build production and isolated preview output and test crawler-readable HTML, metadata, links, and real local Workers asset HTTP behavior. Node 22.12+ and the pinned lockfile are required.

The repository’s `wrangler.jsonc` serves the preview output for local Worker asset checks. The [café guide](docs/cafe-day.md) explains protected Pages preview settings.

The GitHub readiness workflow builds and tests the site. See [website readiness](docs/website-readiness.md) for the original preparation and policy decisions.
