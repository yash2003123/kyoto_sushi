"use client";

import { useEffect } from "react";
import { localeTags, type Locale } from "@/lib/i18n";

/**
 * Keeps <html lang> in step with the route.
 *
 * The <html> element is owned by the root layout, which sits above the locale
 * segment and so cannot know the language. Setting it here means screen
 * readers and translation tools get the right language on every route without
 * duplicating the whole document shell per locale.
 */
export function SetHtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = localeTags[locale];
  }, [locale]);
  return null;
}
