"use client";

import Link from "next/link";
import { AnimatePresence, m, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { LanguageSwitch } from "./LanguageSwitch";
import { CartButton } from "./CartButton";
import { ButtonLink } from "@/components/ui/Button";
import { duration, ease, spring } from "@/components/motion";

type NavLink = { href: string; label: string };

/**
 * Sticky header.
 *
 * Two states, and the transition between them is the whole point: at the top
 * of the page the bar is transparent and tall; once scrolled it condenses,
 * gains a blurred ground and a hairline rule. Both properties animate, so it
 * settles rather than snapping.
 *
 * The height is animated on the inner row rather than the header itself, and
 * the header is `sticky`, so the page below never reflows.
 */
export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  // A motion-value subscription, not a scroll listener with setState on every
  // frame: this only re-renders on the two crossings that matter.
  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled((was) => (was ? value > 24 : value > 48));
  });

  const links: NavLink[] = [
    { href: `/${locale}/menu`, label: dict.nav.menu },
    { href: `/${locale}#student`, label: dict.nav.student },
    { href: `/${locale}#info`, label: dict.nav.hours },
  ];

  return (
    <m.header
      className="sticky top-0 z-50"
      initial={false}
      animate={{
        backgroundColor: scrolled ? "rgba(12,21,38,0.88)" : "rgba(12,21,38,0)",
        borderBottomColor: scrolled ? "rgba(240,235,224,0.16)" : "rgba(240,235,224,0)",
      }}
      transition={{ duration: duration.base, ease: ease.inOut }}
      style={{ borderBottomWidth: 1, backdropFilter: scrolled ? "blur(10px)" : "none" }}
    >
      <a
        href="#main"
        className="bg-kaki sr-only px-4 py-2 text-sm font-bold text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {dict.nav.skip}
      </a>

      <m.div
        className="wrap flex items-center gap-4"
        initial={false}
        animate={{ height: scrolled ? 60 : 76 }}
        transition={{ duration: duration.base, ease: ease.inOut }}
      >
        <Link
          href={`/${locale}`}
          className="font-display text-[22px] font-black tracking-[0.14em] no-underline"
        >
          KY<span className="text-kaki">O</span>TO
        </Link>

        <nav className="ml-auto flex items-center gap-3 sm:gap-5">
          {/* Below md the bar carries only the basket and the menu toggle.
              At 360px anything more pushes the row past the viewport, and the
              order path must never be the thing that gets squeezed off. */}
          <ul className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-washi-dim hover:text-washi hover:border-b-kaki border-b border-transparent py-1.5 text-[13px] tracking-[0.09em] uppercase no-underline transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <LanguageSwitch current={locale} group="bar" />
          </div>

          <CartButton label={dict.nav.cart} />

          <div className="hidden md:block">
            <ButtonLink href={`/${locale}/menu`} size="sm">
              {dict.nav.order}
            </ButtonLink>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? dict.nav.closeMenu : dict.nav.openMenu}
            className="border-rule relative flex h-9 w-9 items-center justify-center border md:hidden"
          >
            <m.span
              className="bg-washi absolute block h-px w-4"
              animate={menuOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -3 }}
              transition={spring.press}
            />
            <m.span
              className="bg-washi absolute block h-px w-4"
              animate={menuOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 3 }}
              transition={spring.press}
            />
          </button>
        </nav>
      </m.div>

      <AnimatePresence initial={false}>
        {menuOpen ? (
          <m.div
            key="mobile-nav"
            className="bg-ai-deep/95 border-rule overflow-hidden border-t backdrop-blur-md md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duration.base, ease: ease.inOut }}
          >
            <div className="wrap py-2">
              <ul className="m-0 flex list-none flex-col p-0">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="border-rule-soft block border-b py-3.5 text-sm tracking-[0.08em] uppercase no-underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between gap-3 py-4">
                <LanguageSwitch current={locale} group="panel" />
                <ButtonLink
                  href={`/${locale}/menu`}
                  size="sm"
                  onClick={() => setMenuOpen(false)}
                >
                  {dict.nav.order}
                </ButtonLink>
              </div>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </m.header>
  );
}
