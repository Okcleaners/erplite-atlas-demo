import { cafe, startDay, totals, transition } from "../../src/day/scenario.ts";

const openDay = transition(startDay(), { type: "open" });
const basket = cafe.products.reduce((day, product) =>
  transition(day, { type: "add", productId: product.id }), openDay);
const money = totals(basket);
const tracked = cafe.products.find(product => product.tracked);
const stockPerSale = basket.ticket.lines.find(line => line.productId === tracked.id).quantity;

export const sale = Object.freeze({
  ...money, tender: cafe.tendered, change: cafe.tendered - money.total,
  stockPerSale, item: tracked.name
});
export const locations = Object.freeze(cafe.locations.map(location => Object.freeze({
  id: location.id,
  name: location.name,
  stock: location.stock[tracked.id],
  drawer: location.id === cafe.locationId ? cafe.openingCash : 15000
})));
const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const usd = cents => dollars.format(cents / 100);

export function outcome(last) {
  const { current, other, beforeStock, beforeDrawer } = last;
  return `${current.name} sold ${sale.stockPerSale} oat bar. Stock went from ${beforeStock} to ${current.stock} and drawer cash from ${usd(beforeDrawer)} to ${usd(current.drawer)}. ${other.name} stayed at ${other.stock} oat bars and ${usd(other.drawer)}.`;
}

export function start() {
  return { generation: 1, events: [] };
}

export function reset(state) {
  return { generation: state.generation + 1, events: [] };
}

export function nextId(state) {
  return state.generation + ":" + (state.events.length + 1);
}

export function view(state) {
  const records = locations.map(location => ({ ...location, sales: 0, tax: 0, receipts: 0 }));
  for (const event of state.events) {
    const record = records.find(location => location.id === event.location);
    record.stock -= sale.stockPerSale;
    record.drawer += sale.tender - sale.change;
    record.sales += sale.subtotal;
    record.tax += sale.tax;
    record.receipts += 1;
  }
  const combined = Object.fromEntries(["stock", "drawer", "sales", "tax", "receipts"].map(key =>
    [key, records.reduce((sum, record) => sum + record[key], 0)]));
  const event = state.events.at(-1);
  const current = event && records.find(location => location.id === event.location);
  const last = current ? {
    event, current, other: records.find(record => record.id !== current.id),
    beforeStock: current.stock + sale.stockPerSale,
    beforeDrawer: current.drawer - (sale.tender - sale.change)
  } : null;
  return { records, combined, last };
}

export function post(state, { id, location }) {
  if (id !== nextId(state)) return state;
  const record = view(state).records.find(record => record.id === location);
  if (!record || record.stock < sale.stockPerSale) return state;
  return { ...state, events: [...state.events, { id, location }] };
}
