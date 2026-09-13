import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, SESSION_COOKIE } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (id) await destroySession(id);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
