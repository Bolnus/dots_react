import publicRoutes from "./publicRoutes.json";

const OPEN_GRAPH_LOCALE_BY_LOCALE: Record<string, string> = {
  en: "en_US",
  ru: "ru_RU"
};

/** Maps a next-intl locale code to an Open Graph locale string. */
export function getOpenGraphLocale(locale: string): string {
  return OPEN_GRAPH_LOCALE_BY_LOCALE[locale] ?? locale;
}

/** Returns Open Graph alternate locale codes for every locale except the current one. */
export function getOpenGraphAlternateLocales(locale: string): string[] {
  return publicRoutes.locales
    .filter((candidate) => candidate !== locale)
    .map((candidate) => getOpenGraphLocale(candidate));
}
