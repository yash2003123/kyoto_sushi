import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Status of a single order, for the confirmation page to poll while the
 * webhook lands. Returns only what the customer already knows — no contact
 * details, no payment ids — so an guessed uuid leaks nothing useful.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "not-found" }, { status: 404 });

  return NextResponse.json(
    {
      reference: order.reference,
      status: order.status,
      fulfilment: order.fulfilment,
      slotLabel: order.slotLabel,
      total: order.totals.total,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
