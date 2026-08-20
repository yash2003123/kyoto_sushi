/**
 * Order storage.
 *
 * Every API route in this app is a separate serverless function on Vercel, and
 * each of those scales to as many instances as traffic needs. A module-level
 * Map is therefore not "slightly risky" — it is guaranteed to fail: the
 * checkout writes an order into one instance, and the Mollie webhook that has
 * to mark it paid runs somewhere else entirely and finds nothing. The payment
 * succeeds, the kitchen never hears about it.
 *
 * So orders live in Redis, reached over HTTP. HTTP rather than a TCP client
 * because serverless functions cannot hold a connection pool open between
 * invocations without exhausting the database's connection limit.
 *
 * Locally, with no Redis configured, this falls back to an in-process map so
 * `npm run dev` needs no setup. That fallback is refused in production —
 * losing a paid order silently is far worse than an order button that errors
 * loudly.
 */

import { Redis } from "@upstash/redis";

/** Order records outlive the accounting need for them by a wide margin. */
const ORDER_TTL_SECONDS = 60 * 60 * 24 * 30;
/** Slot counters only matter for the day they describe. */
const SLOT_TTL_SECONDS = 60 * 60 * 48;

function credentials(): { url: string; token: string } | null {
  // Vercel's Upstash integration sets the KV_ names; a direct Upstash project
  // sets the UPSTASH_ ones. Accept either so neither setup needs extra config.
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export function isPersistent(): boolean {
  return credentials() !== null;
}

/**
 * True when we are about to take real money without anywhere durable to record
 * it. The API routes refuse to serve in that state.
 */
export function isMisconfigured(): boolean {
  return !isPersistent() && process.env.NODE_ENV === "production";
}

let client: Redis | null = null;

function redis(): Redis | null {
  const config = credentials();
  if (!config) return null;
  if (!client) client = new Redis({ url: config.url, token: config.token });
  return client;
}

/* ------------------------------------------------------------------ *
 * Development fallback
 * ------------------------------------------------------------------ */

/**
 * Hung off globalThis rather than held in module scope.
 *
 * `next dev` compiles each route handler into its own module graph, so a plain
 * module-level Map gives every route its own private copy — the checkout would
 * write an order that the status endpoint could not see, and the confirmation
 * page would sit on "processing" forever even locally. globalThis is the one
 * thing all of them genuinely share, and it also survives hot reloads.
 */
type DevStore = {
  strings: Map<string, string>;
  hashes: Map<string, Map<string, number>>;
};

const devStore: DevStore = ((globalThis as { __kyotoStore?: DevStore }).__kyotoStore ??= {
  strings: new Map(),
  hashes: new Map(),
});

const memory = devStore.strings;
const memoryHashes = devStore.hashes;

/* ------------------------------------------------------------------ *
 * Records
 * ------------------------------------------------------------------ */

export async function putRecord(key: string, value: unknown): Promise<void> {
  const encoded = JSON.stringify(value);
  const db = redis();
  if (db) {
    await db.set(key, encoded, { ex: ORDER_TTL_SECONDS });
    return;
  }
  memory.set(key, encoded);
}

export async function getRecord<T>(key: string): Promise<T | undefined> {
  const db = redis();
  if (db) {
    // The REST client parses JSON responses itself, so a stored string may
    // come back already decoded. Handle both rather than assuming.
    const raw = await db.get<T | string>(key);
    if (raw === null || raw === undefined) return undefined;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return undefined;
      }
    }
    return raw as T;
  }

  const local = memory.get(key);
  return local === undefined ? undefined : (JSON.parse(local) as T);
}

/* ------------------------------------------------------------------ *
 * Slot counters
 * ------------------------------------------------------------------ */

/**
 * Claims one place in a slot, atomically.
 *
 * Read-then-write cannot express this: two customers checking out in the same
 * second would both see room and both be let in, which is precisely the
 * eleven-orders-at-once problem the cap exists to prevent. Incrementing first
 * and standing the increment down on overflow means the counter itself decides,
 * and Redis serialises that for us.
 *
 * Returns false when the slot is already full.
 */
export async function reserveSlot(
  day: string,
  minutes: number,
  capacity: number,
): Promise<boolean> {
  const key = `kyoto:slots:${day}`;
  const field = String(minutes);
  const db = redis();

  if (db) {
    const taken = await db.hincrby(key, field, 1);
    if (taken > capacity) {
      await db.hincrby(key, field, -1);
      return false;
    }
    await db.expire(key, SLOT_TTL_SECONDS);
    return true;
  }

  const hash = memoryHashes.get(key) ?? new Map<string, number>();
  memoryHashes.set(key, hash);
  const taken = (hash.get(field) ?? 0) + 1;
  if (taken > capacity) return false;
  hash.set(field, taken);
  return true;
}

/** Gives a place back — a failed or expired payment must not hold a slot. */
export async function releaseSlot(day: string, minutes: number): Promise<void> {
  const key = `kyoto:slots:${day}`;
  const field = String(minutes);
  const db = redis();

  if (db) {
    const remaining = await db.hincrby(key, field, -1);
    // Never let a double release drive the counter below zero, or the slot
    // would accept more orders than the cap allows.
    if (remaining < 0) await db.hincrby(key, field, 1);
    return;
  }

  const hash = memoryHashes.get(key);
  if (!hash) return;
  hash.set(field, Math.max(0, (hash.get(field) ?? 0) - 1));
}

/** Current occupancy of every slot today, for the picker. */
export async function slotCounts(day: string): Promise<Map<number, number>> {
  const key = `kyoto:slots:${day}`;
  const db = redis();
  const load = new Map<number, number>();

  if (db) {
    const hash = await db.hgetall<Record<string, number | string>>(key);
    if (hash) {
      for (const [field, value] of Object.entries(hash)) {
        load.set(Number(field), Number(value));
      }
    }
    return load;
  }

  const hash = memoryHashes.get(key);
  if (hash) for (const [field, value] of hash) load.set(Number(field), value);
  return load;
}
