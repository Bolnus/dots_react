import type { ReactElement } from "react";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { routing } from "@/FSD/shared/lib/i18n/routing";

type RestPageProps = Readonly<{
  params: Promise<{ locale: string; rest: string[] }>;
}>;

/** Catch-all under a locale: unknown paths redirect to the localized home page. */
export default async function RestPage({ params }: RestPageProps): Promise<ReactElement> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    redirect(`/${routing.defaultLocale}`);
  }

  setRequestLocale(locale);
  redirect("/");
}
