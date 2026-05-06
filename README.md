# ERP-Lite Operational Atlas

This is a static, business-facing demo atlas for ERP-lite.

It is meant for merchants, salespeople, implementation partners, and non-technical operators. It explains what the system does, why it matters, which business endpoints it touches, and how a customer purchase moves through the business.

## Files

- `index.html`: standalone static atlas UI.
- `atlas-data.json`: business module and lifecycle content.
- `README.md`: this usage note.

## Open Locally

Open `docs/erplite-atlas/index.html` directly in a browser.

The page tries to load `atlas-data.json`. Some browsers restrict local `file://` JSON loading, so `index.html` includes an embedded fallback data object and still works when opened directly.

## What It Shows

- High-level ERP-lite modules:
  - Sales Register
  - Customer/CRM
  - Inventory
  - Payments & Recovery
  - Reporting
  - Business Operations
  - AI Assistant
  - Integrations
  - Backup & Replay
- Clickable module details:
  - What it does
  - Why it matters
  - What it touches
  - Example merchant conversation
  - Future expansion
- Lifecycle playback:
  - Follow a customer purchase from lookup through sale, receipt, reporting, recovery protection, and AI next actions.

## Boundaries

- Static HTML/CSS/JS only.
- No backend.
- No build step.
- No external CDN dependencies.
- No source paths, tests, Graphify internals, harness details, or implementation-specific files are shown in the UI.
- This does not change POS runtime behavior, frontend POS behavior, backend truth logic, or generated Graphify files.
