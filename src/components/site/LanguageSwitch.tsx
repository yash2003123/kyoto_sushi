"use client";

import { usePathname, useRouter } from "next/navigation";
import { m } from "motion/react";
import { locales, type Locale } from "@/lib/i18n";
import { spring } from "@/components/motion";

/**
 * Language switch.
 *
 * Navigates to the equivalent real URL rather than swapping strings in place,
 * so each language stays indexable. The active pill slides between options
 * with a shared `layoutId` — one of the few places a spring earns its keep,
 * because the marker is a physical object moving from A to B.
 */
export function LanguageSwitch({
  current,
  /**
   * The desktop bar and the mobile panel each render a switch, and two
   * elements sharing a `layoutId` would fight over the same marker. Each
   * instance gets its own group.
   */
  group = "bar",
}: {
  current: Locale;
  group?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function go(next: Locale) {
    if (next === current) return;
    const rest = pathname.replace(new RegExp(`^/${current}`), "");
    router.push(`/${next}${rest}`);
  }

  return (
    <div
      className="border-rule flex items-center gap-0.5 border p-[3px]"
      role="group"
      aria-label="Taal / Language / Langue"
    >
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => go(locale)}
            aria-current={active ? "true" : "false"}
            className={`relative px-2 py-1.5 text-[11.5px] font-bold tracking-[0.12em] transition-colors duration-200 sm:px-2.5 ${
              active ? "text-white" : "text-washi-dim hover:text-washi"
            }`}
          >
            {active ? (
              <m.span
                layoutId={`lang-pill-${group}`}
                className="bg-kaki absolute inset-0"
                transition={spring.panel}
              />
            ) : null}
            <span className="relative">{locale.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
