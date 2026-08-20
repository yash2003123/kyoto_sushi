import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, localeTags, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionary";
import { MotionProvider, PageTransition } from "@/components/motion";
import { CartProvider } from "@/lib/cart";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CartDrawer } from "@/components/site/CartDrawer";
import { SetHtmlLang } from "@/components/site/SetHtmlLang";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  const base = siteUrl();

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `${base}/${lang}`,
      // Each language is a real, indexable URL — that is why they are routes
      // and not a client-side toggle.
      languages: {
        ...Object.fromEntries(locales.map((l) => [localeTags[l], `${base}/${l}`])),
        "x-default": `${base}/nl`,
      },
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      url: `${base}/${lang}`,
      siteName: "Kyoto Leuven",
      locale: localeTags[lang].replace("-", "_"),
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  return (
    <MotionProvider>
      <CartProvider>
        <SetHtmlLang locale={locale} />
        <Header locale={locale} dict={dict} />
        <main id="main">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer locale={locale} dict={dict} />
        <CartDrawer locale={locale} dict={dict} />
      </CartProvider>
    </MotionProvider>
  );
}
