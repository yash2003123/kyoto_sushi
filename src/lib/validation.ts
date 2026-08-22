/**
 * Shared input validation. Used by both the checkout form (client) and the
 * checkout API (server) so the two can never quietly drift apart — the client
 * check exists for instant feedback, the server check is the one that
 * actually matters.
 */

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The phone number is for the kitchen to call about a problem with an order,
 * not for billing, so this accepts any plausible international number rather
 * than only Belgian ones. Leuven has a large international student
 * population, and a Belgian-only pattern rejects real numbers like
 * Luxembourg's +352 691 23 14 17.
 *
 * First checks that the raw input contains nothing but a leading "+", digits,
 * and ordinary formatting characters (space, dot, dash, parens) — rejecting
 * anything else, letters included, rather than silently stripping it — then
 * checks the digit count against the range real phone numbers fall in (E.164
 * caps a full international number at 15 digits).
 */
export function isValidPhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (!/^\+?[\d\s.()-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15;
}
