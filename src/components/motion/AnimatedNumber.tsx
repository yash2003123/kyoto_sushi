"use client";

import { m, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import { spring } from "./tokens";

/**
 * Counts a number up or down instead of snapping. Used for the cart total, so
 * adding a dish reads as a change rather than a repaint.
 *
 * The element is width-stable via `tabular-nums`, so counting never nudges
 * the layout around it.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const raw = useMotionValue(value);
  const smooth = useSpring(raw, spring.panel);
  const text = useTransform(smooth, (n) => format(n));

  useEffect(() => {
    raw.set(value);
  }, [raw, value]);

  return (
    <m.span className={className} aria-live="polite">
      {text}
    </m.span>
  );
}
