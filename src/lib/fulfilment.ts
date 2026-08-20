/**
 * Settling a payment.
 *
 * Shared by the Mollie webhook and by simulation mode, because "what happens
 * once the money is confirmed" must be one piece of code. If simulation took a
 * different path it would test something the real flow never does, which is
 * worse than not testing at all.
 */

import { applyPaymentStatus, updateOrder, type Order, type OrderStatus } from "./orders";
import { sendToKitchen } from "./kitchen";

/**
 * Records the payment outcome and, when the money arrived, gets the ticket to
 * the counter.
 *
 * Idempotent: Mollie retries until it gets a 2xx, so this runs repeatedly on
 * the same order. The print is claimed by stamping `ticketSentAt` *before*
 * attempting it — two webhook deliveries racing must not both reach the
 * printer. If the printer cannot be reached the stamp is cleared again, so the
 * next retry tries afresh rather than the order silently never printing.
 */
export async function settlePayment(
  orderId: string,
  status: OrderStatus,
  paymentMethod?: string | null,
): Promise<Order | undefined> {
  const order = await applyPaymentStatus(orderId, status, paymentMethod);
  if (!order) return undefined;

  if (status !== "paid" || order.ticketSentAt) return order;

  const claimed = await updateOrder(orderId, {
    ticketSentAt: new Date().toISOString(),
  });

  const delivered = await sendToKitchen(claimed ?? order);
  if (!delivered) {
    return (await updateOrder(orderId, { ticketSentAt: null })) ?? order;
  }

  return claimed ?? order;
}
