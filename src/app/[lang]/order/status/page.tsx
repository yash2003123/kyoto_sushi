import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionary";
import { OrderStatusView } from "@/components/order/OrderStatusView";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OrderStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ order?: string; simulated?: string }>;
}) {
  const { lang } = await params;
  const { order, simulated } = await searchParams;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  return (
    <OrderStatusView
      locale={locale}
      dict={getDictionary(locale)}
      orderId={order ?? null}
      simulated={simulated === "1"}
    />
  );
}
