"use client";

import { AnimatePresence, m } from "motion/react";
import { useCart } from "@/lib/cart";
import { formatPrice, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { AnimatedNumber, spring } from "@/components/motion";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Mobile checkout bar.
 *
 * Most visitors arrive hungry, on a phone, often already walking — the way to
 * the payment screen should never be more than a thumb away. Slides in from
 * below the fold the moment the basket stops being empty, and stays out of the
 * way until then.
 */
export function StickyCartBar({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { count, subtotal, ready } = useCart();
  const visible = ready && count > 0;

  return (
    <AnimatePresence>
      {visible ? (
        <m.div
          className="bg-ai-deep/95 border-rule fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={spring.panel}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="wrap flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-washi-dim m-0 text-[11.5px] tracking-[0.14em] uppercase">
                {count} {dict.board.items}
              </p>
              <AnimatedNumber
                value={subtotal}
                format={(n) => formatPrice(Math.round(n), locale)}
                className="font-display tabular block text-xl font-bold"
              />
            </div>
            <ButtonLink href={`/${locale}/order`} size="sm">
              {dict.cart.checkout}
            </ButtonLink>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
