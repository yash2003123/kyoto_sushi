"use client";

import { useEffect, useState } from "react";
import {
  ADMIN_LOCALE_KEY,
  adminDictionaries,
  adminLocales,
  type AdminLocale,
} from "./admin-dictionary";

function readStored(): AdminLocale {
  if (typeof window === "undefined") return "nl";
  try {
    const stored = window.localStorage.getItem(ADMIN_LOCALE_KEY);
    return (adminLocales as readonly string[]).includes(stored ?? "") ? (stored as AdminLocale) : "nl";
  } catch {
    // Private browsing / storage disabled — fall back silently rather than
    // break the login screen over a per-browser convenience.
    return "nl";
  }
}

/**
 * The admin panel's own language, independent of anything customer-facing.
 * Stored in localStorage rather than a cookie or the database: it's a
 * per-browser preference for whoever is currently at the counter, not
 * something that needs to sync across devices or be readable server-side.
 */
export function useAdminLocale() {
  const [locale, setLocaleState] = useState<AdminLocale>("nl");

  // Read the stored value after mount so server and first client render
  // agree (both "nl"), then swap in the real preference — avoids a
  // hydration mismatch from reading localStorage during render.
  useEffect(() => {
    setLocaleState(readStored());
  }, []);

  function setLocale(next: AdminLocale) {
    setLocaleState(next);
    try {
      window.localStorage.setItem(ADMIN_LOCALE_KEY, next);
    } catch {
      // Ignore — the preference just won't survive a reload this time.
    }
  }

  return { locale, setLocale, dict: adminDictionaries[locale] };
}
