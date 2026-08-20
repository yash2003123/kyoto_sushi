/**
 * Motion tokens.
 *
 * Every animation in the app resolves its timing from this file. Nothing
 * should hand-write a duration, an easing curve or a spring config inline —
 * if a new value is genuinely needed it belongs here first.
 *
 * Direction: subtle, premium, smooth. Transform + opacity only, so the
 * compositor does the work and nothing triggers layout.
 */

import type { Transition, Variants } from "motion/react";

/** Durations, in seconds. Kept inside the 200–600ms band. */
export const duration = {
  fast: 0.2,
  base: 0.32,
  slow: 0.48,
  slower: 0.6,
} as const;

/**
 * Easings. `out` is the workhorse: fast departure, long soft settle, which is
 * what reads as "premium" rather than "snappy". `inOut` is for things that
 * move both ways (headers collapsing, drawers sliding).
 */
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  in: [0.55, 0, 1, 0.45],
} as const;

/**
 * Springs, used only where a gesture or a physical object justifies one:
 * button press, drawer, badge pop. Damping is high on purpose — these settle
 * without visible overshoot.
 */
export const spring = {
  /** Press/hover feedback. Reacts instantly, no wobble. */
  press: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 },
  /** Panels and drawers. Slightly heavier so large surfaces feel weighty. */
  panel: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 },
  /** The one place a touch of overshoot is allowed: a count badge changing. */
  pop: { type: "spring", stiffness: 500, damping: 24, mass: 0.6 },
} satisfies Record<string, Transition>;

/** Default transition for enter animations. */
export const enterTransition: Transition = {
  duration: duration.slow,
  ease: ease.out,
};

/** Stagger step between siblings, in seconds. The brief's 50–100ms band. */
export const stagger = {
  tight: 0.05,
  base: 0.07,
  loose: 0.1,
} as const;

/** Distance, in px, that entering content travels upward. Deliberately small. */
export const travel = {
  sm: 10,
  base: 16,
  lg: 24,
} as const;

/* ------------------------------------------------------------------ *
 * Shared variants
 * ------------------------------------------------------------------ */

/**
 * The house enter animation: fade in while rising a short distance.
 * Under `prefers-reduced-motion` Motion drops the transform and keeps the
 * opacity, which is the behaviour we want — content still announces itself.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: travel.base },
  visible: {
    opacity: 1,
    y: 0,
    transition: enterTransition,
  },
};

export const fadeUpSmall: Variants = {
  hidden: { opacity: 0, y: travel.sm },
  visible: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: enterTransition },
};

/** For cards and tiles: rise plus a hair of scale. Never below 0.96. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: travel.base, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: enterTransition,
  },
};

/** Images: settle out of a very slight over-scale, so the frame stays fixed. */
export const imageReveal: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.slower, ease: ease.out },
  },
};

/**
 * Container variant. Children with `variants` and no explicit `initial`/
 * `animate` inherit the parent's state, so a list only needs this on the
 * wrapper and `fadeUp` on each item.
 */
export function staggerContainer(
  step: number = stagger.base,
  delay: number = 0,
): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: step, delayChildren: delay },
    },
  };
}

/** Viewport config shared by every scroll-triggered reveal. */
export const viewportOnce = { once: true, amount: 0.2, margin: "0px 0px -80px 0px" } as const;
