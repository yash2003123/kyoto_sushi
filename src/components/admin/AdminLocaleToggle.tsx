import { adminLocales, type AdminLocale } from "@/lib/admin-dictionary";

const LABELS: Record<AdminLocale, string> = { nl: "NL", en: "EN" };

export function AdminLocaleToggle({
  locale,
  onChange,
}: {
  locale: AdminLocale;
  onChange: (locale: AdminLocale) => void;
}) {
  return (
    <div className="flex border border-[#141412]/20" role="group" aria-label="Taal / Language">
      {adminLocales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          aria-current={locale === code}
          className={`px-2.5 py-1 text-[12px] font-semibold ${
            locale === code ? "bg-[#E4572E] text-white" : "text-[#141412]/60"
          }`}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
