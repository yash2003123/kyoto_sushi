/**
 * Gallery panel image overrides.
 *
 * The homepage gallery (Gallery.tsx) shows a large course kanji on a
 * gradient wash by default — the stand-in built for exactly the moment before
 * real food photography exists. Once a photo exists for a course, the admin
 * panel can upload it here and Gallery.tsx swaps that one panel over to a
 * real photo; the other panels keep the kanji treatment until they get one
 * too. Stored as a data URL directly in the same Redis used for everything
 * else — a handful of compressed photos is nowhere near its storage limits,
 * and it avoids standing up a separate file host for three images.
 */

import { cache } from "react";
import type { CourseId } from "./menu";
import { getRecord, putRecord, deleteRecord } from "./store";

/** Comfortably under Upstash's per-value size limit even after base64 inflation. */
export const MAX_IMAGE_BYTES = 1_500_000;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function key(course: CourseId): string {
  return `kyoto:settings:gallery:${course}`;
}

export type GalleryImage = { dataUrl: string; updatedAt: string };

export const getGalleryImage = cache(
  async (course: CourseId): Promise<GalleryImage | undefined> => {
    return getRecord<GalleryImage>(key(course));
  },
);

export async function saveGalleryImage(
  course: CourseId,
  contentType: string,
  bytes: Uint8Array,
): Promise<{ error: string } | { ok: true }> {
  if (!ALLOWED_TYPES.has(contentType)) return { error: "unsupported-type" };
  if (bytes.byteLength > MAX_IMAGE_BYTES) return { error: "too-large" };

  const dataUrl = `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
  await putRecord(key(course), { dataUrl, updatedAt: new Date().toISOString() });
  return { ok: true };
}

export async function resetGalleryImage(course: CourseId): Promise<void> {
  await deleteRecord(key(course));
}
