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
form.hidden = false;

function link(label, href) {
  const anchor = document.createElement("a");
  anchor.textContent = label;
  anchor.href = href;
  return anchor;
}
function update(ask = false) {
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
  for (const value of [record.answer, "Scope · " + record.scope, "Product lifecycle · " + record.lifecycle, record.limitation, record.availability]) {
    const p = document.createElement("p");
    p.textContent = value;
    help.append(p);
  }
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
