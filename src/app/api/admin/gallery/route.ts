import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/admin-session";
import {
  getGalleryImage,
  saveGalleryImage,
  resetGalleryImage,
  MAX_IMAGE_BYTES,
} from "@/lib/gallery-settings";
import type { CourseId } from "@/lib/menu";

export const dynamic = "force-dynamic";

const FEATURED_COURSES: CourseId[] = ["sushi", "bowls", "drinks"];

function isCourse(value: unknown): value is CourseId {
  return typeof value === "string" && (FEATURED_COURSES as string[]).includes(value);
}

export async function GET() {
  if (!(await requireSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const images = Object.fromEntries(
    await Promise.all(
      FEATURED_COURSES.map(async (course) => [course, await getGalleryImage(course)] as const),
    ),
  );
  return NextResponse.json(images);
}

const DATA_URL = /^data:([\w./+-]+);base64,(.+)$/;

export async function POST(request: Request) {
  if (!(await requireSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { course?: unknown; dataUrl?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  if (!isCourse(body.course)) return NextResponse.json({ error: "bad-course" }, { status: 400 });
  if (typeof body.dataUrl !== "string") {
    return NextResponse.json({ error: "bad-image" }, { status: 400 });
  }

  const match = DATA_URL.exec(body.dataUrl);
  if (!match) return NextResponse.json({ error: "bad-image" }, { status: 400 });
  const [, contentType, base64] = match;

  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    return NextResponse.json({ error: "bad-image" }, { status: 400 });
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }

  const result = await saveGalleryImage(body.course, contentType, bytes);
  if ("error" in result) return NextResponse.json(result, { status: 400 });

  revalidatePath("/[lang]", "layout");
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await requireSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const course = new URL(request.url).searchParams.get("course");
  if (!isCourse(course)) return NextResponse.json({ error: "bad-course" }, { status: 400 });

  await resetGalleryImage(course);
  revalidatePath("/[lang]", "layout");
  return NextResponse.json({ ok: true });
}
