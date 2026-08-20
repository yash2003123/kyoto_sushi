"use client";

import { m } from "motion/react";
import type { ElementType, ReactNode } from "react";
import { fadeUp, fadeIn, riseIn, viewportOnce, duration, ease } from "./tokens";

type Preset = "fade-up" | "fade" | "rise";

const presets = { "fade-up": fadeUp, fade: fadeIn, rise: riseIn } as const;

/**
 * `m.create` builds a new component type, so it must never run inside render —
 * a fresh type on every pass would remount the subtree and restart animations.
 * Cache one motion component per tag for the life of the module.
 */
const motionTagCache = new Map<ElementType, ElementType>();

function motionTag(as: ElementType): ElementType {
  let cached = motionTagCache.get(as);
  if (!cached) {
    cached = m.create(as as string) as ElementType;
    motionTagCache.set(as, cached);
  }
  return cached;
}

export type RevealProps = {
  children: ReactNode;
  /** Which house variant to use. Default: the fade + upward move. */
  preset?: Preset;
  /** Seconds to wait before starting. Use sparingly; prefer <Stagger>. */
  delay?: number;
  /** Override the travel distance in px. */
  distance?: number;
  /** Render as something other than a div. */
  as?: ElementType;
  className?: string;
  /**
   * Animate on mount instead of on scroll. Use for above-the-fold content
   * that is already in view — a viewport trigger there just adds a flash.
   */
  onMount?: boolean;
  id?: string;
};

/**
 * Fades content in and moves it slightly upward as it enters the viewport.
 * This is the default way to bring anything onto the page; reach for a custom
 * variant only when this genuinely cannot express it.
 */
export function Reveal({
  children,
  preset = "fade-up",
  delay = 0,
  distance,
  as = "div",
  className,
  onMount = false,
  id,
}: RevealProps) {
  const Tag = motionTag(as) as typeof m.div;
  const base = presets[preset];

  // Only build a bespoke variant when the caller overrides the distance.
  const variants =
    distance === undefined
      ? base
      : {
          hidden: { ...base.hidden, y: distance },
          visible: { ...(base.visible as object), y: 0 },
        };

  const activation = onMount
    ? ({ animate: "visible" } as const)
    : ({ whileInView: "visible", viewport: viewportOnce } as const);

  return (
    <Tag
      id={id}
      className={className}
      initial="hidden"
      variants={variants}
      transition={{ duration: duration.slow, ease: ease.out, delay }}
      {...activation}
    >
      {children}
    </Tag>
  );
}
