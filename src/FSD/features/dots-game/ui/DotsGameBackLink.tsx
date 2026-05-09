"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/FSD/shared/lib/i18n/navigation";

import styles from "./DotsGame.module.css";

/** Client-side back link for the dots game setup screen. */
export function DotsGameBackLink(): ReactElement {
  const t = useTranslations("GamePage");
  return (
    <Link href="/" prefetch={false} className={styles.backLink}>
      {t("back")}
    </Link>
  );
}
