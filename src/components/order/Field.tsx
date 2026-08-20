"use client";

import { AnimatePresence, m } from "motion/react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { duration, ease } from "@/components/motion";

const inputClass =
  "border-rule focus:border-kaki w-full border bg-transparent px-3.5 py-3 text-[15px] " +
  "transition-colors duration-200 outline-none placeholder:text-washi-dim/50";

function ErrorLine({ message }: { message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <m.p
          className="text-kaki m-0 overflow-hidden text-[12px]"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1, marginTop: 4 }}
          exit={{ height: 0, opacity: 0, marginTop: 0 }}
          transition={{ duration: duration.fast, ease: ease.out }}
        >
          {message}
        </m.p>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Text input with an inline error that grows into place instead of appearing.
 * The height animation is the one place a layout-affecting animation is worth
 * it: the alternative is the submit button jumping under the customer's thumb.
 */
export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="text-washi-dim mb-1.5 block text-[11.5px] tracking-[0.16em] uppercase">
        {label}
      </span>
      <input
        {...props}
        aria-invalid={error ? "true" : undefined}
        className={inputClass}
      />
      <ErrorLine message={error} />
    </label>
  );
}

export function TextareaField({
  label,
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="text-washi-dim mb-1.5 block text-[11.5px] tracking-[0.16em] uppercase">
        {label}
      </span>
      <textarea {...props} rows={3} className={`${inputClass} resize-y`} />
      <ErrorLine message={error} />
    </label>
  );
}
