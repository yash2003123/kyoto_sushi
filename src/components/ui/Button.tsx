"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { m } from "motion/react";
import { pressMotion } from "@/components/motion";

type Variant = "solid" | "ghost" | "ink";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 border font-bold uppercase tracking-[0.1em] " +
  "transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  solid: "border-transparent bg-kaki text-white hover:bg-kaki-deep",
  ghost: "border-rule bg-transparent text-washi hover:bg-washi/8",
  ink: "border-transparent bg-sumi text-white hover:bg-black",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2.5 text-[11.5px]",
  md: "px-6 py-3.5 text-[13px]",
};

function classes(variant: Variant, size: Size, className = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

/**
 * The site's button. Colour change is a CSS transition; the lift and press are
 * Motion springs from the shared `pressMotion` preset, so every button on the
 * site reacts identically and reduced-motion strips all of them at once.
 */
export function Button({
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<typeof m.button> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <m.button
      {...pressMotion}
      className={classes(variant, size, className)}
      {...props}
    >
      {children}
    </m.button>
  );
}

const MotionLink = m.create(Link);

export function ButtonLink({
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<typeof MotionLink> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <MotionLink {...pressMotion} className={classes(variant, size, className)} {...props}>
      {children}
    </MotionLink>
  );
}
