import type { Metadata } from "next";

import { buildAlternates, getAbsoluteLocalizedUrl } from "./alternates";
import { getOpenGraphAlternateLocales, getOpenGraphLocale } from "./localeOpenGraph";
import { isLocalSiteUrl } from "./siteUrl";

const DEFAULT_OG_IMAGE_PATH = "/og/default.png";

/** Composes exhaustive localized page metadata with canonical, hreflang, OG, and Twitter tags. */
export function buildLocalizedMetadata({
  locale,
  href,
  title,
  description,
  keywords,
  siteName,
  ogImageAlt,
  indexable = true
}: {
  locale: string;
  href: string;
  title: string;
  description: string;
  keywords: string;
  siteName: string;
  ogImageAlt: string;
  indexable?: boolean;
}): Metadata {
  const pageUrl = getAbsoluteLocalizedUrl(locale, href);
  const shouldIndex = indexable && !isLocalSiteUrl();
  const ogImage = {
    url: DEFAULT_OG_IMAGE_PATH,
    width: 1200,
    height: 630,
    alt: ogImageAlt
  };

  return {
    title,
    description,
    keywords,
    alternates: buildAlternates(locale, href),
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName,
      locale: getOpenGraphLocale(locale),
      alternateLocale: getOpenGraphAlternateLocales(locale),
      type: "website",
      images: [ogImage]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE_PATH]
    },
    robots: shouldIndex ? { index: true, follow: true } : { index: false, follow: false }
  };
}

/** Composes site-wide default metadata including a title template for nested pages. */
export function buildSiteMetadata({
  locale,
  title,
  description,
  keywords,
  siteName,
  ogImageAlt
}: {
  locale: string;
  title: string;
  description: string;
  keywords: string;
  siteName: string;
  ogImageAlt: string;
}): Metadata {
  const pageMetadata = buildLocalizedMetadata({
    locale,
    href: "/",
    title,
    description,
    keywords,
    siteName,
    ogImageAlt
  });

  return {
    ...pageMetadata,
    title: {
      default: title,
      template: `%s · ${title}`
    }
  };
}
