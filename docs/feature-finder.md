# Maintaining Feature Finder

The website builds the directory and one static page per capability from `knowledge/catalog.json`. The build still emits the v1 compatibility download at `/finder/catalog.v1.json`. The same records supply the browser index and Help answers. Neither filtering nor asking a question makes a network request. A café chapter link opens its written explanation. The Play link starts the ordinary scenario.

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

## Public release maintenance

The catalog is the single authored set of seven records. An entry in `knowledge/approved-revisions.json` pins each reviewed revision's content by SHA-256. The initial entries carry forward the scoped wording and demo links from the Feature Finder baseline. Keep private evidence, decisions and identities outside the public release. A digest detects changes and does not authenticate a reviewer.

For a correction or withdrawal, increment the record revision, set `publication.supersedes` to the prior revision, and update the review, record issue and release issue dates. Set the publication state to `corrected` or `withdrawn`. Use `evidence: "unknown"` for lost support. An optional `expiresOn` is exclusive at midnight UTC. Keep the slug even for a withdrawal. After approval of the exact edited record, append its `recordDigest(record)` from `scripts/knowledge-release.mjs` to that slug's review history. The build rejects silently missing slugs, unpinned edits and invalid lineage. Never overwrite the prior digest to authorize an edit.

The release ID hashes the effective records, declared schema, graph and compatibility projection. Graph edges come exclusively from a reviewed record's chapter link. Build-time projections replace inactive records with dated, revisioned notices at their canonical HTML URLs and in the v2 feed. Finder search, v1 and graph edges omit them. A clock-driven expiration changes the effective release ID even when the authoring revision stays the same. The browser also checks expiry when searching.

Rebuild and replace the static artifacts as a unit on correction or at the first expiry, and invalidate controlled caches. Static pages and previously downloaded v1 files cannot recall themselves. Before enabling hosting for finite-lived claims, qualify that rebuild and cache process. Current records have no scheduled expiry. A consumer should re-read the manifest, verify bytes and release IDs, and reject inactive or time-expired claims independently.

A future read-only adapter should load only the verified public release, use the existing qualifier-sensitive search, fetch by slug and return canonical URL, scope, status, revision, limitations and sources. Follow only the released graph edges. The adapter needs no POS bindings or graph credentials. Any future private graph crosswalk belongs to editorial review and requires current engineering evidence before stronger product wording is approved.
