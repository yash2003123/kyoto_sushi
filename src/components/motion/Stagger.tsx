"use client";

import { m } from "motion/react";
import type { ElementType, ReactNode } from "react";
import { fadeUp, riseIn, staggerContainer, viewportOnce } from "./tokens";

const itemPresets = { "fade-up": fadeUp, rise: riseIn } as const;
type ItemPreset = keyof typeof itemPresets;

const tagCache = new Map<ElementType, ElementType>();
function motionTag(as: ElementType): ElementType {
  let cached = tagCache.get(as);
  if (!cached) {
    cached = m.create(as as string) as ElementType;
    tagCache.set(as, cached);
  }
  return cached;
}

export type StaggerProps = {
  children: ReactNode;
  /** Seconds between each child. Defaults to 70ms, inside the 50–100ms band. */
  step?: number;
  /** Seconds before the first child starts. */
  delay?: number;
  as?: ElementType;
  className?: string;
  /** Animate on mount rather than on scroll. */
  onMount?: boolean;
  id?: string;
};

/**
 * Container that drives a list of <StaggerItem>s.
 *
 * Children inherit the parent's animation state through variant propagation,
 * so items need no `initial`/`animate` of their own and there is exactly one
 * IntersectionObserver per list rather than one per card.
 */
export function Stagger({
  children,
  step,
  delay = 0,
  as = "div",
  className,
  onMount = false,
  id,
}: StaggerProps) {
  const Tag = motionTag(as) as typeof m.div;
  const activation = onMount
    ? ({ animate: "visible" } as const)
    : ({ whileInView: "visible", viewport: viewportOnce } as const);

  return (
    <Tag
      id={id}
      className={className}
      initial="hidden"
      variants={staggerContainer(step, delay)}
      {...activation}
    >
      {children}
    </Tag>
  );
}

export type StaggerItemProps = {
  children: ReactNode;
  preset?: ItemPreset;
  as?: ElementType;
  className?: string;
};

/** One child of a <Stagger>. Carries no timing of its own — the parent owns it. */
export function StaggerItem({
  children,
  preset = "fade-up",
  as = "div",
  className,
}: StaggerItemProps) {
  const Tag = motionTag(as) as typeof m.div;
  return (
    <Tag className={className} variants={itemPresets[preset]}>
      {children}
    </Tag>
  );
}
