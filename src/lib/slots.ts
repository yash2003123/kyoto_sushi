/**
 * Pickup slot generation.
 *
 * The slot picker reflects kitchen capacity, not a calendar. Three rules,
 * all of which come from how a sushi counter actually runs:
 *
 *  1. The earliest slot is now plus the current prep time (30 min, 60 when
 *     the kitchen flips to busy).
 *  2. Slots are 15 minutes wide and each one is capped, so a busy Saturday
 *     cannot put eleven orders on the counter at the same moment.
 *  3. Slots stop before the kitchen closes, and jump the afternoon gap.
 */

import {
  SERVICES,
  CLOSED_WEEKDAY,
  formatMinutes,
  localNow,
  type LocalNow,
} from "./hours";
import { getServiceState } from "./service-state";

export const SLOT_MINUTES = 15;
/** Orders one 15-minute slot can absorb before it is shown as full. */
export const SLOT_CAPACITY = 4;
/** Last slot must leave the kitchen this long before close. */
const CLOSING_BUFFER = 15;

export type Slot = {
  /** Minutes past local midnight. */
  minutes: number;
  /** "18:45" */
  label: string;
  /** Orders already taken for this slot. */
  taken: number;
  full: boolean;
};

function roundUpToSlot(minutes: number): number {
  return Math.ceil(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

/**
 * Slots for the rest of today. Returns an empty list when the kitchen is
 * closed for the day or orders are paused, which the UI reads as "no online
 * ordering right now" rather than showing a dead calendar.
 */
export function slotsForToday(
  load: Map<number, number>,
  now: LocalNow = localNow(),
): Slot[] {
  const service = getServiceState();
  if (service.paused) return [];
  if (now.weekday === CLOSED_WEEKDAY) return [];

  const earliest = roundUpToSlot(now.minutes + service.prepMinutes);
  const slots: Slot[] = [];

  for (const window of [SERVICES.lunch, SERVICES.dinner]) {
    const start = Math.max(earliest, window.open);
    const end = window.close - CLOSING_BUFFER;
    for (let m = roundUpToSlot(start); m <= end; m += SLOT_MINUTES) {
      const taken = load.get(m) ?? 0;
      slots.push({
        minutes: m,
        label: formatMinutes(m),
        taken,
        full: taken >= SLOT_CAPACITY,
      });
    }
  }

  return slots;
}

/** Server-side guard: a slot the client offers may have filled since. */
export function isSlotBookable(
  minutes: number,
  load: Map<number, number>,
  now: LocalNow = localNow(),
): boolean {
  return slotsForToday(load, now).some((s) => s.minutes === minutes && !s.full);
}

/** The soonest bookable slot, used for the "as soon as possible" option. */
export function earliestSlot(
  load: Map<number, number>,
  now: LocalNow = localNow(),
): Slot | null {
  return slotsForToday(load, now).find((s) => !s.full) ?? null;
}
