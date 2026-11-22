export type Product = { id: string; name: string; price: number; tracked: boolean };
export type Location = { id: string; name: string; stock: Record<string, number> };
export type Customer = { id: string; name: string; profile: string };
export type Scenario = {
  business: string; locationId: string; register: string; ticketId: string;
  openingCash: number; tendered: number; taxBasisPoints: number;
  products: Product[]; locations: Location[]; customers: Customer[];
};

// All amounts are integer USD cents. IDs and times are fixed public fiction.
export const cafe: Scenario = {
  business: "River & Oak", locationId: "river", register: "Front counter", ticketId: "104",
  openingCash: 20000, tendered: 1000, taxBasisPoints: 500,
  products: [
    { id: "coffee", name: "House coffee", price: 500, tracked: false },
    { id: "oat-bar", name: "Oat bar", price: 300, tracked: true },
  ],
  locations: [
    { id: "river", name: "River", stock: { "oat-bar": 12 } },
    { id: "hill", name: "Hill", stock: { "oat-bar": 9 } },
  ],
  customers: [{ id: "sam", name: "Sam Reed", profile: "River regular · Usual drink is house coffee" }],
};

type Line = { productId: string; quantity: number; unitPrice: number };
type Ticket = { id: string; locationId: string; lines: Line[]; customerId: string | null };
type Receipt = Ticket & {
  subtotal: number; tax: number; total: number; tendered: number; change: number;
  stockMovements: { productId: string; quantity: number }[];
};
export type Day = {
  scenario: Scenario; session: "waiting" | "open" | "closed"; ticket: Ticket;
  receipt: Receipt | null; cashMovements: { ticketId: string; amount: number }[];
  close: { expected: number; counted: number; variance: number } | null;
};
type Action =
  | { type: "open" | "reset" }
  | { type: "add"; productId: string }
  | { type: "attach"; customerId: string }
  | { type: "pay"; tendered: number }
  | { type: "close"; counted: number };

export function startDay(scenario: Scenario = cafe): Day {
  return {
    scenario, session: "waiting", receipt: null, close: null, cashMovements: [],
    ticket: { id: scenario.ticketId, locationId: scenario.locationId, lines: [], customerId: null },
  };
}
export function totals(day: Day) {
  const subtotal = day.ticket.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const tax = Math.round(subtotal * day.scenario.taxBasisPoints / 10000);
  return { subtotal, tax, total: subtotal + tax };
}
export function basketReady(day: Day) {
  return day.scenario.products.every(product => day.ticket.lines.some(line => line.productId === product.id));
}
export function drawer(day: Day) {
  const opening = day.session === "waiting" ? 0 : day.scenario.openingCash;
  const net = day.cashMovements.reduce((sum, movement) => sum + movement.amount, 0);
  return { opening, net, expected: opening + net };
}
export function stock(day: Day, locationId: string, productId: string) {
  const location = day.scenario.locations.find(item => item.id === locationId);
  const before = location?.stock[productId];
  if (before === undefined) return null;
  const movement = day.receipt?.locationId === locationId
    ? day.receipt.stockMovements.find(item => item.productId === productId) : undefined;
  return { before, after: before + (movement?.quantity ?? 0) };
}
export function transition(day: Day, action: Action): Day {
  if (action.type === "reset") return startDay(day.scenario);
  if (action.type === "open") return day.session === "waiting" ? { ...day, session: "open" } : day;
  if (day.session !== "open") return day;
  if (action.type === "close") {
    const { expected } = drawer(day);
    if (!day.receipt || !Number.isSafeInteger(action.counted) || action.counted < 0) return day;
    // This guided day asks the visitor to recount before closing a discrepant drawer.
    const variance = action.counted - expected;
    return variance === 0 ? { ...day, session: "closed", close: { expected, counted: action.counted, variance } } : day;
  }
  if (day.receipt) return day;
  const { ticket, scenario } = day;
  switch (action.type) {
    case "add": {
      const product = scenario.products.find(item => item.id === action.productId);
      if (!product || ticket.lines.some(line => line.productId === product.id)) return day;
      const line = { productId: product.id, quantity: 1, unitPrice: product.price };
      return { ...day, ticket: { ...ticket, lines: [...ticket.lines, line] } };
    }
    case "attach": {
      if (!basketReady(day) || ticket.customerId === action.customerId ||
          !scenario.customers.some(item => item.id === action.customerId)) return day;
      return { ...day, ticket: { ...ticket, customerId: action.customerId } };
    }
    case "pay": {
      const amounts = totals(day);
      if (!ticket.customerId || !basketReady(day) || !Number.isSafeInteger(action.tendered) ||
          action.tendered < amounts.total) return day;
      const stockMovements = [];
      for (const line of ticket.lines) {
        if (!scenario.products.find(product => product.id === line.productId)?.tracked) continue;
        if ((stock(day, ticket.locationId, line.productId)?.after ?? 0) < line.quantity) return day;
        stockMovements.push({ productId: line.productId, quantity: -line.quantity });
      }
      const change = action.tendered - amounts.total;
      const receipt = { ...ticket, ...amounts, tendered: action.tendered, change, stockMovements };
      const cashMovements = [{ ticketId: ticket.id, amount: action.tendered }, { ticketId: ticket.id, amount: -change }];
      return { ...day, receipt, cashMovements };
    }
  }
  return day;
}

export function parseCount(value: string) {
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(value.trim());
  return match ? Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0")) : null;
}
export const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
