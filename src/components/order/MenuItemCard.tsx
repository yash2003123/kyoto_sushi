"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { ALLERGEN_LABELS, t, type MenuItem } from "@/lib/menu";
import { formatPrice, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { duration, ease, pressMotion, spring } from "@/components/motion";

/**
 * One dish.
 *
 * The add button swaps its label to a confirmation for a beat, so a customer
 * scanning a long list can tell what landed in the basket without looking up
 * at the header. The swap is a crossfade over a fixed-width button, so nothing
 * around it moves.
 */
export function MenuItemCard({
  item,
  locale,
  dict,
}: {
  item: MenuItem;
  locale: Locale;
  dict: Dictionary;
}) {
  const { add, quantityOf } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<number | null>(null);
  const quantity = quantityOf(item.id);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  function onAdd() {
    add(item);
    setJustAdded(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setJustAdded(false), 1400);
  }

  const allergens = item.allergens
    .map((code) => t(ALLERGEN_LABELS[code], locale))
    .filter(Boolean)
    .join(", ");

  return (
    <article
      className={`border-rule-soft bg-ai-deep/40 flex h-full flex-col border p-5 transition-colors duration-200 ${
        item.available ? "hover:border-rule" : "opacity-55"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="m-0 text-[15.5px] leading-snug font-medium">
          {t(item.name, locale)}
        </h3>
        <span className="font-display tabular shrink-0 text-[17px] font-bold">
          {formatPrice(item.price, locale)}
        </span>
      </div>

      {item.desc ? (
        <p className="text-washi-dim m-0 mt-1.5 text-[13.5px] leading-snug">
          {t(item.desc, locale)}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.pieces ? <Tag>{`${item.pieces} ${dict.menu.pieces}`}</Tag> : null}
        {item.tags.includes("spicy") ? <Tag accent>{dict.menu.spicy}</Tag> : null}
        {item.tags.includes("vegetarian") ? <Tag>{dict.menu.vegetarian}</Tag> : null}
        {item.tags.includes("raw") ? <Tag>{dict.menu.raw}</Tag> : null}
      </div>

      {allergens ? (
        <p className="text-washi-dim/70 m-0 mt-2.5 text-[11.5px]">
          {dict.menu.allergensLabel}: {allergens}
        </p>
      ) : null}

      <div className="mt-auto flex items-center gap-3 pt-4">
        {item.available ? (
          <m.button
            type="button"
            onClick={onAdd}
            {...pressMotion}
            className="border-rule hover:border-kaki hover:bg-kaki relative min-w-[104px] border px-4 py-2 text-[12px] font-bold tracking-[0.1em] uppercase transition-colors duration-200"
          >
            {/* Both labels occupy the same grid cell, so the crossfade cannot
                change the button's width mid-animation. */}
            <span className="grid [grid-template-areas:'label']">
              <AnimatePresence initial={false} mode="popLayout">
                <m.span
                  key={justAdded ? "added" : "add"}
                  className="[grid-area:label]"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: duration.fast, ease: ease.out }}
                >
                  {justAdded ? dict.menu.added : dict.menu.add}
                </m.span>
              </AnimatePresence>
            </span>
          </m.button>
        ) : (
          <span className="border-rule text-washi-dim border px-4 py-2 text-[12px] tracking-[0.1em] uppercase">
            {dict.menu.soldOut}
          </span>
        )}

        <AnimatePresence initial={false}>
          {quantity > 0 ? (
            <m.span
              className="bg-kaki tabular flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[12px] font-bold text-white"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={spring.pop}
            >
              {quantity}
            </m.span>
          ) : null}
        </AnimatePresence>
      </div>
    </article>
  );
}

function Tag({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`border px-2 py-0.5 text-[10.5px] tracking-[0.14em] uppercase ${
        accent ? "border-kaki/50 text-kaki" : "border-rule text-washi-dim"
      }`}
    >
      {children}
    </span>
  );
}
