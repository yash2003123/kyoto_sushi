/**
 * Absolute base URL, for canonical links, payment redirects and webhooks.
 *
 * `NEXT_PUBLIC_SITE_URL` is authoritative when set, and it must be set in
 * production — Mollie's webhook needs a publicly reachable address and cannot
 * infer one. When it is absent, deriving the origin from the incoming request
 * keeps redirects on whatever host actually served the page, instead of
 * bouncing the customer to a hardcoded localhost:3000 that is not listening.
 */
export function siteUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    // This value is only ever a protocol + host — every caller appends its
    // own path on top. Reducing to `.origin` rather than trimming a trailing
    // slash means a value pasted straight from a browser's address bar (e.g.
    // ".../en", trailing slash, stray whitespace) can't silently double up
    // into paths like "/en/en/order/status" instead of failing loudly.
    try {
      return new URL(configured).origin;
    } catch {
      return configured.replace(/\/$/, "");
    }
  }

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  if (request) {
    try {
      // Respect the proxy headers a platform sets, then fall back to the URL
      // the request arrived on.
      const headers = request.headers;
      const host = headers.get("x-forwarded-host") ?? headers.get("host");
      const proto = headers.get("x-forwarded-proto") ?? "http";
      if (host) return `${proto}://${host}`;
      return new URL(request.url).origin;
    } catch {
      // Fall through to the development default.
    }
  }

  return "http://localhost:3000";
}
