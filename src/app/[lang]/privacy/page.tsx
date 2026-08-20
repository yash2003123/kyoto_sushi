import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { privacy } from "@/data/legal";
import { LegalPage } from "@/components/site/LegalPage";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const copy = privacy[lang as Locale];
  return <LegalPage {...copy} />;
}
