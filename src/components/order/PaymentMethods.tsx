"use client";

import { m } from "motion/react";
import { PAYMENT_METHODS, type PaymentMethodId } from "@/lib/payment-methods";
import { duration, ease, spring } from "@/components/motion";

/**
 * Payment method picker.
 *
 * Bancontact is first and preselected because in Belgium it is not a
 * preference, it is how people pay — burying it behind a card form is how a
 * direct order gets abandoned. Nothing here handles card data: choosing a
 * method only decides which Mollie hosted screen the customer lands on.
 */
export function PaymentMethods({
  value,
  onChange,
}: {
  value: PaymentMethodId;
  onChange: (method: PaymentMethodId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {PAYMENT_METHODS.map((method) => {
        const selected = method.id === value;
        return (
          <m.button
            key={method.id}
            type="button"
            onClick={() => onChange(method.id)}
            aria-pressed={selected}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={spring.press}
            className={`relative flex items-center justify-center border px-3 py-3.5 text-[13px] font-medium transition-colors duration-200 ${
              selected ? "border-kaki text-white" : "border-rule text-washi-dim hover:text-washi"
            }`}
          >
            {selected ? (
              <m.span
                layoutId="method-marker"
                className="border-kaki absolute inset-0 border-2"
                transition={{ duration: duration.fast, ease: ease.out }}
              />
            ) : null}
            <span className="relative">{method.label}</span>
          </m.button>
        );
      })}
    </div>
  );
}
