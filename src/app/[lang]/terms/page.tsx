import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { terms } from "@/data/legal";
import { LegalPage } from "@/components/site/LegalPage";

// See privacy/page.tsx for why.
export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const copy = terms[lang as Locale];
  return <LegalPage {...copy} />;
}
