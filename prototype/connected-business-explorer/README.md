# Connected Business Explorer

This prototype asks where stock and cash move when a customer buys the same basket at River or Hill. Choose the selling location, optionally predict what will change, then post a fictional sale. The storefront connects to its local records while the other location remains visible. The combined report adds both locations. Start a new experiment to repeat the sale or reset both stores to their opening figures.

## Open locally

From the website repository root, install the existing locked development dependencies and build the dedicated route.

```sh
npm ci
node --experimental-strip-types prototype/connected-business-explorer/build.mjs
```

Open `prototype/connected-business-explorer/dist/connected-business-explorer/index.html` directly in a browser. The standalone file contains the HTML, CSS, SVG and script. If a local HTTP URL is useful, serve this prototype's `dist` directory from loopback and open `/connected-business-explorer/`. The website's normal build and crawl inventory exclude the prototype. Its document carries noindex.

## Scenario

| Record | Opening values and behavior |
| --- | --- |
| Basket and pricing | The shared café fixture supplies a house coffee, one tracked oat bar, the illustrative tax and the tender. The café pricing logic calculates $8.00 net sales and $0.40 tax. The shopper tenders $10.00 and receives $1.60 change. |
| River | Opens with 12 oat bars and $200.00 in the drawer, using the café fixture. |
| Hill | Opens with 9 oat bars and a fictional $150.00 drawer, added for the two-store comparison. |
| Combined totals | Sum both stores’ inventory, drawer balances, net sales, tax and receipts. Drawer cash includes opening cash and retained tender. |

[`scenario.mjs`](scenario.mjs) holds a session generation and an ordered journal of synthetic receipt IDs and selling locations. The next receipt ID admits one transition. Retried IDs, old IDs after a reset, unknown locations and sales without enough stock leave the journal unchanged. The model replays the journal into both sets of location records and the combined report. Money is calculated in integer cents. Formatting to USD happens at the presentation boundary.

[`explorer.mjs`](explorer.mjs) keeps the draft ID and prediction in the form. The visitor starts a new draft explicitly after each sale. Location choices, predictions, opening the explanation and the finite light pulse have no posting authority. No data persists beyond the page session. Before enhancement, the page shows opening balances and a worked example calculated by the same model.

## Artwork and learning design

The [editable storefront SVG](storefronts.svg) adapts the original [creative evaluation illustration](../../docs/evaluations/mirage-tesseract/connected-business.svg). Each model has its own roof fittings, planted detail and lit glass. Quiet Orbit tokens set the palette and type. Responsive HTML holds the store names, ledger values and controls. A trace changes emphasis only after a posted receipt. Reduced motion retains the current values and steady highlight.

Every Joule informed the order of prediction, experiment and explanation. MotionSites informed the use of depth and lighting to direct attention. The drawing, controls and wording are Atlasade source. [Every Joule](https://iamtechartist.com/every-joule/) · [MotionSites](https://motionsites.ai/) · [Quiet Orbit](../../docs/quiet-orbit.md)

## Comparison and integration recommendation

[A Day With Atlasade](../../docs/cafe-day.md) guides the visitor from opening a register through checkout, tracing a receipt and reconciling the drawer. Its detailed receipt makes one transaction inspectable. The Explorer keeps River and Hill visible simultaneously so visitors can vary the selling location, repeat a transaction and compare each result with the combined figures. The architectural models make the two locations easy to tell apart while the ledger cards expose the exact values.

Consider a secondary product-education link alongside the café walkthrough after a short comprehension trial. Ask first-time visitors to predict a Hill sale after seeing a River sale and explain why River’s stock stays unchanged while the combined report moves. The qualification checks measure behavior and layout. Comprehension with first-time visitors has yet to be measured.

## Reproduce qualification

```sh
node --experimental-strip-types --test prototype/connected-business-explorer/scenario.test.mjs
python prototype/connected-business-explorer/browser.py --engine chromium --output <evidence-directory> --media
python prototype/connected-business-explorer/browser.py --engine firefox --output <evidence-directory>
python prototype/connected-business-explorer/browser.py --engine webkit --output <evidence-directory>
npm run check
```

The browser test uses installed Python Playwright browsers and psutil. It opens the built file offline and checks the three viewport sizes, keyboard operation, reduced motion, draft replay protection, stock exhaustion, reset, the explanatory disclosure and the JavaScript-free example. Chromium writes responsive screenshots, a recorded walkthrough and a throttled click-to-paint measurement.

### Qualification on November 24, 2026

| Check | Result |
| --- | --- |
| Scenario and website regressions | 6 scenario and 36 website tests passed. All 64 normal production build files matched the production baseline byte for byte. |
| Browser matrix | Chromium 149, Firefox 151 and WebKit 26.5 passed at 1440 × 900, 768 × 1024 and 390 × 844. The 768 px cases checked reduced motion. Each engine passed the JavaScript-free worked example at 320 px. |
| Accessibility checks | Native radio keyboard navigation, focus after submission, repeat and reset, visible disclosure focus, status copy, and no horizontal overflow. Sampled palette contrast measured 6.85:1 for dark-surface body text, 5.93:1 for the record note, and 5.26:1 or better for the focus outlines. |
| Isolated route and payload | A loopback request to `/connected-business-explorer/` served the same bytes as the double-clickable preview. The self-contained artifact is 32,253 bytes or 10,538 bytes gzipped. Browser runs loaded zero additional resources. |
| Interaction latency | In Chromium at 390 × 844 and 4× CPU slowdown, 80 measured sales after 8 warmups took 29.3 ms p50 and 30.3 ms p95 from click to the second animation frame. This is a local paint measurement. |
| Hosting boundary | The site's normal build retains the 011 knowledge release. The public prototype path returned 404 and anonymous review access still returned 302. |

The mobile runs use browser viewport emulation. Screen-reader and first-time visitor comprehension studies were outside this qualification.
