# Maintaining Feature Finder

The website builds the directory and one static page per capability from `public/finder/catalog.v1.json`. The same records supply the browser index and Help answers. Neither filtering nor asking a question makes a network request. A café chapter link opens its written explanation. The Play link starts the ordinary scenario.

## Public wording and approval

1. Compare the exact claim with dated engineering evidence and existing approved public documentation. Record the revision, scope, evidence, commercial dependencies and publication decision in the private review record. Keep proposed claims there until their wording is approved.
2. Export only merchant-facing wording and public links. Use the stable slug, versioned schema, record revision and review date to identify each entry. The review date records a wording check. A source-code inspection, successful demo or review date alone cannot establish commercial availability.
3. Choose the product lifecycle at the scope of the claim. Implemented requires approval for the stated product behavior. Experimental describes an approved trial. Planned describes an approved future direction. Use unverified when available documentation does not establish the claim. Describe package and provider availability separately for every state.
4. Review aliases and complete questions alongside their answers. Read every direct answer as if a merchant had asked the entire question, including payment, timing and location qualifiers. Add cases that must return uncertainty. Check that each public source and chapter still supports the wording.
5. Run `npm run check` and both browser suites before integrating a reviewed catalog change. A change to field meaning requires a new schema version. Preserve published slugs or supply redirects.

## Local browser checks

Build with `npm run check` and serve `dist-preview` on loopback using the existing Pages preview workflow. Run `python test/browser/cafe.py --base http://127.0.0.1:18744` and `python test/browser/features.py --base http://127.0.0.1:18744 --output <local-evidence-directory>`. The latter requires Playwright Chromium, captures three viewport sizes, and measures 80 repeated search updates after eight warmups with 4× CPU throttling. The build checks the 25 KB gzip budget for both scripts and the embedded records.

## Future knowledge consumers

A private Graphify review process can propose changes keyed by public slug and version. Only reviewed public fields enter this repository. A future read-only MCP resource can consume the same versioned export and return scope, status, limitations and public citations. Keep private graph identifiers, operational data and tools outside the website and export.
