"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Menu, MenuItem, CourseId } from "@/lib/menu";
import type { HoursConfig } from "@/lib/hours";
import { useAdminLocale } from "@/lib/use-admin-locale";
import { AdminLocaleToggle } from "./AdminLocaleToggle";
import type { AdminDictionary } from "@/lib/admin-dictionary";

type Tab = "menu" | "hours" | "gallery";

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function Dashboard() {
  const [tab, setTab] = useState<Tab>("menu");
  const router = useRouter();
  const { locale, setLocale, dict } = useAdminLocale();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/beheer/login");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="m-0 text-xl font-bold">{dict.brand}</h1>
        <div className="flex items-center gap-3">
          <AdminLocaleToggle locale={locale} onChange={setLocale} />
          <button
            onClick={logout}
            className="border border-[#141412]/20 bg-white px-3 py-1.5 text-[13px]"
          >
            {dict.nav.logout}
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-[#141412]/15">
        {(
          [
            ["menu", dict.nav.tabMenu],
            ["hours", dict.nav.tabHours],
            ["gallery", dict.nav.tabGallery],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3.5 py-2.5 text-[14px] font-medium ${
              tab === id
                ? "border-b-2 border-[#E4572E] text-[#141412]"
                : "text-[#141412]/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "menu" ? <MenuEditor dict={dict} /> : null}
      {tab === "hours" ? <HoursEditor dict={dict} /> : null}
      {tab === "gallery" ? <GalleryEditor dict={dict} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Menu — prices and availability
 * ------------------------------------------------------------------ */

const ALLERGEN_IDS = [
  "fish",
  "crustacean",
  "gluten",
  "soy",
  "sesame",
  "egg",
  "milk",
  "sulphites",
] as const;

const TAG_IDS = ["raw", "spicy", "vegetarian", "signature", "student", "lunch"] as const;

function blankItem(categoryId: string): MenuItem {
  return {
    id: `${categoryId}-${Date.now().toString(36)}`,
    name: { nl: "Nieuw gerecht", en: "New dish", fr: "Nouveau plat" },
    desc: { nl: "", en: "", fr: "" },
    price: 0,
    allergens: [],
    tags: [],
    available: true,
  };
}

function MenuEditor({ dict }: { dict: AdminDictionary }) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/menu")
      .then((r) => r.json())
      .then(setMenu);
  }, []);

  function updateItem(itemId: string, patch: Partial<MenuItem>) {
    if (!menu) return;
    setMenu({
      ...menu,
      courses: menu.courses.map((course) => ({
        ...course,
        categories: course.categories.map((category) => ({
          ...category,
          items: category.items.map((item) =>
            item.id === itemId ? { ...item, ...patch } : item,
          ),
        })),
      })),
    });
  }

  function updateLocalized(
    itemId: string,
    field: "name" | "desc",
    locale: "nl" | "en" | "fr",
    value: string,
  ) {
    if (!menu) return;
    const item = itemsOf(menu).find((i) => i.id === itemId);
    if (!item) return;
    const current = item[field] ?? { nl: "", en: "", fr: "" };
    updateItem(itemId, { [field]: { ...current, [locale]: value } } as Partial<MenuItem>);
  }

  function toggleListValue(itemId: string, field: "allergens" | "tags", value: string) {
    if (!menu) return;
    const item = itemsOf(menu).find((i) => i.id === itemId);
    if (!item) return;
    const list = item[field];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    updateItem(itemId, { [field]: next } as Partial<MenuItem>);
  }

  function addItem(categoryId: string) {
    if (!menu) return;
    const item = blankItem(categoryId);
    setMenu({
      ...menu,
      courses: menu.courses.map((course) => ({
        ...course,
        categories: course.categories.map((category) =>
          category.id === categoryId
            ? { ...category, items: [...category.items, item] }
            : category,
        ),
      })),
    });
    setExpanded((current) => new Set(current).add(item.id));
  }

  function deleteItem(itemId: string) {
    if (!menu) return;
    if (!window.confirm(dict.menu.confirmDelete)) return;
    setMenu({
      ...menu,
      courses: menu.courses.map((course) => ({
        ...course,
        categories: course.categories.map((category) => ({
          ...category,
          items: category.items.filter((item) => item.id !== itemId),
        })),
      })),
    });
  }

  function toggleExpanded(itemId: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  async function save() {
    if (!menu) return;
    setStatus("saving");
    const response = await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(menu),
    });
    setStatus(response.ok ? "saved" : "error");
  }

  if (!menu) return <p>{dict.menu.loading}</p>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={status === "saving"}
          className="bg-[#E4572E] px-4 py-2 text-[14px] font-semibold text-white disabled:opacity-50"
        >
          {status === "saving" ? dict.menu.saving : dict.menu.save}
        </button>
        {status === "saved" ? (
          <span className="text-[13px] text-[#7E8F6B]">{dict.menu.saved}</span>
        ) : null}
        {status === "error" ? (
          <span className="text-[13px] text-[#E4572E]">{dict.menu.error}</span>
        ) : null}
      </div>

      {menu.courses.map((course) => (
        <div key={course.id} className="mb-8">
          <h2 className="mb-2 text-[13px] font-bold tracking-[0.1em] text-[#7E8F6B] uppercase">
            {course.id} {course.kanji}
          </h2>
          {course.categories.map((category) => (
            <div key={category.id} className="mb-3">
              <p className="mb-1.5 text-[13px] font-medium text-[#141412]/70">
                {category.name.nl}
              </p>
              <div className="flex flex-col gap-1">
                {category.items.map((item) => (
                  <div key={item.id} className="border border-[#141412]/10 bg-white">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        aria-label={dict.menu.showDetails}
                        className="shrink-0 text-[12px] text-[#141412]/40"
                      >
                        {expanded.has(item.id) ? "▾" : "▸"}
                      </button>
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="min-w-0 flex-1 truncate text-left text-[14px]"
                      >
                        {item.name.nl}
                      </button>
                      <label className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-[#141412]/60">
                        <input
                          type="checkbox"
                          checked={item.available}
                          onChange={(e) => updateItem(item.id, { available: e.target.checked })}
                        />
                        {dict.menu.available}
                      </label>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="text-[13px] text-[#141412]/50">€</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={(item.price / 100).toFixed(2)}
                          onChange={(e) => {
                            const euros = Number(e.target.value);
                            if (Number.isFinite(euros) && euros >= 0) {
                              updateItem(item.id, { price: Math.round(euros * 100) });
                            }
                          }}
                          className="w-20 border border-[#141412]/20 px-2 py-1 text-[13px]"
                        />
                      </div>
                    </div>

                    {expanded.has(item.id) ? (
                      <div className="border-t border-[#141412]/10 bg-[#F0EBE0]/40 px-3 py-3">
                        <div className="mb-3 grid gap-2 sm:grid-cols-3">
                          {(["nl", "en", "fr"] as const).map((locale) => (
                            <label key={locale} className="block text-[12px]">
                              <span className="mb-0.5 block uppercase text-[#141412]/50">
                                {dict.menu.name} ({locale})
                              </span>
                              <input
                                type="text"
                                value={item.name[locale] ?? ""}
                                onChange={(e) =>
                                  updateLocalized(item.id, "name", locale, e.target.value)
                                }
                                className="w-full border border-[#141412]/20 px-2 py-1.5 text-[13px]"
                              />
                            </label>
                          ))}
                        </div>

                        <div className="mb-3 grid gap-2 sm:grid-cols-3">
                          {(["nl", "en", "fr"] as const).map((locale) => (
                            <label key={locale} className="block text-[12px]">
                              <span className="mb-0.5 block uppercase text-[#141412]/50">
                                {dict.menu.description} ({locale})
                              </span>
                              <input
                                type="text"
                                value={item.desc?.[locale] ?? ""}
                                onChange={(e) =>
                                  updateLocalized(item.id, "desc", locale, e.target.value)
                                }
                                className="w-full border border-[#141412]/20 px-2 py-1.5 text-[13px]"
                              />
                            </label>
                          ))}
                        </div>

                        <label className="mb-3 block max-w-[120px] text-[12px]">
                          <span className="mb-0.5 block uppercase text-[#141412]/50">
                            {dict.menu.pieces}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={item.pieces ?? ""}
                            onChange={(e) =>
                              updateItem(item.id, {
                                pieces: e.target.value ? Number(e.target.value) : undefined,
                              })
                            }
                            className="w-full border border-[#141412]/20 px-2 py-1.5 text-[13px]"
                          />
                        </label>

                        <div className="mb-3">
                          <span className="mb-1 block text-[12px] uppercase text-[#141412]/50">
                            {dict.menu.allergens}
                          </span>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {ALLERGEN_IDS.map((id) => (
                              <label key={id} className="flex items-center gap-1 text-[12.5px]">
                                <input
                                  type="checkbox"
                                  checked={item.allergens.includes(id)}
                                  onChange={() => toggleListValue(item.id, "allergens", id)}
                                />
                                {dict.allergens[id]}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="mb-3">
                          <span className="mb-1 block text-[12px] uppercase text-[#141412]/50">
                            {dict.menu.tags}
                          </span>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {TAG_IDS.map((id) => (
                              <label key={id} className="flex items-center gap-1 text-[12.5px]">
                                <input
                                  type="checkbox"
                                  checked={item.tags.includes(id)}
                                  onChange={() => toggleListValue(item.id, "tags", id)}
                                />
                                {dict.tags[id]}
                              </label>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-[12px] text-[#E4572E] underline"
                        >
                          {dict.menu.deleteDish}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <button
                onClick={() => addItem(category.id)}
                className="mt-1.5 border border-dashed border-[#141412]/25 px-3 py-1.5 text-[12.5px] text-[#141412]/60"
              >
                {dict.menu.addDish(category.name.nl)}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function itemsOf(menu: Menu): MenuItem[] {
  return menu.courses.flatMap((c) => c.categories.flatMap((cat) => cat.items));
}

/* ------------------------------------------------------------------ *
 * Hours
 * ------------------------------------------------------------------ */

function HoursEditor({ dict }: { dict: AdminDictionary }) {
  const [config, setConfig] = useState<HoursConfig | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/admin/hours")
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  async function save() {
    if (!config) return;
    setStatus("saving");
    const response = await fetch("/api/admin/hours", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(config),
    });
    setStatus(response.ok ? "saved" : "error");
  }

  if (!config) return <p>{dict.hours.loading}</p>;

  return (
    <div className="max-w-[480px]">
      <div className="mb-5 grid grid-cols-2 gap-4">
        <TimeField
          label={dict.hours.lunchOpen}
          value={config.services.lunch.open}
          onChange={(m) =>
            setConfig({ ...config, services: { ...config.services, lunch: { ...config.services.lunch, open: m } } })
          }
        />
        <TimeField
          label={dict.hours.lunchClose}
          value={config.services.lunch.close}
          onChange={(m) =>
            setConfig({ ...config, services: { ...config.services, lunch: { ...config.services.lunch, close: m } } })
          }
        />
        <TimeField
          label={dict.hours.dinnerOpen}
          value={config.services.dinner.open}
          onChange={(m) =>
            setConfig({ ...config, services: { ...config.services, dinner: { ...config.services.dinner, open: m } } })
          }
        />
        <TimeField
          label={dict.hours.dinnerClose}
          value={config.services.dinner.close}
          onChange={(m) =>
            setConfig({ ...config, services: { ...config.services, dinner: { ...config.services.dinner, close: m } } })
          }
        />
      </div>

      <label className="mb-5 block text-[13px]">
        <span className="mb-1 block text-[#141412]/60">{dict.hours.closedWeekday}</span>
        <select
          value={config.closedWeekday}
          onChange={(e) => setConfig({ ...config, closedWeekday: Number(e.target.value) })}
          className="border border-[#141412]/20 bg-white px-3 py-2 text-[14px]"
        >
          {dict.hours.weekdays.map((label, i) => (
            <option key={i} value={i}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={status === "saving"}
          className="bg-[#E4572E] px-4 py-2 text-[14px] font-semibold text-white disabled:opacity-50"
        >
          {status === "saving" ? dict.hours.saving : dict.hours.save}
        </button>
        {status === "saved" ? (
          <span className="text-[13px] text-[#7E8F6B]">{dict.hours.saved}</span>
        ) : null}
        {status === "error" ? (
          <span className="text-[13px] text-[#E4572E]">{dict.hours.error}</span>
        ) : null}
      </div>
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (minutes: number) => void;
}) {
  return (
    <label className="block text-[13px]">
      <span className="mb-1 block text-[#141412]/60">{label}</span>
      <input
        type="time"
        value={minutesToTime(value)}
        onChange={(e) => onChange(timeToMinutes(e.target.value))}
        className="w-full border border-[#141412]/20 bg-white px-3 py-2 text-[14px]"
      />
    </label>
  );
}

/* ------------------------------------------------------------------ *
 * Gallery photos
 * ------------------------------------------------------------------ */

const FEATURED_COURSES = ["sushi", "bowls", "drinks"] as const satisfies readonly CourseId[];

function GalleryEditor({ dict }: { dict: AdminDictionary }) {
  const [images, setImages] = useState<Record<string, { dataUrl: string } | null> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function refresh() {
    fetch("/api/admin/gallery")
      .then((r) => r.json())
      .then(setImages);
  }

  useEffect(refresh, []);

  async function upload(course: CourseId, file: File) {
    setBusy(course);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ course, dataUrl }),
    });
    setBusy(null);
    refresh();
  }

  async function reset(course: CourseId) {
    setBusy(course);
    await fetch(`/api/admin/gallery?course=${course}`, { method: "DELETE" });
    setBusy(null);
    refresh();
  }

  if (!images) return <p>{dict.gallery.loading}</p>;

  return (
    <div>
      <p className="mb-5 max-w-[52ch] text-[13.5px] text-[#141412]/60">{dict.gallery.intro}</p>
      <div className="grid gap-5 sm:grid-cols-3">
        {FEATURED_COURSES.map((id) => {
          const label = dict.gallery.courses[id];
          const image = images[id];
          return (
            <div key={id} className="border border-[#141412]/10 bg-white p-3">
              <p className="mb-2 text-[13px] font-medium">{label}</p>
              <div className="mb-2 flex aspect-[4/3] items-center justify-center bg-[#F0EBE0] text-[12px] text-[#141412]/40">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.dataUrl} alt={label} className="h-full w-full object-cover" />
                ) : (
                  dict.gallery.defaultLabel
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy === id}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(id, file);
                  e.target.value = "";
                }}
                className="mb-1.5 block w-full text-[12px]"
              />
              {image ? (
                <button
                  onClick={() => reset(id)}
                  disabled={busy === id}
                  className="text-[12px] text-[#141412]/50 underline disabled:opacity-50"
                >
                  {dict.gallery.reset}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
