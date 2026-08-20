export const locales = ["nl", "en", "fr"] as const;
export type Locale = (typeof locales)[number];

/** Dutch first — that is the operating language of the restaurant. */
export const defaultLocale: Locale = "nl";

export const localeNames: Record<Locale, string> = {
  nl: "Nederlands",
  en: "English",
  fr: "Français",
};

/** BCP-47 tags used for <html lang> and hreflang. */
export const localeTags: Record<Locale, string> = {
  nl: "nl-BE",
  en: "en",
  fr: "fr-BE",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Currency formatting, locale-correct. Belgium uses a comma decimal. */
export function formatPrice(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTags[locale], {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
