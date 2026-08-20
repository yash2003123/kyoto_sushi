/**
 * Getting the order to the counter.
 *
 * An email to an inbox nobody watches during service is not a system. The
 * primary channel is a cloud receipt printer next to the sushi counter that
 * prints the ticket the moment the payment clears; the tablet with the audible
 * alert is the backup. Both sit behind one outbound webhook so the transport
 * can change without touching the order flow.
 *
 * Failure here must never fail the payment: the money is already taken and the
 * customer has a confirmation. We log loudly and let the tablet's polling view
 * be the safety net.
 */

import type { Order } from "./orders";
import { findItem, t } from "./menu";

export type KitchenTicket = {
  reference: string;
  placedAt: string;
  readyAt: string;
  fulfilment: Order["fulfilment"];
  transport: Order["transport"];
  customer: { name: string; phone: string; address?: string };
  notes: string;
  lines: { name: string; quantity: number; note?: string }[];
  total: number;
};

export function buildTicket(order: Order): KitchenTicket {
  return {
    reference: order.reference,
    placedAt: order.createdAt,
    readyAt: order.slotLabel,
    fulfilment: order.fulfilment,
    transport: order.transport,
    customer: {
      name: order.customer.name,
      phone: order.customer.phone,
      address:
        order.fulfilment === "delivery"
          ? [order.customer.address, order.customer.postcode, order.customer.city]
              .filter(Boolean)
              .join(", ")
          : undefined,
    },
    notes: order.notes,
    // The ticket prints in Dutch: that is the language of the kitchen,
    // whatever language the customer ordered in.
    lines: order.totals.lines.map((line) => ({
      name: t(findItem(line.id)?.name, "nl"),
      quantity: line.quantity,
    })),
    total: order.totals.total,
  };
}

export async function sendToKitchen(order: Order): Promise<boolean> {
  const url = process.env.KITCHEN_WEBHOOK_URL;
  const ticket = buildTicket(order);

  if (!url) {
    // No printer wired up yet. Log the ticket so it is at least recoverable
    // from the platform logs during the pilot.
    console.info("[kitchen] ticket (no KITCHEN_WEBHOOK_URL set)", ticket);
    return false;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.KITCHEN_WEBHOOK_TOKEN
          ? { authorization: `Bearer ${process.env.KITCHEN_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(ticket),
    });
    if (!response.ok) {
      console.error("[kitchen] printer rejected ticket", order.reference, response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[kitchen] could not reach printer", order.reference, error);
    return false;
  }
}
