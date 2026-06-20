import type { ReactElement } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { GamesGrid } from "@/FSD/widgets/games-grid/ui/GamesGrid";
import { buildLocalizedMetadata } from "@/FSD/shared/lib/seo/buildMetadata";

import styles from "./page.module.css";

type HomePageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

/** Home page metadata with canonical and localized social tags. */
export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return buildLocalizedMetadata({
    locale,
    href: "/",
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    siteName: t("title"),
    ogImageAlt: t("ogImageAlt")
  });
}

/** Home: hero copy and games grid. */
export default async function HomePage({ params }: HomePageProps): Promise<ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HomePage");

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </section>
      <GamesGrid />
    </main>
  );
}
