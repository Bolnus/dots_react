import type { ReactElement, ReactNode } from "react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QueryProvider } from "@/FSD/shared/api/query/QueryProvider.client";
import { routing } from "@/FSD/shared/lib/i18n/routing";
import { buildSiteMetadata } from "@/FSD/shared/lib/seo";
import { AppHeader } from "@/FSD/widgets/app-header/ui/AppHeader";

type LocaleLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>;

/** Build-time paths for each supported locale. */
export function generateStaticParams(): { locale: string }[] {
  return routing.locales.map((locale) => ({ locale }));
}

/** Default document metadata for a locale segment. */
export async function generateMetadata({ params }: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return buildSiteMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    siteName: t("title"),
    ogImageAlt: t("ogImageAlt")
  });
}

/** Locale shell: messages provider, global styles, shared header. */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps): Promise<ReactElement> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <QueryProvider>
        <AppHeader />
        {children}
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
