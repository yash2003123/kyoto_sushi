"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Menu, MenuItem, CourseId } from "@/lib/menu";
import type { HoursConfig } from "@/lib/hours";

type Tab = "menu" | "hours" | "gallery";

const WEEKDAY_LABELS = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
];

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

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/beheer/login");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="m-0 text-xl font-bold">Kyoto — Beheer</h1>
        <button
          onClick={logout}
          className="border border-[#141412]/20 bg-white px-3 py-1.5 text-[13px]"
        >
          Uitloggen
        </button>
      </div>

      <div className="mb-6 flex gap-2 border-b border-[#141412]/15">
        {(
          [
            ["menu", "Kaart & prijzen"],
            ["hours", "Openingsuren"],
            ["gallery", "Foto's"],
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

      {tab === "menu" ? <MenuEditor /> : null}
      {tab === "hours" ? <HoursEditor /> : null}
      {tab === "gallery" ? <GalleryEditor /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Menu — prices and availability
 * ------------------------------------------------------------------ */

function MenuEditor() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

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

  if (!menu) return <p>Laden…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={status === "saving"}
          className="bg-[#E4572E] px-4 py-2 text-[14px] font-semibold text-white disabled:opacity-50"
        >
          {status === "saving" ? "Bezig…" : "Wijzigingen opslaan"}
        </button>
        {status === "saved" ? (
          <span className="text-[13px] text-[#7E8F6B]">Opgeslagen. Direct live.</span>
        ) : null}
        {status === "error" ? (
          <span className="text-[13px] text-[#E4572E]">Opslaan mislukt. Probeer opnieuw.</span>
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
                  <div
                    key={item.id}
                    className="flex items-center gap-3 border border-[#141412]/10 bg-white px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-[14px]">{item.name.nl}</span>
                    <label className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-[#141412]/60">
                      <input
                        type="checkbox"
                        checked={item.available}
                        onChange={(e) => updateItem(item.id, { available: e.target.checked })}
                      />
                      beschikbaar
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
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Hours
 * ------------------------------------------------------------------ */

function HoursEditor() {
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

  if (!config) return <p>Laden…</p>;

  return (
    <div className="max-w-[480px]">
      <div className="mb-5 grid grid-cols-2 gap-4">
        <TimeField
          label="Middag open"
          value={config.services.lunch.open}
          onChange={(m) =>
            setConfig({ ...config, services: { ...config.services, lunch: { ...config.services.lunch, open: m } } })
          }
        />
        <TimeField
          label="Middag sluit"
          value={config.services.lunch.close}
          onChange={(m) =>
            setConfig({ ...config, services: { ...config.services, lunch: { ...config.services.lunch, close: m } } })
          }
        />
        <TimeField
          label="Avond open"
          value={config.services.dinner.open}
          onChange={(m) =>
            setConfig({ ...config, services: { ...config.services, dinner: { ...config.services.dinner, open: m } } })
          }
        />
        <TimeField
          label="Avond sluit"
          value={config.services.dinner.close}
          onChange={(m) =>
            setConfig({ ...config, services: { ...config.services, dinner: { ...config.services.dinner, close: m } } })
          }
        />
      </div>

      <label className="mb-5 block text-[13px]">
        <span className="mb-1 block text-[#141412]/60">Wekelijkse sluitingsdag</span>
        <select
          value={config.closedWeekday}
          onChange={(e) => setConfig({ ...config, closedWeekday: Number(e.target.value) })}
          className="border border-[#141412]/20 bg-white px-3 py-2 text-[14px]"
        >
          {WEEKDAY_LABELS.map((label, i) => (
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
          {status === "saving" ? "Bezig…" : "Openingsuren opslaan"}
        </button>
        {status === "saved" ? (
          <span className="text-[13px] text-[#7E8F6B]">Opgeslagen. Direct live.</span>
        ) : null}
        {status === "error" ? (
          <span className="text-[13px] text-[#E4572E]">Opslaan mislukt.</span>
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

const FEATURED_COURSES: { id: CourseId; label: string }[] = [
  { id: "sushi", label: "Sushi" },
  { id: "bowls", label: "Bowls & boxes" },
  { id: "drinks", label: "Dranken" },
];

function GalleryEditor() {
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

  if (!images) return <p>Laden…</p>;

  return (
    <div>
      <p className="mb-5 max-w-[52ch] text-[13.5px] text-[#141412]/60">
        Zonder foto toont een paneel een kanji-tegel in plaats van een foto. Upload een foto om
        die te vervangen — JPG, PNG of WebP, max 1,5MB.
      </p>
      <div className="grid gap-5 sm:grid-cols-3">
        {FEATURED_COURSES.map(({ id, label }) => {
          const image = images[id];
          return (
            <div key={id} className="border border-[#141412]/10 bg-white p-3">
              <p className="mb-2 text-[13px] font-medium">{label}</p>
              <div className="mb-2 flex aspect-[4/3] items-center justify-center bg-[#F0EBE0] text-[12px] text-[#141412]/40">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.dataUrl} alt={label} className="h-full w-full object-cover" />
                ) : (
                  "kanji-tegel (standaard)"
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
                  Terug naar standaard
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
