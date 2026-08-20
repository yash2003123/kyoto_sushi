/**
 * Mollie hosted checkout — server only.
 *
 * Card details never touch this codebase: we create a payment, redirect the
 * customer to Mollie's own checkout, and act on the webhook. That keeps the
 * project out of PCI scope entirely.
 *
 * The method list and the base URL live in `lib/payment-methods.ts` and
 * `lib/site.ts` so client components can read them without pulling the SDK
 * into the browser bundle.
 */

import "server-only";
import createMollieClient, { type MollieClient } from "@mollie/api-client";

let client: MollieClient | null = null;

/** Null when no API key is configured — the app then runs in simulation mode. */
export function mollie(): MollieClient | null {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return null;
  if (!client) client = createMollieClient({ apiKey });
  return client;
}

export function isLive(): boolean {
  return Boolean(process.env.MOLLIE_API_KEY);
}

/** Mollie needs amounts as decimal strings, not cents. */
export function toMollieAmount(cents: number): { currency: "EUR"; value: string } {
  return { currency: "EUR", value: (cents / 100).toFixed(2) };
}
