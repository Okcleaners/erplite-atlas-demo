import React, { useState } from "react";
import { cafe, drawer, money, startDay, stock, transition } from "./day/scenario.ts";

// A read-only snapshot of the same fictional day a visitor can play.
function completedMorning() {
  let day = transition(startDay(cafe), { type: "open" });
  for (const product of cafe.products) day = transition(day, { type: "add", productId: product.id });
  day = transition(day, { type: "attach", customerId: cafe.customers[0].id });
  return transition(day, { type: "pay", tendered: cafe.tendered });
}
const day = completedMorning();
const receipt = day.receipt;
const product = cafe.products.find(p => p.id === receipt.stockMovements[0].productId);
const river = cafe.locations.find(place => place.id === receipt.locationId);
const hill = cafe.locations.find(place => place.id !== river.id);
const inventory = stock(day, river.id, product.id);
const customer = cafe.customers.find(person => person.id === receipt.customerId);

export default function SalePortrait() {
  const [run, setRun] = useState(0);
  return <figure className="sale-portrait" aria-label="River and Oak connected sale">
    <div className="portrait-top"><span className="fiction">Fictional café demo</span><button type="button" onClick={() => setRun(n => n + 1)}>{run ? "Replay connection" : "Follow this sale"} <span aria-hidden="true">↳</span></button></div>
    <div className="portrait-stage" key={run} data-tracing={run > 0}>
      <div className="portrait-slip">
        <div className="slip-kicker"><span>Receipt #{receipt.id}</span><span>✓ Paid</span></div>
        <h2>{cafe.business}</h2>
        <p className="slip-place">{river.name} · {cafe.register}</p>
        <div className="portrait-lines">{receipt.lines.map(line => <div key={line.productId}>
          <span>{line.quantity} × {cafe.products.find(p => p.id === line.productId).name}</span>
          <b>{money(line.quantity * line.unitPrice)}</b></div>)}</div>
        <div className="slip-foot"><span>Customer<strong>{customer.name}</strong></span><span>Total paid<strong>{money(receipt.total)}</strong></span></div>
      </div>
      <svg className="sale-filaments" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true">
        {[25, 75].map(x => {
          const path = `M50 0 V11 Q50 17 ${x < 50 ? 47 : 53} 17 H${x} V36`;
          return <g key={x}><path d={path} /><path className="signal" d={path} pathLength="1" /></g>;
        })}
      </svg>
      <div className="portrait-outcomes">
        <div><span className="record-label">Inventory · {river.name}</span><strong>{inventory.before} → {inventory.after}</strong>
          <small>{product.name}s · {hill.name} stays at {stock(day,hill.id,product.id).after}</small></div>
        <div><span className="record-label">Cash retained</span><strong>{money(drawer(day).net)}</strong>
          <small>{money(receipt.subtotal)} sales + {money(receipt.tax)} tax</small></div>
      </div>
    </div>
    <noscript><style>{".sale-portrait button{display:none}"}</style></noscript>
    <span className="visually-hidden" role="status">{run > 0 && `Receipt ${receipt.id} linked ${customer.name} to this sale. ${river.name} now has ${inventory.after} oat bars and retained ${money(drawer(day).net)}.`}</span>
  </figure>;
}
