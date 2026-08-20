import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionary";
import { Hero } from "@/components/site/Hero";
import { MenuBoard } from "@/components/site/MenuBoard";
import { StudentBand } from "@/components/site/StudentBand";
import { InfoCards } from "@/components/site/InfoCards";
import { RestaurantSchema } from "@/components/site/RestaurantSchema";

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
      <MenuBoard locale={locale} dict={dict} />
      <StudentBand locale={locale} dict={dict} />
      <InfoCards dict={dict} />
    </>
  );
}
