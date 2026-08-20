import nl, { type Dictionary } from "@/data/dictionaries/nl";
import en from "@/data/dictionaries/en";
import fr from "@/data/dictionaries/fr";
import type { Locale } from "./i18n";

const dictionaries = { nl, en, fr } as const;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
