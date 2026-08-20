import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionary";
import { CheckoutForm } from "@/components/order/CheckoutForm";
import { Reveal } from "@/components/motion";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: `${getDictionary(lang).checkout.title} · Kyoto Leuven`,
    // A checkout page has no business in a search index.
    robots: { index: false, follow: false },
  };
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  return (
    <div className="wrap py-12 sm:py-16">
      <Reveal onMount className="mb-10">
        <h1 className="font-display m-0 text-[clamp(30px,4.4vw,46px)] font-normal">
          {dict.checkout.title}
        </h1>
      </Reveal>
      <CheckoutForm locale={locale} dict={dict} />
    </div>
  );
}
