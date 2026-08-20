"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/dictionary";
import { duration, ease, stagger } from "@/components/motion";

export type SlotOption = { minutes: number; label: string; full: boolean };

type SlotsResponse = {
  paused: boolean;
  prepMinutes: number;
  open: boolean;
  slots: SlotOption[];
};

/**
 * Kitchen-capacity slot picker.
 *
 * Not a calendar: the list comes from the server, already trimmed to what the
 * counter can actually absorb. Full slots stay visible but disabled, because
 * "18:45 is gone" is more useful to a customer than a silently shorter list.
 * The picker refetches every 60s so a slot that fills during checkout goes
 * grey before the payment is attempted rather than after.
 */
export function SlotPicker({
  dict,
  value,
  onChange,
  onStateChange,
}: {
  dict: Dictionary;
  value: number | null;
  onChange: (minutes: number | null) => void;
  onStateChange?: (state: { paused: boolean; hasSlots: boolean }) => void;
}) {
  const [data, setData] = useState<SlotsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/slots", { cache: "no-store" });
        if (!response.ok) return;
        const json = (await response.json()) as SlotsResponse;
        if (cancelled) return;
        setData(json);
        onStateChange?.({ paused: json.paused, hasSlots: json.slots.some((s) => !s.full) });
      } catch {
        // Offline or a blip: keep whatever we last showed rather than
        // emptying the picker under the customer.
      }
    }

    load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [onStateChange]);

  const slots = data?.slots ?? [];

  return (
    <div>
      <p className="text-washi-dim m-0 mb-3 text-[12.5px]">{dict.checkout.prepNote}</p>

      {/* Reserve the row before the fetch lands, so arriving slots do not
          push the contact fields and the pay button down the page. */}
      <div className="flex min-h-[92px] flex-wrap content-start gap-2">
        <Choice selected={value === null} onClick={() => onChange(null)}>
          {dict.checkout.asap}
        </Choice>

        <AnimatePresence initial={false}>
          {slots.map((slot, index) => (
            <m.div
              key={slot.minutes}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{
                duration: duration.base,
                ease: ease.out,
                // Cap the queue: a long slot list must not take four seconds
                // to finish arriving.
                delay: Math.min(index, 12) * stagger.tight,
              }}
            >
              <Choice
                selected={value === slot.minutes}
                disabled={slot.full}
                onClick={() => onChange(slot.minutes)}
              >
                <span className="tabular">{slot.label}</span>
                {slot.full ? (
                  <span className="ml-1.5 text-[10px] uppercase opacity-70">
                    {dict.checkout.slotFull}
                  </span>
                ) : null}
              </Choice>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Choice({
  selected,
  disabled = false,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <m.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: duration.fast, ease: ease.out }}
      className={`border px-3.5 py-2 text-[13px] transition-colors duration-200 ${
        disabled
          ? "border-rule-soft text-washi-dim/45 line-through"
          : selected
            ? "border-kaki bg-kaki text-white"
            : "border-rule text-washi hover:border-washi-dim"
      }`}
    >
      {children}
    </m.button>
  );
}
