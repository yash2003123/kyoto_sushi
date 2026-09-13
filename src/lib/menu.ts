/**
 * Menu data layer.
 *
 * `loadMenu()` is the only place the app touches the menu source. It reads a
 * live copy from the store first — written by the admin panel — and falls
 * back to the committed JSON seed when nothing has been saved yet, so the
 * site behaves identically to before the admin panel existed until an owner
 * actually changes something.
 *
 * Wrapped in React's `cache()`: several independent server components on the
 * same page (the menu board, the gallery band, the cart drawer's parent
 * layout) each call this, and within one request they should collapse into a
 * single store read rather than one each.
 */

import { cache } from "react";
import raw from "@/data/menu.json";
import type { Locale } from "./i18n";
import { getRecord, putRecord } from "./store";

const MENU_KEY = "kyoto:settings:menu";

export type Localized = Record<Locale, string>;

export type MenuItem = {
  id: string;
  name: Localized;
  desc?: Localized;
  /** Integer cents. Never a float — money in floats is how totals drift. */
  price: number;
  pieces?: number;
  allergens: string[];
  tags: string[];
  available: boolean;
};

export type MenuCategory = {
  id: string;
  name: Localized;
  note?: Localized;
  items: MenuItem[];
};

export type MenuCourse = {
  id: string;
  kanji: string;
  categories: MenuCategory[];
};

export type Menu = {
  updatedAt: string;
  courses: MenuCourse[];
};

/** Course ids map onto dictionary keys, so copy stays with the copy. */
export type CourseId = "sushi" | "warm" | "bowls" | "deals" | "drinks";

function seedMenu(): Menu {
  const data = raw as unknown as Menu;
  return { updatedAt: data.updatedAt, courses: data.courses };
}

export const loadMenu = cache(async (): Promise<Menu> => {
  const stored = await getRecord<Menu>(MENU_KEY);
  return stored ?? seedMenu();
});

/** Used by the admin panel. Every save replaces the whole menu document. */
export async function saveMenu(menu: Menu): Promise<void> {
  await putRecord(MENU_KEY, { ...menu, updatedAt: new Date().toISOString() });
}

/**
 * Builds an id → item lookup from an already-resolved menu.
 *
 * Deliberately synchronous and given the menu as an argument rather than
 * loading it itself: server call sites (pricing, the kitchen ticket) load the
 * menu once and index it once, and client components (the cart drawer, the
 * checkout summary) receive the resolved menu as a prop from their server
 * parent and can build the same index locally — neither has to touch the
 * store directly.
 */
export function indexMenu(menu: Menu): Map<string, MenuItem> {
  const index = new Map<string, MenuItem>();
  for (const course of menu.courses) {
    for (const category of course.categories) {
      for (const item of category.items) index.set(item.id, item);
    }
  }
  return index;
}

export function countItems(course: MenuCourse): number {
  return course.categories.reduce((n, c) => n + c.items.length, 0);
}

export function t(value: Localized | undefined, locale: Locale): string {
  return value?.[locale] ?? value?.nl ?? "";
}

/** Allergen labels. EU-14 subset actually used by this kitchen. */
export const ALLERGEN_LABELS: Record<string, Localized> = {
  fish: { nl: "vis", en: "fish", fr: "poisson" },
  crustacean: { nl: "schaaldieren", en: "crustaceans", fr: "crustacés" },
  gluten: { nl: "gluten", en: "gluten", fr: "gluten" },
  soy: { nl: "soja", en: "soya", fr: "soja" },
  sesame: { nl: "sesam", en: "sesame", fr: "sésame" },
  egg: { nl: "ei", en: "egg", fr: "œuf" },
  milk: { nl: "melk", en: "milk", fr: "lait" },
  sulphites: { nl: "sulfieten", en: "sulphites", fr: "sulfites" },
};
