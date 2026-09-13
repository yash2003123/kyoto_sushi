import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionary";
import { Hero } from "@/components/site/Hero";
import { Gallery } from "@/components/site/Gallery";
import { MenuBoard } from "@/components/site/MenuBoard";
import { StudentBand } from "@/components/site/StudentBand";
import { InfoCards } from "@/components/site/InfoCards";
import { RestaurantSchema } from "@/components/site/RestaurantSchema";

// The hero status, the gallery, the menu board and the info cards all read
// menu/hours data that the admin panel can change at any moment. Static
// generation plus on-demand revalidation is fragile for that combination in
// the App Router (a route Next.js already committed to a static render for
// can throw DYNAMIC_SERVER_USAGE when later data needs a genuinely fresh
// render) — confirmed by hitting exactly that error while testing an admin
// save. Forcing this dynamic sidesteps the whole class of bug: every request
// gets a current render, at the cost of build-time prerendering this page
// does not meaningfully benefit from anyway.
export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <RestaurantSchema locale={locale} />
      <Hero locale={locale} dict={dict} />
      <Gallery locale={locale} dict={dict} />
      <MenuBoard locale={locale} dict={dict} />
      <StudentBand locale={locale} dict={dict} />
      <InfoCards dict={dict} />
    </>
  );
}
