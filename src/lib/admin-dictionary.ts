/**
 * Admin panel UI language.
 *
 * Separate from the customer-facing dictionary (lib/dictionary.ts) on
 * purpose: this covers the chrome of /beheer itself — button labels, field
 * names, status messages — not menu content, which already has its own
 * nl/en/fr fields per item regardless of which language the admin reads the
 * panel in. Two languages, not three: the owner asked for Dutch and English
 * only here, unlike the customer site.
 */

export const adminLocales = ["nl", "en"] as const;
export type AdminLocale = (typeof adminLocales)[number];

export const ADMIN_LOCALE_KEY = "kyoto-admin-locale";

const nl = {
  brand: "Kyoto — Beheer",
  login: {
    subtitle: "Log in om de kaart, uren en foto's te beheren.",
    passwordPlaceholder: "Wachtwoord",
    submit: "Inloggen",
    submitBusy: "Bezig…",
    wrongPassword: "Verkeerd wachtwoord.",
    tooManyAttempts: "Te veel pogingen. Probeer het over een kwartier opnieuw.",
    networkError: "Geen verbinding. Controleer uw internet.",
  },
  nav: {
    logout: "Uitloggen",
    tabMenu: "Kaart & prijzen",
    tabHours: "Openingsuren",
    tabGallery: "Foto's",
  },
  menu: {
    loading: "Laden…",
    save: "Wijzigingen opslaan",
    saving: "Bezig…",
    saved: "Opgeslagen. Direct live.",
    error: "Opslaan mislukt. Probeer opnieuw.",
    available: "beschikbaar",
    showDetails: "Details tonen",
    name: "Naam",
    description: "Omschrijving",
    pieces: "Aantal stuks",
    allergens: "Allergenen",
    tags: "Labels",
    deleteDish: "Dit gerecht verwijderen",
    confirmDelete: "Dit gerecht definitief verwijderen?",
    addDish: (category: string) => `+ Gerecht toevoegen aan “${category}”`,
  },
  allergens: {
    fish: "vis",
    crustacean: "schaaldieren",
    gluten: "gluten",
    soy: "soja",
    sesame: "sesam",
    egg: "ei",
    milk: "melk",
    sulphites: "sulfieten",
  },
  tags: {
    raw: "rauwe vis",
    spicy: "pittig",
    vegetarian: "vegetarisch",
    signature: "signature",
    student: "studentenmenu",
    lunch: "middagmenu",
  },
  hours: {
    loading: "Laden…",
    lunchOpen: "Middag open",
    lunchClose: "Middag sluit",
    dinnerOpen: "Avond open",
    dinnerClose: "Avond sluit",
    closedWeekday: "Wekelijkse sluitingsdag",
    save: "Openingsuren opslaan",
    saving: "Bezig…",
    saved: "Opgeslagen. Direct live.",
    error: "Opslaan mislukt.",
    weekdays: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"],
  },
  gallery: {
    loading: "Laden…",
    intro:
      "Zonder foto toont een paneel een kanji-tegel in plaats van een foto. Upload een foto om die te vervangen — JPG, PNG of WebP, max 1,5MB.",
    defaultLabel: "kanji-tegel (standaard)",
    reset: "Terug naar standaard",
    courses: { sushi: "Sushi", bowls: "Bowls & boxes", drinks: "Dranken" },
  },
};

const en: typeof nl = {
  brand: "Kyoto — Admin",
  login: {
    subtitle: "Log in to manage the menu, hours and photos.",
    passwordPlaceholder: "Password",
    submit: "Log in",
    submitBusy: "Working…",
    wrongPassword: "Wrong password.",
    tooManyAttempts: "Too many attempts. Try again in about 15 minutes.",
    networkError: "No connection. Check your internet.",
  },
  nav: {
    logout: "Log out",
    tabMenu: "Menu & prices",
    tabHours: "Opening hours",
    tabGallery: "Photos",
  },
  menu: {
    loading: "Loading…",
    save: "Save changes",
    saving: "Working…",
    saved: "Saved. Live immediately.",
    error: "Save failed. Try again.",
    available: "available",
    showDetails: "Show details",
    name: "Name",
    description: "Description",
    pieces: "Number of pieces",
    allergens: "Allergens",
    tags: "Tags",
    deleteDish: "Delete this dish",
    confirmDelete: "Delete this dish permanently?",
    addDish: (category: string) => `+ Add a dish to “${category}”`,
  },
  allergens: {
    fish: "fish",
    crustacean: "crustaceans",
    gluten: "gluten",
    soy: "soy",
    sesame: "sesame",
    egg: "egg",
    milk: "milk",
    sulphites: "sulphites",
  },
  tags: {
    raw: "raw fish",
    spicy: "spicy",
    vegetarian: "vegetarian",
    signature: "signature",
    student: "student menu",
    lunch: "lunch menu",
  },
  hours: {
    loading: "Loading…",
    lunchOpen: "Lunch opens",
    lunchClose: "Lunch closes",
    dinnerOpen: "Dinner opens",
    dinnerClose: "Dinner closes",
    closedWeekday: "Weekly closing day",
    save: "Save opening hours",
    saving: "Working…",
    saved: "Saved. Live immediately.",
    error: "Save failed.",
    weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
  gallery: {
    loading: "Loading…",
    intro:
      "Without a photo, a panel shows a kanji tile instead. Upload a photo to replace it — JPG, PNG or WebP, max 1.5MB.",
    defaultLabel: "kanji tile (default)",
    reset: "Back to default",
    courses: { sushi: "Sushi", bowls: "Bowls & boxes", drinks: "Drinks" },
  },
};

export const adminDictionaries: Record<AdminLocale, typeof nl> = { nl, en };
export type AdminDictionary = typeof nl;
