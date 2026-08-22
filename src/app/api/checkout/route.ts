import { NextResponse } from "next/server";
import { PricingError, TRANSPORT_QUESTION_THRESHOLD, priceOrder } from "@/lib/pricing";
import { SlotFullError, createOrder, slotLoadForToday, updateOrder } from "@/lib/orders";
import { settlePayment } from "@/lib/fulfilment";
import { isSlotBookable, earliestSlot } from "@/lib/slots";
import { formatMinutes, localNow, openState } from "@/lib/hours";
import { getServiceState } from "@/lib/service-state";
import { mollie, toMollieAmount } from "@/lib/mollie";
import { isPaymentMethod } from "@/lib/payment-methods";
import { isMisconfigured } from "@/lib/store";
import { siteUrl } from "@/lib/site";
import { EMAIL, isValidPhone } from "@/lib/validation";
import { Locale as MollieLocale, PaymentMethod, type Payment } from "@mollie/api-client";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Body = {
  locale?: string;
  slotMinutes?: number | null;
  method?: string;
  notes?: string;
  transport?: string | null;
  customer?: Record<string, unknown>;
  cart?: { id?: unknown; quantity?: unknown }[];
};

function str(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return fail("bad-json");
  }

  // Refuse rather than take money we have nowhere durable to record. In this
  // state the webhook could never find the order to mark it paid, so the
  // kitchen would never be told — a silent loss is worse than a visible error.
  if (isMisconfigured()) {
    console.error(
      "[checkout] no order store configured (KV_REST_API_URL / KV_REST_API_TOKEN). Refusing orders.",
    );
    return fail("store-unavailable", 503);
  }

  const service = getServiceState();
  if (service.paused) return fail("orders-paused", 409);

  const now = localNow();
  if (!openState(now).open && localNow().weekday === 1) return fail("closed", 409);

  const locale: Locale = isLocale(str(body.locale)) ? (body.locale as Locale) : "nl";

  const method = str(body.method);
  if (!isPaymentMethod(method)) return fail("bad-method");

  // --- customer -----------------------------------------------------------
  const raw = body.customer ?? {};
  const customer = {
    name: str(raw.name, 80),
    phone: str(raw.phone, 32),
    email: str(raw.email, 120),
  };
  if (customer.name.length < 2) return fail("bad-name");
  if (!EMAIL.test(customer.email)) return fail("bad-email");
  if (!isValidPhone(customer.phone)) return fail("bad-phone");

  // --- cart, re-priced from the menu source, never from the client --------
  const cart = (body.cart ?? [])
    .map((line) => ({ id: str(line.id, 64), quantity: Number(line.quantity) }))
    .filter((line) => line.id.length > 0);

  let totals;
  try {
    totals = priceOrder(cart);
  } catch (error) {
    if (error instanceof PricingError) return fail(error.message);
    throw error;
  }

  // --- slot, re-checked against live capacity ----------------------------
  const load = await slotLoadForToday();
  let slotMinutes: number | null = null;
  let slotLabel: string;

  if (body.slotMinutes === null || body.slotMinutes === undefined) {
    const soonest = earliestSlot(load, now);
    if (!soonest) return fail("no-slots", 409);
    slotMinutes = soonest.minutes;
    slotLabel = soonest.label;
  } else {
    const requested = Number(body.slotMinutes);
    if (!Number.isInteger(requested) || !isSlotBookable(requested, load, now)) {
      return fail("slot-unavailable", 409);
    }
    slotMinutes = requested;
    slotLabel = formatMinutes(requested);
  }

  const transportRaw = str(body.transport, 8);
  const transport =
    transportRaw === "car" || transportRaw === "bike" || transportRaw === "foot"
      ? transportRaw
      : null;
  // Above €60 the packing genuinely differs, so the answer is required.
  if (totals.total >= TRANSPORT_QUESTION_THRESHOLD && !transport) {
    return fail("transport-required");
  }

  let order;
  try {
    order = await createOrder({
      locale,
      fulfilment: "pickup",
      slotMinutes,
      slotLabel,
      customer,
      notes: str(body.notes, 400),
      transport,
      totals,
    });
  } catch (error) {
    // The slot filled between the picker offering it and the customer pressing
    // pay. Nothing was written and no money was taken.
    if (error instanceof SlotFullError) return fail("slot-unavailable", 409);
    throw error;
  }

  const base = siteUrl(request);
  const returnUrl = `${base}/${locale}/order/status?order=${order.id}`;
  const client = mollie();

  // No API key configured: run the flow end to end without taking money, so
  // the order path can be exercised before the merchant account exists.
  //
  // This settles the order through exactly the same code the real webhook
  // uses, so the kitchen ticket genuinely fires and the confirmation page is
  // telling the truth when it says the order reached the counter. Simulating
  // only the redirect would leave the half that matters untested.
  if (!client) {
    try {
      await updateOrder(order.id, { paymentMethod: method });
      await settlePayment(order.id, "paid", method);
    } catch (error) {
      // The order itself was already written by createOrder above — this is
      // the settlement step failing (a store hiccup), not the order vanishing.
      // Report it as a proper JSON error rather than letting it surface as an
      // unhandled 500 with no body, which the browser cannot parse and which
      // then shows the customer a generic "network" failure that hides what
      // actually happened.
      console.error("[checkout] simulated settlement failed", order.reference, error);
      return fail("settlement-failed", 502);
    }
    return NextResponse.json({
      orderId: order.id,
      reference: order.reference,
      checkoutUrl: `${returnUrl}&simulated=1`,
      simulated: true,
    });
  }

  try {
    const payment: Payment = await client.payments.create({
      amount: toMollieAmount(totals.total),
      description: `Kyoto Leuven ${order.reference}`,
      redirectUrl: returnUrl,
      webhookUrl: `${base}/api/webhooks/mollie`,
      // Pre-selecting the method sends the customer straight to Bancontact
      // instead of through Mollie's own method picker — one screen fewer.
      method: method as PaymentMethod,
      metadata: { orderId: order.id },
      locale:
        locale === "nl"
          ? MollieLocale.nl_BE
          : locale === "fr"
            ? MollieLocale.fr_BE
            : MollieLocale.en_GB,
    });

    await updateOrder(order.id, { paymentId: payment.id, paymentMethod: method });

    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) return fail("no-checkout-url", 502);

    return NextResponse.json({
      orderId: order.id,
      reference: order.reference,
      checkoutUrl,
      simulated: false,
    });
  } catch (error) {
    console.error("[checkout] mollie payment failed", order.reference, error);
    await updateOrder(order.id, { status: "failed" });
    return fail("payment-create-failed", 502);
  }
}
