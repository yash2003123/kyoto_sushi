/**
 * Order store.
 *
 * In-memory for now, deliberately behind a narrow async interface. Swapping
 * this for Postgres or KV is a change to this file only — every caller already
 * awaits. It is not a production store: a serverless instance recycling drops
 * the orders, which is exactly why the interface is async and why the kitchen
 * ticket is pushed at webhook time rather than read back from here.
 */

import { randomUUID } from "node:crypto";
import type { Fulfilment, OrderTotals } from "./pricing";
import type { Locale } from "./i18n";

export type OrderStatus = "pending" | "paid" | "failed" | "expired";

export type Customer = {
  name: string;
  phone: string;
  email: string;
  address?: string;
  postcode?: string;
  city?: string;
};

export type Order = {
  id: string;
  reference: string;
  createdAt: string;
  locale: Locale;
  status: OrderStatus;
  fulfilment: Fulfilment;
  /** Minutes past local midnight, or null for "as soon as possible". */
  slotMinutes: number | null;
  slotLabel: string;
  customer: Customer;
  notes: string;
  transport: "car" | "bike" | "foot" | null;
  totals: OrderTotals;
  paymentId: string | null;
  paymentMethod: string | null;
  /** Set once the ticket has reached the counter, so retries do not reprint. */
  ticketSentAt: string | null;
};

const store = new Map<string, Order>();

/** Human-readable reference the counter can shout across the kitchen. */
function makeReference(): string {
  const alphabet = "ACDEFGHJKLMNPQRSTUVWXYZ2345679";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `KY-${out}`;
}

export async function createOrder(
  input: Omit<Order, "id" | "reference" | "createdAt" | "status" | "paymentId" | "paymentMethod" | "ticketSentAt">,
): Promise<Order> {
  const order: Order = {
    ...input,
    id: randomUUID(),
    reference: makeReference(),
    createdAt: new Date().toISOString(),
    status: "pending",
    paymentId: null,
    paymentMethod: null,
    ticketSentAt: null,
  };
  store.set(order.id, order);
  return order;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return store.get(id);
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>,
): Promise<Order | undefined> {
  const existing = store.get(id);
  if (!existing) return undefined;
  const next = { ...existing, ...patch };
  store.set(id, next);
  return next;
}

/**
 * Orders already committed to each 15-minute slot today, for the capacity cap.
 * Only paid and pending orders count — a failed payment must free its slot.
 */
export async function slotLoadForToday(): Promise<Map<number, number>> {
  const today = new Date().toISOString().slice(0, 10);
  const load = new Map<number, number>();
  for (const order of store.values()) {
    if (order.slotMinutes === null) continue;
    if (order.status === "failed" || order.status === "expired") continue;
    if (!order.createdAt.startsWith(today)) continue;
    load.set(order.slotMinutes, (load.get(order.slotMinutes) ?? 0) + 1);
  }
  return load;
}
