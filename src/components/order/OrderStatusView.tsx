"use client";

import { m } from "motion/react";
import { useEffect, useState } from "react";
import { formatPrice, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { ButtonLink } from "@/components/ui/Button";
import { Stagger, StaggerItem, duration, ease, spring } from "@/components/motion";

type Status = "pending" | "paid" | "failed" | "expired" | "unknown";

type OrderResponse = {
  reference: string;
  status: Status;
  fulfilment: "pickup";
  slotLabel: string;
  total: number;
};

/**
 * Confirmation screen.
 *
 * The customer lands here from Mollie's redirect, which arrives before the
 * webhook does. So the page polls: it opens on "processing" and settles into
 * confirmed once the money is actually reported paid. Never claim an order is
 * in the kitchen until the webhook says the payment cleared.
 */
export function OrderStatusView({
  locale,
  dict,
  orderId,
  simulated,
}: {
  locale: Locale;
  dict: Dictionary;
  orderId: string | null;
  simulated: boolean;
}) {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        if (!response.ok) return;
        const json = (await response.json()) as OrderResponse;
        if (!cancelled) setOrder(json);
      } catch {
        // Keep the last known state; the next tick will try again.
      }
      if (!cancelled) setAttempts((n) => n + 1);
    }

    poll();
    // Back off after the first half-minute — the webhook is either late or
    // not coming, and hammering the endpoint helps nobody.
    const interval = attempts < 10 ? 3000 : 15000;
    const timer = window.setTimeout(poll, interval);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, attempts < 10]);

  // With no Mollie key configured the flow runs end to end without taking
  // money, so the order path is demoable before the merchant account exists.
  const status: Status = simulated ? "paid" : (order?.status ?? "pending");

  const copy =
    status === "paid"
      ? { title: dict.confirm.paidTitle, body: dict.confirm.paidBody, tone: "good" as const }
      : status === "failed" || status === "expired"
        ? { title: dict.confirm.failedTitle, body: dict.confirm.failedBody, tone: "bad" as const }
        : {
            title: dict.confirm.pendingTitle,
            body: dict.confirm.pendingBody,
            tone: "wait" as const,
          };

  return (
    <div className="wrap flex min-h-[70vh] items-center justify-center py-16">
      <Stagger onMount step={0.08} className="max-w-[46ch] text-center">
        <StaggerItem className="mb-6 flex justify-center">
          <StatusMark tone={copy.tone} />
        </StaggerItem>

        <StaggerItem
          as="h1"
          className="font-display m-0 text-[clamp(26px,3.6vw,38px)] leading-tight font-normal"
        >
          {copy.title}
        </StaggerItem>

        <StaggerItem as="p" className="text-washi-dim mt-3">
          {copy.body}
        </StaggerItem>

        {order ? (
          <StaggerItem className="border-rule mt-8 border-t pt-6">
            <dl className="m-0 grid grid-cols-2 gap-y-2 text-left text-[14px]">
              <dt className="text-washi-dim">{dict.confirm.reference}</dt>
              <dd className="tabular m-0 text-right font-bold">{order.reference}</dd>
              <dt className="text-washi-dim">{dict.confirm.readyAt}</dt>
              <dd className="tabular m-0 text-right">{order.slotLabel}</dd>
              <dt className="text-washi-dim">{dict.cart.total}</dt>
              <dd className="tabular m-0 text-right">
                {formatPrice(order.total, locale)}
              </dd>
            </dl>
          </StaggerItem>
        ) : null}

        <StaggerItem className="mt-8 flex flex-wrap justify-center gap-3">
          {status === "failed" || status === "expired" ? (
            <ButtonLink href={`/${locale}/order`}>{dict.confirm.retry}</ButtonLink>
          ) : null}
          <ButtonLink href={`/${locale}`} variant="ghost">
            {dict.confirm.home}
          </ButtonLink>
        </StaggerItem>
      </Stagger>
    </div>
  );
}

/**
 * The status mark.
 *
 * The tick draws itself with a stroke-dashoffset animation rather than fading
 * in — 420ms of a line being drawn is the whole celebration, which is as much
 * as a payment confirmation should get. The waiting state is a slow ring; the
 * failure state does not animate at all.
 */
function StatusMark({ tone }: { tone: "good" | "bad" | "wait" }) {
  const color = tone === "good" ? "#7E8F6B" : tone === "bad" ? "#E4572E" : "#DDD5C6";

  return (
    <m.svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={spring.panel}
      aria-hidden
    >
      <m.circle
        cx="32"
        cy="32"
        r="29"
        stroke={color}
        strokeWidth="1.5"
        opacity={0.4}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: duration.slower, ease: ease.out }}
      />
      {tone === "good" ? (
        <m.path
          d="M20 33.5 L28.5 42 L44 25"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.42, ease: ease.out, delay: 0.22 }}
        />
      ) : tone === "bad" ? (
        <path
          d="M24 24 L40 40 M40 24 L24 40"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ) : (
        <m.circle
          cx="32"
          cy="32"
          r="29"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="30 152"
          animate={{ rotate: 360 }}
          style={{ transformOrigin: "32px 32px" }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />
      )}
    </m.svg>
  );
}
