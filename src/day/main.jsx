import React, { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Banknote, BookOpen, Check, CircleCheck, Coffee, Cookie, GitBranch, MapPin, Plus, ReceiptText, RotateCcw, Search, Store, Sunrise, Sunset, UsersRound, Wallet } from "lucide-react";
import { basketReady, cafe, drawer, money, parseCount, startDay, stock, totals, transition } from "./scenario.ts";

const chapters = [
  { title: "Begin the day", short: "Open the register", time: "7:00 AM", icon: Sunrise, line: "The first cups are on the counter. Count the float and open River for the morning." },
  { title: "The first customer", short: "Build a ticket", time: "7:12 AM", icon: Coffee, line: "One house coffee and one oat bar, please. Add each item to the ticket." },
  { title: "Customer recognition", short: "Find a regular", time: "7:13 AM", icon: UsersRound, line: "It’s Sam, a River regular. Find their profile and put today’s visit on the same ticket." },
  { title: "Checkout", short: "Take payment", time: "7:14 AM", icon: Wallet, line: "Sam hands you a ten. Take the cash and give back the change." },
  { title: "Follow the sale", short: "Follow the sale", time: "7:15 AM", icon: GitBranch, line: "Look at the receipt from three seats in the business. Each view follows the same sale." },
  { title: "Close the day", short: "Count the drawer", time: "5:00 PM", icon: Sunset, line: "The chairs are up. Compare the cash in River’s drawer with the day’s recorded movements." },
];

function Amount({ label, value, strong = false }) {
  return <div className={"amount" + (strong ? " strong" : "")}><span>{label}</span><b>{money(value)}</b></div>;
}
function Primary({ children, ...props }) {
  return <button type="button" className="primary-action" {...props}>{children}</button>;
}
function Notice({ children }) {
  return <p className="notice"><CircleCheck size={18} aria-hidden="true" />{children}</p>;
}
function Opening({ day, dispatch, next }) {
  const open = day.session !== "waiting";
  return <>
    <div className="float-card"><div className="tile-icon"><Banknote aria-hidden="true" /></div>
      <div><span className="small-label">Opening cash drawer</span><strong className="float-value">{money(day.scenario.openingCash)}</strong></div>
    </div>
    <p className="hint">{open ? "The opening float is recorded. River is ready for its first customer." : "This is the change you start with, before the first sale."}</p>
    {open ? <Primary onClick={next}>Meet the first customer</Primary> : <Primary onClick={() => dispatch({ type: "open" })}><Sunrise size={18} />Open the register</Primary>}
  </>;
}
function TicketLines({ day, record }) {
  return <div className="ticket-lines">{record.lines.map(line => <div className="amount" key={line.productId}>
    <span>{line.quantity} × {day.scenario.products.find(p => p.id === line.productId).name}</span>
    <b>{money(line.unitPrice * line.quantity)}</b></div>)}</div>;
}
function Basket({ day, dispatch, next }) {
  const current = totals(day);
  return <>
    <div className="product-grid">{day.scenario.products.map(product => {
      const added = day.ticket.lines.some(line => line.productId === product.id);
      const Icon = product.tracked ? Cookie : Coffee;
      return <button className="product" aria-disabled={added} key={product.id} type="button"
        aria-label={added ? product.name + " added" : "Add " + product.name.toLowerCase()}
        onClick={() => dispatch({ type: "add", productId: product.id })}>
        <Icon className="product-icon" aria-hidden="true" /><span><strong>{product.name}</strong><small>{money(product.price)}</small></span>
        {added ? <Check size={18} /> : <Plus size={18} />}</button>;
    })}</div>
    <div className="ticket-block"><div className="slip-title"><ReceiptText size={16} />Ticket {day.ticket.id}</div>
      <TicketLines day={day} record={day.ticket} />
      <Amount label="Subtotal" value={current.subtotal} /><Amount label="Illustrative tax (5%)" value={current.tax} />
      <Amount label="Ticket total" value={current.total} strong /></div>
    <Primary disabled={!basketReady(day)} onClick={next}>Find the customer</Primary>
  </>;
}
function Customer({ day, dispatch, next }) {
  const [query, setQuery] = useState("");
  const matches = day.scenario.customers.filter(person => person.name.toLowerCase().includes(query.trim().toLowerCase()));
  const attached = day.scenario.customers.find(person => person.id === day.ticket.customerId);
  return <>
    {!attached && <><label className="field-label" htmlFor="customer-search">Search café customers</label>
      <div className="input-with-icon"><Search size={18} /><input id="customer-search" type="search" autoComplete="off" value={query} placeholder="Search by name" onChange={e => setQuery(e.target.value)} /></div></>}
    {(attached ? [attached] : matches).map(person => <div className="person" key={person.id}>
      <span aria-hidden="true" className="initials">{person.name.split(" ").map(part => part[0]).join("")}</span>
      <div><strong>{person.name}</strong><small>{person.profile}</small></div>
      {!attached && <button type="button" className="outline" onClick={() => dispatch({ type: "attach", customerId: person.id })}>Attach customer</button>}
    </div>)}
    {!attached && !matches.length && <p role="status">No matching café customers. Try “Sam”.</p>}
    {attached && <><Notice>{attached.name} is attached to Ticket {day.ticket.id}.</Notice><Primary autoFocus onClick={next}>Continue to checkout</Primary></>}
  </>;
}
function Receipt({ day }) {
  const r = day.receipt;
  const customer = day.scenario.customers.find(person => person.id === r.customerId);
  const location = day.scenario.locations.find(place => place.id === r.locationId);
  return <section className="receipt" aria-label="Completed receipt">
    <header><span className="slip-title"><ReceiptText size={16} />Receipt {r.id}</span><strong>{day.scenario.business}</strong>
      <span>{location.name} · {day.scenario.register}</span></header>
    <p className="receipt-person">Customer <b>{customer.name}</b></p>
    <TicketLines day={day} record={r} /><Amount label="Subtotal" value={r.subtotal} /><Amount label="Illustrative tax" value={r.tax} />
    <Amount label="Paid in cash" value={r.total} strong /><Amount label="Tendered" value={r.tendered} /><Amount label="Change returned" value={r.change} />
  </section>;
}
function Checkout({ day, dispatch, next }) {
  const { total } = totals(day);
  return day.receipt ? <>
    <Notice>Sale complete. Receipt {day.receipt.id} is ready.</Notice>
    <details className="receipt-toggle"><summary autoFocus>View completed receipt</summary><Receipt day={day} /></details>
    <Primary onClick={next}><GitBranch size={17} />Follow this sale</Primary>
  </> : <>
    <div className="ticket-block"><Amount label="Ticket total" value={total} strong /><Amount label="Cash tendered" value={day.scenario.tendered} />
      <Amount label="Change to return" value={day.scenario.tendered - total} /></div>
    <Primary onClick={() => dispatch({ type: "pay", tendered: day.scenario.tendered })}><Banknote size={18} />Complete simulated sale</Primary>
  </>;
}
const perspectives = { Cashier: ReceiptText, Operator: Store, Finance: BookOpen };
function Perspectives({ day, lens, setLens, next }) {
  const receipt = day.receipt;
  const location = day.scenario.locations.find(place => place.id === receipt.locationId);
  const retained = drawer(day).net;
  const customer = day.scenario.customers.find(person => person.id === receipt.customerId);
  const oatBars = stock(day, receipt.locationId, "oat-bar");
  return <>
    <div className="sale-id"><span><GitBranch size={17} />Receipt {receipt.id} · {location.name}</span><strong>{money(receipt.total)} paid</strong></div>
    <div className="lenses" role="group" aria-label="Sale perspective">{Object.entries(perspectives).map(([name, Icon]) =>
      <button type="button" key={name} aria-pressed={name === lens} onClick={() => setLens(name)}><Icon size={16} />{name}</button>)}</div>
    <div className="lens-panel" key={lens} role="region" aria-label={lens + " perspective"}>
      {lens === "Cashier" && <Receipt day={day} />}
      {lens === "Operator" && <><h3>Oat bars by location</h3>
        <table><thead><tr><th scope="col">Store</th><th scope="col">Before</th><th scope="col">After</th><th scope="col">Change</th></tr></thead><tbody>
          {day.scenario.locations.map(place => { const count = stock(day, place.id, "oat-bar"); return <tr key={place.id}><th scope="row">{place.name}</th><td>{count.before}</td><td><strong>{count.after}</strong></td><td><span className={count.before !== count.after ? "stock-delta" : "same-stock"}>{count.before !== count.after ? (count.before - count.after) + " sold" : "No sale"}</span></td></tr>; })}
        </tbody></table><p className="hint">One oat bar left River with this ticket. Hill kept its original stock.</p></>}
      {lens === "Finance" && <><h3>Where the cash went</h3><div className="money-split" aria-hidden="true">
          <span style={{ width: (receipt.subtotal / receipt.total * 100) + "%" }} /></div><Amount label="Sales excluding tax" value={receipt.subtotal} />
        <Amount label="Tax collected" value={receipt.tax} /><Amount label="Cash retained" value={retained} strong />
        <p className="hint">{money(receipt.tendered)} received less {money(receipt.change)} in change leaves {money(retained)} in the drawer.</p></>}
    </div>
    <details className="connections"><summary>See the bigger picture</summary>
      <p>Receipt {receipt.id} connects three business records.</p>
      <ul>
        <li><UsersRound size={16} /><span><b>Customer</b> {customer.name}’s visit is linked to this receipt.</span></li>
        <li><Store size={16} /><span><b>Stock</b> {location.name} now has {oatBars.after} of its original {oatBars.before} oat bars.</span></li>
        <li><Wallet size={16} /><span><b>Drawer</b> {money(retained)} from this ticket goes into the closing count.</span></li>
      </ul>
    </details><Primary onClick={next}>Go to the closing count</Primary>
  </>;
}
function Closing({ day, dispatch, replay, input, setInput }) {
  const cash = drawer(day);
  const count = parseCount(input);
  const variance = count === null ? null : count - cash.expected;
  if (day.close) return <div className="closing-summary">
    <div className="closed-icon"><Sunset size={30} /></div><h3>River is closed for the day.</h3>
    <p>One customer, one sale, and a drawer that balances.</p>
    <Amount label="Opening cash" value={cash.opening} /><Amount label="Net cash added" value={cash.net} />
    <Amount label="Expected closing cash" value={day.close.expected} /><Amount label="Counted cash" value={day.close.counted} />
    <Amount label="Closing variance" value={day.close.variance} strong /><Primary onClick={replay}><RotateCcw size={16} />Replay the day</Primary>
  </div>;
  return <>
    <div className="ticket-block"><Amount label="Opening cash" value={cash.opening} /><Amount label="Net cash added" value={cash.net} />
      <Amount label="Expected closing cash" value={cash.expected} strong /></div>
    <label className="field-label" htmlFor="counted">Counted cash (USD)</label><input id="counted" className="count-input" inputMode="decimal"
      autoComplete="off" value={input} aria-invalid={count === null} aria-describedby="variance" onChange={e => setInput(e.target.value)} />
    <p id="variance" role="status" className={"variance" + (variance === 0 ? "" : " difference")}>
      {variance === null ? "Enter a dollar amount with up to two decimal places." :
       variance === 0 ? "Variance " + money(variance) + " · Count matches" :
       "Variance " + money(variance) + " · " + (variance < 0 ? "Short" : "Over") + ". Recount the drawer to close."}</p>
    <Primary disabled={variance !== 0} onClick={() => dispatch({ type: "close", counted: count })}>Close the register</Primary>
  </>;
}
function revealWalkthrough() {
  const target = document.getElementById(window.location.hash.slice(1));
  const details = target?.closest("details.walkthrough");
  if (!details) return false;
  details.open = true;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: "nearest" });
  return true;
}

function Player() {
  const [day, dispatch] = useReducer(transition, cafe, startDay);
  const [chapter, setChapter] = useState(0);
  const [seenSale, setSeenSale] = useState(false);
  const [lens, setLens] = useState("Cashier");
  const [resetPrompt, setResetPrompt] = useState(false);
  const [countDraft, setCountDraft] = useState(null);
  const heading = useRef(null);
  const moveFocus = useRef(false);
  const resetButton = useRef(null);
  const unlocked = seenSale ? 5 : day.receipt ? 4 : day.ticket.customerId ? 3 : basketReady(day) ? 2 : day.session === "open" ? 1 : 0;
  // History only moves the reader. It never replays a tender, stock movement or close.
  useEffect(() => {
    const review = () => {
      if (revealWalkthrough()) return;
      const match = /^#chapter-([1-6])$/.exec(window.location.hash);
      const index = match ? Number(match[1]) - 1 : 0;
      const safe = Math.min(index, unlocked);
      if (safe !== index || (!match && window.location.hash)) {
        window.history.replaceState(null, "", safe ? "#chapter-" + (safe + 1) : window.location.pathname);
      }
      moveFocus.current = true;
      setChapter(safe);
      setResetPrompt(false);
      if (safe === 4) setSeenSale(true);
    };
    window.addEventListener("hashchange", review);
    return () => window.removeEventListener("hashchange", review);
  }, [unlocked]);
  useEffect(() => {
    revealWalkthrough();
    // A fresh visit always starts with an unopened local register.
    if (window.location.hash.startsWith("#chapter-")) window.history.replaceState(null, "", window.location.pathname);
  }, []);
  const visit = (index) => {
    if (index === chapter) return;
    moveFocus.current = true;
    window.history.pushState(null, "", index ? "#chapter-" + (index + 1) : window.location.pathname);
    setChapter(index);
    if (index === 4) setSeenSale(true);
    setResetPrompt(false);
  };
  useLayoutEffect(() => { if (moveFocus.current) { heading.current?.focus(); moveFocus.current = false; } }, [chapter]);
  const replay = () => {
    dispatch({ type: "reset" }); setLens("Cashier"); setSeenSale(false); setResetPrompt(false); setCountDraft(null);
    if (chapter === 0) heading.current.focus(); else visit(0);
  };
  const next = () => visit(chapter + 1);
  const current = chapters[chapter];
  const status = day.session === "waiting" ? "Register closed" : day.session === "closed" ? "Day closed" : "Register open";
  const announcement = day.close ? "Day closed and reconciled." : day.receipt ? "Cash sale completed." :
    day.ticket.customerId ? "Sam Reed attached to the ticket." : day.ticket.lines.length ? "Ticket total " + money(totals(day).total) :
    day.session === "open" ? "Register open." : "";
  return <div className="console">
    <nav className="chapter-nav" aria-label="Café day chapters"><div className="nav-label">Your café day</div>
      <ol>{chapters.map(({ short, icon: Icon }, i) => <li key={short}>
        <button type="button" aria-label={"Chapter " + (i + 1) + ". " + short} aria-current={chapter === i ? "step" : undefined} disabled={i > unlocked} onClick={() => visit(i)}>
          <span className="step-icon">{(i < unlocked || day.close) && i !== chapter ? <Check size={16} /> : <Icon size={17} />}</span>{short}</button></li>)}</ol>
      <div className="nav-note"><MapPin size={15} />River location</div>
    </nav>
    <section className="work-panel" aria-labelledby="chapter-title">
      <div className="panel-top"><span><Store size={16} />River · {day.scenario.register}</span><span className="register-status">{status}</span></div>
      <div className="compact-progress" aria-hidden="true">{chapters.map((item, i) => <span key={item.short} className={i <= chapter ? "filled" : ""} />)}</div>
      <div className="panel-body">
        <div className="chapter-meta"><span>Chapter {chapter + 1} of 6</span><span>{current.time}</span></div>
        <h2 ref={heading} tabIndex="-1" id="chapter-title">{current.title}</h2><p className="intro-line">{day.close && chapter === 5 ? "Here’s how the day balanced at the River counter." : current.line}</p>
        <div key={chapter} className="task">
          {chapter === 0 && <Opening {...{ day, dispatch, next }} />}
          {chapter === 1 && <Basket {...{ day, dispatch, next }} />}
          {chapter === 2 && <Customer {...{ day, dispatch, next }} />}
          {chapter === 3 && <Checkout {...{ day, dispatch, next }} />}
          {chapter === 4 && <Perspectives {...{ day, lens, setLens, next }} />}
          {chapter === 5 && <Closing {...{ day, dispatch, replay }} input={countDraft ?? (drawer(day).expected / 100).toFixed(2)} setInput={setCountDraft} />}
        </div>
      </div>
      <div className="controls"><label className="jump">Review chapter <select aria-label="Review chapter" value={chapter} onChange={e => visit(Number(e.target.value))}>
        {chapters.map((item, i) => <option value={i} key={item.short} disabled={i > unlocked}>{i + 1}. {item.short}</option>)}</select></label>
        {day.session !== "waiting" && !resetPrompt && <button type="button" ref={resetButton} onClick={() => setResetPrompt(true)}><RotateCcw size={14} />Start over</button>}
        {resetPrompt && <div className="reset-choice"><span>Restart this café day?</span>
          <button type="button" autoFocus onClick={replay}>Restart</button><button type="button" onClick={() => {setResetPrompt(false); requestAnimationFrame(() => resetButton.current?.focus());}}>Keep playing</button></div>}
      </div>
    </section>
    <div className="sr" role="status">{announcement}</div>
  </div>;
}
createRoot(document.getElementById("counter")).render(<Player />);
