"use client";

import { useEffect } from "react";
import { localNow } from "@/lib/hours";

/**
 * Marks today's row in the hours table.
 *
 * Done after mount rather than during render: the server's day and the
 * customer's can differ either side of midnight, and being wrong about
 * "is it Monday" is exactly the mistake this table exists to prevent.
 * A class toggle, so the table itself stays a server component.
 */
export function TodayHighlight() {
  useEffect(() => {
    const today = localNow().weekday;
    const row = document.querySelector<HTMLElement>(`[data-weekday="${today}"]`);
    if (!row) return;
    row.classList.add("font-bold", "text-white");
    row.querySelector("span")?.classList.add("text-white");
    return () => {
      row.classList.remove("font-bold", "text-white");
      row.querySelector("span")?.classList.remove("text-white");
    };
  }, []);

  return null;
}
