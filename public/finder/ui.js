import { makeIndex, search } from "./search.js";
const form = document.querySelector("#feature-search");
const query = form.elements.query;
const category = form.elements.category;
const lifecycle = form.elements.lifecycle;
const records = JSON.parse(document.querySelector("#catalog").textContent);
const index = makeIndex(records);
const list = document.querySelector("#results");
const cards = new Map([...list.children].map(card => [card.dataset.feature, card]));
const count = document.querySelector("#result-count");
const help = document.querySelector("#help-result");
const reset = form.querySelector("[type=reset]");
const empty = document.querySelector("#no-matches");

function link(label, href) {
  const anchor = document.createElement("a");
  anchor.textContent = label;
  anchor.href = href;
  return anchor;
}
const releaseId = document.querySelector("[data-release]").dataset.release;
let available = true;
function update(ask = false) {
  if (!available) return;
  const result = search(index, query.value, category.value, lifecycle.value);
  list.replaceChildren(...result.records.map(record => cards.get(record.slug)));
  count.textContent = result.records.length + (result.records.length === 1 ? " feature" : " features");
  empty.hidden = !!result.records.length;
  reset.hidden = !query.value && !category.value && !lifecycle.value;
  help.replaceChildren();
  help.hidden = !ask;
  if (!ask) return;
  if (!result.answer) {
    help.textContent = result.records.length ? "There is no verified answer to that exact question. Explore the related features below." : "There is no verified answer to that question in Atlasade Help.";
    return;
  }
  const record = result.answer;
  const heading = document.createElement("h2");
  heading.textContent = record.title;
  help.append(heading);
  const direct = document.createElement("p");
  direct.className = "direct-answer";
  direct.textContent = record.answer;
  const facts = document.createElement("dl");
  for (const [label, value] of [["Scope", record.scope], ["Product lifecycle", record.lifecycle],
    ["What to confirm", record.limitation], ["Merchant availability", record.availability]]) {
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = label;
    detail.textContent = value;
    facts.append(term, detail);
  }
  help.append(direct, facts);
  const revision = document.createElement("p");
  revision.dataset.release = releaseId;
  revision.dataset.revision = record.review.revision;
  revision.textContent = "Revision " + record.review.revision + " · Release " + releaseId.slice(9,21) +
    " · Merchant availability " + record.availabilityStatus;
  help.append(revision);
  for (const source of [...record.sources, ...(record.demo ? [record.demo] : [])]) help.append(link(source.label, source.href));
}
form.addEventListener("input", () => update());
form.addEventListener("submit", event => { event.preventDefault(); update(true); });
form.addEventListener("reset", event => {
  event.preventDefault();
  query.value = "";
  category.value = "";
  lifecycle.value = "";
  update();
  query.focus();
});
update();

// A page restored from the back-forward cache can predate the current release.
// Keep keystrokes local. Recheck on return and once a minute while visible.
let checking = false;
async function revalidate() {
  if (checking || document.hidden || !available) return;
  checking = true;
  try {
    const response = await fetch("/agents/manifest.json", { cache: "no-cache", redirect: "error", signal: AbortSignal.timeout(10000) });
    if (!response.ok || (await response.json()).releaseId !== releaseId) throw new Error("Release unavailable");
    form.hidden = false;
  } catch {
    available = false;
    form.hidden = true;
    list.replaceChildren();
    empty.hidden = true;
    count.textContent = "Current release required";
    help.hidden = false;
    help.replaceChildren("Refresh the directory to check the current release. ", link("Reload Feature Finder", "/features/"));
  } finally {
    checking = false;
  }
}
function checkDeadline() {
  const now = Date.now();
  const deadlines = records.filter(r => r.publication.expiresOn)
    .map(r => Date.parse(r.publication.expiresOn + "T00:00:00Z"));
  if (!deadlines.length) return;
  update(!help.hidden);
  const next = Math.min(...deadlines.filter(time => time > now));
  if (Number.isFinite(next)) setTimeout(checkDeadline, Math.min(2147483647, next - now + 1));
}
checkDeadline();
revalidate();
window.addEventListener("pageshow", event => { if (event.persisted) { update(!help.hidden); revalidate(); } });
document.addEventListener("visibilitychange", () => { if (!document.hidden) { update(!help.hidden); revalidate(); } });
setInterval(revalidate, 60000);
