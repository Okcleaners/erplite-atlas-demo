import { locations, nextId, outcome, post, sale, start, usd, view } from "./scenario.mjs";
import { contact, explorerPath, site } from "../../src/public-content.js";
import { siteFooter, siteHeader } from "../../scripts/site-chrome.mjs";

const glyph = name => `<svg class="glyph" aria-hidden="true"><use href="#${name}"/></svg>`;
const connection = `<svg class="connections" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
  <path class="wire" d="M50 0V13Q50 19 48 19H28Q25 19 25 25V40 M50 13Q50 19 52 19H72Q75 19 75 25V40"/>
  <path class="trace" d="M50 0V13Q50 19 48 19H28Q25 19 25 25V40 M50 13Q50 19 52 19H72Q75 19 75 25V40"/>
</svg>`;

function store(record, index) {
  return `<article class="store ${record.id}" data-location="${record.id}" aria-labelledby="${record.id}-title">
    <header class="store-head"><h3 id="${record.id}-title">${record.name}</h3><span class="store-label" data-part="label">${index === 0 ? "Selected" : "Comparison"}</span></header>
    <div class="store-scene">
      <svg class="model" viewBox="0 0 300 188" aria-hidden="true"><use href="#shop-platform"/><use href="#${record.id}-model"/></svg>
      <div class="source-pin" aria-hidden="true"></div>
    </div>
    ${connection}
    <dl class="records">
      <div class="record stock"><dt>${glyph("inventory")}Oat bars</dt><dd data-part="stock">${record.stock}</dd><dd class="difference" data-part="stock-change">Opening stock</dd></div>
      <div class="record cash"><dt>${glyph("payments")}Drawer cash</dt><dd data-part="drawer">${usd(record.drawer)}</dd><dd class="difference" data-part="drawer-change">Opening drawer</dd></div>
    </dl>
  </article>`;
}

export const totalLabels = { stock: "Oat bars", sales: "Net sales", tax: "Sales tax", drawer: "Drawer cash", receipts: "Receipts" };

export function document({ sharedCss, css, script, symbols, models, website = false }) {
  const initial = start();
  const { records, combined } = view(initial);
  const worked = view(post(initial, { id: nextId(initial), location: locations[0].id }));
  const description = "Explore how a fictional cash sale affects local inventory, drawer cash, and combined totals in two Atlasade storefronts.";
  const canonical = site + explorerPath;
  const websiteMetadata = `<meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="Connected Business Explorer | Atlasade">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${website ? websiteMetadata : '<meta name="robots" content="noindex">'}
  <title>Connected Business Explorer | Atlasade</title>
  <style>${sharedCss}\n${css}</style>
</head>
<body>
  <a class="skip" href="#main">Skip to experiment</a>
  <svg class="symbol-sheet" aria-hidden="true" width="0" height="0">${symbols}${models}</svg>
  ${website ? siteHeader("#brand") : `<header class="mast"><div class="frame mast-inner">
    <span class="wordmark"><svg class="qo-brand" aria-hidden="true"><use href="#brand"/></svg>ATLAS<b>ADE</b></span>
    <span class="simulation">Fictional simulation</span>
  </div></header>`}
  <main id="main" class="frame">
    <header class="introduction">
      ${website ? '<p class="simulation">Fictional simulation</p>' : ""}
      <h1>Connected Business <em>Explorer</em></h1>
      <p>Post a cash sale at River or Hill. See which local records move and how one sale changes the totals for both shops.</p>
    </header>
    <div class="workspace">
      <section class="panel" aria-labelledby="experiment-heading">
        <h2 id="experiment-heading">Try a sale</h2>
        <form id="experiment" hidden>
          <fieldset>
            <legend>Selling location</legend>
            <div class="location-options">
              ${locations.map((location, i) => `<label><input type="radio" name="location" value="${location.id}"${i === 0 ? " checked" : ""}><span>${location.name}</span></label>`).join("")}
            </div>
          </fieldset>
          <fieldset class="prediction">
            <legend>Which store’s stock and cash will change?</legend>
            <label><input type="radio" name="prediction" value="selected"><span>Only the selling store</span></label>
            <label><input type="radio" name="prediction" value="both"><span>Both stores</span></label>
          </fieldset>
          <p class="basket">House coffee + oat bar · ${usd(sale.tax)} illustrative tax</p>
          <button class="primary" id="complete" type="submit" aria-describedby="sale-hint">Complete ${usd(sale.total)} sale</button>
          <p id="sale-hint" class="hint" hidden></p>
          <div class="actions"><button id="repeat" type="button" hidden>New experiment</button><button id="reset-stores" type="button">Reset both stores</button></div>
        </form>
        <p id="outcome" class="outcome" role="status"></p>
        <div id="worked-example" class="fallback"><p><strong>Worked example</strong></p><p>${outcome(worked.last)} The combined drawer becomes ${usd(worked.combined.drawer)}.</p><p>Enable JavaScript to try a sale at either location.</p></div>
      </section>
      <section class="district" aria-labelledby="locations-heading">
        <div class="district-head"><h2 id="locations-heading">River &amp; Oak</h2><span>Location records</span></div>
        <div class="stores">${records.map(store).join("")}</div>
      </section>
    </div>
    <section class="summary" aria-labelledby="totals-heading">
      <div class="summary-head"><h2 id="totals-heading">Both stores combined</h2><span id="summary-change">Opening balances</span></div>
      <dl class="totals">${Object.entries(totalLabels).map(([key, label]) =>
        `<div><dt>${label}</dt><dd data-total="${key}">${["stock","receipts"].includes(key) ? combined[key] : usd(combined[key])}</dd></div>`).join("")}</dl>
      <details id="explanation">
        <summary>Why the other store stays the same</summary>
        <p id="scope-proof">Each receipt belongs to the store that made the sale. It deducts an item from that store and adds the cash kept after change to that store’s drawer. The combined report adds both stores’ records.</p>
        <p>${usd(sale.tender)} tendered − ${usd(sale.change)} change = ${usd(sale.total)} retained. That includes ${usd(sale.subtotal)} in net sales and ${usd(sale.tax)} in illustrative tax. Drawer balances include opening cash.</p>
        ${website ? '<p><a href="/features/location-stock/">Read about location-scoped inventory</a></p>' : ""}
      </details>
    </section>
    ${website ? `<section class="feedback" aria-labelledby="feedback-heading">
      <div><h2 id="feedback-heading">Help shape Atlasade</h2>
      <p>Tell us what helped and which business workflow you’d like to explore next. Please leave out customer, payment, and other sensitive business details.</p></div>
      <a href="mailto:${contact}?subject=Atlasade%20Explorer%20feedback">Email feedback</a>
    </section>` : ""}
  </main>
  ${website ? siteFooter() : ""}
  <script>${script}</script>
</body>
</html>
`;
}
