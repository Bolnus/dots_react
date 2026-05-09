import type { ReactElement } from "react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/FSD/shared/lib/i18n/navigation";

import styles from "./AppHeader.module.css";
import { AppHeaderControls } from "./AppHeaderControls.client";

/** Top bar with site title, theme switcher, and locale switcher. */
export async function AppHeader(): Promise<ReactElement> {
  const t = await getTranslations("Metadata");

  return (
    <header className={styles.header}>
      <Link href="/" prefetch={false} className={styles.brand}>
        <span className={styles.logo}>{t("title")}</span>
        <span className={styles.tagline}>{t("description")}</span>
      </Link>
      <AppHeaderControls />
    </header>
  );
}
