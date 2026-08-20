"use client";

import { m } from "motion/react";
import type { ComponentPropsWithoutRef } from "react";
import { spring } from "./tokens";

/**
 * Hover/tap feedback shared by every button and link-button on the site.
 *
 * The movement is deliberately tiny: a 2px lift and a 1% scale. Anything
 * larger reads as a toy. Both are transform-only, so nothing around the
 * button reflows and the compositor handles the frame.
 *
 * Under `prefers-reduced-motion` the MotionConfig at the app root strips the
 * transforms, leaving the CSS colour transition as the only feedback — which
 * is exactly the intended fallback.
 */
export const pressMotion = {
  whileHover: { scale: 1.015, y: -2 },
  whileTap: { scale: 0.985, y: 0 },
  transition: spring.press,
} as const;

type PressableProps = ComponentPropsWithoutRef<typeof m.button> & {
  /** Disable the gesture without disabling the element (e.g. while loading). */
  inert?: boolean;
};

export function Pressable({ inert = false, ...props }: PressableProps) {
  return <m.button {...(inert ? {} : pressMotion)} {...props} />;
}

type PressableLinkProps = ComponentPropsWithoutRef<typeof m.a>;

export function PressableLink(props: PressableLinkProps) {
  return <m.a {...pressMotion} {...props} />;
}
