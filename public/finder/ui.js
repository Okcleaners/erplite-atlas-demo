import { makeIndex, search } from "./search.js";
const form = document.querySelector("#feature-search");
const query = form.elements.query;
const category = form.elements.category;
const lifecycle = form.elements.lifecycle;
const records = JSON.parse(document.querySelector("#catalog").textContent);
const index = makeIndex(records);
const list = document.querySelector("#results");
const browse = list.querySelector(".feature-groups");
const groups = [...browse.children].map(group => ({
  group, category: group.dataset.category,
  cards: group.querySelector(".card-grid"), count: group.querySelector(".group-count")
}));
const matches = document.createElement("div");
matches.className = "card-grid";
const cards = new Map([...browse.querySelectorAll("[data-feature]")].map(card => [card.dataset.feature, card]));
const heading = document.querySelector("#results-heading");
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
function placeCards(container, ordered) {
  const keep = new Set(ordered);
  for (const card of [...container.children]) if (!keep.has(card)) card.remove();
  ordered.forEach((card, index) => {
    const before = container.children[index] ?? null;
    if (card === before) return;
    if (typeof container.moveBefore === "function" && card.isConnected) container.moveBefore(card, before);
    else container.insertBefore(card, before);
  });
}
function showResults(records, browsing) {
  if (!browsing) {
    if (!matches.isConnected) list.append(matches);
    placeCards(matches, records.map(record => cards.get(record.slug)));
    browse.remove();
    return;
  }
  if (!browse.isConnected) list.append(browse);
  for (const entry of groups) {
    const selected = records.filter(record => record.category === entry.category);
    placeCards(entry.cards, selected.map(record => cards.get(record.slug)));
    entry.group.hidden = !selected.length;
    const total = String(selected.length);
    if (entry.count.textContent !== total) entry.count.textContent = total;
  }
  matches.remove();
}
function update(ask = false) {
  if (!available) return;
  const browsing = !query.value.trim() && !category.value && !lifecycle.value;
  const result = search(index, query.value, category.value, lifecycle.value);
  showResults(result.records, browsing);
  heading.textContent = browsing ? "Browse capabilities" : "Matching capabilities";
  const total = result.records.length + (result.records.length === 1 ? " feature" : " features");
  if (count.textContent !== total) count.textContent = total;
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
  const answerHeading = document.createElement("h2");
  answerHeading.textContent = record.title;
  help.append(answerHeading);
  const direct = document.createElement("p");
  direct.className = "direct-answer";
  direct.textContent = record.answer;
  const facts = document.createElement("dl");
  for (const [label, value] of [["Scope", record.scope], ["Product lifecycle", record.lifecycle],
    ["Evidence", record.claimScope === "synthetic_demo" ? "Fictional café demonstration" : "Merchant product documentation"],
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
  help.append(link("Read feature details", "/features/" + record.slug + "/"));
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
async function checkManifest(signal) {
  const response = await fetch("/agents/manifest.json", { cache: "no-cache", redirect: "error", signal });
  if (!response.ok || (await response.json()).releaseId !== releaseId) throw new Error("Release unavailable");
}

async function checkCurrentRelease() {
  const deadline = 10000;
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return checkManifest(AbortSignal.timeout(deadline));
  }
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  let timer;
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller?.abort();
        reject(new Error("Release check timed out"));
      }, deadline);
    });
    await Promise.race([checkManifest(controller?.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
async function revalidate() {
  if (checking || document.hidden || !available) return;
  checking = true;
  try {
    await checkCurrentRelease();
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
