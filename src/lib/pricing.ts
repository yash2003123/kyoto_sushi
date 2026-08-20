/**
 * Order pricing. Integer cents throughout.
 *
 * This runs on the server at checkout as well as in the browser for the
 * summary, and both must agree — so the rules live here once and the API
 * recomputes rather than trusting anything the client sends.
 */

import { findItem } from "./menu";

export const DELIVERY_FEE = 350;
export const DELIVERY_MINIMUM = 2500;
/** Above this, we ask how the customer is travelling so packing matches. */
export const TRANSPORT_QUESTION_THRESHOLD = 6000;

export type Fulfilment = "pickup" | "delivery";

export type PricedLine = {
  id: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderTotals = {
  lines: PricedLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

export type CartInput = { id: string; quantity: number }[];

export class PricingError extends Error {}

/**
 * Re-prices a cart from the menu source. Unknown or unavailable dishes are a
 * hard error rather than a silent drop: the customer must not discover at the
 * counter that the sashimi they paid for was already sold out.
 */
export function priceOrder(cart: CartInput, fulfilment: Fulfilment): OrderTotals {
  if (cart.length === 0) throw new PricingError("empty-cart");

  const lines: PricedLine[] = cart.map((line) => {
    const item = findItem(line.id);
    if (!item) throw new PricingError(`unknown-item:${line.id}`);
    if (!item.available) throw new PricingError(`unavailable-item:${line.id}`);

    const quantity = Math.floor(line.quantity);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 40) {
      throw new PricingError(`bad-quantity:${line.id}`);
    }

    return {
      id: item.id,
      quantity,
      unitPrice: item.price,
      lineTotal: item.price * quantity,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  if (fulfilment === "delivery" && subtotal < DELIVERY_MINIMUM) {
    throw new PricingError("below-delivery-minimum");
  }

  const deliveryFee = fulfilment === "delivery" ? DELIVERY_FEE : 0;

  return { lines, subtotal, deliveryFee, total: subtotal + deliveryFee };
}
