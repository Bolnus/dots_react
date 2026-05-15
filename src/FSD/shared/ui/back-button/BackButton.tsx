"use client";

import type { ReactElement } from "react";

import backNavStyles from "@/FSD/shared/ui/back-nav/backNav.module.css";

import styles from "./BackButton.module.css";

export type BackButtonProps = Readonly<{
  onClick: () => void;
  label: string;
}>;

/** Shared back button: arrow glyph + localized label; callers manage the navigation. */
export function BackButton({ onClick, label }: BackButtonProps): ReactElement {
  return (
    <button type="button" className={`${backNavStyles.backNav} ${styles.backButton}`} onClick={onClick}>
      <span aria-hidden className={backNavStyles.arrow}>
        ←
      </span>
      <span>{label}</span>
    </button>
  );
}
