import type { ReactNode } from "react";
import { Reveal } from "@/components/motion";

export function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`py-16 sm:py-22 ${className}`}>
      <div className="wrap">{children}</div>
    </section>
  );
}

/**
 * The heading + rule + subtitle row used at the top of every section.
 * Wrapped in a Reveal so section headings enter with the same fade-and-rise
 * as everything else, without each caller remembering to do it.
 */
export function SectionHead({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <Reveal className="mb-10 flex flex-wrap items-baseline gap-x-5 gap-y-3">
      <h2 className="font-display m-0 text-[clamp(26px,3.2vw,36px)] font-bold">{title}</h2>
      <span className="bg-rule h-px min-w-10 flex-1 self-center" aria-hidden />
      {sub ? <p className="text-washi-dim m-0 max-w-[42ch] text-sm">{sub}</p> : null}
      {action}
    </Reveal>
  );
}
