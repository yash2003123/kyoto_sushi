/**
 * Menu data layer.
 *
 * `loadMenu()` is the only place the app touches the menu source. Today it
 * reads a JSON file that a spreadsheet export or a CMS build step can write;
 * swapping it for a live fetch is a change to this one function. Nothing
 * downstream knows or cares — which is the point, because 300+ dishes across
 * three languages with moving prices must never live in JSX.
 */

import raw from "@/data/menu.json";
import type { Locale } from "./i18n";

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

export function loadMenu(): Menu {
  const data = raw as unknown as Menu;
  return { updatedAt: data.updatedAt, courses: data.courses };
}

let index: Map<string, MenuItem> | null = null;

/** Item lookup by id. Used to re-price a cart server-side at checkout. */
export function findItem(id: string): MenuItem | undefined {
  if (!index) {
    index = new Map();
    for (const course of loadMenu().courses) {
      for (const category of course.categories) {
        for (const item of category.items) index.set(item.id, item);
      }
    }
  }
  return index.get(id);
}

export function allItems(): MenuItem[] {
  return loadMenu().courses.flatMap((c) => c.categories.flatMap((k) => k.items));
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
