"use client";

import { m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { localNow, openState, statusMessage, type HoursConfig } from "@/lib/hours";
import type { Dictionary } from "@/lib/dictionary";
import { duration, ease } from "@/components/motion";

/**
 * The live open/closed pill.
 *
 * Rendered empty on the server and filled on mount: the server's clock and the
 * visitor's can disagree across a service boundary, and a hydration mismatch
 * on the very first thing a hungry customer reads is not worth the SSR.
 * The reserved height keeps it from shifting anything when the text lands.
 *
 * `hours` is resolved server-side (by the page that renders Hero) and passed
 * down — the admin panel can change opening hours, and a client component
 * re-checking every minute must not be doing that recomputation against
 * values baked into the JS bundle at the last deploy.
 */
export function LiveStatus({ dict, hours }: { dict: Dictionary; hours: HoursConfig }) {
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  // reducedMotion="user" strips transforms but not opacity, and an endlessly
  // breathing dot is exactly the kind of thing that setting exists to stop.
  const reduced = useReducedMotion();

  useEffect(() => {
    function update() {
      const now = localNow();
      const state = openState(now, hours.services, hours.closedWeekday);
      setOpen(state.open);
      setMessage(statusMessage(state, now, dict.status, hours.services));
    }
    update();
    // Re-check each minute so the pill flips at 14:30 without a reload.
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [dict, hours]);

  return (
    <div className="mt-8 flex min-h-[42px] justify-center">
      <m.div
        className="border-rule text-washi-dim inline-flex items-center gap-2.5 rounded-full border px-4.5 py-2.5 text-[13px] tracking-[0.06em]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: message ? 1 : 0, y: message ? 0 : 8 }}
        transition={{ duration: duration.base, ease: ease.out }}
        aria-live="polite"
      >
        <span className="relative flex h-[7px] w-[7px]">
          {open ? (
            <m.span
              className="bg-moss absolute inset-0 rounded-full"
              // A slow breath, not a blink. 2.4s and a 12% opacity swing is
              // barely perceptible, which is the intent: presence, not motion.
              animate={reduced ? { opacity: 1 } : { opacity: [1, 0.55, 1] }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
              }
              style={{ boxShadow: "0 0 0 4px rgba(126,143,107,.18)" }}
            />
          ) : (
            <span
              className="absolute inset-0 rounded-full bg-[#8A8A8A]"
              style={{ boxShadow: "0 0 0 4px rgba(138,138,138,.15)" }}
            />
          )}
        </span>
        <span>{message ?? " "}</span>
      </m.div>
    </div>
  );
}
