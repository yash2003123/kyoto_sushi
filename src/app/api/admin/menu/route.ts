import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/admin-session";
import { loadMenu, saveMenu, type Menu, type MenuCourse } from "@/lib/menu";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await loadMenu());
}

/**
 * Structural validation only — this never touches copy or item identity, so
 * it does not re-check names, descriptions or ids against the seed. What it
 * must catch: a price that is not a sane integer, since that number becomes
 * a real charge the moment it is saved. Anything shaped wrong here is
 * refused outright rather than partially accepted.
 */
function isValidMenu(value: unknown): value is Menu {
  if (typeof value !== "object" || value === null) return false;
  const menu = value as Partial<Menu>;
  if (!Array.isArray(menu.courses)) return false;
  return menu.courses.every((course: MenuCourse) => {
    if (typeof course.id !== "string" || !Array.isArray(course.categories)) return false;
    return course.categories.every((category) => {
      if (!Array.isArray(category.items)) return false;
      return category.items.every((item) => {
        return (
          typeof item.id === "string" &&
          Number.isInteger(item.price) &&
          item.price >= 0 &&
          item.price < 100_000_00 && // a sanity ceiling, not a real menu price
          typeof item.available === "boolean"
        );
      });
    });
  });
}

export async function POST(request: Request) {
  if (!(await requireSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  if (!isValidMenu(body)) {
    return NextResponse.json({ error: "bad-menu" }, { status: 400 });
  }

  await saveMenu(body);
  // Everything under [lang] reads the menu — the homepage board and gallery,
  // the full menu page, and (via the layout) the cart drawer.
  revalidatePath("/[lang]", "layout");

  return NextResponse.json({ ok: true });
}
