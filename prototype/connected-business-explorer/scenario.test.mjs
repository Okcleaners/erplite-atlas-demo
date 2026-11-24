import assert from "node:assert/strict";
import test from "node:test";
import { nextId, post, reset, sale, start, view } from "./scenario.mjs";

const add = (state, location) => post(state, { id: nextId(state), location });

test("the café basket, illustrative tax, tender and change use cents", () => {
  assert.deepEqual(sale, { subtotal: 800, tax: 40, total: 840, tender: 1000, change: 160,
    stockPerSale: 1, item: "Oat bar" });
});

test("one sale changes the selling location and the combined report", () => {
  for (const [selling, other, falling, drawer] of [
    ["river", "hill", 11, 20840], ["hill", "river", 8, 15840]
  ]) {
    const initial = start();
    const previous = view(initial);
    const after = view(add(initial, selling));
    assert.deepEqual(after.records.find(r => r.id === other), previous.records.find(r => r.id === other));
    assert.equal(after.last.current.id, selling);
    assert.equal(after.last.current.stock, falling);
    assert.equal(after.last.current.drawer, drawer);
    assert.deepEqual(after.combined, { stock: 20, drawer: 35840, sales: 800, tax: 40, receipts: 1 });
    assert.deepEqual(view(initial), previous);
  }
});

test("repeated transactions add to each store once and keep the event scope", () => {
  const state = ["hill", "river", "hill"].reduce(add, start());
  const result = view(state);
  assert.equal(result.last.beforeStock, 8);
  assert.equal(result.last.beforeDrawer, 15840);
  assert.equal(result.last.current.stock, 7);
  assert.equal(result.last.other.stock, 11);
  assert.deepEqual(result.combined, { stock: 18, drawer: 37520, sales: 2400, tax: 120, receipts: 3 });
  assert.deepEqual(result, view(["hill", "river", "hill"].reduce(add, start())));
});

test("duplicate, future, and invalid events do not change the journal", () => {
  const initial = start();
  const draft = { id: nextId(initial), location: "river" };
  const once = post(initial, draft);
  assert.equal(post(once, draft), once);
  assert.equal(post(once, { ...draft, location: "hill" }), once);
  assert.equal(post(once, { id: "1:99", location: "hill" }), once);
  assert.equal(add(once, "unknown"), once);
});

test("inventory exhaustion blocks cash and stock movement at only that store", () => {
  let state = start();
  for (let i = 0; i < 9; i++) state = add(state, "hill");
  assert.equal(view(state).last.current.stock, 0);
  assert.equal(add(state, "hill"), state);
  assert.equal(view(add(state, "river")).combined.receipts, 10);
  for (let i = 0; i < 12; i++) state = add(state, "river");
  assert.equal(add(state, "river"), state);
  assert.equal(add(state, "hill"), state);
  assert.deepEqual(view(state).combined, { stock: 0, drawer: 52640, sales: 16800, tax: 840, receipts: 21 });
});

test("reset restores opening values and invalidates a pre-reset draft", () => {
  const prior = add(start(), "river");
  const restarted = reset(prior);
  assert.deepEqual(view(restarted), view(start()));
  assert.equal(post(restarted, { id: nextId(prior), location: "hill" }), restarted);
  assert.equal(view(add(restarted, "hill")).combined.receipts, 1);
});
