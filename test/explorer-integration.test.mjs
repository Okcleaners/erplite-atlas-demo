import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { contact, explorerPath, site } from "../src/public-content.js";
import "../prototype/connected-business-explorer/scenario.test.mjs";

const read = path => readFile(new URL("../dist/" + path, import.meta.url), "utf8");

test("Explorer gives the site a canonical, crawlable fictional experience and direct feedback", async () => {
  const html = await read(explorerPath.slice(1) + "index.html");
  assert.ok(html.includes('<link rel="canonical" href="' + site + explorerPath + '">'));
  assert.match(html, /Fictional simulation/);
  assert.match(html, /Worked example/);
  assert.match(html, /The combined drawer becomes \$358\.40/);
  assert.match(html, /Help shape Atlasade/);
  assert.ok(html.includes('href="mailto:' + contact + '?subject=Atlasade%20Explorer%20feedback"'));
  assert.match(html, /aria-label="Website".*Feature Finder.*Café day/);
  assert.doesNotMatch(html, /<script[^>]+src=|<iframe|type="email"/i);
});

test("homepage, café and applicable live feature details link the Explorer", async () => {
  const [home, café, ...details] = await Promise.all(["index.html", "day-with-atlasade/index.html",
    ...["location-stock","multi-location","cafe-sale-trace"].map(slug => "features/" + slug + "/index.html")].map(read));
  const link = 'href="' + explorerPath + '"';
  assert.ok([home, café, ...details].every(html => html.includes(link)));
  assert.match(home, /class="button primary" href="\/day-with-atlasade\/">(?:<svg[^>]*>.*?<\/svg>)?Try the café day/);
  assert.match(home, /class="button secondary" href="\/features\/">Find a feature/);
});
