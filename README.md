# AtlasADE Public Website

This repository publishes the AtlasADE public website for `atlasade.com`.

The site is a React + Vite single-page homepage with the original ERP-Lite Operational Atlas demo integrated as the second major scroll section. The Atlas section is powered by the preserved `atlas-data.json` module and lifecycle content.

## Current production and handoff

The canonical site is [www.atlasade.com](https://www.atlasade.com/) on the Cloudflare Pages project `atlasade-website`. The current production source is `461614980e3382018973656483caf5fdec14a598` on `codex/atlas-web-feature-coverage-011`. Production deployment `8c7a8be5-e265-4d71-9867-81678269d2d3` includes the 010 browser compatibility fixes and expands Feature Finder from 7 to 30 records across all 10 product-map modules.

Begin website handoff from [production promotion 011](docs/publication-011.md) for the exact source, knowledge release, validation, and rollback. The [coverage matrix](docs/public-capability-coverage-011.md) records the scope of public claims and search qualification. The separate `atlasade-preview` Pages project hosts the [Access-protected review](https://review.atlasade-preview.pages.dev/features/).

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
