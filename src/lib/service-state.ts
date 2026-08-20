/**
 * Kitchen controls.
 *
 * Two switches the counter needs during service and that must not require a
 * developer: pause new orders entirely, and push prep time from 30 to 60
 * minutes when the counter is buried. Category-level kill switches live in the
 * menu data (`available: false`).
 *
 * Backed by environment variables here so the deploy can flip them; the seam
 * is deliberate — point `getServiceState` at a KV store or a CMS field and the
 * rest of the app is unchanged.
 */

export type ServiceState = {
  /** No new online orders are accepted. */
  paused: boolean;
  /** Minutes between "order placed" and "ready", used for slot generation. */
  prepMinutes: number;
};

export const NORMAL_PREP_MINUTES = 30;
export const BUSY_PREP_MINUTES = 60;

export function getServiceState(): ServiceState {
  const paused = process.env.ORDERS_PAUSED === "1";
  const busy = process.env.KITCHEN_BUSY === "1";
  return {
    paused,
    prepMinutes: busy ? BUSY_PREP_MINUTES : NORMAL_PREP_MINUTES,
  };
}
