import { site } from "../src/public-content.js";
import { loadRelease } from "./knowledge-release.mjs";
const escape = value => String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const url = record => "/features/" + record.slug + "/";
const anchor = ({ href, label }) => '<a href="' + escape(href) + '">' + escape(label) + '</a>';
const status = record => '<span class="pill">Product lifecycle · ' + escape(record.lifecycle) + '</span>';
const chapters = record => record.demo ? anchor({href:record.demo.href,label:"Read “" + record.demo.label + "”"}) : "";
const options = values => values.map(value => '<option value="'+escape(value)+'">'+escape(value[0].toUpperCase()+value.slice(1))+'</option>').join("");
export function shell(title, description, path, body, script = "") {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)} | Atlasade</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${site}${path}">
<meta property="og:title" content="${escape(title)} | Atlasade"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${site}${path}">
<link rel="stylesheet" href="/finder/style.css">${script}</head><body><a class="skip" href="#main">Skip to content</a><header><div class="wrap top"><a class="brand" href="/" aria-label="Atlasade home"><img src="/favicon.ico" width="30" height="30" alt="">ATLAS<b>ADE</b></a><nav aria-label="Website"><a href="/features/">Feature Finder</a><a href="/day-with-atlasade/">Café day</a></nav></div></header>
<main class="wrap" id="main">${body}</main><footer class="wrap"><a href="/">Atlasade home</a><a href="/availability/">Product availability</a><a href="/faq/">Merchant FAQ</a><a href="/agents/">Agent guide</a></footer></body></html>`;
}
const datedNotice = record => "This entry requires a current check. Its review deadline is " + record.publication.expiresOn + " at 00:00 UTC. Ask about this feature in Feature Finder.";
function card(record) {
  return `<article class="card" data-feature="${escape(record.slug)}" data-revision="${record.review.revision}"><div class="category">${escape(record.category)}</div><h2><a href="${url(record)}">${escape(record.title)}</a></h2>
  <p>${escape(record.publication.expiresOn ? datedNotice(record) : record.answer)}</p><div class="card-foot">${status(record)}${record.publication.expiresOn ? "" : chapters(record)}</div></article>`;
}
function detail(record, releaseId) {
  const stamp = '<p class="review" data-release="' + releaseId + '" data-revision="' + record.review.revision + '">Revision ' + record.review.revision + ' · <a href="/agents/manifest.json">Knowledge release ' + releaseId.slice(9,21) + '</a></p>';
  if (record.notice || record.publication.expiresOn) return shell(record.title, record.notice || datedNotice(record), url(record),
    '<a class="back" href="/features/">All features</a><h1>' + escape(record.title) + '</h1><p>' + escape(record.notice || datedNotice(record)) + '</p>' + stamp);
  return shell(record.title,record.answer,url(record),`<a class="back" href="/features/">All features</a>
    <div class="detail-head"><p class="eyebrow">${escape(record.category)}</p><h1>${escape(record.title)}</h1><p class="lead">${escape(record.answer)}</p></div>
    <section class="details"><h2>Scope and availability</h2>${status(record)}<dl><dt>Evidence</dt><dd>${record.claimScope === "synthetic_demo" ? "Fictional café demonstration" : "Merchant product documentation"}</dd><dt>Where this applies</dt><dd>${escape(record.scope)}</dd><dt>Dependencies</dt><dd>${record.dependencies.map(escape).join(" · ")}</dd><dt>Merchant availability · ${escape(record.availabilityStatus)}</dt><dd>${escape(record.availability)}</dd><dt>What to confirm</dt><dd>${escape(record.limitation)}</dd></dl>
    <h2>Supporting documentation</h2><ul>${[...record.sources,...(record.demo?[record.demo]:[])].map(source=>"<li>"+anchor(source)+"</li>").join("")}</ul>
    <p class="review">Public wording checked ${escape(record.review.checkedOn)}${record.status === "corrected" ? " · Corrects revision " + record.publication.supersedes : ""}</p>${stamp}</section>
    ${record.demo?'<aside class="demo"><div><p class="eyebrow">River &amp; Oak</p><h2>See it in the café</h2></div><div>'+chapters(record)+'<a href="/day-with-atlasade/">Play the café day</a></div></aside>':""}`);
}
export async function featureDocuments(release) {
  release ??= await loadRelease();
  const records = release.current;
  const { releaseId } = release.manifest;
  const categories = [...new Set(records.map(r=>r.category))].sort();
  const directory = shell("Feature Finder","Search Atlasade capabilities, explore the River & Oak demo and check the limits for your merchant setup.","/features/",`
    <div class="hero"><div><p class="eyebrow">Atlasade Help</p><h1>Feature Finder</h1><p class="lead">Find out what you can try, where it applies, and what to confirm for your business.</p></div>
    <a class="photo" href="/day-with-atlasade/"><img src="/images/cafe-morning.webp" alt="" width="900" height="600"><span>Explore the River &amp; Oak demo</span></a></div>
    <form id="feature-search" role="search" hidden><label for="query">Search features or ask a question</label><div class="searchbox"><input id="query" name="query" type="search" placeholder="Try “oat bar stock” or “cash checkout”" autocomplete="off" maxlength="400"><button class="ask" type="submit">Ask about a feature</button></div>
    <div class="filters"><div><label for="category-filter">Category</label> <select id="category-filter" name="category"><option value="">All categories</option>${options(categories)}</select></div><div><label for="lifecycle-filter">Product lifecycle</label> <select id="lifecycle-filter" name="lifecycle"><option value="">All states</option>${options(["implemented","experimental","planned","unverified"])}</select></div><button type="reset" hidden>Clear filters</button></div></form>
    <section id="help-result" role="status" aria-label="Atlasade Help answer" hidden></section>
    <div class="list-head"><h2>Browse capabilities</h2><span id="result-count" aria-live="polite">${records.length} features</span></div>
    <p class="note">Product lifecycle describes the merchant product. Café examples use fictional data. <a href="/availability/#labels">About availability</a></p>
    <p id="no-matches" hidden>No matching features. Try a broader term or clear the filters.</p>
    <div id="results">${[...records].sort((a,b)=>a.title.localeCompare(b.title,"en")).map(card).join("")}</div>
    <p class="note">Knowledge release <a href="/agents/" data-release="${releaseId}">${releaseId.slice(9,21)}</a></p>
    <script id="catalog" type="application/json">${JSON.stringify(records).replaceAll("<","\\u003c")}</script>`,'<script type="module" src="/finder/ui.js"></script>');
  return new Map([["/features/",directory],...release.capabilities.records.map(record=>[url(record),detail(record,releaseId)])]);
}
