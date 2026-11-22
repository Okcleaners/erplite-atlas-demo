# A Day With Atlasade

The homepage invites visitors into a fictional day at River & Oak. The existing merchant sections, ten-module explorer, reference pages, accessibility information and alpha inquiry remain available. The café is a separate Vite HTML entry with its own title, description, canonical URL, stylesheet and interactive bundle. The six-chapter text walkthrough is present in the HTML response.

## One ticket through the day

| Chapter | Visitor action | Result |
| --- | --- | --- |
| Begin the day | Open the River counter | Record a $200.00 starting float |
| The first customer | Add a $5.00 coffee and a $3.00 oat bar | $8.00 subtotal plus $0.40 illustrative tax |
| Customer recognition | Find Sam Reed and attach their profile | Ticket 104 carries Sam’s association into the receipt |
| Checkout | Accept $10.00 in simulated cash | Return $1.60 and issue one $8.40 receipt |
| Follow the sale | Inspect Cashier, Operator and Finance | River oat bars move from 12 to 11, Hill keeps 9, and $8.00 in sales plus $0.40 in tax stays in the drawer |
| Close the day | Count and reconcile the drawer | $200.00 + $10.00 − $1.60 gives $208.40 expected cash. A different count shows the signed variance and keeps the register open for a recount |

The plain TypeScript reducer in `src/day/scenario.ts` owns the register, ticket and completed receipt. The scenario supplies fixed public IDs, location-specific opening stock, customer fixtures, pricing and tax. Payment records the tender and change together with the receipt and its tracked stock movement. Selectors calculate monetary totals in cents and project location balances. A repeated sale or close returns the previously committed state.

The React player owns chapter navigation, the perspective and the editable count. Chapter review and browser Back/Forward within the day never submit a business action. Reset and full page reload start from the opening fixture. The browser stores no customer or payment data between visits. Future stories can supply their own fixture and reuse the tested transition rules where their business policies match.

All café records, the register interface, the illustrative tax and the counted-drawer exercise are synthetic. The multi-location comparison is a teaching view. The public availability page carries the alpha, development and roadmap qualifications. Release-specific cash, customer, inventory, reporting and device claims still need product-owner acceptance.

## Local verification

Use the committed lockfile and a compatible Node version (22.12 or later). From the repository root:

```sh
npm ci
npm run check
npm run preview -- --outDir dist-preview --port 18743
```

Open `http://127.0.0.1:18743/day-with-atlasade/`. For the separate browser suite, use Python with Playwright and its installed Chromium. Screenshot capture is optional.

```sh
python test/browser/cafe.py --base http://127.0.0.1:18743 --screenshots /path/to/screenshots
```

## Future Cloudflare Pages preview

| Setting | Preview value |
| --- | --- |
| Git source | `Okcleaners/erplite-atlas-demo`, repository root |
| Dependency installation | `npm ci` with the committed lockfile |
| Build command | `npm run build:preview` |
| Output directory | `dist-preview` |
| Runtime services | Static assets only |
| Preferred public canonical | `https://www.atlasade.com/day-with-atlasade/` |

The normal build emits `dist/`. The preview build also creates a separate directory containing per-page noindex metadata and global preview headers. Upload only the compiled preview directory. The existing Wrangler configuration targets Workers. Use the Pages project’s static build settings for this artifact. [Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)

The directory entry `day-with-atlasade/index.html` supports direct loading. Serve the slashless path at the canonical trailing-slash URL. Preserve the top-level `404.html` and avoid a blanket homepage rewrite. Require 404 responses for missing nested routes and assets. Chapter fragments stay local to the browser. [Pages route matching](https://developers.cloudflare.com/pages/configuration/serving-pages/)

Before a hosted review, restrict the intended preview branch and disable automatic production deployment on the future Pages project. Enable the Pages preview Access policy under **Settings → General** and restrict the Zero Trust Allow policy to the intended reviewers. Verify anonymous denial, unauthorized-account denial and reviewer access on the immutable deployment URL, the branch alias and direct asset URLs. The project root hostname and custom domains need separately scoped protection if used. Preview URLs are public by default. Noindex governs crawling. [Preview deployments and Access](https://developers.cloudflare.com/pages/configuration/preview-deployments/) · [Branch build controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/)

Hosted Access, provider routing and a production cutover require separate authorization and hosted verification. The existing GitHub Pages workflow still publishes on pushes to main. The café milestone ends at a local branch and local preview.
