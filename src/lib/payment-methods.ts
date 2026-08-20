/**
 * Payment methods, as plain data.
 *
 * Deliberately separate from `lib/mollie.ts`: the picker is a client component
 * and importing it from the module that constructs the Mollie SDK would drag
 * the whole server-side client into the browser bundle.
 *
 * Bancontact is first because in Belgium it is not a preference, it is how
 * people pay. Card and Apple Pay follow.
 */
export const PAYMENT_METHODS = [
  { id: "bancontact", label: "Bancontact" },
  { id: "creditcard", label: "Card" },
  { id: "applepay", label: "Apple Pay" },
  { id: "ideal", label: "iDEAL" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export function isPaymentMethod(value: string): value is PaymentMethodId {
  return PAYMENT_METHODS.some((m) => m.id === value);
}
