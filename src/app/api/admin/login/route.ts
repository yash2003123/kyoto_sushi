import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/admin-auth";
import { isMisconfigured, incrementCounter } from "@/lib/store";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 8;
const WINDOW_SECONDS = 60 * 15;

export async function POST(request: Request) {
  if (isMisconfigured()) {
    // Sessions live in the same store as everything else — refuse rather
    // than hand out a login that a restart would silently forget.
    return NextResponse.json({ error: "store-unavailable" }, { status: 503 });
  }

  // The password is the only real gate on a page that is otherwise just
  // unlinked, not actually secret — worth a brute-force guard. Keyed on IP
  // rather than anything from the request body, so it can't be sidestepped
  // by varying the guessed password.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const attempts = await incrementCounter(`kyoto:admin:login-attempts:${ip}`, WINDOW_SECONDS);
  if (attempts > MAX_ATTEMPTS) {
    return NextResponse.json({ error: "too-many-attempts" }, { status: 429 });
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const sessionId = await createSession(password);
  if (!sessionId) {
    return NextResponse.json({ error: "bad-password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
