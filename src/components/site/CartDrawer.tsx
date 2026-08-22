"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { findItem, t } from "@/lib/menu";
import { formatPrice, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { AnimatedNumber, duration, ease, spring, stagger } from "@/components/motion";
import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * Slide-over basket.
 *
 * The panel rides a spring because it is a physical surface the customer just
 * pulled open; the scrim is a plain opacity fade behind it. Lines animate out
 * with `layout` so removing one closes the gap instead of snapping.
 */
export function CartDrawer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { lines, subtotal, drawerOpen, closeDrawer, decrement, add, remove, clear } =
    useCart();

  // Escape to close, and lock the page behind the drawer.
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <AnimatePresence>
      {drawerOpen ? (
        <>
          <m.div
            key="scrim"
            className="fixed inset-0 z-60 bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.base, ease: ease.out }}
            onClick={closeDrawer}
          />

          <m.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={dict.cart.title}
            className="bg-ai-deep border-rule fixed top-0 right-0 z-70 flex h-dvh w-full max-w-[420px] flex-col border-l"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={spring.panel}
          >
            <header className="border-rule flex items-center justify-between border-b px-6 py-5">
              <h2 className="font-display m-0 text-xl font-bold">{dict.cart.title}</h2>
              <button
                type="button"
                onClick={closeDrawer}
                className="text-washi-dim hover:text-washi text-xs tracking-[0.12em] uppercase transition-colors duration-200"
              >
                {dict.cart.close}
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {lines.length === 0 ? (
                <m.div
                  className="py-16 text-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: duration.base, ease: ease.out }}
                >
                  <p className="m-0 text-[15px]">{dict.cart.empty}</p>
                  <p className="text-washi-dim mt-1 text-sm">{dict.cart.emptyHint}</p>
                  <ButtonLink
                    href={`/${locale}/menu`}
                    variant="ghost"
                    size="sm"
                    className="mt-6"
                    onClick={closeDrawer}
                  >
                    {dict.nav.menu}
                  </ButtonLink>
                </m.div>
              ) : (
                <ul className="m-0 list-none p-0">
                  <AnimatePresence initial={false} mode="popLayout">
                    {lines.map((line, index) => {
                      const item = findItem(line.id);
                      if (!item) return null;
                      return (
                        <m.li
                          key={line.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 24 }}
                          transition={{
                            duration: duration.base,
                            ease: ease.out,
                            delay: index * stagger.tight,
                            layout: spring.panel,
                          }}
                          className="border-rule-soft flex items-start gap-3 border-b py-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="m-0 text-[15px] leading-snug">
                              {t(item.name, locale)}
                            </p>
                            <p className="text-washi-dim tabular m-0 text-[13px]">
                              {formatPrice(item.price, locale)}
                            </p>
                          </div>

                          <div className="border-rule flex items-center border">
                            <button
                              type="button"
                              onClick={() => decrement(line.id)}
                              aria-label={dict.cart.decrease}
                              className="hover:bg-washi/8 h-8 w-8 text-sm transition-colors duration-200"
                            >
                              −
                            </button>
                            <span className="tabular w-7 text-center text-sm">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => add(item)}
                              aria-label={dict.cart.increase}
                              className="hover:bg-washi/8 h-8 w-8 text-sm transition-colors duration-200"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => remove(line.id)}
                            aria-label={`${dict.cart.remove}: ${t(item.name, locale)}`}
                            className="text-washi-dim hover:text-kaki mt-1.5 text-xs transition-colors duration-200"
                          >
                            ✕
                          </button>
                        </m.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {lines.length > 0 ? (
              <footer className="border-rule border-t px-6 py-5">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-washi-dim text-sm">{dict.cart.subtotal}</span>
                  <AnimatedNumber
                    value={subtotal}
                    format={(n) => formatPrice(Math.round(n), locale)}
                    className="font-display tabular text-2xl font-bold"
                  />
                </div>

                <ButtonLink
                  href={`/${locale}/order`}
                  onClick={closeDrawer}
                  className="mt-4 w-full"
                >
                  {dict.cart.checkout}
                </ButtonLink>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                  className="mt-2 w-full border-transparent"
                >
                  {dict.cart.clear}
                </Button>
              </footer>
            ) : null}
          </m.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

