const publicRoutes = require("./src/FSD/shared/lib/seo/publicRoutes.json");

const LOCAL_DEV_SITE_URL = "http://localhost";

/** Builds hreflang alternate refs for a locale-prefixed path segment. */
function buildAlternateRefs(siteUrl, pathSuffix) {
  const refs = publicRoutes.locales.map((alternateLocale) => ({
    href: `${siteUrl}/${alternateLocale}${pathSuffix}`,
    hreflang: alternateLocale,
    hrefIsAbsolute: true
  }));

  refs.push({
    href: `${siteUrl}/${publicRoutes.defaultLocale}${pathSuffix}`,
    hreflang: "x-default",
    hrefIsAbsolute: true
  });

  return refs;
}

/** Resolves the path suffix after the locale segment (e.g. "" or "/games/dots"). */
function getPathSuffix(pathname) {
  const localeMatch = pathname.match(/^\/(en|ru)(\/.*)?$/);
  if (!localeMatch) {
    return null;
  }

  return localeMatch[2] ?? "";
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL?.replace(/\/$/, "") ?? LOCAL_DEV_SITE_URL,
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ["/*"],
  additionalPaths: async (config) => {
    const entries = [];

    for (const locale of publicRoutes.locales) {
      for (const pathname of publicRoutes.sitemapPaths) {
        const pathSuffix = pathname === "/" ? "" : pathname;
        const loc = `/${locale}${pathSuffix}`;

        entries.push({
          loc,
          changefreq: pathname === "/" ? "weekly" : "monthly",
          priority: pathname === "/" ? 1.0 : 0.8,
          alternateRefs: buildAlternateRefs(config.siteUrl, pathSuffix)
        });
      }
    }

    return entries;
  },
  transform: async (config, path) => {
    const pathSuffix = getPathSuffix(path);
    if (pathSuffix === null) {
      return null;
    }

    const isAllowed = publicRoutes.sitemapPaths.some((allowedPath) => {
      if (allowedPath === "/") {
        return pathSuffix === "";
      }

      return pathSuffix === allowedPath;
    });

    if (!isAllowed) {
      return null;
    }

    return {
      loc: path,
      changefreq: pathSuffix === "" ? "weekly" : "monthly",
      priority: pathSuffix === "" ? 1.0 : 0.8,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: buildAlternateRefs(config.siteUrl, pathSuffix)
    };
  }
};
