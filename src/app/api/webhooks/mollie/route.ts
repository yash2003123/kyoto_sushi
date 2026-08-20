import { NextResponse } from "next/server";
import { getOrder, updateOrder, type OrderStatus } from "@/lib/orders";
import { mollie } from "@/lib/mollie";
import { sendToKitchen } from "@/lib/kitchen";

export const dynamic = "force-dynamic";

/**
 * Mollie payment webhook.
 *
 * Mollie posts only the payment id — never a status — so the status is always
 * fetched back from the API. That is what makes the endpoint safe to leave
 * unauthenticated: a forged id either does not exist or resolves to the real
 * payment's real status.
 *
 * Mollie retries until it gets a 2xx, so this must be idempotent: the kitchen
 * ticket is guarded by `ticketSentAt` and never prints twice.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const paymentId = form?.get("id");

  if (typeof paymentId !== "string" || !paymentId.startsWith("tr_")) {
    return NextResponse.json({ error: "bad-payload" }, { status: 400 });
  }

  const client = mollie();
  if (!client) return NextResponse.json({ error: "not-configured" }, { status: 503 });

  let payment;
  try {
    payment = await client.payments.get(paymentId);
  } catch (error) {
    console.error("[webhook] could not fetch payment", paymentId, error);
    // 500 so Mollie retries — a transient API blip must not lose the order.
    return NextResponse.json({ error: "fetch-failed" }, { status: 500 });
  }

  const orderId = payment.metadata
    ? (payment.metadata as { orderId?: string }).orderId
    : undefined;
  if (!orderId) return NextResponse.json({ ok: true });

  const order = await getOrder(orderId);
  if (!order) {
    console.warn("[webhook] payment for unknown order", orderId);
    return NextResponse.json({ ok: true });
  }

  const status: OrderStatus =
    payment.status === "paid"
      ? "paid"
      : payment.status === "expired"
        ? "expired"
        : payment.status === "failed" || payment.status === "canceled"
          ? "failed"
          : "pending";

  const updated = await updateOrder(orderId, {
    status,
    paymentMethod: payment.method ?? order.paymentMethod,
  });

  // Print exactly once, and only for money that actually arrived.
  if (updated && status === "paid" && !updated.ticketSentAt) {
    await updateOrder(orderId, { ticketSentAt: new Date().toISOString() });
    const delivered = await sendToKitchen(updated);
    if (!delivered) {
      // Clear the guard so a retry can try the printer again.
      await updateOrder(orderId, { ticketSentAt: null });
    }
  }

  return NextResponse.json({ ok: true });
}
