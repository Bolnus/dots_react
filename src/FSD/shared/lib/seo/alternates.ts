import type { Metadata } from "next";

import { getPathname } from "@/FSD/shared/lib/i18n/navigation";

import publicRoutes from "./publicRoutes.json";
import { getSiteUrl } from "./siteUrl";

/** Builds an absolute URL for a locale-specific pathname. */
export function getAbsoluteLocalizedUrl(locale: string, href: string): string {
  const pathname = getPathname({ locale, href });
  return `${getSiteUrl()}${pathname}`;
}

/** Builds canonical and hreflang alternates for a localized route. */
export function buildAlternates(locale: string, href: string): Metadata["alternates"] {
  const languages = Object.fromEntries(
    publicRoutes.locales.map((alternateLocale) => [alternateLocale, getAbsoluteLocalizedUrl(alternateLocale, href)])
  );

  languages["x-default"] = getAbsoluteLocalizedUrl(publicRoutes.defaultLocale, href);

  return {
    canonical: getAbsoluteLocalizedUrl(locale, href),
    languages
  };
}
