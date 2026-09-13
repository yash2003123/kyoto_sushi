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
 * The admin panel now edits item identity too (name, description, and it can
 * mint a brand-new item with a client-generated id), which the previous,
 * narrower version of this check — price and availability only — never had
 * to worry about. Two things become real risks once ids and names are
 * editable rather than fixed at the seed:
 *
 * - A duplicate id would let one item silently shadow another wherever the
 *   menu gets indexed by id (pricing, the cart, the kitchen ticket) — the
 *   shadowed item becomes unorderable with no error anywhere.
 * - A blank Dutch name would show blank everywhere a locale is missing,
 *   since `t()` falls back to `.nl` — Dutch is the one name that must exist.
 */
function isValidMenu(value: unknown): value is Menu {
  if (typeof value !== "object" || value === null) return false;
  const menu = value as Partial<Menu>;
  if (!Array.isArray(menu.courses)) return false;

  const seenIds = new Set<string>();

  return menu.courses.every((course: MenuCourse) => {
    if (typeof course.id !== "string" || !Array.isArray(course.categories)) return false;
    return course.categories.every((category) => {
      if (!Array.isArray(category.items)) return false;
      return category.items.every((item) => {
        if (typeof item.id !== "string" || item.id.length === 0) return false;
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);

        return (
          typeof item.name?.nl === "string" &&
          item.name.nl.trim().length > 0 &&
          Number.isInteger(item.price) &&
          item.price >= 0 &&
          item.price < 100_000_00 && // a sanity ceiling, not a real menu price
          typeof item.available === "boolean" &&
          Array.isArray(item.allergens) &&
          item.allergens.every((a) => typeof a === "string") &&
          Array.isArray(item.tags) &&
          item.tags.every((t) => typeof t === "string")
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
