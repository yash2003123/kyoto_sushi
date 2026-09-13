/**
 * Opening hours and live open/closed state.
 *
 * Everything is computed in Europe/Brussels regardless of where the code runs,
 * so a server in another region and a customer's phone agree. Monday closed is
 * a real trap for people who decide on the walk over — it drives the hero
 * status line and the highlighted row in the hours table.
 *
 * Service windows and the closed weekday are configurable from the admin
 * panel and live in the store; `DEFAULT_SERVICES` / `DEFAULT_CLOSED_WEEKDAY`
 * below are what the restaurant actually runs today and double as the
 * fallback until an owner changes something. Every function that used to
 * read the old module-level constants now takes the config explicitly —
 * callers fetch it once with `getHoursConfig()` and pass it down, rather than
 * each function reaching into the store itself.
 */

import { cache } from "react";
import { getRecord, putRecord } from "./store";

export const TIMEZONE = "Europe/Brussels";

export type ServiceWindow = { open: number; close: number };
export type ServicesConfig = { lunch: ServiceWindow; dinner: ServiceWindow };

export type HoursConfig = {
  services: ServicesConfig;
  /** 0 = Sunday. */
  closedWeekday: number;
};

/** Minutes past midnight. What the restaurant runs today. */
export const DEFAULT_SERVICES: ServicesConfig = {
  lunch: { open: 11 * 60 + 30, close: 14 * 60 + 30 },
  dinner: { open: 17 * 60 + 30, close: 22 * 60 + 30 },
};

/** 0 = Sunday. The restaurant is closed on Monday. */
export const DEFAULT_CLOSED_WEEKDAY = 1;

const HOURS_KEY = "kyoto:settings:hours";

export const getHoursConfig = cache(async (): Promise<HoursConfig> => {
  const stored = await getRecord<HoursConfig>(HOURS_KEY);
  return stored ?? { services: DEFAULT_SERVICES, closedWeekday: DEFAULT_CLOSED_WEEKDAY };
});

/** Used by the admin panel. */
export async function saveHoursConfig(config: HoursConfig): Promise<void> {
  await putRecord(HOURS_KEY, config);
}

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

export function openState(
  now: LocalNow = localNow(),
  services: ServicesConfig = DEFAULT_SERVICES,
  closedWeekday: number = DEFAULT_CLOSED_WEEKDAY,
): OpenState {
  if (now.weekday === closedWeekday) return { open: false, kind: "monday" };
  const { lunch, dinner } = services;
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
  services: ServicesConfig = DEFAULT_SERVICES,
): string {
  switch (state.kind) {
    case "open":
      return copy.openUntil + formatMinutes(state.closesAt);
    case "monday":
      return copy.closedToday;
    case "before-lunch":
      return copy.opensAt + formatMinutes(services.lunch.open);
    case "between":
      return copy.reopensAt + formatMinutes(services.dinner.open);
    case "after":
      // Sunday evening: the next open day is Tuesday, not tomorrow.
      return now.weekday === 0 ? copy.mondayShut : copy.tomorrow;
  }
}

/** Monday-first week, for the hours table. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
