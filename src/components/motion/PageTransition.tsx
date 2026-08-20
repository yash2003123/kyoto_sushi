"use client";

import { m } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { duration, ease, travel } from "./tokens";

/**
 * Cross-route transition.
 *
 * Keyed on the pathname so each route mounts its own instance and plays the
 * enter animation. Exit is intentionally not animated: holding the outgoing
 * page while the next one streams in delays first paint on a phone, and the
 * order path is the product.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <m.div
      key={pathname}
      initial={{ opacity: 0, y: travel.sm }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: ease.out }}
    >
      {children}
    </m.div>
  );
}
