"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminLocale } from "@/lib/use-admin-locale";
import { AdminLocaleToggle } from "@/components/admin/AdminLocaleToggle";

export default function LoginPage() {
  const router = useRouter();
  const { locale, setLocale, dict } = useAdminLocale();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        router.replace("/beheer");
        router.refresh();
        return;
      }

      const json = (await response.json().catch(() => ({}))) as { error?: string };
      setError(
        json.error === "too-many-attempts" ? dict.login.tooManyAttempts : dict.login.wrongPassword,
      );
    } catch {
      setError(dict.login.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-[10vh] max-w-[360px]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="m-0 text-xl font-bold">{dict.brand}</h1>
          <p className="m-0 mt-1 text-sm text-[#141412]/60">{dict.login.subtitle}</p>
        </div>
        <AdminLocaleToggle locale={locale} onChange={setLocale} />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={dict.login.passwordPlaceholder}
          className="border border-[#141412]/20 bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-[#E4572E]"
        />
        {error ? <p className="m-0 text-[13px] text-[#E4572E]">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting || !password}
          className="bg-[#E4572E] px-4 py-2.5 text-[14px] font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {submitting ? dict.login.submitBusy : dict.login.submit}
        </button>
      </form>
    </div>
  );
}
