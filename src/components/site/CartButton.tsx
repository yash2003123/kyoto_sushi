"use client";

import { AnimatePresence, m } from "motion/react";
import { useCart } from "@/lib/cart";
import { pressMotion, spring } from "@/components/motion";

/**
 * Basket button with a count badge.
 *
 * The badge is the one place a springy pop is allowed: adding a dish should
 * register in peripheral vision while the customer is still looking at the
 * menu. `key={count}` remounts the number so each change replays.
 */
export function CartButton({ label }: { label: string }) {
  const { count, openDrawer, ready } = useCart();

  return (
    <m.button
      type="button"
      onClick={openDrawer}
      {...pressMotion}
      aria-label={`${label}${count > 0 ? `: ${count}` : ""}`}
      className="border-rule hover:bg-washi/8 relative flex h-9 items-center gap-2 border px-3 text-[12px] tracking-[0.1em] uppercase transition-colors duration-200"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 7h12l-1 13H7L6 7Zm3 0a3 3 0 0 1 6 0"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <AnimatePresence mode="popLayout" initial={false}>
        {ready && count > 0 ? (
          <m.span
            key={count}
            className="bg-kaki tabular flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={spring.pop}
          >
            {count}
          </m.span>
        ) : null}
      </AnimatePresence>
    </m.button>
  );
}
