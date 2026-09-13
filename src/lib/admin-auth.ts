/**
 * Admin login — the Node-only half.
 *
 * One shared password (`ADMIN_PASSWORD`), not per-user accounts — there is
 * one owner, not a staff directory to manage. A successful login gets a
 * random session id stored server-side in the same Redis used for orders,
 * with a TTL; the browser only ever holds that opaque id, in an httpOnly
 * cookie it cannot read or tamper with. Storing the session server-side
 * rather than signing a self-contained cookie means logout actually revokes
 * it — a signed-but-unrevoked cookie stays valid until it expires no matter
 * what a "logout" button claims to do.
 *
 * Kept apart from admin-session.ts because this file uses `node:crypto`,
 * which Edge middleware cannot reliably run — this file must only ever be
 * imported from normal Node routes (the login API route), never from
 * middleware.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { putRecord } from "./store";

export { SESSION_COOKIE, isValidSession, destroySession } from "./admin-session";

const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours — a long shift, not a permanent login.

function sessionKey(id: string): string {
  return `kyoto:admin:session:${id}`;
}

/**
 * Constant-time comparison so a login attempt can't be timed to learn the
 * password one character at a time. `timingSafeEqual` requires equal-length
 * buffers, and passwords are arbitrary length, so both sides are hashed to a
 * fixed 32-byte digest first — hashing rather than padding/truncating, since
 * truncating to a fixed length would let a wrong guess that merely shares a
 * long enough prefix pass.
 */
function passwordMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function createSession(password: string): Promise<string | null> {
  if (!passwordMatches(password)) return null;
  const id = randomBytes(24).toString("base64url");
  await putRecord(sessionKey(id), { createdAt: new Date().toISOString() }, SESSION_TTL_SECONDS);
  return id;
}

export { SESSION_TTL_SECONDS };
