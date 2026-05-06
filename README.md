# AtlasADE Public Website

This repository publishes the AtlasADE public website for `atlasade.com`.

The site is a React + Vite single-page homepage with the original ERP-Lite Operational Atlas demo integrated as the second major scroll section. The Atlas section is powered by the preserved `atlas-data.json` module and lifecycle content.

## Local Development

```bash
npm install
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
