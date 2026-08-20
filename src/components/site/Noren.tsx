"use client";

import { m } from "motion/react";
import { duration, ease } from "@/components/motion";

/**
 * The noren — the split fabric curtain hanging in a Japanese restaurant
 * doorway. This is the one bold move on the page; everything around it stays
 * quiet.
 *
 * The panels drop from the lintel with a hair of rotation and a staggered
 * start, the way fabric actually falls. It is a mount animation, not a scroll
 * one, because it is the first thing above the fold.
 *
 * The container reserves the full height from first paint, so the drop never
 * moves anything below it — no layout shift, and the LCP text under the
 * curtain is not waiting on this to settle.
 */

const panels = [
  { key: "kyo", glyph: "京", accent: false },
  { key: "to", glyph: "都", accent: true },
  { key: "street", label: "Tiensestraat 239", accent: false },
];

export function Noren() {
  return (
    <div
      aria-hidden
      className="flex h-[200px] justify-center gap-1.5 sm:h-[280px]"
      style={{ filter: "drop-shadow(0 18px 30px rgba(0,0,0,.45))" }}
    >
      {panels.map((panel, index) => (
        <m.div
          key={panel.key}
          className="relative flex min-w-0 flex-[0_1_120px] origin-top items-center justify-center rounded-b-[3px] sm:flex-[0_1_190px]"
          style={{
            background:
              "linear-gradient(178deg,#1E3055 0%,#16233D 62%,#101B31 100%)",
            willChange: "transform, opacity",
          }}
          initial={{ y: "-100%", rotate: -1.2, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          transition={{
            duration: duration.slower,
            ease: ease.out,
            delay: 0.05 + index * 0.11,
          }}
        >
          <span
            className="absolute inset-x-0 bottom-3.5 h-px"
            style={{ background: "rgba(240,235,224,.14)" }}
          />
          {panel.glyph ? (
            <b
              className={`font-display text-[40px] leading-none font-black tracking-[0.1em] sm:text-[60px] ${
                panel.accent ? "text-kaki" : "text-washi"
              }`}
              style={{ writingMode: "vertical-rl" }}
            >
              {panel.glyph}
            </b>
          ) : (
            <small
              className="text-washi-dim text-[11px] tracking-[0.42em] uppercase"
              style={{ writingMode: "vertical-rl" }}
            >
              {panel.label}
            </small>
          )}
        </m.div>
      ))}
    </div>
  );
}
