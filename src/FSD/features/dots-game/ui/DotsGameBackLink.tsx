"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import styles from "./DotsGameBackLink.module.css";
import { Link } from "@/FSD/shared/lib/i18n/navigation";

/** Client-side back link from the dots feature to the games home page. */
export function DotsGameBackLink(): ReactElement {
  const t = useTranslations("GamePage");
  return (
    <Link href="/" prefetch={false} className={styles.backLink}>
      <span aria-hidden className={styles.arrow}>
        ←
      </span>
      <span>{t("back")}</span>
    </Link>
  );
}
