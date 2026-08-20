/**
 * Opening hours and live open/closed state.
 *
 * Everything is computed in Europe/Brussels regardless of where the code runs,
 * so a server in another region and a customer's phone agree. Monday closed is
 * a real trap for people who decide on the walk over — it drives the hero
 * status line and the highlighted row in the hours table.
 */

export const TIMEZONE = "Europe/Brussels";

/** Minutes past midnight. */
export const SERVICES = {
  lunch: { open: 11 * 60 + 30, close: 14 * 60 + 30 },
  dinner: { open: 17 * 60 + 30, close: 22 * 60 + 30 },
} as const;

/** 0 = Sunday. The restaurant is closed on Monday. */
export const CLOSED_WEEKDAY = 1;

export type LocalNow = {
  /** 0 = Sunday. */
  weekday: number;
  /** Minutes past local midnight. */
  minutes: number;
  /** ISO date in local terms, e.g. 2026-08-20. */
  date: string;
};

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Reads the wall clock in Brussels off any Date. */
export function localNow(at: Date = new Date()): LocalNow {
  const parts = partsFormatter.formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(get("hour")) % 24;
  return {
    weekday: WEEKDAY_INDEX[get("weekday")] ?? at.getDay(),
    minutes: hour * 60 + Number(get("minute")),
    date: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m < 10 ? "0" : ""}${m}`;
}

export type OpenState =
  | { open: true; kind: "open"; closesAt: number }
  | { open: false; kind: "before-lunch" | "between" | "after" | "monday" };

export function openState(now: LocalNow = localNow()): OpenState {
  if (now.weekday === CLOSED_WEEKDAY) return { open: false, kind: "monday" };
  const { lunch, dinner } = SERVICES;
  if (now.minutes >= lunch.open && now.minutes < lunch.close) {
    return { open: true, kind: "open", closesAt: lunch.close };
  }
  if (now.minutes >= dinner.open && now.minutes < dinner.close) {
    return { open: true, kind: "open", closesAt: dinner.close };
  }
  if (now.minutes < lunch.open) return { open: false, kind: "before-lunch" };
  if (now.minutes < dinner.open) return { open: false, kind: "between" };
  return { open: false, kind: "after" };
}

/** Renders the hero status line for a locale's copy. */
export function statusMessage(
  state: OpenState,
  now: LocalNow,
  copy: {
    closedToday: string;
    openUntil: string;
    opensAt: string;
    reopensAt: string;
    tomorrow: string;
    mondayShut: string;
  },
): string {
  switch (state.kind) {
    case "open":
      return copy.openUntil + formatMinutes(state.closesAt);
    case "monday":
      return copy.closedToday;
    case "before-lunch":
      return copy.opensAt + formatMinutes(SERVICES.lunch.open);
    case "between":
      return copy.reopensAt + formatMinutes(SERVICES.dinner.open);
    case "after":
      // Sunday evening: the next open day is Tuesday, not tomorrow.
      return now.weekday === 0 ? copy.mondayShut : copy.tomorrow;
  }
}

/** Monday-first week, for the hours table. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
