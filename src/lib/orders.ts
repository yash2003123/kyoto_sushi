/**
 * Orders.
 *
 * Thin domain layer over `lib/store.ts`, which owns where the bytes actually
 * live. Slot capacity is enforced here at reservation time rather than by
 * counting orders afterwards, because counting is a read-then-write race and
 * the cap exists precisely for the moments when two people order at once.
 */

import { randomUUID } from "node:crypto";
import type { Fulfilment, OrderTotals } from "./pricing";
import type { Locale } from "./i18n";
import { localNow } from "./hours";
import { SLOT_CAPACITY } from "./slots";
import { getRecord, putRecord, releaseSlot, reserveSlot, slotCounts } from "./store";

export type OrderStatus = "pending" | "paid" | "failed" | "expired";

export type Customer = {
  name: string;
  phone: string;
  email: string;
};

export type Order = {
  id: string;
  reference: string;
  createdAt: string;
  /** Local (Brussels) date the order belongs to, for slot accounting. */
  serviceDay: string;
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
  /** Set once the ticket reached the counter, so retries never reprint. */
  ticketSentAt: string | null;
  /** Set once the slot has been given back, so it is only given back once. */
  slotReleasedAt: string | null;
};

const key = (id: string) => `kyoto:order:${id}`;

/** Human-readable reference the counter can shout across the kitchen. */
function makeReference(): string {
  // No vowels, no 0/1/I/O/B/8 — this gets read aloud and typed by hand.
  const alphabet = "ACDEFGHJKLMNPQRSTUVWXYZ2345679";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `KY-${out}`;
}

export type NewOrder = Omit<
  Order,
  | "id"
  | "reference"
  | "createdAt"
  | "serviceDay"
  | "status"
  | "paymentId"
  | "paymentMethod"
  | "ticketSentAt"
  | "slotReleasedAt"
>;

export class SlotFullError extends Error {
  constructor() {
    super("slot-unavailable");
  }
}

/**
 * Creates an order, claiming its slot first.
 *
 * If the claim fails the slot filled up between the customer choosing it and
 * pressing pay, and no order is written at all — better than taking money for
 * a time the kitchen cannot serve.
 */
export async function createOrder(input: NewOrder): Promise<Order> {
  const day = localNow().date;

  if (input.slotMinutes !== null) {
    const claimed = await reserveSlot(day, input.slotMinutes, SLOT_CAPACITY);
    if (!claimed) throw new SlotFullError();
  }

  const order: Order = {
    ...input,
    id: randomUUID(),
    reference: makeReference(),
    createdAt: new Date().toISOString(),
    serviceDay: day,
    status: "pending",
    paymentId: null,
    paymentMethod: null,
    ticketSentAt: null,
    slotReleasedAt: null,
  };

  try {
    await putRecord(key(order.id), order);
  } catch (error) {
    // Do not strand the reservation if the write fails.
    if (order.slotMinutes !== null) await releaseSlot(day, order.slotMinutes);
    throw error;
  }

  return order;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return getRecord<Order>(key(id));
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>,
): Promise<Order | undefined> {
  const existing = await getOrder(id);
  if (!existing) return undefined;
  const next = { ...existing, ...patch };
  await putRecord(key(id), next);
  return next;
}

/**
 * Marks an order's payment as settled, and frees its slot when the money did
 * not arrive. Idempotent: the webhook is retried until it gets a 2xx, so this
 * must be safe to run repeatedly on the same order.
 */
export async function applyPaymentStatus(
  id: string,
  status: OrderStatus,
  paymentMethod?: string | null,
): Promise<Order | undefined> {
  const existing = await getOrder(id);
  if (!existing) return undefined;

  const patch: Partial<Order> = { status };
  if (paymentMethod) patch.paymentMethod = paymentMethod;

  const abandoned = status === "failed" || status === "expired";
  if (abandoned && existing.slotMinutes !== null && !existing.slotReleasedAt) {
    await releaseSlot(existing.serviceDay, existing.slotMinutes);
    patch.slotReleasedAt = new Date().toISOString();
  }

  const next = { ...existing, ...patch };
  await putRecord(key(id), next);
  return next;
}

/** Orders already committed to each 15-minute slot today, for the picker. */
export async function slotLoadForToday(): Promise<Map<number, number>> {
  return slotCounts(localNow().date);
}
