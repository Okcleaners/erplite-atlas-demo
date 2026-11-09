# AtlasADE Public Website

This repository publishes the AtlasADE public website for `atlasade.com`.

The site is a React + Vite single-page homepage with the original ERP-Lite Operational Atlas demo integrated as the second major scroll section. The Atlas section is powered by the preserved `atlas-data.json` module and lifecycle content.

## Local Development

```bash
npm ci
npm run dev
```

## Production Build

```bash
npm run build
```

The build output is written to `dist/`.

## GitHub Pages

Deployment is handled by `.github/workflows/deploy.yml` on pushes to `main`.

The custom domain is configured by `public/CNAME`:

```text
atlasade.com
```

Vite is configured with a relative base path so the built site works from both the GitHub Pages preview URL and the custom domain.

## Static HTML and Cloudflare readiness

The build preserves Vite and `scripts/sync-pages-root.mjs`, then renders the existing React homepage at build time and hydrates it in the browser. Essential text and links are present without JavaScript. Four plain HTML reference pages cover product purpose, deployment questions, availability, and FAQs. The same compiled stylesheet preserves the existing design.

Run `npm run check` to build production and isolated preview output and test crawler-readable HTML, metadata, links, and real local Workers asset HTTP behavior. Node 22.12+ and the pinned lockfile are required.

Production output is `dist/`. Preview output is `dist-preview/`, with noindex meta tags and headers. `wrangler.jsonc` points only to the preview output, disables production workers.dev, and contains no domains or bindings. Do not deploy or connect it until existing Cloudflare resources have been inspected. The intended future GitHub Preview command is `npx wrangler preview`.

The existing GitHub Pages production workflow is unchanged. Nothing in the readiness workflow deploys the website. See [website readiness](docs/website-readiness.md) for page inventory, claim approvals, crawler policy decisions, branch protection recommendations, and remaining browser/hosted validation.
