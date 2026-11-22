import { test } from "node:test";
import assert from "node:assert/strict";
import { basketReady, cafe, drawer, parseCount, startDay, stock, totals, transition } from "../src/day/scenario.ts";

const actions = [
  { type: "open" }, { type: "add", productId: "coffee" }, { type: "add", productId: "oat-bar" },
  { type: "attach", customerId: "sam" }, { type: "pay", tendered: 1000 }, { type: "close", counted: 20840 },
];
const through = (n, seed = cafe) => actions.slice(0, n).reduce(transition, startDay(seed));

test("opening and adding the two items calculate tax and total without moving cash or stock", () => {
  assert.equal(through(0).session, "waiting");
  assert.deepEqual(drawer(through(1)), { opening: 20000, net: 0, expected: 20000 });
  assert.deepEqual(totals(through(2)), { subtotal: 500, tax: 25, total: 525 });
  assert.deepEqual(totals(through(3)), { subtotal: 800, tax: 40, total: 840 });
  assert.equal(basketReady(through(3)), true);
  assert.equal(through(4).ticket.customerId, "sam");
  assert.deepEqual(stock(through(4), "river", "oat-bar"), { before: 12, after: 12 });
  assert.equal(drawer(through(4)).net, 0);
});
test("one completed ticket owns customer, store, amounts, change, and stock attribution", () => {
  const day = through(5);
  assert.deepEqual(day.receipt, { ...day.ticket, id: "104", customerId: "sam", locationId: "river",
    subtotal: 800, tax: 40, total: 840, tendered: 1000, change: 160, stockMovements: [{ productId: "oat-bar", quantity: -1 }] });
  assert.deepEqual(stock(day, "hill", "oat-bar"), { before: 9, after: 9 });
  assert.deepEqual(stock(day, "river", "oat-bar"), { before: 12, after: 11 });
  assert.equal(stock(day, "river", "coffee"), null);
  assert.deepEqual(day.cashMovements.map(m => m.amount), [1000, -160]);
  assert.deepEqual(drawer(day), { opening: 20000, net: 840, expected: 20840 });
  for (const action of actions.slice(0, 5)) assert.equal(transition(day, action), day);
});
test("guarded prerequisites and invalid cash cannot create a sale or close", () => {
  const invalid = [[0,actions[1]], [1,actions[3]], [3,actions[4]], [4,actions[5]], [2,actions[1]],
    [1,{ type: "add", productId: "absent" }], [3,{ type: "attach", customerId: "unknown" }]];
  for (const [i, action] of invalid) {
    const day = through(i);
    assert.equal(transition(day, action), day);
  }
  const before = through(4);
  for (const tendered of [839, 0, -1, 999.5, NaN, Infinity]) {
    assert.equal(transition(before, { type: "pay", tendered }), before);
  }
  assert.equal(transition(before,{ type: "pay", tendered: 840 }).receipt.change, 0);
  const alternate = structuredClone(cafe);
  alternate.locations[0].stock["oat-bar"] = 0;
  const noStock = through(4, alternate);
  assert.equal(transition(noStock, actions[4]), noStock);
});
test("changed fixture prices, opening float and store drive receipt and drawer projections", () => {
  const seed = structuredClone(cafe);
  seed.openingCash = 5000; seed.locationId = "hill"; seed.products[0].price = 510;
  const day = through(5, seed);
  assert.deepEqual(totals(day), { subtotal: 810, tax: 41, total: 851 });
  assert.equal(day.receipt.change, 149);
  assert.deepEqual(drawer(day), { opening: 5000, net: 851, expected: 5851 });
  assert.equal(stock(day, "river", "oat-bar").after, 12);
  assert.equal(stock(day, "hill", "oat-bar").after, 8);
});
test("counts are exact decimal cents and mismatches leave the register open", () => {
  for (const value of ["", ".", "2e2", "-1", "1.001", "Infinity", "  "]) assert.equal(parseCount(value), null);
  assert.equal(parseCount("208.4"), 20840);
  assert.equal(parseCount("0"), 0);
  const paid = through(5);
  for (const counted of [0, 20000, 20841, -1, NaN, 20840.1]) {
    assert.equal(transition(paid, { type: "close", counted }), paid);
  }
  const closed = through(6);
  assert.deepEqual(closed.close, { expected: 20840, counted: 20840, variance: 0 });
  assert.equal(closed.session, "closed");
  for (const action of actions) assert.equal(transition(closed, action), closed);
});
test("reset from every checkpoint starts an identical replay without mutating an earlier day", () => {
  const final = through(6);
  for (let i = 0; i <= actions.length; i++) {
    const old = through(i);
    const snapshot = structuredClone(old);
    const reset = transition(old, { type: "reset" });
    assert.deepEqual(reset, startDay());
    assert.deepEqual(actions.reduce(transition, reset), final);
    assert.deepEqual(old, snapshot);
  }
});
