import { nextId, outcome, post, reset, sale, start, usd, view } from "./scenario.mjs";

const form = document.querySelector("#experiment");
const complete = document.querySelector("#complete");
const repeat = document.querySelector("#repeat");
const hint = document.querySelector("#sale-hint");
const status = document.querySelector("#outcome");
const summaryChange = document.querySelector("#summary-change");
const scope = document.querySelector("#scope-proof");
const startingScope = scope.textContent;
const selected = () => form.elements.location.value;
const prediction = () => form.elements.prediction.value;
const cards = Object.fromEntries([...document.querySelectorAll("[data-location]")].map(card => [
  card.dataset.location, {
    card, trace: card.querySelector(".trace"),
    parts: Object.fromEntries([...card.querySelectorAll("[data-part]")].map(part => [part.dataset.part, part]))
  }
]));
const totals = [...document.querySelectorAll("[data-total]")];
const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
let state = start();
let draft = nextId(state);
let animation;

function say(message) {
  status.textContent = message;
}

function updateControls() {
  const location = selected();
  const store = view(state).records.find(record => record.id === location);
  for (const [id, entry] of Object.entries(cards)) entry.card.dataset.selected = String(id === location);
  const empty = store.stock < sale.stockPerSale;
  complete.setAttribute("aria-disabled", String(!draft || empty));
  hint.textContent = draft
    ? empty ? store.name + " is out of oat bars. Choose the other store or reset." : ""
    : "Start a new experiment to post another sale.";
  hint.hidden = !hint.textContent;
  repeat.hidden = Boolean(draft);
}

function render() {
  const { records, combined, last } = view(state);
  for (const record of records) {
    const { card, parts } = cards[record.id];
    const changed = last?.current.id === record.id;
    card.dataset.outcome = last ? (changed ? "changed" : "unchanged") : "";
    parts.label.textContent = last ? (changed ? "Sale posted here" : "Unchanged this sale")
      : record.id === selected() ? "Selected" : "Comparison";
    parts.stock.textContent = record.stock;
    parts.drawer.textContent = usd(record.drawer);
    parts["stock-change"].textContent = changed ? last.beforeStock + " → " + record.stock
      : last ? "No stock movement" : "Opening stock";
    parts["drawer-change"].textContent = changed ? "+" + usd(sale.total) + " retained"
      : last ? "No cash movement" : "Opening drawer";
  }
  for (const total of totals) {
    const key = total.dataset.total;
    total.textContent = key === "stock" || key === "receipts" ? combined[key] : usd(combined[key]);
  }
  summaryChange.textContent = last ? "After receipt " + combined.receipts : "Opening balances";
  scope.textContent = last
    ? "The receipt belongs to " + last.current.name + ". Its stock and drawer entries are recorded there. " +
      last.other.name + " did not make this sale. The combined report includes both locations."
    : startingScope;
  updateControls();
}

form.addEventListener("change", event => {
  if (event.target.name === "location") render();
});

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!draft) return;
  const updated = post(state, { id: draft, location: selected() });
  if (updated === state) return;
  const guess = prediction();
  state = updated;
  draft = null;
  render();
  const { last } = view(state);
  const feedback = guess === "both" ? "You predicted both stores. " :
    guess === "selected" ? "Your prediction matched. " : "";
  say(feedback + outcome(last));
  const trace = cards[last.current.id].trace;
  animation?.cancel();
  if (motion.matches && typeof trace.animate === "function") {
    animation = trace.animate([{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: 0 }], 760);
  }
});

repeat.addEventListener("click", () => {
  draft = nextId(state);
  for (const choice of form.elements.prediction) choice.checked = false;
  updateControls();
  say("Ready for another sale. Choose River or Hill.");
  form.querySelector("[name=location]:checked").focus();
});

document.querySelector("#reset-stores").addEventListener("click", () => {
  animation?.cancel();
  state = reset(state);
  draft = nextId(state);
  form.reset();
  render();
  say("Reset complete. Both stores are back to their opening balances.");
  form.querySelector("[name=location]:checked").focus();
});

render();
form.hidden = false;
document.querySelector("#worked-example").hidden = true;
