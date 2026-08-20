"use client";

import { LazyMotion, MotionConfig, domMax } from "motion/react";
import type { ReactNode } from "react";
import { duration, ease } from "./tokens";

/**
 * Single motion root for the app.
 *
 * - `reducedMotion="user"` makes Motion honour the OS setting globally: it
 *   strips transform/layout animation and keeps opacity, so we never have to
 *   branch on the media query inside individual components.
 * - `LazyMotion` loads the animation features as a separate chunk rather than
 *   shipping them in the first bundle. `domMax` over `domAnimation` because
 *   two things genuinely need shared-layout animation: the language pill and
 *   the cart list. Everything downstream therefore imports `m`, not `motion`
 *   — `strict` turns that into a build-time error rather than a silent
 *   bundle regression.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: duration.base, ease: ease.out }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
