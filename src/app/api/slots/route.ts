import { NextResponse } from "next/server";
import { slotsForToday } from "@/lib/slots";
import { slotLoadForToday } from "@/lib/orders";
import { getServiceState } from "@/lib/service-state";
import { localNow, openState } from "@/lib/hours";

export const dynamic = "force-dynamic";

/**
 * Live slot availability. Deliberately not cached: a slot that filled thirty
 * seconds ago must not still be offered.
 */
export async function GET() {
  const service = getServiceState();
  const now = localNow();
  const load = await slotLoadForToday();
  const slots = slotsForToday(load, now);

  return NextResponse.json(
    {
      paused: service.paused,
      prepMinutes: service.prepMinutes,
      open: openState(now).open,
      slots: slots.map(({ minutes, label, full }) => ({ minutes, label, full })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
