"use client";

import { m } from "motion/react";
import Image, { type ImageProps } from "next/image";
import type { ReactNode } from "react";
import { useState } from "react";
import { duration, ease, imageReveal, viewportOnce } from "./tokens";

export type RevealImageProps = Omit<ImageProps, "onLoad"> & {
  /** Class for the clipping frame. The frame owns the layout box. */
  frameClassName?: string;
  /** Extra delay in seconds. */
  delay?: number;
};

/**
 * Image that settles out of a very slight over-scale once it is both in the
 * viewport and decoded.
 *
 * The outer frame is a plain element and never animates, so the space the
 * image occupies is fixed from first paint — the reveal contributes nothing
 * to CLS. Waiting for `onLoad` avoids animating an empty box, which is the
 * usual way this effect ends up looking cheap.
 */
export function RevealImage({
  frameClassName = "",
  delay = 0,
  className = "",
  ...imageProps
}: RevealImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`overflow-hidden ${frameClassName}`}>
      <m.div
        className="h-full w-full"
        initial="hidden"
        whileInView={loaded ? "visible" : "hidden"}
        viewport={viewportOnce}
        variants={imageReveal}
        transition={{ duration: duration.slower, ease: ease.out, delay }}
      >
        <Image
          {...imageProps}
          className={className}
          onLoad={() => setLoaded(true)}
        />
      </m.div>
    </div>
  );
}

/**
 * Same reveal for a surface that is not a bitmap — a gradient placeholder, a
 * video poster, an illustrated tile. Used for the food-photo slots that are
 * waiting on the shoot.
 */
export function RevealFrame({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <m.div
        className="h-full w-full"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={imageReveal}
        transition={{ duration: duration.slower, ease: ease.out, delay }}
      >
        {children}
      </m.div>
    </div>
  );
}
