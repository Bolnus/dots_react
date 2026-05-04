import type { ReactElement } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { GamesGrid } from "@/FSD/widgets/games-grid/ui/GamesGrid";

import styles from "./page.module.css";

type HomePageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

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
