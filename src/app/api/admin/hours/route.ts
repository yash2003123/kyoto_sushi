import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/admin-session";
import { getHoursConfig, saveHoursConfig, type HoursConfig } from "@/lib/hours";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await getHoursConfig());
}

function isValidWindow(value: unknown): value is { open: number; close: number } {
  if (typeof value !== "object" || value === null) return false;
  const w = value as { open?: unknown; close?: unknown };
  return (
    Number.isInteger(w.open) &&
    Number.isInteger(w.close) &&
    (w.open as number) >= 0 &&
    (w.close as number) <= 24 * 60 &&
    (w.open as number) < (w.close as number)
  );
}

function isValidHours(value: unknown): value is HoursConfig {
  if (typeof value !== "object" || value === null) return false;
  const config = value as Partial<HoursConfig>;
  if (typeof config.closedWeekday !== "number") return false;
  if (config.closedWeekday < 0 || config.closedWeekday > 6) return false;
  if (typeof config.services !== "object" || config.services === null) return false;
  return isValidWindow(config.services.lunch) && isValidWindow(config.services.dinner);
}

export async function POST(request: Request) {
  if (!(await requireSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  if (!isValidHours(body)) {
    return NextResponse.json({ error: "bad-hours" }, { status: 400 });
  }

  await saveHoursConfig(body);
  revalidatePath("/[lang]", "layout");

  return NextResponse.json({ ok: true });
}
