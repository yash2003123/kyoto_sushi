/**
 * Admin session reading — the edge-safe half.
 *
 * Split out from admin-auth.ts deliberately: middleware runs on the Edge
 * runtime, which does not reliably support `node:crypto` (used there for the
 * password comparison). This file only ever checks whether a session id is
 * still valid, which is nothing more than a store lookup, so it is safe for
 * middleware to import. Creating a session — the part that touches the
 * password — stays in admin-auth.ts, imported only by the login route, which
 * runs as a normal Node function.
 */

import { cookies } from "next/headers";
import { getRecord, deleteRecord } from "./store";

export const SESSION_COOKIE = "kyoto_admin_session";

function sessionKey(id: string): string {
  return `kyoto:admin:session:${id}`;
}

export async function isValidSession(id: string | undefined): Promise<boolean> {
  if (!id) return false;
  return (await getRecord(sessionKey(id))) !== undefined;
}

export async function destroySession(id: string): Promise<void> {
  await deleteRecord(sessionKey(id));
}

/** For Server Components / Route Handlers that need to check "am I logged in". */
export async function requireSession(): Promise<boolean> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  return isValidSession(id);
}
