import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n";
import { isValidSession, SESSION_COOKIE } from "@/lib/admin-session";

/**
 * Locale routing, plus the admin panel's auth gate.
 *
 * Every language gets a real, indexable URL (`/nl/`, `/en/`, `/fr/`) rather
 * than a client-side toggle — that was only acceptable in the single-file
 * concept. A bare path is redirected to the visitor's best match, falling back
 * to Dutch, which is the operating language of the restaurant.
 *
 * `/beheer` (the admin panel) is deliberately not part of that: it has no
 * locale variants, and it is not a page a hungry customer should ever land
 * on by accident, so it is excluded from the locale matcher entirely and
 * checked separately here instead.
 *
 * Only `admin-session.ts` is imported for the auth check, never
 * admin-auth.ts — this file runs on the Edge runtime, which cannot reliably
 * run the `node:crypto` calls admin-auth.ts uses for the password check, and
 * middleware only ever needs to check whether a session id is still valid,
 * not create one.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/beheer" || pathname.startsWith("/beheer/")) {
    if (pathname === "/beheer/login") return NextResponse.next();
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
    if (await isValidSession(sessionId)) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/beheer/login";
    return NextResponse.redirect(url);
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const header = request.headers.get("accept-language") ?? "";
  const preferred = header
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
    .find((code) => (locales as readonly string[]).includes(code));

  const locale = preferred ?? defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API routes, Next internals and anything with a file extension.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
