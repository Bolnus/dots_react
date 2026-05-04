"use client";

import type { ReactElement } from "react";
import { useLocale, useTranslations } from "next-intl";

import { routing } from "@/FSD/shared/lib/i18n/routing";
import { Link, usePathname } from "@/FSD/shared/lib/i18n/navigation";

import styles from "./LocaleSwitcher.module.css";

/** Switches UI language while keeping the current path (no locale prefix in `href`). */
export function LocaleSwitcher(): ReactElement {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LocaleSwitcher");

  return (
    <div className={styles.root} role="group" aria-label={t("label")}>
      {routing.locales.map((loc) => (
        <Link
          key={loc}
          href={pathname}
          locale={loc}
          className={loc === locale ? styles.active : styles.link}
          prefetch={false}
        >
          {t(loc)}
        </Link>
      ))}
    </div>
  );
}
