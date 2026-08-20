# Kyoto Leuven

Rebuild of the website for Kyoto, a Japanese and Korean restaurant at
Tiensestraat 239, 3000 Leuven.

The goal is not "look nicer". It is to move a meaningful share of orders off
the Takeaway.com marketplace, where commission runs roughly 14–30%, onto the
restaurant's own channel, where a direct order costs about 2% in payment fees.
Two consequences run through every decision here:

- **The order path is the product.** Everything else is supporting material.
- **Speed on mobile beats any visual flourish.** Most visitors arrive hungry,
  on a phone, on mobile data, often already walking.

## Running it

```bash
npm install
cp .env.example .env.local
npm run dev
```

With no `MOLLIE_API_KEY` set the checkout runs end to end in **simulation
mode**: it creates a real order, skips the payment, and lands on the
confirmation page. That way the order path is demoable before the merchant
account exists.

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Motion, Mollie.
Static-first: every content route is prerendered per locale; only the ordering
APIs are dynamic.

## Languages

Real routes at `/nl/`, `/en/`, `/fr/` with `hreflang` and per-locale canonicals
— not a JavaScript toggle. Each language needs its own indexable URL. A bare
path is redirected by `src/middleware.ts` to the visitor's best match, falling
back to Dutch, which is the operating language of the restaurant.

Copy lives in `src/data/dictionaries/`. Dutch is the source of truth; `en` and
`fr` are typed against it, so a missing key is a build error rather than a
blank space on the page.

## The animation system

All of it lives in `src/components/motion/` and is imported from there, never
from `motion/react` directly.

| Piece | What it is for |
| --- | --- |
| `tokens.ts` | Every duration, easing, spring and shared variant. Nothing hand-writes timing inline. |
| `MotionProvider` | One motion root. `reducedMotion="user"`, `LazyMotion` with `domMax`, `strict`. |
| `Reveal` | The house enter animation: fade in while rising 16px. Scroll-triggered by default, `onMount` for above-the-fold. |
| `Stagger` / `StaggerItem` | Lists. One IntersectionObserver per list, children inherit state through variant propagation. |
| `Pressable` / `pressMotion` | Shared hover/tap feedback for every button. |
| `RevealImage` / `RevealFrame` | Images settle out of a slight over-scale inside a fixed frame, so the reveal costs no CLS. |
| `PageTransition` | Cross-route fade, keyed on pathname. |
| `AnimatedNumber` | Counts the cart total instead of snapping it. |

Direction: subtle and premium. Durations sit in the 200–600ms band, stagger
steps at 50–100ms, movement is transform and opacity only so the compositor
does the work. Springs are used only where a gesture or a physical object
justifies one — button press, drawer, count badge — and are damped so they
settle without visible overshoot.

**Reduced motion** is handled in three layers: `reducedMotion="user"` on the
motion root strips transforms globally and keeps opacity; a media query in
`globals.css` covers the CSS transitions and the noren drop; and the two
looping animations (the open-status dot, the pending spinner) check
`useReducedMotion` and hold still.

**Without JavaScript**, Motion server-renders each reveal in its hidden state,
which would leave the page blank. A `<noscript>` rule in the root layout forces
every animated element visible, so the menu and the phone number survive.

## Menu data

`src/data/menu.json`, loaded through `src/lib/menu.ts`. That loader is the
seam: point `loadMenu()` at a CMS or a spreadsheet export and nothing else
changes. Prices are integer cents. `available: false` greys a dish out without
a deploy — the owner has to be able to sell out of sashimi at 21:00 without
calling a developer.

## Order storage

Orders live in Redis, reached over HTTP (`src/lib/store.ts`). This is not a
preference. Every API route is a separate serverless function on Vercel, and
each scales to multiple instances, so a module-level `Map` is guaranteed to
fail: the checkout writes an order into one instance and the Mollie webhook
that must mark it paid runs somewhere else and finds nothing — payment taken,
kitchen never told. HTTP rather than a TCP client because serverless functions
cannot hold a connection pool open between invocations.

Set it up on Vercel with **Storage → Upstash for Redis → connect to project**;
the credentials are injected automatically. With no credentials the app falls
back to an in-process store so `npm run dev` needs no setup, and refuses to
serve `/api/checkout` in production rather than take money it cannot record.

Slot capacity is claimed atomically (`reserveSlot`) rather than by counting
existing orders. Read-then-write cannot express the cap: two customers checking
out in the same second would both see room and both be admitted, which is
exactly the eleven-orders-at-once problem the cap exists to prevent. Verified
with six concurrent requests for one slot — four admitted, two refused.

## Ordering

The slot picker reflects kitchen capacity, not a calendar:

- earliest slot is now plus the current prep time,
- slots are 15 minutes wide and capped at `SLOT_CAPACITY` orders each, so a
  busy Saturday cannot put eleven orders on the counter at once,
- full slots stay visible but disabled — "18:45 is gone" beats a silently
  shorter list,
- the picker refetches every 60s, and the server re-checks capacity at
  checkout, so a slot that filled mid-form is caught before the payment.

Two service controls (`src/lib/service-state.ts`) are read from the
environment: `ORDERS_PAUSED=1` stops new orders, `KITCHEN_BUSY=1` pushes prep
time from 30 to 60 minutes.

The cart is re-priced server-side from the menu source at checkout. Nothing the
client sends about price is trusted.

## Payment

Mollie hosted checkout. The app creates a payment, redirects, and acts on the
webhook — card details never touch this codebase, so the project stays out of
PCI scope. Bancontact is first and preselected because in Belgium it is not a
preference, it is how people pay.

Everything is prepaid: it kills no-shows on a €69 sushi boat that is already
made, and lets the kitchen start immediately.

The webhook (`/api/webhooks/mollie`) is safe to leave unauthenticated because
Mollie posts only a payment id and the status is always fetched back from the
API. It is idempotent — the kitchen ticket is guarded by `ticketSentAt` and
never prints twice.

## Getting orders to the counter

`src/lib/kitchen.ts` posts a ticket to `KITCHEN_WEBHOOK_URL` the moment a
payment clears. That is meant to be a cloud receipt printer next to the sushi
counter, with the tablet as backup. An email to an inbox nobody watches during
service is not a system. A failure to reach the printer never fails the
payment; it clears the guard so the next webhook retry tries again.

## Fonts

Self-hosted subsets in `src/fonts/`, not `next/font/google`. Zen Old Mincho and
Zen Kaku Gothic New ship with several hundred CJK subsets each; pulling them
from Google meant 731 `@font-face` rules and **8.2MB of fonts on first paint**.
The site needs Latin plus the twelve Japanese characters in the noren and the
course labels — **88kB across all six faces**.

Regenerate after adding Japanese copy, or those glyphs fall back to a system
face:

```bash
pip install fonttools brotli
# source TTFs from github.com/google/fonts (OFL), not committed
python3 scripts/subset-fonts.py path/to/source-ttfs
```

## Measured

Production build, 390px viewport, decoded bytes:

| | before font work | now |
| --- | --- | --- |
| fonts | 8247 kB | 88 kB |
| font CSS (gzip) | 174 kB | ~6 kB |
| total page weight | 9629 kB | 783 kB |

CLS is 0.000 on the home and menu pages and 0.02–0.08 on checkout. No console
errors, no horizontal overflow at 360px.

## Still open

These are business questions, not code ones, and they gate the real launch:

1. Can POSGARD, the current provider, accept orders from a custom front end, or
   is the site locked inside their template?
2. How do online orders reach the registered cash register? Belgian hospitality
   businesses over the turnover threshold must run a *geregistreerd
   kassasysteem*, and food service transactions have to pass through it. Online
   orders cannot live in a separate silo. The restaurant's accountant needs to
   confirm this, because the answer constrains which platforms are even
   permissible.
3. Who is the registrant of kyotosushi.be? If POSGARD registered it in their
   own name, the owner does not control their own domain.

Also outstanding, and worth more than any code left in this repo: **there is
not one photograph of food on the current site**, while reviewers keep
mentioning the sashimi served on a wooden boat. A half-day food shoot is the
highest-value item on the project. The layouts have image slots ready
(`RevealImage`, `RevealFrame`).

Two implementation notes for whoever picks this up:

- Order records carry a 30-day TTL, which covers the operational need but not
  the Belgian bookkeeping retention period. Whatever system ends up holding the
  accounting record is the source of truth for that, not this store.
- Reservations are intentionally not built. Table booking is a separate system
  with a covers cap per slot; keeping it out of the order flow is on purpose.
