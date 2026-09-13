import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { privacy } from "@/data/legal";
import { LegalPage } from "@/components/site/LegalPage";

// Every page under [lang] is revalidated together on an admin save
// (revalidatePath("/[lang]", "layout")) — a page left purely static, never
// expecting to be revalidated on demand, can throw DYNAMIC_SERVER_USAGE when
// that sweep reaches it even though this page's own content never changes.
// Forcing it dynamic avoids that whole class of bug; the page is small and
// rarely visited, so there is nothing meaningful to lose.
export const dynamic = "force-dynamic";

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
