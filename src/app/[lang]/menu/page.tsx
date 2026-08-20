import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionary";
import { loadMenu } from "@/lib/menu";
import { MenuBrowser } from "@/components/order/MenuBrowser";
import { Reveal } from "@/components/motion";
import { StickyCartBar } from "@/components/order/StickyCartBar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: `${dict.menu.title} · Kyoto Leuven`, description: dict.menu.lede };
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const menu = loadMenu();

  return (
    <div className="wrap py-12 pb-32 sm:py-16">
      <Reveal onMount className="mb-8">
        <h1 className="font-display m-0 text-[clamp(30px,4.4vw,46px)] font-normal">
          {dict.menu.title}
        </h1>
        <p className="text-washi-dim m-0 mt-2 max-w-[52ch]">{dict.menu.lede}</p>
      </Reveal>

      <MenuBrowser menu={menu} locale={locale} dict={dict} />
      <StickyCartBar locale={locale} dict={dict} />
    </div>
  );
}
