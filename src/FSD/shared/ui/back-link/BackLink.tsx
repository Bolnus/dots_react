"use client";

import type { ReactElement } from "react";

import { Link } from "@/FSD/shared/lib/i18n/navigation";
import backNavStyles from "@/FSD/shared/ui/back-nav/backNav.module.css";

import styles from "./BackLink.module.css";

export type BackLinkProps = Readonly<{
  href: string;
  label: string;
  prefetch?: boolean;
}>;

/** Shared back link: arrow glyph + label; uses i18n-aware routing. */
export function BackLink({ href, label, prefetch = false }: BackLinkProps): ReactElement {
  return (
    <Link href={href} prefetch={prefetch} className={`${backNavStyles.backNav} ${styles.backLink}`}>
      <span aria-hidden className={backNavStyles.arrow}>
        ←
      </span>
      <span>{label}</span>
    </Link>
  );
}
