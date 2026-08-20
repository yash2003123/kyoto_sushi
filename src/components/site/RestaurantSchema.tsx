import { SERVICES, formatMinutes } from "@/lib/hours";
import { localeTags, type Locale } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

/**
 * Structured data.
 *
 * The point is not decoration: Google renders opening hours and the order link
 * straight into the local pack, which is where a hungry customer in Leuven
 * actually starts. Every impression that ends on this domain instead of a
 * marketplace listing is the whole business case for the rebuild.
 */
export function RestaurantSchema({ locale }: { locale: Locale }) {
  const base = siteUrl();
  const openDays = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Kyoto",
    servesCuisine: ["Japanese", "Korean", "Sushi"],
    priceRange: "€€",
    telephone: "+3216418548",
    url: `${base}/${locale}`,
    inLanguage: localeTags[locale],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Tiensestraat 239",
      postalCode: "3000",
      addressLocality: "Leuven",
      addressCountry: "BE",
    },
    vatID: "BE0847.251.943",
    acceptsReservations: "True",
    hasMenu: `${base}/${locale}/menu`,
    potentialAction: {
      "@type": "OrderAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/${locale}/menu` },
    },
    openingHoursSpecification: openDays.flatMap((day) =>
      [SERVICES.lunch, SERVICES.dinner].map((service) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: day,
        opens: formatMinutes(service.open).padStart(5, "0"),
        closes: formatMinutes(service.close).padStart(5, "0"),
      })),
    ),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
