# Browser compatibility qualification 010

The production reference is `b622dd29025cc9171cf9ed4f5b58aedf168fab08`. Both repository skills are present in the tooling parent `174b3b0df0b81ce8ab0b99f12ccd233fa03b83bc`. This milestone changes the directory's request deadline implementation and the layout of Follow the sale in browsers missing newer CSS features.

## Finder and release validation

The directory detects the native timeout method. Its fallback starts one ten-second timer and cancels the fetch with AbortController when available. The deadline includes reading the response body. A browser without AbortController can still reject the operation on time. Each fallback check clears its timer. The same validation function checks the HTTP response and release identity in both paths.

Each of the three engines served a valid, previous, malformed, delayed-body and unavailable manifest to both paths. Only a valid matching manifest enabled Help. The test accelerated the ten-second interval, checked the requested deadline and counted outstanding fallback timers. The existing cache suite covered open-tab corrections, withdrawal, midnight expiry and offline return.

All three engines revalidated on actual Back navigation. The automation sessions reloaded the page. A separate Chromium run launched a fresh profile with no debugger attached during navigation, displayed a valid cash answer, then promoted a different manifest in a local fixture while the visitor was on another page. On Back it reported a real `pageshow.persisted === true` and replaced the old answer with the refresh notice. The three automated engines also exercised the persisted event handler with a warm answer in the page.

## Café and browser coverage

Follow the sale starts with a stacked receipt and two effects. A named component class establishes the containment boundary. A wide enough component uses two columns. The existing selected perspective identifies the illuminated connection. The register and its financial state use the same scenario engine as the production reference.

| Windows Playwright engine | 390 × 844 | 768 × 1024 | 1440 × 900 |
| --- | --- | --- | --- |
| Chromium 149.0.7827.55 | Café, Finder, Help | Same, reduced motion | Keyboard café |
| Firefox 151.0 | Café, Finder, Help | Same, reduced motion | Keyboard café |
| WebKit 26.5 | Café, Finder, Help | Same, reduced motion | Keyboard register after pointer entry |

All three resolved feature citations, rendered JavaScript-free documentation and completed checkout, trace, short and over counts, close and replay. Windows WebKit's default Tab sequence skipped native links on the homepage. The WebKit register test therefore used the homepage link by pointer and used keyboard controls within the experience. Verify native link traversal with the owner's Safari keyboard settings.

With container rules removed, the previous layout produced two columns at 390 px. All three engines kept one readable column and the receipt control with either CSS feature absent and with both absent at 200% CSS content zoom in a 780 px viewport. CSS zoom is an approximation of browser zoom. The Chapter 5 Chromium screenshots at the three sizes matched the approved reference byte for byte.

## Measurements

The reference and candidate used local HTTP/1.1, Chromium 149, 390 × 844 and 4× CPU throttling. Cold loads used five fresh contexts per page, without network throttling. Results are medians in milliseconds. These are laboratory observations on one host.

| Page | LCP before → after | Load event before → after | Largest contentful element |
| --- | --- | --- | --- |
| Homepage | 564 → 588 | 612 → 619 | Café photograph in the figure |
| Feature Finder | 288 → 276 | 273 → 259 | Feature description paragraph |
| Café | 144 → 148 | 185 → 185 | Café photograph in the image element |

Each LCP identification held in all five loads of each build. This comparison provides no evidence that changing image priority improves loading. Finder scripts plus embedded index measured 5,552 → 5,755 bytes gzip. Search input to second animation frame measured 24.1 → 24.8 ms p95 over 80 updates after eight warmups. The budgets are 25,000 bytes and 50 ms.

## Repeat locally

Run `npm ci`, `npm run check`, `npm ci --prefix mcp`, `npm test --prefix mcp` and `npm run test:worker`. For each engine, run the following against the compiled local site with Python Playwright and its browsers installed.

```text
python test/browser/manifest_compat.py --engine <engine>
python test/browser/features.py --engine <engine> --base <loopback-url> --output <directory>
python test/browser/cafe.py --engine <engine> --base <loopback-url> --legacy-layout --screenshots <directory>
```

Use the protected review on real iPhone or iPad Safari, macOS Safari and Android Chrome before public promotion. Check browser zoom, keyboard settings, Back after navigating away, and receipt expansion at large text sizes. Current desktop engines and emulated missing APIs cannot establish coverage on historical Safari releases.
