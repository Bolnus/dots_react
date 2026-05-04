import type { ReactElement } from "react";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import styles from "./AppHeader.module.css";

/** Top bar with site title, theme switcher, and locale switcher. */
export async function AppHeader(): Promise<ReactElement> {
  const t = await getTranslations("Metadata");

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.logo}>{t("title")}</span>
        <span className={styles.tagline}>{t("description")}</span>
      </div>
      <div className={styles.controls}>
        <ThemeSwitcher />
        <LocaleSwitcher />
      </div>
    </header>
  );
}
