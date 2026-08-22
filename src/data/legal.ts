import type { Locale } from "@/lib/i18n";
import type { LegalSection } from "@/components/site/LegalPage";

type LegalCopy = { title: string; intro: string; sections: LegalSection[] };

/**
 * Placeholder legal copy.
 *
 * Written to be structurally correct — the headings a Belgian food business
 * actually needs — but it is not legal advice and the restaurant's accountant
 * should review it before launch. Notably unresolved: how online orders reach
 * the geregistreerd kassasysteem, which affects what the terms can promise.
 */
export const terms: Record<Locale, LegalCopy> = {
  nl: {
    title: "Algemene voorwaarden",
    intro:
      "Deze voorwaarden gelden voor bestellingen via kyotosushi.be. Laatst bijgewerkt op 20 augustus 2026.",
    sections: [
      {
        heading: "Wie wij zijn",
        body: [
          "Kyoto, Tiensestraat 239, 3000 Leuven. BTW BE 0847.251.943. Telefoon 016 41 85 48.",
        ],
      },
      {
        heading: "Bestellen en betalen",
        body: [
          "Alle online bestellingen worden vooraf betaald via Mollie. Wij bewaren geen kaartgegevens.",
          "Een bestelling is pas bevestigd zodra de betaling is geslaagd en u een bevestiging ontvangt.",
        ],
      },
      {
        heading: "Afhalen",
        body: [
          "Bereidingstijd bedraagt ongeveer 30 minuten. Het gekozen tijdslot is een richttijd, geen garantie.",
        ],
      },
      {
        heading: "Annuleren",
        body: [
          "Verse bereidingen zijn uitgesloten van het herroepingsrecht zodra de keuken eraan begonnen is. Bel ons zo snel mogelijk als er iets misloopt.",
        ],
      },
      {
        heading: "Allergenen",
        body: [
          "Allergenen staan bij elk gerecht vermeld. Ons atelier verwerkt vis, schaaldieren, soja, sesam, gluten en ei; sporen zijn nooit volledig uit te sluiten.",
        ],
      },
    ],
  },
  en: {
    title: "Terms",
    intro:
      "These terms cover orders placed through kyotosushi.be. Last updated 20 August 2026.",
    sections: [
      {
        heading: "Who we are",
        body: [
          "Kyoto, Tiensestraat 239, 3000 Leuven, Belgium. VAT BE 0847.251.943. Phone 016 41 85 48.",
        ],
      },
      {
        heading: "Ordering and payment",
        body: [
          "All online orders are paid up front through Mollie. We never store card details.",
          "An order is confirmed once the payment succeeds and you receive a confirmation.",
        ],
      },
      {
        heading: "Collection",
        body: [
          "Preparation takes around 30 minutes. The chosen slot is a target, not a guarantee.",
        ],
      },
      {
        heading: "Cancellation",
        body: [
          "Freshly prepared food is exempt from the right of withdrawal once the kitchen has started. Call us as soon as possible if something is wrong.",
        ],
      },
      {
        heading: "Allergens",
        body: [
          "Allergens are listed with every dish. Our kitchen handles fish, crustaceans, soya, sesame, gluten and egg; traces can never be fully excluded.",
        ],
      },
    ],
  },
  fr: {
    title: "Conditions générales",
    intro:
      "Ces conditions s'appliquent aux commandes passées via kyotosushi.be. Dernière mise à jour le 20 août 2026.",
    sections: [
      {
        heading: "Qui nous sommes",
        body: [
          "Kyoto, Tiensestraat 239, 3000 Louvain. TVA BE 0847.251.943. Téléphone 016 41 85 48.",
        ],
      },
      {
        heading: "Commande et paiement",
        body: [
          "Toutes les commandes en ligne sont payées à l'avance via Mollie. Nous ne conservons aucune donnée de carte.",
          "Une commande est confirmée dès que le paiement aboutit et que vous recevez une confirmation.",
        ],
      },
      {
        heading: "Retrait",
        body: [
          "La préparation prend environ 30 minutes. Le créneau choisi est une estimation, pas une garantie.",
        ],
      },
      {
        heading: "Annulation",
        body: [
          "Les préparations fraîches sont exclues du droit de rétractation dès que la cuisine a commencé. Appelez-nous au plus vite en cas de problème.",
        ],
      },
      {
        heading: "Allergènes",
        body: [
          "Les allergènes sont indiqués pour chaque plat. Notre cuisine manipule poisson, crustacés, soja, sésame, gluten et œuf ; les traces ne peuvent jamais être totalement exclues.",
        ],
      },
    ],
  },
};

export const privacy: Record<Locale, LegalCopy> = {
  nl: {
    title: "Privacy",
    intro:
      "Wat wij bijhouden wanneer u online bestelt, en waarom. Laatst bijgewerkt op 20 augustus 2026.",
    sections: [
      {
        heading: "Wat wij verzamelen",
        body: [
          "Naam, telefoonnummer en e-mailadres. Meer hebben wij niet nodig om uw bestelling klaar te maken.",
        ],
      },
      {
        heading: "Betalingen",
        body: [
          "Betalingen verlopen via Mollie. Uw kaartgegevens komen nooit op onze servers en wij zien er ook nooit meer van dan het bedrag en de methode.",
        ],
      },
      {
        heading: "Hoe lang",
        body: [
          "Bestelgegevens bewaren wij zolang de boekhoudkundige bewaarplicht dat vraagt. Daarna verdwijnen ze.",
        ],
      },
      {
        heading: "Uw rechten",
        body: [
          "U kunt uw gegevens opvragen, laten verbeteren of laten wissen. Bel 016 41 85 48 of spreek ons aan in de zaak.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy",
    intro:
      "What we keep when you order online, and why. Last updated 20 August 2026.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Name, phone number and email address. We do not need anything else to prepare your order.",
        ],
      },
      {
        heading: "Payments",
        body: [
          "Payments run through Mollie. Your card details never reach our servers, and we never see more than the amount and the method.",
        ],
      },
      {
        heading: "How long",
        body: [
          "Order records are kept as long as Belgian bookkeeping rules require. After that they go.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can ask for your data, have it corrected, or have it deleted. Call 016 41 85 48 or speak to us in the restaurant.",
        ],
      },
    ],
  },
  fr: {
    title: "Confidentialité",
    intro:
      "Ce que nous conservons lorsque vous commandez en ligne, et pourquoi. Dernière mise à jour le 20 août 2026.",
    sections: [
      {
        heading: "Ce que nous collectons",
        body: [
          "Nom, téléphone et adresse e-mail. Nous n'avons besoin de rien d'autre pour préparer votre commande.",
        ],
      },
      {
        heading: "Paiements",
        body: [
          "Les paiements passent par Mollie. Vos données de carte n'atteignent jamais nos serveurs et nous ne voyons que le montant et le moyen de paiement.",
        ],
      },
      {
        heading: "Durée de conservation",
        body: [
          "Les commandes sont conservées aussi longtemps que la comptabilité belge l'exige. Ensuite elles sont supprimées.",
        ],
      },
      {
        heading: "Vos droits",
        body: [
          "Vous pouvez demander vos données, les faire corriger ou les faire supprimer. Appelez le 016 41 85 48 ou parlez-nous au restaurant.",
        ],
      },
    ],
  },
};
